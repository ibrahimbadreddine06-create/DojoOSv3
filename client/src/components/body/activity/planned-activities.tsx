import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { TimeBlock, Workout } from "@shared/schema";

export function PlannedActivities() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: timeBlocks } = useQuery<TimeBlock[]>({
    queryKey: ["/api/time-blocks", today],
  });

  const { data: workouts } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const bodyBlocks = timeBlocks?.filter(
    (b) => b.linkedItemId === "body_activity" || b.linkedModule === "body_workout"
  ) || [];

  const todaysWorkouts = workouts?.filter(
    (w) => w.date && format(new Date(w.date), "yyyy-MM-dd") === today
  ) || [];

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Linked Time Blocks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {bodyBlocks.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground font-medium">No activities planned</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest mt-1">
              Link from Daily Planner
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bodyBlocks.map((block) => {
              const isCompleted = todaysWorkouts.some(w => w.linkedBlockId === block.id && w.completed);
              
              return (
                <div 
                  key={block.id} 
                  className={`group relative bg-card border rounded-2xl p-4 transition-all hover:shadow-md ${isCompleted ? "border-red-500/30" : "border-dashed opacity-60 hover:opacity-100"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isCompleted ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        <Play className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">{block.title}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{block.startTime} - {block.endTime}</p>
                      </div>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-red-500" />
                    ) : (
                      <Button size="sm" variant="outline" className="text-[10px] font-black uppercase tracking-widest h-8">
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
