import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";

export function IntakeTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: intakeLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intake-logs", format(selectedDate, "yyyy-MM-dd")],
  });

  const totals = intakeLogs?.reduce(
    (acc, log) => ({
      calories: acc.calories + (parseFloat(log.calories) || 0),
      protein: acc.protein + (parseFloat(log.protein) || 0),
      carbs: acc.carbs + (parseFloat(log.carbs) || 0),
      fats: acc.fats + (parseFloat(log.fats) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Nutrition Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Log meals and track macronutrients
          </p>
        </div>
        <Button size="sm" data-testid="button-add-meal">
          <Plus className="w-4 h-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {intakeLogs && intakeLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Totals</CardTitle>
            <CardDescription>{format(selectedDate, "MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-2xl font-semibold font-mono" data-testid="text-total-calories">
                  {totals?.calories.toFixed(0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-2xl font-semibold font-mono" data-testid="text-total-protein">
                  {totals?.protein.toFixed(1)}g
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Carbs</p>
                <p className="text-2xl font-semibold font-mono" data-testid="text-total-carbs">
                  {totals?.carbs.toFixed(1)}g
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fats</p>
                <p className="text-2xl font-semibold font-mono" data-testid="text-total-fats">
                  {totals?.fats.toFixed(1)}g
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : intakeLogs && intakeLogs.length > 0 ? (
        <div className="space-y-3">
          {intakeLogs.map((log) => (
            <Card key={log.id} data-testid={`card-meal-${log.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {log.mealName || "Meal"}
                    </CardTitle>
                    {log.notes && (
                      <CardDescription className="text-sm mt-1">
                        {log.notes}
                      </CardDescription>
                    )}
                  </div>
                  <div className="text-right font-mono text-sm">
                    <p className="font-semibold">{parseFloat(log.calories).toFixed(0)} cal</p>
                    <p className="text-muted-foreground">
                      P: {parseFloat(log.protein).toFixed(0)}g | C: {parseFloat(log.carbs).toFixed(0)}g | F: {parseFloat(log.fats).toFixed(0)}g
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No meals logged</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start tracking your nutrition
          </p>
          <Button data-testid="button-create-meal">
            Log Meal
          </Button>
        </div>
      )}
    </div>
  );
}
