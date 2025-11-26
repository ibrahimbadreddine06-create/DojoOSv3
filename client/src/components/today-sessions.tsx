import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { TimeBlock } from "@shared/schema";

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
  module: "second_brain" | "languages" | "studies";
  itemId?: string;
}

export function TodaySessions({ module, itemId }: TodaySessionsProps) {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: sessions, isLoading } = useQuery<TimeBlock[]>({
    queryKey: ["/api/time-blocks/linked", module, today, itemId],
    queryFn: async () => {
      const params = new URLSearchParams({ date: today, module });
      if (itemId) params.append("itemId", itemId);
      const response = await fetch(`/api/time-blocks/linked?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
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
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Today's Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            No sessions scheduled for today
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Link time blocks from the Daily Planner
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today's Sessions
          <Badge variant="secondary" className="ml-auto">
            {sessions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {sessions.map((block) => {
            const height = getBlockHeight(block);
            const completedTasks = block.tasks?.filter((t: { completed: boolean }) => t.completed).length || 0;
            const totalTasks = block.tasks?.length || 0;

            return (
              <div
                key={block.id}
                className={`rounded-md border p-3 transition-shadow hover-elevate ${
                  block.completed
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card border-border"
                }`}
                style={{ minHeight: height }}
                data-testid={`session-block-${block.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-sm ${
                      block.completed ? "line-through text-muted-foreground" : ""
                    }`}>
                      {block.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {block.startTime} - {block.endTime}
                      </span>
                    </div>
                    {totalTasks > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {completedTasks}/{totalTasks} tasks completed
                      </div>
                    )}
                  </div>
                  {block.completed && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Done
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
