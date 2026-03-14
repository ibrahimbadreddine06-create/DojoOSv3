import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, CalendarClock, Check, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AddIntakeLogDialog } from "@/components/dialogs/add-intake-log-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TodaySessions } from "../today-sessions";

export function IntakeTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: intakeLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intake-logs", format(selectedDate, "yyyy-MM-dd")],
  });

  const consumedLogs = intakeLogs?.filter(log => log.status === "consumed" || !log.status) || [];
  const plannedLogs = intakeLogs?.filter(log => log.status === "planned") || [];

  const totals = consumedLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (parseFloat(log.calories) || 0),
      protein: acc.protein + (parseFloat(log.protein) || 0),
      carbs: acc.carbs + (parseFloat(log.carbs) || 0),
      fats: acc.fats + (parseFloat(log.fats) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const consumeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/intake-logs/${id}`, { status: "consumed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intake-logs"] });
      toast({ title: "Meal marked as consumed" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/intake-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intake-logs"] });
      toast({ title: "Meal deleted" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Nutrition Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Log meals and track macronutrients
          </p>
        </div>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="log">Log Day (Consumed)</TabsTrigger>
          <TabsTrigger value="plan">Plan Day (Upcoming)</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-6">
          <div className="flex justify-end">
            <AddIntakeLogDialog mode="log" />
          </div>

          {consumedLogs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Nutrition Targets</CardTitle>
                    <CardDescription>{format(selectedDate, "MMMM d, yyyy")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Calories Target */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Calories</span>
                          <span className="text-muted-foreground">{totals.calories.toFixed(0)} / 2500 kcal</span>
                        </div>
                        <div className="h-4 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, (totals.calories / 2500) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Protein Target */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Protein</span>
                          <span className="text-muted-foreground">{totals.protein.toFixed(0)} / 150g</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, (totals.protein / 150) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Carbs Target */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Carbs</span>
                          <span className="text-muted-foreground">{totals.carbs.toFixed(0)} / 300g</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, (totals.carbs / 300) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Fats Target */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Fats</span>
                          <span className="text-muted-foreground">{totals.fats.toFixed(0)} / 70g</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, (totals.fats / 70) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <TodaySessions module="body" itemId="body_intake" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 text-center py-12 border rounded-lg border-dashed">
                <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-base font-medium">No meals logged</h3>
                <p className="text-sm text-muted-foreground mb-4">Track your intake above</p>
              </div>
              <div className="lg:col-span-1">
                <TodaySessions module="body" itemId="body_intake" />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {isLoading ? (
              [1, 2].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)
            ) : consumedLogs.length > 0 ? (
              consumedLogs.map((log) => (
                <Card key={log.id}>
                  <CardHeader className="pb-3 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{log.mealName || "Meal"}</CardTitle>
                        {log.notes && <CardDescription className="text-xs mt-1">{log.notes}</CardDescription>}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold">{parseFloat(log.calories).toFixed(0)} cal</p>
                        <p className="text-xs text-muted-foreground">
                          P:{parseFloat(log.protein).toFixed(0)} C:{parseFloat(log.carbs).toFixed(0)} F:{parseFloat(log.fats).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-base font-medium">No meals logged</h3>
                <p className="text-sm text-muted-foreground mb-4">Track your intake above</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <div className="flex justify-end items-center gap-4">
            <p className="text-sm text-muted-foreground mr-auto">
              Adding tasks for: <span className="font-semibold text-foreground">{format(selectedDate, "EEEE")}</span>
            </p>
            <AddIntakeLogDialog mode="plan" />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)
            ) : plannedLogs.length > 0 ? (
              plannedLogs.map((log) => (
                <Card key={log.id} className="border-dashed bg-accent/5">
                  <CardHeader className="pb-3 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarClock className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">{log.mealName || "Planned Meal"}</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          P:{parseFloat(log.protein).toFixed(0)} C:{parseFloat(log.carbs).toFixed(0)} F:{parseFloat(log.fats).toFixed(0)} • {parseFloat(log.calories).toFixed(0)} cal
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => deleteMutation.mutate(log.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button size="sm" className="gap-2 h-8" onClick={() => consumeMutation.mutate(log.id)}>
                          <Check className="w-4 h-4" /> Eat
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <CalendarClock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-base font-medium">No meals planned</h3>
                <p className="text-sm text-muted-foreground mb-4">Plan your nutrition ahead of time</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

