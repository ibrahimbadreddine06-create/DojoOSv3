import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Trash2, Plus, Droplets, Pill, Timer, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { AddIntakeLogDialog } from "@/components/dialogs/add-intake-log-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MetricRing } from "./metric-ring";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const DEFAULT_GOALS = { calories: 2500, protein: 150, carbs: 300, fats: 70 };

// ─── Micro nutrient card ──────────────────────────────────────────────────────

function MicroCard({ label, value, goal, unit, emoji }: {
  label: string; value: number; goal: number; unit: string; emoji: string;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const hasData = value > 0;
  return (
    <div className="bg-card border border-border/60 rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm">{emoji}</span>
        <span className={cn("text-[10px] font-mono font-bold", hasData ? "text-foreground" : "text-muted-foreground/40")}>
          {hasData ? `${value.toFixed(0)}${unit}` : "—"}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/60 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">{label}</p>
    </div>
  );
}

// ─── Fasting timer ────────────────────────────────────────────────────────────

function FastingTimer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: activeFast } = useQuery<any>({ queryKey: ["/api/fasting-logs/active"] });

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
      startTime: new Date().toISOString(), status: "active", targetHours: "16",
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/fasting-logs/active"] }); toast({ title: "Fast started" }); },
  });

  const endMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/fasting-logs/${activeFast?.id}`, {
      endTime: new Date().toISOString(), status: "completed",
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/fasting-logs/active"] }); toast({ title: "Fast ended" }); },
  });

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const targetHours = parseFloat(activeFast?.targetHours || "16");
  const pct = activeFast ? Math.min(100, (elapsed / (targetHours * 3600)) * 100) : 0;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fasting</p>
        </div>
        {activeFast && (
          <Badge variant="secondary" className="text-[10px]">{targetHours}h target</Badge>
        )}
      </div>
      {activeFast ? (
        <div className="flex items-center gap-4">
          <MetricRing
            value={Math.round(pct)}
            max={100}
            label="Progress"
            unit="%"
            color="#f97316"
            size="sm"
            animate={false}
          />
          <div className="flex-1">
            <p className="font-mono font-black text-2xl tabular-nums" data-testid="text-fasting-timer">
              {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">of {targetHours}h fast</p>
            <Button size="sm" variant="outline" className="mt-2 w-full rounded-xl"
              onClick={() => endMutation.mutate()} disabled={endMutation.isPending}>
              End Fast
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full rounded-xl gap-2"
          onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
          <Timer className="w-3.5 h-3.5" />
          Start 16h Fast
        </Button>
      )}
    </div>
  );
}

// ─── Supplements ──────────────────────────────────────────────────────────────

function AddSupplementDialog({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mg");
  const [show, setShow] = useState(false);

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/supplement-logs", {
      date: new Date(date).toISOString(), name, amount: amount || undefined, unit: unit || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplement-logs", date] });
      setName(""); setAmount(""); setShow(false);
      toast({ title: "Supplement logged" });
    },
  });

  if (!show) return (
    <button className="w-full h-8 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
      onClick={() => setShow(true)}>
      <Plus className="w-3 h-3" /> Add supplement
    </button>
  );

  return (
    <div className="space-y-2 pt-1">
      <input className="w-full border rounded-xl px-3 py-1.5 text-sm bg-background" placeholder="Supplement name"
        value={name} onChange={e => setName(e.target.value)} data-testid="input-supplement-name" />
      <div className="flex gap-2">
        <input className="flex-1 border rounded-xl px-3 py-1.5 text-sm bg-background" placeholder="Amount"
          value={amount} onChange={e => setAmount(e.target.value)} data-testid="input-supplement-amount" />
        <select className="border rounded-xl px-2 py-1.5 text-sm bg-background" value={unit}
          onChange={e => setUnit(e.target.value)} data-testid="select-supplement-unit">
          {["mg", "mcg", "g", "IU", "ml", "capsule", "tablet"].map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 rounded-xl" onClick={() => addMutation.mutate()} disabled={!name || addMutation.isPending}>Save</Button>
        <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setShow(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function SupplementSection({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: supplements } = useQuery<any[]>({ queryKey: ["/api/supplement-logs", date] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/supplement-logs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/supplement-logs", date] }); toast({ title: "Supplement removed" }); },
  });

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4">
      <button className="flex items-center justify-between w-full" onClick={() => setOpen(v => !v)}
        data-testid="button-toggle-supplements">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Supplements</p>
          {supplements && supplements.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{supplements.length}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {supplements && supplements.length > 0 ? supplements.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1" data-testid={`row-supplement-${s.id}`}>
              <div>
                <span className="text-sm font-medium">{s.name}</span>
                {s.amount && <span className="text-xs text-muted-foreground ml-2">{s.amount} {s.unit || ""}</span>}
              </div>
              <button onClick={() => deleteMutation.mutate(s.id)} data-testid={`button-delete-supplement-${s.id}`}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )) : <p className="text-sm text-muted-foreground py-1">No supplements logged</p>}
          <AddSupplementDialog date={date} />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IntakeTab() {
  const [selectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: intakeLogs, isLoading } = useQuery<any[]>({ queryKey: ["/api/intake-logs", dateStr] });
  const { data: bodyProfile } = useQuery<any>({ queryKey: ["/api/body-profile"] });

  const goals = {
    calories: bodyProfile?.dailyCalorieGoal || DEFAULT_GOALS.calories,
    protein: bodyProfile?.dailyProteinGoal || DEFAULT_GOALS.protein,
    carbs: bodyProfile?.dailyCarbsGoal || DEFAULT_GOALS.carbs,
    fats: bodyProfile?.dailyFatsGoal || DEFAULT_GOALS.fats,
  };

  const profileNotSet = !bodyProfile?.dailyCalorieGoal;

  const consumedLogs = intakeLogs?.filter(l => l.status === "consumed" || !l.status) || [];

  const totals = consumedLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (parseFloat(log.calories) || 0),
      protein: acc.protein + (parseFloat(log.protein) || 0),
      carbs: acc.carbs + (parseFloat(log.carbs) || 0),
      fats: acc.fats + (parseFloat(log.fats) || 0),
      fiber: acc.fiber + (parseFloat(log.fiber) || 0),
      water: acc.water + (parseFloat(log.water) || 0),
      vitaminD: acc.vitaminD + (parseFloat(log.vitaminD) || 0),
      iron: acc.iron + (parseFloat(log.iron) || 0),
      calcium: acc.calcium + (parseFloat(log.calcium) || 0),
      magnesium: acc.magnesium + (parseFloat(log.magnesium) || 0),
      zinc: acc.zinc + (parseFloat(log.zinc) || 0),
      potassium: acc.potassium + (parseFloat(log.potassium) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, water: 0, vitaminD: 0, iron: 0, calcium: 0, magnesium: 0, zinc: 0, potassium: 0 }
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/intake-logs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/intake-logs"] }); toast({ title: "Meal removed" }); },
  });

  const groupedByMealType = MEAL_TYPES.reduce<Record<string, any[]>>((acc, type) => {
    acc[type] = consumedLogs.filter(l => (l.mealType || "snack") === type);
    return acc;
  }, {} as Record<string, any[]>);

  const waterGoalMl = 2500;
  const waterPct = Math.min(100, (totals.water / waterGoalMl) * 100);

  // Pie chart data
  const calRemaining = Math.max(0, goals.calories - totals.calories);
  const pieData = [
    { name: "Consumed", value: Math.round(totals.calories), color: "#f97316" },
    { name: "Remaining", value: Math.round(calRemaining), color: "hsl(var(--muted))" },
  ];

  const hasMicros = totals.vitaminD > 0 || totals.iron > 0 || totals.calcium > 0 || totals.magnesium > 0;

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Nutrition</h2>
          <p className="text-xs text-muted-foreground">{format(selectedDate, "EEEE, MMMM d")}</p>
        </div>
        <AddIntakeLogDialog mode="log" />
      </div>

      {/* Profile not set banner */}
      {profileNotSet && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Using default goals</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Set up your Body profile to get personalized calorie & macro targets.</p>
          </div>
        </div>
      )}

      {/* Calorie donut + macro rings */}
      <div className="bg-card border border-border/60 rounded-2xl p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Calorie Overview</p>

        <div className="flex items-center gap-6">
          {/* Donut chart */}
          <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx={65}
                  cy={65}
                  innerRadius={48}
                  outerRadius={65}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-black text-xl tabular-nums leading-none">
                {Math.round(totals.calories) > 999
                  ? `${(totals.calories / 1000).toFixed(1)}k`
                  : Math.round(totals.calories)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">kcal</span>
            </div>
          </div>

          {/* Right side info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Consumed</span>
              <span className="font-mono font-bold text-sm text-orange-500">{Math.round(totals.calories)} kcal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Remaining</span>
              <span className="font-mono font-bold text-sm">{Math.max(0, Math.round(goals.calories - totals.calories))} kcal</span>
            </div>
            <div className="h-px bg-border/60" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Goal</span>
              <span className="font-mono text-sm text-muted-foreground">{goals.calories} kcal</span>
            </div>
            {totals.calories > goals.calories && (
              <Badge variant="destructive" className="text-[10px]">Over by {Math.round(totals.calories - goals.calories)} kcal</Badge>
            )}
          </div>
        </div>

        {/* Macro rings */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-border/40">
          <MetricRing value={Math.round(totals.protein)} max={goals.protein} label="Protein" unit="g" color="#3b82f6" size="sm" />
          <MetricRing value={Math.round(totals.carbs)} max={goals.carbs} label="Carbs" unit="g" color="#f59e0b" size="sm" />
          <MetricRing value={Math.round(totals.fats)} max={goals.fats} label="Fats" unit="g" color="#a855f7" size="sm" />
          <MetricRing value={Math.round(totals.fiber)} max={25} label="Fiber" unit="g" color="#22c55e" size="sm" />
        </div>
      </div>

      {/* Hydration */}
      <div className="bg-card border border-border/60 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Hydration</p>
          </div>
          <span className="font-mono text-sm font-bold text-blue-500">
            {Math.round(totals.water)} <span className="text-muted-foreground font-normal text-xs">/ {waterGoalMl} ml</span>
          </span>
        </div>
        {/* Water fill bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${waterPct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">Log meals with a water value to track hydration</p>
      </div>

      {/* Micronutrients (only if any logged) */}
      {hasMicros && (
        <div className="bg-card border border-border/60 rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Micronutrients</p>
          <div className="grid grid-cols-3 gap-2">
            <MicroCard label="Vit D" value={totals.vitaminD} goal={20} unit="µg" emoji="☀️" />
            <MicroCard label="Iron" value={totals.iron} goal={18} unit="mg" emoji="🩸" />
            <MicroCard label="Calcium" value={totals.calcium} goal={1000} unit="mg" emoji="🦴" />
            <MicroCard label="Magnesium" value={totals.magnesium} goal={400} unit="mg" emoji="⚡" />
            <MicroCard label="Zinc" value={totals.zinc} goal={11} unit="mg" emoji="🔬" />
            <MicroCard label="Potassium" value={totals.potassium} goal={3500} unit="mg" emoji="🫀" />
          </div>
        </div>
      )}

      {/* Fasting + supplements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FastingTimer />
        <SupplementSection date={dateStr} />
      </div>

      {/* Meal log */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Meal Log</p>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-2xl" />)}</div>
        ) : consumedLogs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 border border-dashed border-border rounded-2xl">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No meals logged today</p>
            <AddIntakeLogDialog mode="log" />
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
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {MEAL_TYPE_LABELS[type]}
                    </p>
                    <span className="text-xs text-muted-foreground font-mono">{typeCals.toFixed(0)} kcal</span>
                  </div>
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id} data-testid={`card-meal-${log.id}`}
                        className="bg-card border border-border/60 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{log.mealName || "Meal"}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            P:{parseFloat(log.protein || 0).toFixed(0)}g · C:{parseFloat(log.carbs || 0).toFixed(0)}g · F:{parseFloat(log.fats || 0).toFixed(0)}g
                          </p>
                        </div>
                        <span className="font-mono font-bold text-sm shrink-0">{parseFloat(log.calories || 0).toFixed(0)} kcal</span>
                        <button
                          onClick={() => deleteMutation.mutate(log.id)}
                          data-testid={`button-delete-meal-${log.id}`}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-2" />
    </div>
  );
}
