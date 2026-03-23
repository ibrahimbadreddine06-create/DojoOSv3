import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { format } from "date-fns";
import { SectionLabel } from "./section-label";
import type { TimeBlock } from "@shared/schema";

export function PlannedActivities() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: timeBlocks } = useQuery<TimeBlock[]>({
    queryKey: ["/api/time-blocks", today],
  });

  const bodyBlocks = timeBlocks?.filter(
    (b) => b.linkedModule === "body" || b.linkedModule === "body_workout"
  ) || [];

  return (
    <div>
      <SectionLabel>Activities planned today</SectionLabel>

      {bodyBlocks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">No activities planned today</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add a time block in your daily planner to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bodyBlocks.map((block) => (
            <Card key={block.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {block.startTime} – {block.endTime}
                  </div>
                  <div className="text-sm font-medium mt-0.5">{block.title}</div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Start
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
