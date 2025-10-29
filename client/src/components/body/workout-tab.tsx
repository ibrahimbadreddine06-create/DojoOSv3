import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import { AddWorkoutDialog } from "@/components/dialogs/add-workout-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function WorkoutTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workouts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/workouts"],
  });

  const toggleWorkoutMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/workouts/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    },
    onError: () => {
      toast({ title: "Failed to update workout", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Workout Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Log your workouts and track progress
          </p>
        </div>
        <AddWorkoutDialog />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : workouts && workouts.length > 0 ? (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <Card key={workout.id} className="hover-elevate" data-testid={`card-workout-${workout.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{workout.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {format(new Date(workout.date), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Button
                    variant={workout.completed ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleWorkoutMutation.mutate({ id: workout.id, completed: !workout.completed })}
                    disabled={toggleWorkoutMutation.isPending}
                    data-testid={`button-complete-${workout.id}`}
                  >
                    {workout.completed ? "Completed" : "Mark Complete"}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No workouts logged</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start tracking your exercises and progress
          </p>
          <AddWorkoutDialog />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exercise History</CardTitle>
          <CardDescription>Track progress for individual exercises</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Per-exercise charts will be implemented in integration phase
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
