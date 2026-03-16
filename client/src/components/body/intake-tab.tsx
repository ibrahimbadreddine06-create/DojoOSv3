import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UtensilsCrossed, Trash2, Plus, Droplets, Pill, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { AddIntakeLogDialog } from "@/components/dialogs/add-intake-log-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TodaySessions } from "../today-sessions";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const DEFAULT_GOALS = { calories: 2500, protein: 150, carbs: 300, fats: 70 };

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-mono">{value.toFixed(0)} / {goal}{label === "Calories" ? " kcal" : "g"}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FastingTimer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: activeFast } = useQuery<any>({
    queryKey: ["/api/fasting-logs/active"],
  });

  useEffect(() => {
    if (activeFast?.startTime) {
      const start = new Date(activeFast.startTime).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeFast]);

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/fasting-logs", {
      startTime: new Date().toISOString(),
      status: "active",
      targetHours: "16",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fasting-logs/active"] });
      toast({ title: "Fast started" });
    },
  });

  const endMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/fasting-logs/${activeFast?.id}`, {
      endTime: new Date().toISOString(),
      status: "completed",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fasting-logs/active"] });
      toast({ title: "Fast ended" });
    },
  });

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const targetHours = parseFloat(activeFast?.targetHours || "16");
  const pct = activeFast ? Math.min(100, (elapsed / (targetHours * 3600)) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Intermittent Fasting</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {activeFast ? (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold tabular-nums" data-testid="text-fasting-timer">
                {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Target: {targetHours}h fast</p>
            </div>
            <Progress value={pct} className="h-2" />
            <Button size="sm" variant="outline" className="w-full" onClick={() => endMutation.mutate()} disabled={endMutation.isPending}>
              End Fast
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">No active fast</p>
            <Button size="sm" variant="outline" className="w-full" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              <Timer className="w-4 h-4 mr-2" />
              Start 16h Fast
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SupplementSection({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: supplements } = useQuery<any[]>({
    queryKey: ["/api/supplement-logs", date],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/supplement-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplement-logs", date] });
      toast({ title: "Supplement removed" });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setOpen(v => !v)}
          data-testid="button-toggle-supplements"
        >
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Supplements</CardTitle>
            {supplements && supplements.length > 0 && (
              <Badge variant="secondary" className="text-xs">{supplements.length}</Badge>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-2">
          {supplements && supplements.length > 0 ? supplements.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1" data-testid={`row-supplement-${s.id}`}>
              <div>
                <span className="text-sm font-medium">{s.name}</span>
                {s.amount && <span className="text-xs text-muted-foreground ml-2">{s.amount} {s.unit || ""}</span>}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => deleteMutation.mutate(s.id)}
                data-testid={`button-delete-supplement-${s.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground py-2">No supplements logged today</p>
          )}
          <AddSupplementDialog date={date} />
        </CardContent>
      )}
    </Card>
  );
}

function AddSupplementDialog({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mg");
  const [show, setShow] = useState(false);

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/supplement-logs", {
      date: new Date(date).toISOString(),
      name,
      amount: amount || undefined,
      unit: unit || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplement-logs", date] });
      setName(""); setAmount(""); setShow(false);
      toast({ title: "Supplement logged" });
    },
  });

  if (!show) {
    return (
      <Button size="sm" variant="ghost" className="w-full gap-2 text-xs" onClick={() => setShow(true)}>
        <Plus className="w-3 h-3" /> Add supplement
      </Button>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <input
        className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
        placeholder="Supplement name"
        value={name}
        onChange={e => setName(e.target.value)}
        data-testid="input-supplement-name"
      />
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          data-testid="input-supplement-amount"
        />
        <select
          className="border rounded-md px-2 py-1.5 text-sm bg-background"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          data-testid="select-supplement-unit"
        >
          {["mg", "mcg", "g", "IU", "ml", "capsule", "tablet"].map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => addMutation.mutate()} disabled={!name || addMutation.isPending}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setShow(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export function IntakeTab() {
  const [selectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: intakeLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intake-logs", dateStr],
  });

  const { data: bodyProfile } = useQuery<any>({
    queryKey: ["/api/body-profile"],
  });

  const goals = {
    calories: bodyProfile?.dailyCalorieGoal || DEFAULT_GOALS.calories,
    protein: bodyProfile?.dailyProteinGoal || DEFAULT_GOALS.protein,
    carbs: bodyProfile?.dailyCarbsGoal || DEFAULT_GOALS.carbs,
    fats: bodyProfile?.dailyFatsGoal || DEFAULT_GOALS.fats,
  };

  const consumedLogs = intakeLogs?.filter(l => l.status === "consumed" || !l.status) || [];

  const totals = consumedLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (parseFloat(log.calories) || 0),
      protein: acc.protein + (parseFloat(log.protein) || 0),
      carbs: acc.carbs + (parseFloat(log.carbs) || 0),
      fats: acc.fats + (parseFloat(log.fats) || 0),
      water: acc.water + (parseFloat(log.water) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 }
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/intake-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intake-logs"] });
      toast({ title: "Meal removed" });
    },
  });

  const groupedByMealType = MEAL_TYPES.reduce<Record<string, any[]>>((acc, type) => {
    acc[type] = consumedLogs.filter(l => (l.mealType || "snack") === type);
    return acc;
  }, {} as Record<string, any[]>);

  const waterGoalMl = 2500;
  const waterPct = Math.min(100, (totals.water / waterGoalMl) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Nutrition Tracking</h2>
          <p className="text-sm text-muted-foreground">{format(selectedDate, "EEEE, MMMM d")}</p>
        </div>
        <AddIntakeLogDialog mode="log" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Macros Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Daily Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MacroBar label="Calories" value={totals.calories} goal={goals.calories} color="bg-primary" />
              <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="bg-blue-500" />
              <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color="bg-green-500" />
              <MacroBar label="Fats" value={totals.fats} goal={goals.fats} color="bg-yellow-500" />
            </CardContent>
          </Card>

          {/* Water */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <CardTitle className="text-sm font-semibold">Hydration</CardTitle>
                <span className="text-xs text-muted-foreground ml-auto font-mono">
                  {totals.water.toFixed(0)} / {waterGoalMl} ml
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${waterPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Add water via meal logs (include water field)</p>
            </CardContent>
          </Card>

          {/* Meals Grouped */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : consumedLogs.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-base font-medium">No meals logged today</h3>
              <p className="text-sm text-muted-foreground mb-4">Start logging your intake</p>
            </div>
          ) : (
            <div className="space-y-4">
              {MEAL_TYPES.map(type => {
                const logs = groupedByMealType[type];
                if (logs.length === 0) return null;
                const typeCals = logs.reduce((s, l) => s + (parseFloat(l.calories) || 0), 0);
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {MEAL_TYPE_LABELS[type]}
                      </h3>
                      <span className="text-xs text-muted-foreground font-mono">{typeCals.toFixed(0)} kcal</span>
                    </div>
                    <div className="space-y-2">
                      {logs.map(log => (
                        <Card key={log.id} data-testid={`card-meal-${log.id}`}>
                          <CardContent className="p-3 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{log.mealName || "Meal"}</p>
                              {log.notes && <p className="text-xs text-muted-foreground truncate">{log.notes}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono text-sm font-semibold">{parseFloat(log.calories || 0).toFixed(0)} cal</p>
                              <p className="text-xs text-muted-foreground">
                                P:{parseFloat(log.protein || 0).toFixed(0)} C:{parseFloat(log.carbs || 0).toFixed(0)} F:{parseFloat(log.fats || 0).toFixed(0)}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0"
                              onClick={() => deleteMutation.mutate(log.id)}
                              data-testid={`button-delete-meal-${log.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <TodaySessions module="body" itemId="body_intake" />
          <FastingTimer />
          <SupplementSection date={dateStr} />
        </div>
      </div>
    </div>
  );
}
