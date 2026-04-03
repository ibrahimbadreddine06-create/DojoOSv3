import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, isToday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Moon, Flame, Settings,
  TrendingUp, TrendingDown, Droplets, Heart,
  Activity, Battery, Scale, Plus, Minus, LayoutGrid,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MetricRing } from "./metric-ring";
import { SectionHeader } from "./section-header";
import { TodaySessions } from "@/components/today-sessions";
import { ModuleBriefing } from "./module-briefing";
import type { Workout, IntakeLog, SleepLog, BodyProfile, TimeBlock } from "@shared/schema";

const TODAY = format(new Date(), "yyyy-MM-dd");

// ─────────────────────────────────────────────
// WIDGET REGISTRY
// ─────────────────────────────────────────────

const WIDGET_META = {
  briefing:    { label: "Sensei Briefing",  description: "AI daily insight" },
  vitals:      { label: "Today's Vitals",   description: "4 core body rings" },
  planned:     { label: "Planned Today",    description: "Scheduled body sessions" },
  focus:       { label: "Focus Areas",      description: "Alerts & warnings" },
  consistency: { label: "Consistency",      description: "7-day habit grid" },
  signals:     { label: "Body Signals",     description: "Biometric indicators" },
  biometrics:  { label: "Biometrics",       description: "Heart rate & effort" },
} as const;

type WidgetId = keyof typeof WIDGET_META;
const ALL_WIDGETS = Object.keys(WIDGET_META) as WidgetId[];
const DEFAULT_VISIBLE: WidgetId[] = [
  "briefing", "vitals", "planned", "focus", "consistency", "signals", "biometrics",
];

// ─────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────

function Sparkline({ data, color = "#14b8a6", h = 36 }: { data: number[]; color?: string; h?: number }) {
  if (data.length < 2) return null;
  const w = 72;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      {/* Dot at last point */}
      {(() => {
        const last = data[data.length - 1];
        const x = w;
        const y = h - ((last - min) / range) * (h - 4) - 2;
        return <circle cx={x} cy={y} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

function BarGauge({ value, color }: { value: number; color: string }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function WidgetWrapper({
  id, customizeMode, dimmed, onAdd, onRemove, children,
}: {
  id: WidgetId;
  customizeMode: boolean;
  dimmed: boolean;
  onAdd: (id: WidgetId) => void;
  onRemove: (id: WidgetId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative transition-opacity duration-300", dimmed && "opacity-40")}>
      {customizeMode && !dimmed && (
        <button
          onClick={() => onRemove(id)}
          className="absolute -top-2 -left-2 z-20 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background"
        >
          <Minus className="w-2.5 h-2.5 text-white" />
        </button>
      )}
      {customizeMode && dimmed && (
        <button
          onClick={() => onAdd(id)}
          className="absolute -top-2 -left-2 z-20 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background"
        >
          <Plus className="w-2.5 h-2.5 text-white" />
        </button>
      )}
      <div className={dimmed ? "pointer-events-none" : undefined}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export function BodyHub() {
  const [, navigate] = useLocation();
  const [customizeMode, setCustomizeMode] = useState(false);

  // ── Widget visibility (localStorage) ──
  const [visible, setVisible] = useState<WidgetId[]>(() => {
    try {
      const raw = localStorage.getItem("bodyWidgets_v1");
      if (raw) {
        const parsed: WidgetId[] = JSON.parse(raw);
        return parsed.filter((id) => ALL_WIDGETS.includes(id));
      }
    } catch {}
    return DEFAULT_VISIBLE;
  });

  const hidden = ALL_WIDGETS.filter((id) => !visible.includes(id));

  const persist = (next: WidgetId[]) => {
    setVisible(next);
    localStorage.setItem("bodyWidgets_v1", JSON.stringify(next));
  };

  const removeWidget = (id: WidgetId) => persist(visible.filter((v) => v !== id));
  const addWidget    = (id: WidgetId) => persist([...visible, id]);

  // ── Data queries ──
  const { data: workouts }        = useQuery<Workout[]>   ({ queryKey: [`/api/workouts/${TODAY}`] });
  const { data: sleepLogs }       = useQuery<SleepLog[]>  ({ queryKey: ["/api/sleep-logs/all"] });
  const { data: intakeLogs }      = useQuery<IntakeLog[]> ({ queryKey: [`/api/intake-logs/${TODAY}`] });
  const { data: hygieneRoutines } = useQuery<any[]>       ({ queryKey: ["/api/hygiene-routines"] });
  const { data: bodyProfile }     = useQuery<BodyProfile> ({ queryKey: ["/api/body-profile"] });
  const { data: dailyState }      = useQuery<any>         ({ queryKey: [`/api/daily-state/${TODAY}`] });
  const { data: timeBlocks }      = useQuery<TimeBlock[]> ({ queryKey: [`/api/time-blocks/${TODAY}`] });
  const { data: signals }         = useQuery<{ balance: number; stress: number; momentum: number }>(
    { queryKey: ["/api/body/signals"] }
  );
  const { data: history7d }     = useQuery<any[]>({ queryKey: ["/api/activity/trends?metric=steps&days=7"] });
  const { data: calorieTrends } = useQuery<any[]>({ queryKey: ["/api/nutrition/trends/batch?metrics=calories&days=7"] });
  const { data: sleepTrends }   = useQuery<any[]>({ queryKey: ["/api/rest/trends?metric=sleepHours&days=7"] });

  // ── Derived values ──
  const readiness      = dailyState?.recoveryScore ?? 0;
  const todayCalories  = dailyState?.caloriesConsumed ?? 0;
  const calorieGoal    = bodyProfile?.dailyCalorieGoal || 2500;
  const totalRoutines  = hygieneRoutines?.length || 0;
  const completedToday = (hygieneRoutines || []).filter((r: any) => r.lastCompletedDate === TODAY).length;

  const workoutsThisWeek = useMemo(
    () => history7d?.filter((h) => h.workoutCompleted).length || 0,
    [history7d]
  );

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d    = subDays(new Date(), 6 - i);
      const dStr = format(d, "yyyy-MM-dd");
      const act  = history7d?.find((h) => h.date === dStr);
      const eat  = (calorieTrends as any)?.calories?.find((h: any) => h.date === dStr);
      const slp  = sleepTrends?.find((h) => h.date === dStr);
      return {
        date:       d,
        hasWorkout: (act?.value || 0) > 0,
        hasIntake:  (eat?.value || 0) > 0,
        hasSleep:   (slp?.value || 0) > 0,
      };
    });
  }, [history7d, calorieTrends, sleepTrends]);

  const streakCount = useMemo(() => {
    let s = 0;
    for (let i = last7Days.length - 1; i >= 0; i--) {
      const d = last7Days[i];
      if (d.hasWorkout || d.hasIntake || d.hasSleep) s++;
      else break;
    }
    return s;
  }, [last7Days]);

  const weekCompletion = useMemo(() => {
    const total = last7Days.length * 3;
    const done  = last7Days.reduce(
      (a, d) => a + (d.hasWorkout ? 1 : 0) + (d.hasIntake ? 1 : 0) + (d.hasSleep ? 1 : 0),
      0
    );
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [last7Days]);

  const overallReadiness = dailyState?.readinessScore ?? 0;

  // Sparkline data (7-point arrays)
  const hrData  = [62, 60, 63, 58, 61, 59, dailyState?.avgHeartRate  || 61];
  const volData = [2.1, 2.4, 1.8, 3.1, 2.7, 2.9, (dailyState?.totalVolume || 0) / 1000];

  // ── Widget renderer ──
  const renderWidget = (id: WidgetId, dimmed = false) => {
    let content: React.ReactNode;

    switch (id) {
      case "briefing":
        content = (
          <ModuleBriefing
            title="Briefing"
            kicker="Sensei AI"
            content="Recovery is strong today. You have a heavy lifting session planned this afternoon — make sure to hydrate and front-load your carbs."
          />
        );
        break;

      case "vitals":
        content = (
          <div className="space-y-3">
            <SectionHeader title="Today's State" kicker="Biometrics" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Recovery",  value: readiness,      max: 100,                  unit: undefined,  color: "#14b8a6", to: "/body/sleep" },
                { label: "Nutrition", value: todayCalories,  max: calorieGoal,           unit: "kcal",    color: "#f97316", to: "/body/nutrition" },
                { label: "Activity",  value: workoutsThisWeek, max: 5,                  unit: "this wk", color: "#f59e0b", to: "/body/activity" },
                { label: "Care",      value: completedToday, max: Math.max(totalRoutines, 1), unit: undefined, color: "#8b5cf6", to: "/body/looks" },
              ].map(({ label, value, max, unit, color, to }) => (
                <motion.div
                  key={label}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(to)}
                  className="bg-card rounded-2xl p-5 border border-border/60 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                >
                  <MetricRing value={value} max={max} label={label} unit={unit} color={color} size="sm" />
                </motion.div>
              ))}
            </div>
          </div>
        );
        break;

      case "planned":
        content = <TodaySessions module="body" />;
        break;

      case "focus":
        content = (
          <div className="space-y-3">
            <SectionHeader title="Focus Areas" kicker="Action Required" />
            <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-2 px-2 hide-scrollbar">
              <div className="snap-start shrink-0 w-52 bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Hydration low</p>
                  <p className="text-xs text-amber-600/60 dark:text-amber-400/60 mt-0.5">1 L behind schedule</p>
                </div>
              </div>
              <div className="snap-start shrink-0 w-52 bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Sleep deficit</p>
                  <p className="text-xs text-blue-600/60 dark:text-blue-400/60 mt-0.5">−1.2 h avg this week</p>
                </div>
              </div>
            </div>
          </div>
        );
        break;

      case "consistency":
        content = (
          <div className="space-y-3">
            <SectionHeader title="Consistency" kicker="Execution" />
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
              {/* Top bar: streak + week % */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <span className="text-xl font-bold tabular-nums leading-none">{streakCount}</span>
                    <span className="text-xs text-muted-foreground font-medium ml-1.5">day streak</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground/60 mb-1.5 uppercase tracking-wider">
                    This week
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <BarGauge value={weekCompletion} color="#f59e0b" />
                    </div>
                    <span className="text-sm font-bold tabular-nums">{weekCompletion}%</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mb-4">
                {[
                  { label: "Move",  color: "bg-amber-500" },
                  { label: "Eat",   color: "bg-orange-400" },
                  { label: "Sleep", color: "bg-indigo-400" },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    <div className={cn("w-2 h-2 rounded-full", color)} />
                    {label}
                  </span>
                ))}
              </div>

              {/* 7-day grid */}
              <div className="flex justify-between w-full">
                {last7Days.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <div className={cn("w-7 h-7 rounded-lg transition-all", day.hasWorkout ? "bg-amber-500" : "bg-muted/20")} />
                      <div className={cn("w-7 h-7 rounded-lg transition-all", day.hasIntake  ? "bg-orange-400" : "bg-muted/20")} />
                      <div className={cn("w-7 h-7 rounded-lg transition-all", day.hasSleep   ? "bg-indigo-400" : "bg-muted/20")} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-tight tabular-nums",
                      isToday(day.date) ? "text-foreground" : "text-muted-foreground/30"
                    )}>
                      {format(day.date, "EEEEE")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        break;

      case "signals":
        content = (
          <div className="space-y-3">
            <SectionHeader title="Body Signals" kicker="Biometrics" />
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-5">
              {([
                { label: "Energy Balance",   value: signals?.balance   ?? 0, color: "#10b981", Icon: Scale    },
                { label: "Nervous Stress",   value: signals?.stress    ?? 0, color: "#f59e0b", Icon: Activity },
                { label: "Habit Momentum",   value: signals?.momentum  ?? 0, color: "#f97316", Icon: Flame    },
                { label: "Overall Readiness",value: overallReadiness,        color: "#3b82f6", Icon: Battery  },
              ] as const).map(({ label, value, color, Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
                      <span className="text-sm font-bold tabular-nums">{value}%</span>
                    </div>
                    <BarGauge value={value} color={color} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case "biometrics":
        content = (
          <div className="space-y-3">
            <SectionHeader title="Biometric Trends" kicker="Analysis" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Heart Rate */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/body/activity/avgHR")}
                className="bg-card border border-border/60 shadow-sm rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Resting Heart Rate
                      </span>
                    </div>
                    <p className="text-3xl font-bold leading-none">
                      {dailyState?.avgHeartRate || "—"}
                      <span className="text-base text-muted-foreground font-semibold ml-1.5">bpm</span>
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <TrendingDown className="w-3 h-3" /> Optimal
                    </span>
                  </div>
                  <div className="shrink-0 pt-1">
                    <Sparkline data={hrData} color="#f43f5e" />
                  </div>
                </div>
              </motion.div>

              {/* Effort Volume */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/body/activity/strengthVolume")}
                className="bg-card border border-border/60 shadow-sm rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Dumbbell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Effort Volume
                      </span>
                    </div>
                    <p className="text-3xl font-bold leading-none">
                      {((dailyState?.totalVolume || 0) / 1000).toFixed(1)}
                      <span className="text-base text-muted-foreground font-semibold ml-1.5">tons</span>
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <TrendingUp className="w-3 h-3" /> Growing
                    </span>
                  </div>
                  <div className="shrink-0 pt-1">
                    <Sparkline data={volData} color="#f59e0b" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
        break;
    }

    return (
      <WidgetWrapper
        key={id}
        id={id}
        customizeMode={customizeMode}
        dimmed={dimmed}
        onAdd={addWidget}
        onRemove={removeWidget}
      >
        {content}
      </WidgetWrapper>
    );
  };

  // ── Render ──
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700 pb-24">
      <div className="space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Body</h1>
            <p className="text-sm text-muted-foreground">Daily overview & planning</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={customizeMode ? "default" : "secondary"}
              size="sm"
              onClick={() => setCustomizeMode((c) => !c)}
              className="rounded-xl text-xs font-semibold"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              {customizeMode ? "Done" : "Customize"}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate("/body/setup")}
              className="shrink-0 shadow-sm rounded-xl bg-foreground text-background hover:bg-foreground/90"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* VISIBLE WIDGETS */}
        {visible.map((id) => renderWidget(id))}

        {/* HIDDEN WIDGETS (customize mode only) */}
        <AnimatePresence>
          {customizeMode && hidden.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Dashed separator */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-dashed border-border/40" />
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/35">
                  Hidden widgets
                </span>
                <div className="flex-1 border-t border-dashed border-border/40" />
              </div>

              {hidden.map((id) => renderWidget(id, true))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
