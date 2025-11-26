import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";

const taskSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Task text is required"),
  completed: z.boolean().default(false),
  importance: z.number().min(1).max(5).default(3),
});

const formSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  title: z.string().min(1, "Title is required"),
  completed: z.boolean().default(false),
  linkedModule: z.string().optional(),
  linkedItemId: z.string().optional(),
  tasks: z.array(taskSchema).default([]),
});

type FormData = z.infer<typeof formSchema>;

const LINKABLE_MODULES = [
  { value: "second_brain", label: "Second Brain" },
  { value: "languages", label: "Languages" },
  { value: "studies", label: "Studies" },
];

interface AddTimeBlockDialogProps {
  date: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultStartTime?: string;
  defaultEndTime?: string;
  parentId?: string;
}

export function AddTimeBlockDialog({ 
  date, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  defaultStartTime = "09:00",
  defaultEndTime = "10:00",
  parentId
}: AddTimeBlockDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      title: "",
      completed: false,
      linkedModule: undefined,
      linkedItemId: undefined,
      tasks: [],
    },
  });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const selectedModule = form.watch("linkedModule");

  const { data: linkedItems } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/knowledge-themes", selectedModule],
    enabled: !!selectedModule,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        date,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        title: "",
        completed: false,
        linkedModule: undefined,
        linkedItemId: undefined,
        tasks: [],
      });
    }
  }, [date, open, defaultStartTime, defaultEndTime, form]);

  useEffect(() => {
    if (selectedModule) {
      form.setValue("linkedItemId", undefined);
    }
  }, [selectedModule, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        parentId: parentId || null,
        linkedModule: data.linkedModule || null,
        linkedItemId: data.linkedItemId || null,
      };
      return await apiRequest("POST", "/api/time-blocks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", date] });
      toast({ title: "Time block created successfully" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create time block", variant: "destructive" });
    },
  });

  const addTask = () => {
    appendTask({
      id: crypto.randomUUID(),
      text: "",
      completed: false,
      importance: 3,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-block">
          <Plus className="w-4 h-4 mr-2" />
          {parentId ? "Add Sub-Block" : "Add Block"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{parentId ? "Add Sub-Block" : "Add Time Block"}</DialogTitle>
          <DialogDescription>
            {parentId 
              ? "Create a nested block within the parent block"
              : "Create a new time block for your daily schedule"
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Morning workout" data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" data-testid="input-start-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" data-testid="input-end-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="w-4 h-4" />
                Link to Module (Optional)
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkedModule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-linked-module">
                            <SelectValue placeholder="Select module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {LINKABLE_MODULES.map((module) => (
                            <SelectItem key={module.value} value={module.value}>
                              {module.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedModule && (
                  <FormField
                    control={form.control}
                    name="linkedItemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item (Optional)</FormLabel>
                        {linkedItems && linkedItems.length > 0 ? (
                          <Select 
                            onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-linked-item">
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">All {LINKABLE_MODULES.find(m => m.value === selectedModule)?.label}</SelectItem>
                              {linkedItems.map((item) => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            No items in this module yet
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormDescription className="text-xs">
                Linked blocks will appear in the module's "Today's Sessions" section
              </FormDescription>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Tasks</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addTask}
                  data-testid="button-add-task"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>
              
              {taskFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet. Add tasks with importance levels (1-5).
                </p>
              )}

              {taskFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg bg-card">
                  <div className="flex-1">
                    <Input
                      {...form.register(`tasks.${index}.text`)}
                      placeholder="Task description"
                      data-testid={`input-task-${index}`}
                    />
                  </div>
                  <Select
                    value={form.watch(`tasks.${index}.importance`)?.toString()}
                    onValueChange={(val) => form.setValue(`tasks.${index}.importance`, parseInt(val))}
                  >
                    <SelectTrigger className="w-24" data-testid={`select-task-importance-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTask(index)}
                    data-testid={`button-remove-task-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              
              {taskFields.length > 0 && (
                <FormDescription className="text-xs">
                  Task importance (1-5) affects how tasks contribute to completion
                </FormDescription>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                {createMutation.isPending ? "Creating..." : "Create Block"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
