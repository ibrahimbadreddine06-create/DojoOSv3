import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";

const addMinutes = (timeStr: string, minutes: number): string => {
  const [hours, mins] = timeStr.split(":").map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440; // Wrap around 24 hours
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
};

const formSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  title: z.string().min(1, "Title is required"),
  completed: z.boolean().default(false),
  linkedModule: z.string().optional(),
  linkedItemId: z.string().optional(),
  importance: z.number().min(1).max(5).default(3),
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
  /** For preset mode - if provided, calls this instead of API */
  onPresetSubmit?: (block: {
    title: string;
    startTime: string;
    endTime: string;
    importance: number;
    linkedModule?: string;
    linkedItemId?: string;
  }) => void;
}

export function AddTimeBlockDialog({ 
  date, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  defaultStartTime = "09:00",
  defaultEndTime = "10:00",
  parentId,
  onPresetSubmit
}: AddTimeBlockDialogProps) {
  const isPresetMode = !!onPresetSubmit;
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
      importance: 3,
    },
  });

  const selectedModule = form.watch("linkedModule");

  const { data: linkedItems } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/knowledge-topics", selectedModule],
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
        importance: 3,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-block">
          <Plus className="w-4 h-4 mr-2" />
          {parentId ? "Add Sub-Block" : "Add Block"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">{parentId ? "Add Sub-Block" : "Add Time Block"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
              if (isPresetMode && onPresetSubmit) {
                onPresetSubmit({
                  title: data.title,
                  startTime: data.startTime,
                  endTime: data.endTime,
                  importance: data.importance,
                  linkedModule: data.linkedModule,
                  linkedItemId: data.linkedItemId,
                });
                setOpen(false);
                form.reset();
              } else {
                createMutation.mutate(data);
              }
            })} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter block title" className="text-base" data-testid="input-title" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">Start</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => field.onChange(addMinutes(field.value, -15))}
                          data-testid="button-start-time-down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Input {...field} placeholder="00:00" className="text-sm font-mono text-center flex-1" data-testid="input-start-time" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => field.onChange(addMinutes(field.value, 15))}
                          data-testid="button-start-time-up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">End</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => field.onChange(addMinutes(field.value, -15))}
                          data-testid="button-end-time-down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Input {...field} placeholder="00:00" className="text-sm font-mono text-center flex-1" data-testid="input-end-time" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => field.onChange(addMinutes(field.value, 15))}
                          data-testid="button-end-time-up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="importance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">Importance</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(parseInt(val))} 
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="text-sm" data-testid="select-importance">
                        <SelectValue placeholder="3 - Medium" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Medium</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <FormField
                control={form.control}
                name="linkedModule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">Module</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm" data-testid="select-linked-module">
                          <SelectValue placeholder="None" />
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
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {selectedModule && (
                <FormField
                  control={form.control}
                  name="linkedItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Item</FormLabel>
                      {linkedItems && linkedItems.length > 0 ? (
                        <Select 
                          onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm" data-testid="select-linked-item">
                              <SelectValue placeholder="All" />
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
                        <p className="text-xs text-muted-foreground py-2">
                          No items
                        </p>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-8 text-sm" data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={!isPresetMode && createMutation.isPending} className="h-8 text-sm" data-testid="button-submit">
                {!isPresetMode && createMutation.isPending ? "Creating..." : parentId ? "Add Sub-Block" : isPresetMode ? "Add Block" : "Create Block"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
