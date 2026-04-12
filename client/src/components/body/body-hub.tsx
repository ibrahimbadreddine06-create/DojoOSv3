import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, subDays } from "date-fns";
import {
  Activity,
  Battery,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Utensils,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MetricRing } from "./metric-ring";
import { TodaySessions } from "@/components/today-sessions";
import { ModuleBriefing } from "./module-briefing";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition, WidgetRenderContext } from "@/components/body/module-grid";
import type { BodyProfile, IntakeLog, SleepLog, Workout } from "@shared/schema";

const TODAY = format(new Date(), "yyyy-MM-dd");

function Sparkline({ data, color = "#14b8a6", h = 34 }: { data: number[]; color?: string; h?: number }) {
  if (data.length < 2) return null;
  const w = 72;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");
  const last = data[data.length - 1];
  const lx = w;
  const ly = h - ((last - min) / range) * (h - 4) - 2;

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
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function MetricWidget({
  ctx,
  label,
  value,
  max,
  unit,
  color,
  to,
  onNavigate,
  ...rootProps
}: {
  ctx: WidgetRenderContext;
  label: string;
  value: number;
  max: number;
  unit?: string;
  color: string;
  to: string;
  onNavigate: (path: string) => void;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const ringSize = ctx.shape === "horizontal" ? "md" : ctx.size.h >= 2 ? "lg" : "sm";

  return (
    <button
      {...rootProps}
      type="button"
      onClick={() => onNavigate(to)}
      className={cn(
        "h-full w-full rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md",
        ctx.shape === "horizontal" ? "flex items-center justify-between gap-4" : "flex flex-col items-center justify-center",
        rootProps.className,
      )}
    >
      {rootProps.children}
      {ctx.shape === "horizontal" && (
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Today</p>
        </div>
      )}
      <MetricRing value={value} max={max} label={label} unit={unit} color={color} size={ringSize} />
    </button>
  );
}

function FocusWidget({
  label,
  detail,
  icon: Icon,
  color,
  ...rootProps
}: {
  label: string;
  detail: string;
  icon: typeof Droplets;
  color: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rootProps} className={cn("flex h-full w-full flex-col justify-between rounded-2xl border p-5 shadow-sm", rootProps.className)} style={{ ...rootProps.style, borderColor: `${color}30`, backgroundColor: `${color}12` }}>
      {rootProps.children}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}22` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color }}>{label}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function SignalWidget({ label, value, color, icon: Icon, ...rootProps }: { label: string; value: number; color: string; icon: typeof Battery } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rootProps} className={cn("flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-sm", rootProps.className)}>
      {rootProps.children}
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="font-mono text-2xl font-bold tabular-nums">{value}%</span>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <BarGauge value={value} color={color} />
      </div>
    </div>
  );
}

function BiometricWidget({
  label,
  value,
  unit,
  badge,
  color,
  data,
  icon: Icon,
  trendIcon: TrendIcon,
  onClick,
  ...rootProps
}: {
  label: string;
  value: string | number;
  unit: string;
  badge: string;
  color: string;
  data: number[];
  icon: typeof Heart;
  trendIcon: typeof TrendingUp;
  onClick: () => void;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rootProps}
      type="button"
      onClick={onClick}
      className={cn("flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md", rootProps.className)}
    >
      {rootProps.children}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
            <span className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
          </div>
          <p className="text-3xl font-bold leading-none">
            {value}
            <span className="ml-1.5 text-base font-semibold text-muted-foreground">{unit}</span>
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <Sparkline data={data} color={color} />
        </div>
      </div>
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
        <TrendIcon className="h-3 w-3" />
        {badge}
      </span>
    </button>
  );
}

function ConsistencyWidget({ streakCount, weekCompletion, last7Days, ...rootProps }: { streakCount: number; weekCompletion: number; last7Days: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rootProps} className={cn("flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-sm", rootProps.className)}>
      {rootProps.children}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <span className="text-xl font-bold tabular-nums leading-none">{streakCount}</span>
            <span className="ml-1.5 text-xs font-medium text-muted-foreground">day streak</span>
          </div>
        </div>
        <div className="min-w-[7rem]">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-muted-foreground/60">
            <span>This week</span>
            <span>{weekCompletion}%</span>
          </div>
          <BarGauge value={weekCompletion} color="#f59e0b" />
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {last7Days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="flex flex-col gap-1">
              <div className={cn("h-6 w-6 rounded-lg transition-all", day.hasWorkout ? "bg-amber-500" : "bg-muted/20")} />
              <div className={cn("h-6 w-6 rounded-lg transition-all", day.hasIntake ? "bg-orange-400" : "bg-muted/20")} />
              <div className={cn("h-6 w-6 rounded-lg transition-all", day.hasSleep ? "bg-indigo-400" : "bg-muted/20")} />
            </div>
            <span className={cn("text-[9px] font-bold uppercase tracking-tight tabular-nums", isToday(day.date) ? "text-foreground" : "text-muted-foreground/30")}>
              {format(day.date, "EEEEE")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BodyHub() {
  const [, navigate] = useLocation();

  const { data: hygieneRoutines } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
  const { data: bodyProfile } = useQuery<BodyProfile>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState } = useQuery<any>({ queryKey: [`/api/daily-state/${TODAY}`] });
  const { data: signals } = useQuery<{ balance: number; stress: number; momentum: number }>({ queryKey: ["/api/body/signals"] });
  const { data: history7d } = useQuery<any[]>({ queryKey: ["/api/activity/trends?metric=steps&days=7"] });
  const { data: calorieTrends } = useQuery<any[]>({ queryKey: ["/api/nutrition/trends/batch?metrics=calories&days=7"] });
  const { data: sleepTrends } = useQuery<any[]>({ queryKey: ["/api/rest/trends?metric=sleepHours&days=7"] });

  const readiness = dailyState?.recoveryScore ?? 0;
  const todayCalories = dailyState?.caloriesConsumed ?? 0;
  const calorieGoal = bodyProfile?.dailyCalorieGoal || 2500;
  const totalRoutines = hygieneRoutines?.length || 0;
  const completedToday = (hygieneRoutines || []).filter((r: any) => r.lastCompletedDate === TODAY).length;
  const overallReadiness = dailyState?.readinessScore ?? 0;

  const workoutsThisWeek = useMemo(
    () => history7d?.filter((h) => h.workoutCompleted).length || 0,
    [history7d],
  );

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dStr = format(d, "yyyy-MM-dd");
    const act = history7d?.find((h) => h.date === dStr);
    const eat = (calorieTrends as any)?.calories?.find((h: any) => h.date === dStr);
    const slp = sleepTrends?.find((h) => h.date === dStr);
    return {
      date: d,
      hasWorkout: (act?.value || 0) > 0,
      hasIntake: (eat?.value || 0) > 0,
      hasSleep: (slp?.value || 0) > 0,
    };
  }), [history7d, calorieTrends, sleepTrends]);

  const streakCount = useMemo(() => {
    let streak = 0;
    for (let i = last7Days.length - 1; i >= 0; i--) {
      const day = last7Days[i];
      if (day.hasWorkout || day.hasIntake || day.hasSleep) streak += 1;
      else break;
    }
    return streak;
  }, [last7Days]);

  const weekCompletion = useMemo(() => {
    const total = last7Days.length * 3;
    const done = last7Days.reduce((sum, day) => sum + (day.hasWorkout ? 1 : 0) + (day.hasIntake ? 1 : 0) + (day.hasSleep ? 1 : 0), 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [last7Days]);

  const hrData = [62, 60, 63, 58, 61, 59, dailyState?.avgHeartRate || 61];
  const volData = [2.1, 2.4, 1.8, 3.1, 2.7, 2.9, (dailyState?.totalVolume || 0) / 1000];

  const widgets: WidgetDefinition[] = useMemo(() => [
    {
      id: "briefing",
      label: "Sensei Briefing",
      icon: Sparkles,
      defaultW: 3,
      defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => (
        <ModuleBriefing
          title="Briefing"
          kicker="Sensei AI"
          content="Recovery is strong today. You have a heavy lifting session planned this afternoon - make sure to hydrate and front-load your carbs."
        />
      ),
    },
    {
      id: "recovery",
      label: "Recovery",
      icon: Moon,
      defaultW: 1,
      defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
        { id: "bar", label: "Bar" },
        { id: "sparkline", label: "Sparkline" },
      ],
      render: (ctx) => <MetricWidget ctx={ctx} label="Recovery" value={readiness} max={100} color="#14b8a6" to="/body/sleep" onNavigate={navigate} />,
    },
    {
      id: "nutrition",
      label: "Nutrition",
      icon: Utensils,
      defaultW: 1,
      defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
        { id: "bar", label: "Bar" },
      ],
      render: (ctx) => <MetricWidget ctx={ctx} label="Nutrition" value={todayCalories} max={calorieGoal} unit="kcal" color="#f97316" to="/body/nutrition" onNavigate={navigate} />,
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      defaultW: 1,
      defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
        { id: "bar", label: "Bar" },
        { id: "timeline", label: "Timeline" },
      ],
      render: (ctx) => <MetricWidget ctx={ctx} label="Activity" value={workoutsThisWeek} max={5} unit="this wk" color="#f59e0b" to="/body/activity" onNavigate={navigate} />,
    },
    {
      id: "care",
      label: "Care",
      icon: Sparkles,
      defaultW: 1,
      defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
        { id: "bar", label: "Bar" },
      ],
      render: (ctx) => <MetricWidget ctx={ctx} label="Care" value={completedToday} max={Math.max(totalRoutines, 1)} color="#8b5cf6" to="/body/looks" onNavigate={navigate} />,
    },
    {
      id: "planned",
      label: "Planned Today",
      icon: Activity,
      defaultW: 3,
      defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="body" />,
    },
    {
      id: "hydration_low",
      label: "Hydration Low",
      icon: Droplets,
      defaultW: 1,
      defaultH: 1,
      visualizations: [
        { id: "alert", label: "Alert Card" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <FocusWidget label="Hydration low" detail="1 L behind schedule" icon={Droplets} color="#f59e0b" />,
    },
    {
      id: "sleep_deficit",
      label: "Sleep Deficit",
      icon: Moon,
      defaultW: 1,
      defaultH: 1,
      visualizations: [
        { id: "alert", label: "Alert Card" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <FocusWidget label="Sleep deficit" detail="-1.2 h avg this week" icon={Moon} color="#3b82f6" />,
    },
    {
      id: "consistency",
      label: "Consistency",
      icon: Flame,
      defaultW: 3,
      defaultH: 3,
      allowedSizes: [{ w: 2, h: 2 }, { w: 3, h: 3 }],
      visualizations: [
        { id: "heatmap", label: "7-day Grid" },
        { id: "streak", label: "Streak Strip" },
      ],
      render: () => <ConsistencyWidget streakCount={streakCount} weekCompletion={weekCompletion} last7Days={last7Days} />,
    },
    {
      id: "energy_balance",
      label: "Energy Balance",
      icon: Scale,
      defaultW: 1,
      defaultH: 1,
      visualizations: [
        { id: "diverging", label: "Diverging Bar" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <SignalWidget label="Energy Balance" value={signals?.balance ?? 0} color="#10b981" icon={Scale} />,
    },
    {
      id: "nervous_stress",
      label: "Nervous Stress",
      icon: Activity,
      defaultW: 1,
      defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "gauge", label: "Gauge" },
      ],
      render: () => <SignalWidget label="Nervous Stress" value={signals?.stress ?? 0} color="#f59e0b" icon={Activity} />,
    },
    {
      id: "habit_momentum",
      label: "Habit Momentum",
      icon: Flame,
      defaultW: 1,
      defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "gauge", label: "Gauge" },
        { id: "sparkline", label: "Sparkline" },
      ],
      render: () => <SignalWidget label="Habit Momentum" value={signals?.momentum ?? 0} color="#f97316" icon={Flame} />,
    },
    {
      id: "overall_readiness",
      label: "Overall Readiness",
      icon: Battery,
      defaultW: 1,
      defaultH: 1,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <SignalWidget label="Overall Readiness" value={overallReadiness} color="#3b82f6" icon={Battery} />,
    },
    {
      id: "resting_hr",
      label: "Resting Heart Rate",
      icon: Heart,
      defaultW: 2,
      defaultH: 1,
      visualizations: [
        { id: "sparkline", label: "Sparkline" },
        { id: "bar", label: "Bar" },
      ],
      render: () => (
        <BiometricWidget
          label="Resting Heart Rate"
          value={dailyState?.avgHeartRate || "-"}
          unit="bpm"
          badge="Optimal"
          color="#f43f5e"
          data={hrData}
          icon={Heart}
          trendIcon={TrendingDown}
          onClick={() => navigate("/body/activity/avgHR")}
        />
      ),
    },
    {
      id: "effort_volume",
      label: "Effort Volume",
      icon: Dumbbell,
      defaultW: 2,
      defaultH: 1,
      visualizations: [
        { id: "sparkline", label: "Sparkline" },
        { id: "bar", label: "Bar" },
      ],
      render: () => (
        <BiometricWidget
          label="Effort Volume"
          value={((dailyState?.totalVolume || 0) / 1000).toFixed(1)}
          unit="tons"
          badge="Growing"
          color="#f59e0b"
          data={volData}
          icon={Dumbbell}
          trendIcon={TrendingUp}
          onClick={() => navigate("/body/activity/strengthVolume")}
        />
      ),
    },
  ], [
    readiness,
    todayCalories,
    calorieGoal,
    workoutsThisWeek,
    completedToday,
    totalRoutines,
    streakCount,
    weekCompletion,
    last7Days,
    signals,
    overallReadiness,
    dailyState,
    hrData,
    volData,
    navigate,
  ]);

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in p-4 pb-24 duration-700 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Home</h1>
      </div>
      <ModuleGrid widgets={widgets} storageKey="moduleGrid_hub_v3" />
    </div>
  );
}
