import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Moon } from "lucide-react";
import { format } from "date-fns";

export function SleepTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: sleepLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sleep-logs", format(selectedDate, "yyyy-MM-dd")],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sleep & Rest Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Track planned vs actual sleep hours
          </p>
        </div>
        <Button size="sm" data-testid="button-add-sleep">
          <Plus className="w-4 h-4 mr-2" />
          Log Sleep
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : sleepLogs && sleepLogs.length > 0 ? (
        <div className="space-y-3">
          {sleepLogs.map((log) => (
            <Card key={log.id} data-testid={`card-sleep-${log.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {format(new Date(log.date), "MMMM d, yyyy")}
                    </CardTitle>
                    {log.notes && (
                      <CardDescription className="text-sm">
                        {log.notes}
                      </CardDescription>
                    )}
                  </div>
                  <div className="text-right font-mono">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Planned</p>
                        <p className="text-lg font-semibold">
                          {parseFloat(log.plannedHours).toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="text-lg font-semibold">
                          {parseFloat(log.actualHours).toFixed(1)}h
                        </p>
                      </div>
                      {log.quality && (
                        <div>
                          <p className="text-xs text-muted-foreground">Quality</p>
                          <p className="text-lg font-semibold">
                            {log.quality}/5
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Moon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No sleep logs</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start tracking your sleep patterns
          </p>
          <Button data-testid="button-create-sleep">
            Log Sleep
          </Button>
        </div>
      )}
    </div>
  );
}
