import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
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
  { value: "goals", label: "Goals" },
  { value: "second_brain", label: "Second Brain" },
  { value: "languages", label: "Languages" },
  { value: "studies", label: "Studies" },
  { value: "body", label: "Body" },
  { value: "disciplines", label: "Disciplines" },
  { value: "possessions", label: "Possessions" },
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
    linkedSubItemId?: string;
    parentId?: string | null;
  }) => void;
  existingBlocks?: any[];
}

export function AddTimeBlockDialog({
  date,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultStartTime = "09:00",
  defaultEndTime = "10:00",
  parentId,
  onPresetSubmit,
  existingBlocks = []
}: AddTimeBlockDialogProps) {
  const isPresetMode = !!onPresetSubmit;
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const form = useForm<FormData & { linkedSubItemId?: string }>({
    resolver: zodResolver(formSchema.extend({ linkedSubItemId: z.string().optional() })),
    defaultValues: {
      date,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      title: "",
      completed: false,
      linkedModule: undefined,
      linkedItemId: undefined,
      linkedSubItemId: undefined,
      importance: 3,
    },
  });

  const selectedModule = form.watch("linkedModule");
  const selectedItemId = form.watch("linkedItemId");

  const { data: pageSettings } = useQuery<{ module: string; active: boolean }[]>({
    queryKey: ["/api/page-settings"],
  });

  const activeLinkableModules = LINKABLE_MODULES.filter(m => {
    if (!pageSettings || pageSettings.length === 0) return true;
    // Look for exact match or normalized match (hyphen vs underscore)
    const setting = pageSettings.find(s =>
      s.module.toLowerCase() === m.value.toLowerCase() ||
      s.module.toLowerCase() === m.value.replace('_', '-').toLowerCase() ||
      s.module.toLowerCase() === m.value.replace('-', '_').toLowerCase()
    );
    return setting ? setting.active : true;
  });

  const { data: linkedItems, isLoading: isLinkedItemsLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/linkable-items", selectedModule],
    enabled: !!selectedModule,
  });

  const { data: subItems, isLoading: isSubItemsLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/linkable-sub-items", selectedModule, selectedItemId],
    enabled: !!selectedModule && !!selectedItemId,
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
        linkedSubItemId: undefined,
        importance: 3,
      });
    }
  }, [date, open, defaultStartTime, defaultEndTime, form]);

  useEffect(() => {
    if (selectedModule) {
      form.setValue("linkedItemId", undefined);
      form.setValue("linkedSubItemId", undefined);
    }
  }, [selectedModule, form]);

  useEffect(() => {
    if (selectedItemId) {
      form.setValue("linkedSubItemId", undefined);
    }
  }, [selectedItemId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData & { linkedSubItemId?: string }) => {
      const payload = {
        ...data,
        parentId: parentId || null,
        linkedModule: data.linkedModule || null,
        linkedItemId: data.linkedItemId || null,
        linkedSubItemId: data.linkedSubItemId || null,
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
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" data-testid="button-add-block">
            <Plus className="w-4 h-4 mr-2" />
            {parentId ? "Add Sub-Block" : "Add Block"}
          </Button>
        </DialogTrigger>
      )}
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
                linkedSubItemId: data.linkedSubItemId,
                parentId: parentId || null,
              });
              setOpen(false);
              form.reset();
            } else {
              // Client-side overlap validation
              const hasOverlap = (existingBlocks as any[]).some((b) => {
                if (b.parentId || b.id === parentId) return false;
                // Use the internal timeToMinutes/checkOverlap logic or equivalent
                const timeToMinutes = (time: string) => {
                  const [h, m] = time.split(":").map(Number);
                  return h * 60 + m;
                };
                const s1 = timeToMinutes(data.startTime);
                const e1 = timeToMinutes(data.endTime);
                const s2 = timeToMinutes(b.startTime);
                const e2 = timeToMinutes(b.endTime);
                return s1 < e2 && s2 < e1;
              });

              if (hasOverlap && !parentId) {
                toast({
                  title: "Overlapping time slots",
                  description: "This time slot is already partially occupied.",
                  variant: "destructive",
                });
                return;
              }
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

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
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
                        <SelectContent side="top">
                          <SelectItem value="none">None</SelectItem>
                          {activeLinkableModules.map((module) => (
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
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                          {selectedModule === 'second-brain' ? 'Theme' :
                            selectedModule === 'languages' ? 'Language' :
                              selectedModule === 'studies' ? 'Course' :
                                selectedModule === 'body' ? 'Sub-Module' :
                                  selectedModule === 'goals' ? 'Goal' : 'Item'}
                        </FormLabel>
                        {isLinkedItemsLoading ? (
                          <div className="flex items-center gap-2 py-2 px-3 border rounded-md bg-muted/20">
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-muted-foreground">Loading items...</span>
                          </div>
                        ) : linkedItems && linkedItems.length > 0 ? (
                          <Select
                            onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="text-sm" data-testid="select-linked-item">
                                <SelectValue placeholder="All" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent side="top">
                              <SelectItem value="none">Entire Module</SelectItem>
                              {linkedItems.map((item) => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-xs text-muted-foreground py-2 italic border rounded-md px-2 bg-muted/20">
                            No items found
                          </p>
                        )}
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {selectedItemId && (
                <FormField
                  control={form.control}
                  name="linkedSubItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        {selectedModule === 'second-brain' || selectedModule === 'languages' ? 'Chapter / Milestone' :
                          selectedModule === 'studies' ? 'Lesson / Material' :
                            selectedModule === 'body' ? 'Exercise / Activity' :
                              selectedModule === 'goals' ? 'Sub-Goal' : 'Detail (Optional)'}
                      </FormLabel>
                      {isSubItemsLoading ? (
                        <div className="flex items-center gap-2 py-2 px-3 border rounded-md bg-muted/20">
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-muted-foreground">Loading specific items...</span>
                        </div>
                      ) : subItems && subItems.length > 0 ? (
                        <Select
                          onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm" data-testid="select-linked-sub-item">
                              <SelectValue placeholder="Select specific item..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent side="top">
                            <SelectItem value="none">Entire Sub-Module</SelectItem>
                            {subItems.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2 italic border rounded-md px-2 bg-muted/20">
                          No specific items found
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

