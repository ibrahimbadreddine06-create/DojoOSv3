import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { format } from "date-fns";

export function HygieneTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: routines, isLoading } = useQuery<any[]>({
    queryKey: ["/api/hygiene-routines", format(selectedDate, "yyyy-MM-dd")],
  });

  const completedCount = routines?.filter(r => r.completed).length || 0;
  const totalCount = routines?.length || 0;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Hygiene & Looks</h2>
          <p className="text-sm text-muted-foreground">
            Track daily hygiene routines
          </p>
        </div>
        <Button size="sm" data-testid="button-add-routine">
          <Plus className="w-4 h-4 mr-2" />
          Add Routine
        </Button>
      </div>

      {routines && routines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Completion</CardTitle>
            <CardDescription>{format(selectedDate, "MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-semibold font-mono" data-testid="text-hygiene-completion">
                {completionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} routines completed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : routines && routines.length > 0 ? (
        <div className="space-y-2">
          {routines.map((routine) => (
            <Card
              key={routine.id}
              className="hover-elevate"
              data-testid={`card-routine-${routine.id}`}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={routine.completed}
                      className="w-5 h-5 rounded"
                      data-testid={`checkbox-routine-${routine.id}`}
                    />
                    <CardTitle className={`text-base ${routine.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {routine.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No hygiene routines</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create routines to track daily hygiene tasks
          </p>
          <Button data-testid="button-create-routine">
            Add Routine
          </Button>
        </div>
      )}
    </div>
  );
}
