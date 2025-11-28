import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Clock, GripVertical, Trash2, Play } from "lucide-react";
import { format, addDays, subDays, isToday, isYesterday, isTomorrow, parseISO } from "date-fns";
import { AddTimeBlockDialog } from "@/components/dialogs/add-time-block-dialog";
import { CreatePresetDialog } from "@/components/dialogs/create-preset-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
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

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
            <div 
              ref={gridRef}
              className={`relative w-full ${dragState ? 'cursor-grabbing select-none' : ''}`}
              onClick={handleGridClick}
              data-testid="planner-grid"
              style={{ height: HOURS.length * HOUR_HEIGHT + 20 }}
            >
                {HOURS.map((hour) => (
                  <div 
                    key={hour} 
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: hour * HOUR_HEIGHT }}
                  >
                    <span className="absolute -top-3 left-2 text-xs text-muted-foreground font-mono bg-card px-1">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
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
                      const isParent = subBlocks.length > 0;
                      
                      return (
                        <div
                          key={block.id}
                          data-block-id={block.id}
                          className={`absolute left-4 right-4 rounded border transition-shadow ${
                            isDragging ? 'shadow-lg ring-2 ring-primary/50 z-10' : 'hover-elevate'
                          } ${
                            block.completed 
                              ? "bg-primary/10 border-primary/30" 
                              : "bg-card border-border"
                          }`}
                          style={{ top, height, minHeight: '20px' }}
                          data-testid={`block-${block.id}`}
                        >
                          <div 
                            className="w-full h-full flex flex-col px-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!dragState) {
                                toggleBlockMutation.mutate({ id: block.id, completed: !block.completed });
                              }
                            }}
                          >
                            <span className={`text-xs truncate leading-tight ${
                              block.completed ? "line-through text-muted-foreground" : ""
                            }`}>
                              {block.title}
                            </span>
                          </div>

                          <div 
                            className="absolute top-1 right-1 cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={(e) => handleDragStart(e, originalBlock, 'move')}
                            data-testid={`block-drag-handle-${block.id}`}
                          >
                            <GripVertical className="w-2 h-2 text-muted-foreground/50" />
                          </div>

                          {!block.parentId && height > 40 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-1 left-1 h-3 w-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddSubBlockParentId(block.id);
                                setClickedTime({ start: block.startTime, end: block.endTime });
                                setAddDialogOpen(true);
                              }}
                              data-testid={`button-add-sub-block-${block.id}`}
                            >
                              <Plus className="w-2 h-2" />
                            </Button>
                          )}

                          <div 
                            className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-primary/20 rounded-b"
                            style={{ touchAction: 'none' }}
                            onPointerDown={(e) => handleDragStart(e, originalBlock, 'resize')}
                            data-testid={`block-resize-handle-${block.id}`}
                          />
                        </div>
                      );
                    })}
                    
                    {/* Render sub-blocks (with parentId) */}
                    {blocks.filter(b => b.parentId).map((originalBlock) => {
                      const block = getDisplayBlock(originalBlock);
                      const { top, height } = getBlockStyle(block);
                      const isDragging = dragState?.blockId === block.id;
                      
                      return (
                        <div
                          key={block.id}
                          data-block-id={block.id}
                          className={`absolute rounded-md border-l-4 border-l-primary/50 transition-shadow ${
                            isDragging ? 'shadow-lg ring-2 ring-primary/50 z-10' : 'hover-elevate'
                          } ${
                            block.completed 
                              ? "bg-primary/5 border border-primary/20" 
                              : "bg-muted/50 border border-border/50"
                          }`}
                          style={{ top, height, left: '60%', right: '4px' }}
                          data-testid={`sub-block-${block.id}`}
                        >
                          <div 
                            className="p-2 h-full flex flex-col overflow-hidden cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!dragState) {
                                toggleBlockMutation.mutate({ id: block.id, completed: !block.completed });
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className={`font-medium text-xs truncate ${
                                block.completed ? "line-through text-muted-foreground" : ""
                              }`}>
                                {block.title}
                              </span>
                              {block.completed && (
                                <Badge variant="outline" className="text-xs shrink-0 px-1 py-0">
                                  Done
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {block.startTime} - {block.endTime}
                            </span>
                          </div>
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
