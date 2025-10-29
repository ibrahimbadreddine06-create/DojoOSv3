import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { AddTimeBlockDialog } from "@/components/dialogs/add-time-block-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: blocks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/time-blocks", dateStr],
  });

  const { data: dailyMetrics } = useQuery<any>({
    queryKey: ["/api/daily-metrics", dateStr],
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/time-blocks/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", dateStr] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-metrics", dateStr] });
    },
    onError: () => {
      toast({ title: "Failed to update time block", variant: "destructive" });
    },
  });

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const importanceColors: Record<number, string> = {
    1: "bg-muted text-muted-foreground",
    2: "bg-chart-2/20 text-chart-2",
    3: "bg-chart-1/20 text-chart-1",
    4: "bg-chart-4/20 text-chart-4",
    5: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-planner-title">
              Daily Planner
            </h1>
            <p className="text-muted-foreground">
              Manage your time blocks and track daily completion
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday} data-testid="button-today">
              Today
            </Button>
            <Button variant="outline" size="sm" data-testid="button-add-preset">
              <Plus className="w-4 h-4 mr-2" />
              Preset
            </Button>
            <AddTimeBlockDialog date={dateStr} />
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevDay}
                data-testid="button-prev-day"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold" data-testid="text-selected-date">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDay}
                data-testid="button-next-day"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            {dailyMetrics?.plannerCompletion !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Completion:</span>
                <span className="text-lg font-semibold font-mono" data-testid="text-completion-score">
                  {dailyMetrics.plannerCompletion}%
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : blocks && blocks.length > 0 ? (
              blocks.map((block) => (
                <Card key={block.id} className="hover-elevate" data-testid={`card-block-${block.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{block.title}</CardTitle>
                          <Badge
                            variant="outline"
                            className={importanceColors[block.importance] || importanceColors[3]}
                            data-testid={`badge-importance-${block.id}`}
                          >
                            Importance {block.importance}
                          </Badge>
                        </div>
                        <CardDescription className="font-mono text-sm">
                          {block.startTime} - {block.endTime}
                        </CardDescription>
                      </div>
                      <Button
                        variant={block.completed ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleBlockMutation.mutate({ id: block.id, completed: !block.completed })}
                        disabled={toggleBlockMutation.isPending}
                        data-testid={`button-complete-${block.id}`}
                      >
                        {block.completed ? "Completed" : "Mark Complete"}
                      </Button>
                    </div>
                  </CardHeader>
                  {(block.associatedModules?.length > 0 || block.tasks?.length > 0) && (
                    <CardContent className="pt-0 space-y-3">
                      {block.associatedModules?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {block.associatedModules.map((module: string) => (
                            <Badge key={module} variant="secondary" data-testid={`badge-module-${module}`}>
                              {module}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {block.tasks?.length > 0 && (
                        <div className="space-y-2">
                          {block.tasks.map((task: any) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-sm"
                              data-testid={`task-${task.id}`}
                            >
                              <input
                                type="checkbox"
                                checked={task.completed}
                                className="w-4 h-4 rounded"
                                data-testid={`checkbox-task-${task.id}`}
                              />
                              <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No time blocks yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by creating a time block or applying a preset
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" data-testid="button-apply-preset">
                    Apply Preset
                  </Button>
                  <AddTimeBlockDialog date={dateStr} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {blocks && blocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completion History</CardTitle>
              <CardDescription>Track your daily completion over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Chart will be implemented in integration phase
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
