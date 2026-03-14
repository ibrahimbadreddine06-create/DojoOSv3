import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { format } from "date-fns";
import { AddHygieneRoutineDialog } from "@/components/dialogs/add-hygiene-routine-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { TodaySessions } from "../today-sessions";

export function HygieneTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: routines, isLoading } = useQuery<any[]>({
    queryKey: ["/api/hygiene-routines", format(selectedDate, "yyyy-MM-dd")],
  });

  const toggleRoutineMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/hygiene-routines/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hygiene-routines"] });
    },
    onError: () => {
      toast({ title: "Failed to update routine", variant: "destructive" });
    },
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
        <AddHygieneRoutineDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {routines && routines.length > 0 ? (
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
          ) : (
            <div className="text-center py-12 border rounded-lg border-dashed h-full">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hygiene routines</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create routines to track daily hygiene tasks
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <TodaySessions module="body" itemId="body_hygiene" />
        </div>
      </div>

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
                    <Checkbox
                      checked={routine.completed}
                      onCheckedChange={(checked) =>
                        toggleRoutineMutation.mutate({
                          id: routine.id,
                          completed: !!checked
                        })
                      }
                      disabled={toggleRoutineMutation.isPending}
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
          <AddHygieneRoutineDialog />
        </div>
      )}
    </div>
  );
}

