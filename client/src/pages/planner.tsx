import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Clock, GripVertical, Trash2, Play, ChevronDown, ListTodo, Layers, Maximize2, Minimize2 } from "lucide-react";
import { format, addDays, subDays, isToday, isYesterday, isTomorrow, parseISO } from "date-fns";
import { AddTimeBlockDialog } from "@/components/dialogs/add-time-block-dialog";
import { CreatePresetDialog } from "@/components/dialogs/create-preset-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TimeBlock, DayPreset, DailyMetric } from "@shared/schema";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 100;
const SNAP_MINUTES = 30;

function getDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d");
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function snapToGrid(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

function getBlockStyle(block: TimeBlock): { top: number; height: number } {
  const startMinutes = timeToMinutes(block.startTime);
  const endMinutes = timeToMinutes(block.endTime);
  const duration = endMinutes - startMinutes;
  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: Math.max((duration / 60) * HOUR_HEIGHT, 30),
  };
}

function getModuleColorVar(linkedModule?: string | null): string {
  if (!linkedModule) return '--primary';
  const moduleColorMap: Record<string, string> = {
    'goals': '--module-goals',
    'second_brain': '--module-second-brain',
    'second-brain': '--module-second-brain',
    'languages': '--module-languages',
    'studies': '--module-studies',
    'planner': '--module-planner',
    'daily_planner': '--module-planner',
  };
  return moduleColorMap[linkedModule] || '--primary';
}

interface DragState {
  blockId: string;
  type: 'move' | 'resize';
  startY: number;
  originalStartMinutes: number;
  originalEndMinutes: number;
  pointerId: number;
  targetElement: HTMLElement;
}

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [clickedTime, setClickedTime] = useState<{ start: string; end: string } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempBlock, setTempBlock] = useState<{ id: string; startTime: string; endTime: string } | null>(null);
  const [addSubBlockParentId, setAddSubBlockParentId] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [addingTaskToBlock, setAddingTaskToBlock] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const gridRef = useRef<HTMLDivElement>(null);

  const { data: blocks, isLoading } = useQuery<TimeBlock[]>({
    queryKey: ["/api/time-blocks", dateStr],
  });

  const { data: dailyMetrics } = useQuery<{ plannerCompletion?: string }>({
    queryKey: ["/api/daily-metrics", dateStr],
  });

  const { data: allMetrics } = useQuery<DailyMetric[]>({
    queryKey: ["/api/daily-metrics"],
  });

  const { data: presets, isLoading: presetsLoading } = useQuery<DayPreset[]>({
    queryKey: ["/api/day-presets"],
  });

  const chartData = useMemo(() => {
    if (!allMetrics || allMetrics.length === 0) return [];
    return allMetrics.map(m => ({
      date: format(parseISO(m.date), "MMM d"),
      fullDate: m.date,
      completion: parseFloat(m.plannerCompletion || "0"),
    }));
  }, [allMetrics]);

  const chartConfig = {
    completion: {
      label: "Completion",
      color: "hsl(var(--primary))",
    },
  };

  const applyPresetMutation = useMutation({
    mutationFn: async (preset: DayPreset) => {
      const results = [];
      for (const block of preset.blocks) {
        const result = await apiRequest("POST", "/api/time-blocks", {
          date: dateStr,
          startTime: block.startTime,
          endTime: block.endTime,
          title: block.title,
          tasks: block.tasks?.map(t => ({
            id: crypto.randomUUID(),
            text: t.text,
            importance: t.importance,
            completed: false,
          })) || [],
          linkedModule: block.linkedModule,
          linkedItemId: block.linkedItemId,
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
      toast({ title: "Preset applied successfully" });
    },
    onError: () => {
      toast({ title: "Failed to apply preset", variant: "destructive" });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/day-presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-presets"] });
      toast({ title: "Preset deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete preset", variant: "destructive" });
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/time-blocks/${id}`, { completed });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
      const updatedBlocks = queryClient.getQueryData<TimeBlock[]>(["/api/time-blocks", dateStr]);
      if (updatedBlocks && updatedBlocks.length > 0) {
        const parentBlocks = updatedBlocks.filter(b => !b.parentId);
        const completedCount = parentBlocks.filter(b => b.completed).length;
        const plannerCompletion = Math.round((completedCount / parentBlocks.length) * 100);
        await apiRequest("PUT", `/api/daily-metrics/${dateStr}`, { plannerCompletion });
        queryClient.invalidateQueries({ queryKey: ["/api/daily-metrics", dateStr] });
        queryClient.invalidateQueries({ queryKey: ["/api/daily-metrics"] });
      }
    },
    onError: () => {
      toast({ title: "Failed to update time block", variant: "destructive" });
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, startTime, endTime }: { id: string; startTime: string; endTime: string }) => {
      return await apiRequest("PATCH", `/api/time-blocks/${id}`, { startTime, endTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
      toast({ title: "Block updated" });
    },
    onError: () => {
      toast({ title: "Failed to update block", variant: "destructive" });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async ({ blockId, taskText }: { blockId: string; taskText: string }) => {
      const block = blocks?.find(b => b.id === blockId);
      if (!block) throw new Error("Block not found");
      const newTask = {
        id: crypto.randomUUID(),
        text: taskText,
        completed: false,
        importance: 1,
      };
      const updatedTasks = [...(block.tasks || []), newTask];
      return await apiRequest("PATCH", `/api/time-blocks/${blockId}`, { tasks: updatedTasks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
      setAddingTaskToBlock(null);
      setNewTaskText("");
      toast({ title: "Task added" });
    },
    onError: () => {
      toast({ title: "Failed to add task", variant: "destructive" });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ blockId, taskId }: { blockId: string; taskId: string }) => {
      const block = blocks?.find(b => b.id === blockId);
      if (!block) throw new Error("Block not found");
      const updatedTasks = block.tasks?.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ) || [];
      
      // Check if all tasks are now completed
      const allTasksCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
      const shouldMarkBlockCompleted = allTasksCompleted && !block.completed;
      
      // Update tasks
      await apiRequest("PATCH", `/api/time-blocks/${blockId}`, { tasks: updatedTasks });
      
      // If all tasks are completed, mark the block as completed
      if (shouldMarkBlockCompleted) {
        return await apiRequest("PATCH", `/api/time-blocks/${blockId}`, { completed: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      return await apiRequest("DELETE", `/api/time-blocks/${blockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
      toast({ title: "Block deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete block", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async ({ blockId, taskId }: { blockId: string; taskId: string }) => {
      const block = blocks?.find(b => b.id === blockId);
      if (!block) throw new Error("Block not found");
      const updatedTasks = block.tasks?.filter(t => t.id !== taskId) || [];
      return await apiRequest("PATCH", `/api/time-blocks/${blockId}`, { tasks: updatedTasks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const handleAddTask = (blockId: string) => {
    if (newTaskText.trim()) {
      addTaskMutation.mutate({ blockId, taskText: newTaskText.trim() });
    }
  };

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState && expandedContent) {
      setExpandedContent(null);
      return;
    }
    if (dragState) return;
    if (!gridRef.current) return;
    if ((e.target as HTMLElement).closest('[data-block-id]')) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + gridRef.current.scrollTop;
    const hourIndex = Math.floor(y / HOUR_HEIGHT);
    const hour = Math.min(Math.max(hourIndex + 6, 6), 23);
    const startHour = hour.toString().padStart(2, "0");
    const endHour = Math.min(hour + 1, 24).toString().padStart(2, "0");
    setClickedTime({ start: `${startHour}:00`, end: `${endHour}:00` });
    setAddDialogOpen(true);
  };

  const handleDragStart = useCallback((
    e: React.PointerEvent,
    block: TimeBlock,
    type: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDragState({
      blockId: block.id,
      type,
      startY: e.clientY,
      originalStartMinutes: timeToMinutes(block.startTime),
      originalEndMinutes: timeToMinutes(block.endTime),
      pointerId: e.pointerId,
      targetElement: target,
    });
    setTempBlock({
      id: block.id,
      startTime: block.startTime,
      endTime: block.endTime,
    });
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragState || !gridRef.current) return;
    
    const deltaY = e.clientY - dragState.startY;
    const deltaMinutes = (deltaY / HOUR_HEIGHT) * 60;
    
    if (dragState.type === 'move') {
      const newStartMinutes = snapToGrid(dragState.originalStartMinutes + deltaMinutes);
      const duration = dragState.originalEndMinutes - dragState.originalStartMinutes;
      const newEndMinutes = newStartMinutes + duration;
      
      if (newStartMinutes >= 6 * 60 && newEndMinutes <= 24 * 60) {
        setTempBlock({
          id: dragState.blockId,
          startTime: minutesToTime(newStartMinutes),
          endTime: minutesToTime(newEndMinutes),
        });
      }
    } else {
      const newEndMinutes = snapToGrid(dragState.originalEndMinutes + deltaMinutes);
      const minEnd = dragState.originalStartMinutes + 30;
      
      if (newEndMinutes >= minEnd && newEndMinutes <= 24 * 60) {
        setTempBlock({
          id: dragState.blockId,
          startTime: minutesToTime(dragState.originalStartMinutes),
          endTime: minutesToTime(newEndMinutes),
        });
      }
    }
  }, [dragState]);

  const handleDragEnd = useCallback(() => {
    if (dragState) {
      try {
        dragState.targetElement.releasePointerCapture(dragState.pointerId);
      } catch {
      }
      
      if (tempBlock) {
        const block = blocks?.find(b => b.id === dragState.blockId);
        if (block && (block.startTime !== tempBlock.startTime || block.endTime !== tempBlock.endTime)) {
          updateBlockMutation.mutate({
            id: tempBlock.id,
            startTime: tempBlock.startTime,
            endTime: tempBlock.endTime,
          });
        }
      }
    }
    setDragState(null);
    setTempBlock(null);
  }, [dragState, tempBlock, blocks, updateBlockMutation]);

  const completionPercent = dailyMetrics?.plannerCompletion 
    ? parseFloat(dailyMetrics.plannerCompletion) 
    : 0;

  const showTodayButton = !isToday(selectedDate);

  const getDisplayBlock = (block: TimeBlock) => {
    if (tempBlock && tempBlock.id === block.id) {
      return { ...block, startTime: tempBlock.startTime, endTime: tempBlock.endTime };
    }
    return block;
  };

  return (
    <div 
      className="container mx-auto p-4 md:p-6 max-w-7xl"
      onPointerMove={dragState ? handleDragMove : undefined}
      onPointerUp={dragState ? handleDragEnd : undefined}
      onPointerLeave={dragState ? handleDragEnd : undefined}
      onPointerCancel={dragState ? handleDragEnd : undefined}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Daily Planner</h1>

        <Card className="flex-shrink-0">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-sm font-medium">Completion History</CardTitle>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-medium" data-testid="text-completion-score">
                  {completionPercent.toFixed(0)}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4 px-4">
            {chartData.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">
                Start tracking to see your completion history
              </div>
            ) : (
              <div className="h-96">
                <ChartContainer 
                  config={chartConfig} 
                  className="h-full w-full"
                >
                  <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                    <defs>
                      <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      width={40}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(_, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullDate;
                        }
                        return "";
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completion"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#completionGradient)"
                      dot={{ fill: "hsl(var(--primary))", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-max lg:auto-rows-auto">
          <Card className="lg:col-span-3 order-1 lg:order-none">
            <CardHeader className="py-3 px-4 border-b">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevDay}
                    data-testid="button-prev-day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium" data-testid="text-selected-date">
                    {getDateLabel(selectedDate)}
                    {!isToday(selectedDate) && !isYesterday(selectedDate) && !isTomorrow(selectedDate) && (
                      <span className="text-muted-foreground font-normal ml-2">
                        {format(selectedDate, "yyyy")}
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextDay}
                    data-testid="button-next-day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {showTodayButton && (
                    <Button variant="outline" size="sm" onClick={handleToday} data-testid="button-today">
                      Today
                    </Button>
                  )}
                  <AddTimeBlockDialog 
                    date={dateStr} 
                    open={addDialogOpen}
                    onOpenChange={(open) => {
                      setAddDialogOpen(open);
                      if (!open) setAddSubBlockParentId(null);
                    }}
                    defaultStartTime={clickedTime?.start}
                    defaultEndTime={clickedTime?.end}
                    parentId={addSubBlockParentId || undefined}
                  />
                </div>
              </div>
            </CardHeader>
            <div className="h-px bg-border" />
            <div className="flex pl-3 pr-3 pt-4">
              <div className="w-14 flex-shrink-0 relative" style={{ height: HOURS.length * HOUR_HEIGHT + 20 }}>
                {HOURS.map((hour) => (
                  <div
                    key={`hour-${hour}`}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: hour * HOUR_HEIGHT }}
                  >
                    <span className="absolute -top-3 left-1 text-xs text-muted-foreground font-mono bg-card px-1">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              <div 
                ref={gridRef}
                className={`relative flex-1 ${dragState ? 'cursor-grabbing select-none' : ''}`}
                onClick={handleGridClick}
                data-testid="planner-grid"
                style={{ height: HOURS.length * HOUR_HEIGHT + 20 }}
              >
                {HOURS.map((hour) => (
                  <div 
                    key={`grid-${hour}`}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: hour * HOUR_HEIGHT }}
                  />
                ))}

                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                  </div>
                ) : blocks && blocks.length > 0 ? (
                  <>
                    {/* Render parent blocks only (no parentId) */}
                    {blocks.filter(b => !b.parentId).map((originalBlock) => {
                      const block = getDisplayBlock(originalBlock);
                      const { top, height } = getBlockStyle(block);
                      const isDragging = dragState?.blockId === block.id;
                      const subBlocks = blocks.filter(b => b.parentId === block.id);
                      const colorVar = getModuleColorVar(block.linkedModule);
                      const taskCount = block.tasks?.length || 0;
                      const completedTasks = block.tasks?.filter(t => t.completed).length || 0;
                      const isExpanded = expandedBlocks.has(block.id);
                      
                      const HEADER_HEIGHT = 32;
                      const CONTENT_MIN_HEIGHT = 40;
                      const hasContent = taskCount > 0 || subBlocks.length > 0;
                      const contentOverflows = hasContent && height < HEADER_HEIGHT + CONTENT_MIN_HEIGHT + 10;
                      const isCollapsed = contentOverflows && !isExpanded;
                      const displayHeight = isCollapsed ? HEADER_HEIGHT : (isExpanded ? 'auto' : height);
                      
                      return (
                        <div
                          key={block.id}
                          data-block-id={block.id}
                          className={`absolute rounded-lg border flex flex-col overflow-hidden transition-all duration-200 ${
                            isDragging ? 'shadow-2xl z-20' : 'shadow-sm hover:shadow-md'
                          }`}
                          style={{ 
                            top, 
                            height: displayHeight,
                            minHeight: isExpanded ? height : HEADER_HEIGHT,
                            left: '8px', 
                            right: '8px',
                            borderColor: `hsl(var(${colorVar}) / 0.5)`,
                            backgroundColor: `hsl(var(${colorVar}) / 0.04)`,
                            zIndex: isExpanded ? 15 : isDragging ? 20 : 1,
                            ...(isDragging && { 
                              boxShadow: `0 25px 50px -12px hsl(var(${colorVar}) / 0.4), 0 0 0 1px hsl(var(${colorVar}) / 0.2)`,
                            })
                          }}
                          data-testid={`block-${block.id}`}
                        >
                          {/* Header - ONLY checkbox, title, time, drag - 60% opacity */}
                          <div 
                            className={`flex items-center gap-2 px-3 py-2 shrink-0 ${block.completed ? 'opacity-70' : ''}`}
                            style={{ 
                              backgroundColor: `hsl(var(${colorVar}) / 0.55)`,
                              minHeight: HEADER_HEIGHT,
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={block.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (!dragState) {
                                  toggleBlockMutation.mutate({ id: block.id, completed: !block.completed });
                                }
                              }}
                              className="w-3.5 h-3.5 shrink-0 cursor-pointer"
                              style={{ accentColor: `hsl(var(${colorVar}))` }}
                              data-testid={`checkbox-block-${block.id}`}
                            />
                            <span className={`text-sm font-medium truncate flex-1 ${
                              block.completed ? "line-through text-muted-foreground/60" : "text-foreground/90"
                            }`}>
                              {block.title}
                            </span>
                            <span className="text-xs text-muted-foreground/70 font-mono shrink-0">
                              {block.startTime}–{block.endTime}
                            </span>
                            <div 
                              className="cursor-grab active:cursor-grabbing shrink-0"
                              style={{ touchAction: 'none' }}
                              onPointerDown={(e) => handleDragStart(e, originalBlock, 'move')}
                              data-testid={`block-drag-handle-${block.id}`}
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground/60" />
                            </div>
                            {contentOverflows && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-4 w-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedContent(expandedContent === block.id ? null : block.id);
                                }}
                                data-testid={`button-toggle-expand-content-${block.id}`}
                              >
                                {expandedContent === block.id ? (
                                  <Minimize2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Maximize2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlockMutation.mutate(block.id);
                              }}
                              data-testid={`button-delete-block-${block.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* Dividing line */}
                          <div style={{ height: '1px', backgroundColor: `hsl(var(${colorVar}) / 0.4)` }} />

                          {/* Content area - EVERYTHING (tasks, sub-blocks, buttons) - 30% opacity */}
                          {!isCollapsed && (
                            <div 
                              className={`flex-1 flex flex-col gap-2 min-h-0 p-3 overflow-y-auto ${block.completed ? 'opacity-65' : ''}`}
                              style={{ 
                                backgroundColor: `hsl(var(${colorVar}) / 0.25)`,
                                ...(expandedContent === block.id && {
                                  position: 'fixed',
                                  inset: '0',
                                  zIndex: 40,
                                  margin: 0,
                                  padding: '3rem 2.5rem 2.5rem 2.5rem',
                                  borderRadius: '0.5rem',
                                  maxHeight: '90vh',
                                  left: '50%',
                                  top: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: '90%',
                                  maxWidth: '600px',
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Tasks */}
                              {taskCount > 0 && (
                                <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                                  {block.tasks?.map((task) => (
                                    <div 
                                      key={task.id} 
                                      className="flex items-center gap-1 px-2 py-1 rounded bg-background group" 
                                    >
                                      <input 
                                        type="checkbox" 
                                        checked={task.completed}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleTaskMutation.mutate({ blockId: block.id, taskId: task.id });
                                        }}
                                        className="w-3 h-3 shrink-0 cursor-pointer"
                                        style={{ accentColor: `hsl(var(${colorVar}))` }}
                                      />
                                      <span className={`truncate text-xs flex-1 ${task.completed ? 'line-through text-muted-foreground/70' : 'text-foreground/80'}`}>
                                        {task.text}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-3 w-3 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTaskMutation.mutate({ blockId: block.id, taskId: task.id });
                                        }}
                                        data-testid={`button-delete-task-${task.id}`}
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add task input */}
                              {addingTaskToBlock === block.id && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-background" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'Enter') handleAddTask(block.id);
                                      if (e.key === 'Escape') {
                                        setAddingTaskToBlock(null);
                                        setNewTaskText("");
                                      }
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        setAddingTaskToBlock(null);
                                        setNewTaskText("");
                                      }, 150);
                                    }}
                                    placeholder="Task name..."
                                    className="flex-1 text-xs bg-transparent border-none outline-none"
                                    autoFocus
                                    data-testid={`input-new-task-${block.id}`}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddTask(block.id);
                                    }}
                                    disabled={!newTaskText.trim()}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}

                              {/* Sub-blocks (nested inside parent content) */}
                              {subBlocks.length > 0 && (
                                <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                  {subBlocks.map((subBlock) => {
                                    const subTaskCount = subBlock.tasks?.length || 0;
                                    const subCompletedTasks = subBlock.tasks?.filter(t => t.completed).length || 0;
                                    const subIsExpanded = expandedBlocks.has(subBlock.id);
                                    const SUB_HEADER_HEIGHT = 24;
                                    const SUB_CONTENT_MIN = 20;
                                    const subContentOverflows = subTaskCount > 0 && 60 < SUB_HEADER_HEIGHT + SUB_CONTENT_MIN;
                                    const subIsCollapsed = subContentOverflows && !subIsExpanded;
                                    
                                    return (
                                      <div
                                        key={subBlock.id}
                                        className="relative rounded border flex flex-col overflow-hidden bg-background/50"
                                        style={{ 
                                          borderColor: `hsl(var(${colorVar}) / 0.3)`,
                                          ...(expandedContent === subBlock.id && {
                                            position: 'fixed',
                                            inset: '0',
                                            zIndex: 40,
                                            margin: 0,
                                            padding: '3rem 2.5rem 2.5rem 2.5rem',
                                            borderRadius: '0.5rem',
                                            maxHeight: '90vh',
                                            left: '50%',
                                            top: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '90%',
                                            maxWidth: '600px',
                                          })
                                        }}
                                        data-testid={`sub-block-nested-${subBlock.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {/* Sub-block header */}
                                        <div 
                                          className="flex items-center gap-1 px-1.5 py-0.5 shrink-0"
                                          style={{ 
                                            backgroundColor: `hsl(var(${colorVar}) / 0.15)`,
                                            ...(expandedContent === subBlock.id && {
                                              position: 'sticky',
                                              top: 0,
                                              zIndex: 41,
                                            })
                                          }}
                                        >
                                          <input 
                                            type="checkbox" 
                                            checked={subBlock.completed}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (!dragState) {
                                                toggleBlockMutation.mutate({ id: subBlock.id, completed: !subBlock.completed });
                                              }
                                            }}
                                            className="w-2.5 h-2.5 shrink-0 cursor-pointer"
                                            style={{ accentColor: `hsl(var(${colorVar}))` }}
                                          />
                                          <span className={`text-xs font-medium truncate flex-1 ${subBlock.completed ? "line-through text-muted-foreground/60" : ""}`}>
                                            {subBlock.title}
                                          </span>
                                          {subTaskCount > 0 && (
                                            <Badge 
                                              variant="outline" 
                                              className="text-xs shrink-0 px-1 py-0" 
                                              style={{ 
                                                borderColor: `hsl(var(${colorVar}) / 0.4)`,
                                                backgroundColor: `hsl(var(${colorVar}) / 0.08)`,
                                              }}
                                            >
                                              {subCompletedTasks}/{subTaskCount}
                                            </Badge>
                                          )}
                                          {subContentOverflows && (
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-3 w-3 shrink-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedContent(expandedContent === subBlock.id ? null : subBlock.id);
                                              }}
                                              data-testid={`button-expand-sub-nested-${subBlock.id}`}
                                            >
                                              {expandedContent === subBlock.id ? (
                                                <Minimize2 className="w-2 h-2" />
                                              ) : (
                                                <Maximize2 className="w-2 h-2" />
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                        
                                        {/* Sub-block content */}
                                        {!subIsCollapsed && (
                                          <div 
                                            className="flex flex-col gap-1 px-1.5 py-1 overflow-y-auto"
                                            style={{ 
                                              backgroundColor: `hsl(var(${colorVar}) / 0.1)`,
                                              ...(expandedContent === subBlock.id && {
                                                flex: 1,
                                              })
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {subTaskCount > 0 && (
                                              <div className="flex flex-col gap-0.5">
                                                {subBlock.tasks?.map((task) => (
                                                  <div 
                                                    key={task.id} 
                                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer hover-elevate bg-background/80" 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleTaskMutation.mutate({ blockId: subBlock.id, taskId: task.id });
                                                    }}
                                                  >
                                                    <input 
                                                      type="checkbox" 
                                                      checked={task.completed}
                                                      readOnly
                                                      className="w-2 h-2 shrink-0"
                                                      style={{ accentColor: `hsl(var(${colorVar}))` }}
                                                    />
                                                    <span className={`truncate text-xs ${task.completed ? 'line-through text-muted-foreground/60' : 'text-foreground/80'}`}>
                                                      {task.text}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            
                                            {/* Add task input for sub-block */}
                                            {addingTaskToBlock === subBlock.id && (
                                              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-background/80">
                                                <input
                                                  type="text"
                                                  value={newTaskText}
                                                  onChange={(e) => setNewTaskText(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddTask(subBlock.id);
                                                    if (e.key === 'Escape') {
                                                      setAddingTaskToBlock(null);
                                                      setNewTaskText("");
                                                    }
                                                  }}
                                                  onBlur={() => {
                                                    setTimeout(() => {
                                                      setAddingTaskToBlock(null);
                                                      setNewTaskText("");
                                                    }, 150);
                                                  }}
                                                  placeholder="Task..."
                                                  className="flex-1 text-xs bg-transparent border-none outline-none"
                                                  autoFocus
                                                  data-testid={`input-new-task-sub-nested-${subBlock.id}`}
                                                />
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-3 w-3"
                                                  onClick={() => handleAddTask(subBlock.id)}
                                                  disabled={!newTaskText.trim()}
                                                >
                                                  <Plus className="w-1.5 h-1.5" />
                                                </Button>
                                              </div>
                                            )}
                                            
                                            {/* Add task button for sub-block */}
                                            {addingTaskToBlock !== subBlock.id && (
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-4 w-4 self-start"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setAddingTaskToBlock(subBlock.id);
                                                  setNewTaskText("");
                                                }}
                                                data-testid={`button-add-task-sub-nested-${subBlock.id}`}
                                              >
                                                <Plus className="w-2 h-2" style={{ color: `hsl(var(${colorVar}))` }} />
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Footer with + and minimize buttons */}
                              <div 
                                className="flex items-center gap-1 px-2 py-1 mt-auto shrink-0"
                              >
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-5 w-5"
                                      onClick={(e) => e.stopPropagation()}
                                      data-testid={`button-add-${block.id}`}
                                    >
                                      <Plus className="w-3 h-3" style={{ color: `hsl(var(${colorVar}))` }} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-40 p-1" align="start">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start gap-2 h-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddingTaskToBlock(block.id);
                                        setNewTaskText("");
                                      }}
                                      data-testid={`button-add-task-${block.id}`}
                                    >
                                      <ListTodo className="w-3.5 h-3.5" />
                                      Add Task
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start gap-2 h-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddSubBlockParentId(block.id);
                                        setClickedTime({ start: block.startTime, end: block.endTime });
                                        setAddDialogOpen(true);
                                      }}
                                      data-testid={`button-add-sub-block-${block.id}`}
                                    >
                                      <Layers className="w-3.5 h-3.5" />
                                      Add Sub-block
                                    </Button>
                                  </PopoverContent>
                                </Popover>
                                <div className="flex-1" />
                                {contentOverflows && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBlockExpanded(block.id);
                                    }}
                                    data-testid={`button-expand-${block.id}`}
                                  >
                                    <ChevronDown 
                                      className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      style={{ color: `hsl(var(${colorVar}))` }}
                                    />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Resize handle */}
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize"
                            style={{ 
                              touchAction: 'none',
                              backgroundColor: `hsla(var(${colorVar}), 0.4)`,
                            }}
                            onPointerDown={(e) => handleDragStart(e, originalBlock, 'resize')}
                            data-testid={`block-resize-handle-${block.id}`}
                          />
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">No blocks yet</p>
                      <p className="text-muted-foreground text-xs">Click on the grid to add one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="order-2 lg:order-none self-start">
            <CardHeader className="py-3 px-4 flex-shrink-0 border-b">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-sm font-medium">Presets</CardTitle>
                <CreatePresetDialog />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 min-h-0">
              {presetsLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : presets && presets.length > 0 ? (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="group border rounded-md p-2 bg-card hover-elevate"
                      data-testid={`preset-${preset.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{preset.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => applyPresetMutation.mutate(preset)}
                            disabled={applyPresetMutation.isPending}
                            data-testid={`button-apply-preset-${preset.id}`}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => deletePresetMutation.mutate(preset.id)}
                            disabled={deletePresetMutation.isPending}
                            data-testid={`button-delete-preset-${preset.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {preset.blocks.length} block{preset.blocks.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="text-sm">No presets saved</p>
                  <p className="text-xs mt-1">Create a preset to quickly add common schedules</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
