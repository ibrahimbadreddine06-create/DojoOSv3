import { useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, isToday } from "date-fns";
import { motion } from "framer-motion";
import {
  Dumbbell, Moon, Flame, TrendingDown, TrendingUp,
  Droplets, Heart, Activity, Battery, Scale, LayoutGrid, Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MetricRing } from "./metric-ring";
import { SectionHeader } from "./section-header";
import { TodaySessions } from "@/components/today-sessions";
import { ModuleBriefing } from "./module-briefing";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition } from "@/components/body/module-grid";
import type { Workout, IntakeLog, SleepLog, BodyProfile, TimeBlock } from "@shared/schema";

const TODAY = format(new Date(), "yyyy-MM-dd");

// ── Helpers ───────────────────────────────────────────────────────────────────

function Sparkline({ data, color = "#14b8a6", h = 36 }: { data: number[]; color?: string; h?: number }) {
  if (data.length < 2) return null;
  const w = 72, max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const last = data[data.length - 1];
  const lx = w, ly = h - ((last - min) / range) * (h - 4) - 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}

function BarGauge({ value, color }: { value: number; color: string }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BodyHub() {
  const [, navigate] = useLocation();

  const { data: workouts }        = useQuery<Workout[]>  ({ queryKey: [`/api/workouts/${TODAY}`] });
  const { data: sleepLogs }       = useQuery<SleepLog[]> ({ queryKey: ["/api/sleep-logs/all"] });
  const { data: intakeLogs }      = useQuery<IntakeLog[]>({ queryKey: [`/api/intake-logs/${TODAY}`] });
  const { data: hygieneRoutines } = useQuery<any[]>      ({ queryKey: ["/api/hygiene-routines"] });
  const { data: bodyProfile }     = useQuery<BodyProfile>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState }      = useQuery<any>        ({ queryKey: [`/api/daily-state/${TODAY}`] });
  const { data: signals }         = useQuery<{ balance: number; stress: number; momentum: number }>(
    { queryKey: ["/api/body/signals"] });
  const { data: history7d }     = useQuery<any[]>({ queryKey: ["/api/activity/trends?metric=steps&days=7"] });
  const { data: calorieTrends } = useQuery<any[]>({ queryKey: ["/api/nutrition/trends/batch?metrics=calories&days=7"] });
  const { data: sleepTrends }   = useQuery<any[]>({ queryKey: ["/api/rest/trends?metric=sleepHours&days=7"] });

  const readiness      = dailyState?.recoveryScore ?? 0;
  const todayCalories  = dailyState?.caloriesConsumed ?? 0;
  const calorieGoal    = bodyProfile?.dailyCalorieGoal || 2500;
  const totalRoutines  = hygieneRoutines?.length || 0;
  const completedToday = (hygieneRoutines || []).filter((r: any) => r.lastCompletedDate === TODAY).length;
  const overallReadiness = dailyState?.readinessScore ?? 0;

  const workoutsThisWeek = useMemo(
    () => history7d?.filter((h) => h.workoutCompleted).length || 0, [history7d]);

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i), dStr = format(d, "yyyy-MM-dd");
    const act = history7d?.find((h) => h.date === dStr);
    const eat = (calorieTrends as any)?.calories?.find((h: any) => h.date === dStr);
    const slp = sleepTrends?.find((h) => h.date === dStr);
    return { date: d, hasWorkout: (act?.value || 0) > 0, hasIntake: (eat?.value || 0) > 0, hasSleep: (slp?.value || 0) > 0 };
  }), [history7d, calorieTrends, sleepTrends]);

  const streakCount = useMemo(() => {
    let s = 0;
    for (let i = last7Days.length - 1; i >= 0; i--) {
      const d = last7Days[i];
      if (d.hasWorkout || d.hasIntake || d.hasSleep) s++; else break;
    }
    return s;
  }, [last7Days]);

  const weekCompletion = useMemo(() => {
    const total = last7Days.length * 3;
    const done = last7Days.reduce((a, d) => a + (d.hasWorkout ? 1 : 0) + (d.hasIntake ? 1 : 0) + (d.hasSleep ? 1 : 0), 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [last7Days]);

  const hrData  = [62, 60, 63, 58, 61, 59, dailyState?.avgHeartRate  || 61];
  const volData = [2.1, 2.4, 1.8, 3.1, 2.7, 2.9, (dailyState?.totalVolume || 0) / 1000];

  const widgets: WidgetDefinition[] = useMemo(() => [
    // ── AI Briefing ──────────────────────────────────────────────────────────
    {
      id: "briefing", label: "Sensei Briefing", icon: Sparkles,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => (
        <ModuleBriefing title="Briefing" kicker="Sensei AI"
          content="Recovery is strong today. You have a heavy lifting session planned this afternoon — make sure to hydrate and front-load your carbs." />
      ),
    },
    // ── Vitals (4 rings) ──────────────────────────────────────────────────────
    {
      id: "vitals", label: "Today's Vitals", icon: Activity,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Vitals Grid" }],
      render: () => (
        <div className="space-y-3 h-full">
          <SectionHeader title="Today's State" kicker="Biometrics" />
          <div className="grid grid-cols-2 gap-3 h-auto">
            {[
              { label: "Recovery",  value: readiness,      max: 100,           unit: undefined,  color: "#14b8a6", to: "/body/sleep" },
              { label: "Nutrition", value: todayCalories,  max: calorieGoal,   unit: "kcal",     color: "#f97316", to: "/body/nutrition" },
              { label: "Activity",  value: workoutsThisWeek, max: 5,           unit: "this wk",  color: "#f59e0b", to: "/body/activity" },
              { label: "Care",      value: completedToday, max: Math.max(totalRoutines, 1), unit: undefined, color: "#8b5cf6", to: "/body/looks" },
            ].map(({ label, value, max, unit, color, to }) => (
              <motion.div key={label} whileTap={{ scale: 0.97 }} onClick={() => navigate(to)}
                className="bg-card rounded-2xl p-4 border border-border/60 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                <MetricRing value={value} max={max} label={label} unit={unit} color={color} size="sm" />
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    // ── Planned sessions ──────────────────────────────────────────────────────
    {
      id: "planned", label: "Planned Today", icon: LayoutGrid,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="body" />,
    },
    // ── Focus areas ───────────────────────────────────────────────────────────
    {
      id: "focus", label: "Focus Areas", icon: Flame,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Alert Cards" }],
      render: () => (
        <div className="space-y-3">
          <SectionHeader title="Focus Areas" kicker="Action Required" />
          <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-1 px-1">
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
      ),
    },
    // ── Consistency grid ──────────────────────────────────────────────────────
    {
      id: "consistency", label: "Consistency", icon: Flame,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "7-day Grid" }],
      render: () => (
        <div className="space-y-3">
          <SectionHeader title="Consistency" kicker="Execution" />
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
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
                <p className="text-xs font-bold text-muted-foreground/60 mb-1.5 uppercase tracking-wider">This week</p>
                <div className="flex items-center gap-2">
                  <div className="w-24"><BarGauge value={weekCompletion} color="#f59e0b" /></div>
                  <span className="text-sm font-bold tabular-nums">{weekCompletion}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 mb-4">
              {[{ label: "Move", color: "bg-amber-500" }, { label: "Eat", color: "bg-orange-400" }, { label: "Sleep", color: "bg-indigo-400" }].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  <div className={cn("w-2 h-2 rounded-full", color)} />{label}
                </span>
              ))}
            </div>
            <div className="flex justify-between w-full">
              {last7Days.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <div className={cn("w-7 h-7 rounded-lg transition-all", day.hasWorkout ? "bg-amber-500" : "bg-muted/20")} />
                    <div className={cn("w-7 h-7 rounded-lg transition-all", day.hasIntake  ? "bg-orange-400" : "bg-muted/20")} />
                    <div className={cn("w-7 h-7 rounded-lg transition-all", day.hasSleep   ? "bg-indigo-400" : "bg-muted/20")} />
                  </div>
                  <span className={cn("text-[9px] font-bold uppercase tracking-tight tabular-nums",
                    isToday(day.date) ? "text-foreground" : "text-muted-foreground/30")}>
                    {format(day.date, "EEEEE")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // ── Body signals ──────────────────────────────────────────────────────────
    {
      id: "signals", label: "Body Signals", icon: Battery,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Signal Bars" }],
      render: () => (
        <div className="space-y-3">
          <SectionHeader title="Body Signals" kicker="Biometrics" />
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-5">
            {([
              { label: "Energy Balance",    value: signals?.balance  ?? 0, color: "#10b981", Icon: Scale    },
              { label: "Nervous Stress",    value: signals?.stress   ?? 0, color: "#f59e0b", Icon: Activity },
              { label: "Habit Momentum",    value: signals?.momentum ?? 0, color: "#f97316", Icon: Flame    },
              { label: "Overall Readiness", value: overallReadiness,       color: "#3b82f6", Icon: Battery  },
            ] as const).map(({ label, value, color, Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}18` }}>
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
      ),
    },
    // ── Biometrics (sparklines) ───────────────────────────────────────────────
    {
      id: "biometrics", label: "Biometric Trends", icon: Heart,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Sparkline Cards" }],
      render: () => (
        <div className="space-y-3">
          <SectionHeader title="Biometric Trends" kicker="Analysis" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/activity/avgHR")}
              className="bg-card border border-border/60 shadow-sm rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Resting Heart Rate</span>
                  </div>
                  <p className="text-3xl font-bold leading-none">
                    {dailyState?.avgHeartRate || "—"}
                    <span className="text-base text-muted-foreground font-semibold ml-1.5">bpm</span>
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <TrendingDown className="w-3 h-3" /> Optimal
                  </span>
                </div>
                <div className="shrink-0 pt-1"><Sparkline data={hrData} color="#f43f5e" /></div>
              </div>
            </motion.div>

            <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/activity/strengthVolume")}
              className="bg-card border border-border/60 shadow-sm rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Effort Volume</span>
                  </div>
                  <p className="text-3xl font-bold leading-none">
                    {((dailyState?.totalVolume || 0) / 1000).toFixed(1)}
                    <span className="text-base text-muted-foreground font-semibold ml-1.5">tons</span>
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <TrendingUp className="w-3 h-3" /> Growing
                  </span>
                </div>
                <div className="shrink-0 pt-1"><Sparkline data={volData} color="#f59e0b" /></div>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [readiness, todayCalories, calorieGoal, workoutsThisWeek, completedToday, totalRoutines,
      signals, overallReadiness, streakCount, weekCompletion, last7Days, hrData, volData, dailyState]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <ModuleGrid widgets={widgets} storageKey="moduleGrid_hub_v1" />
    </div>
  );
}
