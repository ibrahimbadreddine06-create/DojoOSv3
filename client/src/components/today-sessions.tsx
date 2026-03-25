import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/circular-progress";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { TimeBlock } from "@shared/schema";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 40;

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getBlockHeight(block: TimeBlock): number {
  const startMinutes = timeToMinutes(block.startTime);
  const endMinutes = timeToMinutes(block.endTime);
  const duration = endMinutes - startMinutes;
  return Math.max((duration / 60) * HOUR_HEIGHT, 30);
}

interface TodaySessionsProps {
  module: "second_brain" | "languages" | "studies" | "body" | "disciplines" | "activity" | "nutrition" | "rest" | "hygiene";
  itemId?: string;
  naked?: boolean;
  hideHeader?: boolean;
  className?: string;
}

function getModuleColorVar(linkedModule?: string | null): string {
  if (!linkedModule) return '--primary';
  const moduleColorMap: Record<string, string> = {
    'goals': '--module-goals',
    'second_brain': '--module-second-brain',
    'second-brain': '--module-second-brain',
    'languages': '--module-languages',
    'studies': '--module-studies',
    'disciplines': '--module-disciplines',
    'planner': '--module-planner',
    'daily_planner': '--module-planner',
    'activity': '--module-activity',
    'workout': '--module-activity',
    'sport': '--module-activity',
    'nutrition': '--module-nutrition',
    'meal': '--module-nutrition',
    'food': '--module-nutrition',
    'rest': '--module-rest',
    'sleep': '--module-rest',
    'hygiene': '--module-hygiene',
    'looks': '--module-hygiene',
  };
  return moduleColorMap[linkedModule] || '--primary';
}

function calculateWeightedCompletion(tasks?: Array<{ completed: boolean; importance?: number }>, subBlocks?: Array<{ completed: boolean; importance?: number }>): number {
  const allItems = [...(tasks || []), ...(subBlocks || [])];
  if (allItems.length === 0) return 0;
  let totalWeight = 0;
  let completedWeight = 0;
  for (const item of allItems) {
    const importance = item.importance || 3;
    totalWeight += importance;
    if (item.completed) completedWeight += importance;
  }
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

export function TodaySessions({ module, itemId, naked = false, hideHeader = false, className }: TodaySessionsProps) {
  const [, navigate] = useLocation();
  const today = format(new Date(), "yyyy-MM-dd");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery<TimeBlock[]>({
    queryKey: ["/api/time-blocks/linked", module, today, itemId],
    queryFn: async () => {
      const url = new URL(`${window.location.origin}/api/time-blocks/linked`);
      url.searchParams.append("date", today);
      url.searchParams.append("module", module);
      if (itemId) url.searchParams.append("itemId", itemId);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/time-blocks/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/time-blocks/linked", module, today, itemId] });
      const previous = queryClient.getQueryData(["/api/time-blocks/linked", module, today, itemId]);
      queryClient.setQueryData(["/api/time-blocks/linked", module, today, itemId], (old: any[]) =>
        old.filter((block) => block.id !== id)
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Block deleted" });
    },
    onError: (err, id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/time-blocks/linked", module, today, itemId], context.previous);
      }
      toast({ title: "Failed to delete block", variant: "destructive" });
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/time-blocks/${id}`, { completed });
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/time-blocks/linked", module, today, itemId] });
      queryClient.setQueryData(["/api/time-blocks/linked", module, today, itemId], (old: any[]) =>
        old.map((block) => block.id === id ? { ...block, completed } : block)
      );
    },
    onError: () => {
      queryClient.refetchQueries({ queryKey: ["/api/time-blocks/linked", module, today, itemId] });
    },
  });

  if (isLoading) {
    if (naked) return <div className={cn("animate-pulse text-muted-foreground text-sm", className)}>Loading...</div>;
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Today's Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    if (naked) {
      return (
        <div className={cn("py-6 flex flex-col items-center justify-center gap-2", className)}>
          <p className="text-sm font-medium text-muted-foreground/50">No sessions scheduled for today</p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/planner')} className="text-[10px] h-7">
            Go to Daily Planner
          </Button>
        </div>
      );
    }
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Today's Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 px-4 flex flex-col items-center justify-center gap-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              No sessions scheduled for today
            </p>
            <p className="text-xs text-muted-foreground">
              Link time blocks from the Daily Planner
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/planner')}>
            Go to Daily Planner
          </Button>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className={cn("space-y-3", naked ? "" : "p-4", className)}>
      {!hideHeader && naked && (
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Today's Sessions</span>
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-4 min-w-[1.25rem] flex items-center justify-center">
            {sessions.length}
          </Badge>
        </div>
      )}
      <div className="space-y-3">
        {sessions.map((block) => {
          const colorVar = getModuleColorVar(block.linkedModule);
          const progress = calculateWeightedCompletion(block.tasks || [], []);

          return (
            <div
              key={block.id}
              className="rounded-xl border flex flex-col overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md"
              style={{
                borderColor: `hsl(var(${colorVar}) / 0.4)`,
                backgroundColor: `hsl(var(${colorVar}) / 0.03)`,
                minHeight: 70,
              }}
              data-testid={`session-block-${block.id}`}
            >
              {/* Header */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 shrink-0 ${block.completed ? 'opacity-70' : ''}`}
                style={{
                  backgroundColor: `hsl(var(${colorVar}) / 0.45)`,
                  minHeight: 28,
                }}
              >
                <CircularProgress
                  completed={block.completed}
                  progress={progress}
                  diameter={18}
                  colorVar={colorVar}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBlockMutation.mutate({ id: block.id, completed: !block.completed });
                  }}
                  data-testid={`checkbox-block-${block.id}`}
                />
                <span className={`text-xs font-bold truncate flex-1 uppercase tracking-tight ${block.completed ? "line-through text-muted-foreground/60" : "text-foreground/90"
                  }`}>
                  {block.title}
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold tabular-nums shrink-0">
                  {block.startTime}–{block.endTime}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 text-destructive/40 hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${block.title}"?`)) {
                      deleteBlockMutation.mutate(block.id);
                    }
                  }}
                  data-testid={`button-delete-block-${block.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Divider */}
              <div style={{ height: '0.5px', backgroundColor: `hsl(var(${colorVar}) / 0.3)` }} />

              {/* Content area */}
              {block.tasks && block.tasks.length > 0 && (
                <div
                  className={`flex-1 flex flex-col gap-1.5 min-h-0 p-2.5 overflow-y-auto ${block.completed ? 'opacity-60' : ''}`}
                  style={{
                    backgroundColor: `hsl(var(${colorVar}) / 0.15)`,
                  }}
                >
                  {block.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-150"
                      style={{
                        backgroundColor: `hsl(var(${colorVar}) / 0.1)`,
                      }}
                    >
                      <span className={`truncate text-[11px] font-medium flex-1 ${task.completed ? 'line-through text-muted-foreground/50' : 'text-foreground/70'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (naked) return content;

  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today's Sessions
          <Badge variant="secondary" className="ml-auto">
            {sessions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
}
