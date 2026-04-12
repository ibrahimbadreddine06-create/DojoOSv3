import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { ModuleBriefing } from "../module-briefing";
import { cn } from "@/lib/utils";
import {
  Plus, Timer, Activity as ActivityIcon, MapPin, Heart,
  Zap, Flame, TrendingUp, Dumbbell, Gauge, CalendarDays,
  Waves, ListChecks, Sparkles,
} from "lucide-react";
import { format, startOfWeek, isAfter } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { KpiTile } from "./kpi-tile";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition, WidgetRenderContext } from "@/components/body/module-grid";
import { WeeklyEffortGauge } from "./weekly-effort-gauge";
import { PlannedActivities } from "./planned-activities";
import { ActivityLogCalendar } from "./activity-log-calendar";
import { ExercisesMusclesSection } from "./exercises-muscles-section";
import { HrZonesSection } from "./hr-zones-section";
import { LogActivityModal } from "./log-activity-modal";
import { TodaySessions } from "@/components/today-sessions";

import type { Workout, BodyProfile, DailyState } from "@shared/schema";

function ringSizeFor(ctx: WidgetRenderContext): "sm" | "md" | "lg" {
  if (ctx.size.h <= 1 || ctx.size.w <= 1 && ctx.shape === "square") return "sm";
  if (ctx.shape === "horizontal" || ctx.size.h === 2) return "md";
  return "lg";
}

function ActiveTimeWidget({
  ctx,
  value,
  goal,
  visualizationId,
  ...rootProps
}: {
  ctx: WidgetRenderContext;
  value: number;
  goal: number;
  visualizationId: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const pct = goal > 0 ? Math.min(100, Math.round((safeValue / goal) * 100)) : 0;
  const trend = [8, 12, 5, 16, 10, 18, safeValue].map((v) => Math.max(2, Math.min(22, v)));
  const isEmpty = safeValue === 0;

  const microBars = (
    <div className="mt-3 flex items-end gap-1">
      {trend.map((v, i) => (
        <span
          key={i}
          className="block w-2 rounded-full"
          style={{ height: `${v}px`, background: "linear-gradient(180deg, rgba(245,158,11,0.9), rgba(245,158,11,0.25))" }}
        />
      ))}
    </div>
  );

  const header = (
    <div className={cn("flex w-full items-start justify-between gap-3", ctx.shape === "horizontal" && "items-center")}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Active Time</p>
        <p className={cn("mt-2 font-black leading-none", ctx.shape === "horizontal" ? "text-3xl" : "text-4xl")}>
          {safeValue}
          <span className="ml-1.5 text-xs font-bold text-muted-foreground">min</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          {isEmpty ? "Start your first session" : `+${Math.max(0, safeValue - Math.round(goal * 0.4))} min vs avg`}
        </p>
      </div>
      <div className="min-w-[5.5rem] text-right">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Today</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{pct}% of goal</p>
      </div>
    </div>
  );

  const numberLayout = (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Active Time</p>
          <p className="mt-2 text-5xl font-black leading-none">
            {safeValue}
            <span className="ml-1 text-sm font-bold text-muted-foreground">min</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {isEmpty ? "Start your first session" : `+${Math.max(0, safeValue - Math.round(goal * 0.4))} min vs avg`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Today</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{pct}% of goal</p>
        </div>
      </div>
      {microBars}
    </div>
  );

  const barLayout = (
    <div className="flex h-full w-full flex-col justify-between">
      {header}
      {microBars}
    </div>
  );

  const timelineLayout = (
    <div className="flex h-full w-full flex-col justify-between">
      {header}
      <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45">
        <span>Now</span>
        <span>Later</span>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const filled = i < Math.max(1, Math.round((pct / 100) * 7));
          return (
            <span
              key={i}
              className="h-2 rounded-full"
              style={{ background: filled ? "linear-gradient(180deg, rgba(245,158,11,0.9), rgba(245,158,11,0.25))" : "hsl(var(--muted) / 0.35)" }}
            />
          );
        })}
      </div>
      {microBars}
    </div>
  );

  const content =
    visualizationId === "timeline" ? timelineLayout
      : visualizationId === "number" ? numberLayout
        : barLayout;

  return (
    <div {...rootProps} className={cn("h-full w-full rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm", rootProps.className)}>
      {rootProps.children}
      {content}
    </div>
  );
}

export function ActivityPage() {
  const [, navigate] = useLocation();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: workouts }     = useQuery<Workout[]>({ queryKey: [`/api/workouts/${today}`] });
  const { data: bodyProfile }  = useQuery<BodyProfile>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState }   = useQuery<DailyState | null>({ queryKey: [`/api/daily-state/${today}`] });

  const todaysWorkouts = workouts?.filter(
    (w) => w.date && format(new Date(w.date), "yyyy-MM-dd") === today,
  ) || [];

  const activeMinutes = dailyState?.activeMinutes ??
    todaysWorkouts.reduce((s, w) =>
      s + (w.endTime && w.startTime ? Math.round((new Date(w.endTime).getTime() - new Date(w.startTime).getTime()) / 60000) : 0), 0);

  const effortScore    = dailyState?.effortScore    ?? null;
  const caloriesBurned = dailyState?.caloriesBurned ?? null;
  const recoveryScore  = dailyState?.recoveryScore  ?? null;
  const steps          = dailyState?.steps          ?? null;
  const distanceKm     = dailyState?.distanceKm ? parseFloat(String(dailyState.distanceKm)) : null;
  const avgHeartRate   = dailyState?.avgHeartRate   ?? null;
  const totalVolume    = dailyState?.totalVolume    ?? null;

  const dailyEnergyGoal    = bodyProfile?.dailyEnergyGoal    ?? 2500;
  const activeTimeGoal     = bodyProfile?.activeTimeGoal     ?? 45;
  const weeklyEffortTarget = bodyProfile?.weeklyEffortTarget ?? 500;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyEffort = useMemo(() => {
    if (!workouts) return 0;
    return workouts.filter((w) => w.date && isAfter(new Date(w.date), weekStart) && w.completed).length * 50;
  }, [workouts, weekStart]);

  const widgets: WidgetDefinition[] = useMemo(() => [
    // ── AI Briefing ──────────────────────────────────────────────────────────
    {
      id: "briefing", label: "AI Briefing", icon: Sparkles,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => <ActivityAiBrief dailyData={dailyState} />,
    },
    // ── Effort ring ──────────────────────────────────────────────────────────
    {
      id: "effort_ring", label: "Effort Ring", icon: Zap,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/activity/metric/effortScore")}>
          <CardContent className="p-2 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={effortScore ?? 0} max={100} label="Effort" color="#f59e0b" size={ringSizeFor(ctx)} sublabel="score" />
          </CardContent>
        </Card>
      ),
    },
    // ── Energy ring ──────────────────────────────────────────────────────────
    {
      id: "energy_ring", label: "Energy Ring", icon: Flame,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/activity/metric/energyBurned")}>
          <CardContent className="p-2 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={caloriesBurned ?? 0} max={dailyEnergyGoal} label="Energy" unit="kcal" color="#f59e0b" size={ringSizeFor(ctx)} sublabel="today" />
          </CardContent>
        </Card>
      ),
    },
    // ── Recovery ring ────────────────────────────────────────────────────────
    {
      id: "recovery_ring", label: "Recovery Ring", icon: TrendingUp,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/sleep")}>
          <CardContent className="p-2 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={recoveryScore ?? 0} max={100} label="Recovery" color="#14b8a6" size={ringSizeFor(ctx)} sublabel="readiness" />
          </CardContent>
        </Card>
      ),
    },
    // ── KPI tiles ────────────────────────────────────────────────────────────
    {
      id: "active_time", label: "Active Time", icon: Timer,
      defaultW: 1, defaultH: 1,
      allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 1, h: 2 }],
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "timeline", label: "Timeline" },
        { id: "number", label: "Number" },
      ],
      render: (ctx) => (
        <ActiveTimeWidget
          ctx={ctx}
          value={activeMinutes || 0}
          goal={activeTimeGoal}
          visualizationId={ctx.visualizationId}
        />
      ),
    },
    {
      id: "steps", label: "Steps", icon: ActivityIcon,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "number", label: "Number" },
        { id: "sparkline", label: "Sparkline" },
      ],
      render: () => <KpiTile label="Steps" value={steps} unit="steps" goal={8000} wearableRequired metricKey="steps" />,
    },
    {
      id: "distance", label: "Distance", icon: MapPin,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "number", label: "Number" },
        { id: "sparkline", label: "Sparkline" },
      ],
      render: () => <KpiTile label="Distance" value={distanceKm} unit="km" goal={5} goalUnit="km" wearableRequired metricKey="distance" />,
    },
    {
      id: "avg_hr", label: "Avg HR", icon: Heart,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "sparkline", label: "Sparkline" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <KpiTile label="Avg HR" value={avgHeartRate} unit="bpm" wearableRequired metricKey="avgHR" />,
    },
    {
      id: "effort_score", label: "Effort Score", icon: Zap,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "gauge", label: "Gauge" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <KpiTile label="Effort Score" value={effortScore} unit="" metricKey="effortScore" />,
    },
    {
      id: "calories_tile", label: "Calories Burned", icon: Flame,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "number", label: "Number" },
        { id: "sparkline", label: "Sparkline" },
      ],
      render: () => <KpiTile label="Calories" value={caloriesBurned} unit="kcal" metricKey="energyBurned" />,
    },
    {
      id: "recovery_tile", label: "Recovery Score", icon: TrendingUp,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "gauge", label: "Gauge" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <KpiTile label="Recovery" value={recoveryScore} unit="" metricKey="recoveryScore" />,
    },
    {
      id: "volume", label: "Total Volume", icon: Dumbbell,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "number", label: "Number" },
        { id: "sparkline", label: "Sparkline" },
      ],
      render: () => <KpiTile label="Total Volume" value={totalVolume} unit="kg" metricKey="volume" />,
    },
    // ── Sections ─────────────────────────────────────────────────────────────
    {
      id: "weekly_effort", label: "Weekly Effort", icon: Gauge,
      defaultW: 3, defaultH: 2,
      visualizations: [
        { id: "gauge", label: "Gauge" },
        { id: "arc", label: "Arc" },
      ],
      render: () => <WeeklyEffortGauge currentEffort={weeklyEffort} target={weeklyEffortTarget} />,
    },
    {
      id: "today_sessions", label: "Today's Sessions", icon: ListChecks,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="activity" />,
    },
    {
      id: "planned_activities", label: "Planned Activities", icon: CalendarDays,
      defaultW: 3, defaultH: 3,
      visualizations: [
        { id: "list", label: "List" },
        { id: "timeline", label: "Timeline" },
      ],
      render: () => <PlannedActivities />,
    },
    {
      id: "log_calendar", label: "Log Calendar", icon: CalendarDays,
      defaultW: 3, defaultH: 4,
      allowedSizes: [{ w: 3, h: 3 }, { w: 3, h: 4 }, { w: 3, h: 5 }],
      visualizations: [
        { id: "calendar", label: "Calendar" },
        { id: "heatmap", label: "Heatmap" },
      ],
      render: () => <ActivityLogCalendar />,
    },
    {
      id: "exercises_muscles", label: "Exercises & Muscles", icon: Dumbbell,
      defaultW: 3, defaultH: 3,
      visualizations: [
        { id: "map", label: "Muscle Map" },
        { id: "list", label: "List" },
      ],
      render: () => <ExercisesMusclesSection />,
    },
    {
      id: "hr_zones", label: "HR Zones", icon: Waves,
      defaultW: 3, defaultH: 2,
      visualizations: [
        { id: "stacked", label: "Stacked Bars" },
        { id: "bar", label: "Bar" },
      ],
      render: () => <HrZonesSection />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [activeMinutes, activeTimeGoal, steps, distanceKm, avgHeartRate, effortScore, caloriesBurned, recoveryScore, totalVolume, dailyEnergyGoal, weeklyEffort, weeklyEffortTarget, dailyState]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Activity</h1>
        </div>
        <Button onClick={() => setLogModalOpen(true)} size="sm"
          className="gap-1.5 shadow-sm rounded-xl bg-amber-500 hover:bg-amber-600 border-none text-white">
          <Plus className="w-4 h-4" /> Log activity
        </Button>
      </div>

      <ModuleGrid widgets={widgets} storageKey="moduleGrid_activity_v1" />

      <LogActivityModal open={logModalOpen} onOpenChange={setLogModalOpen} />
    </div>
  );
}

function ActivityAiBrief({ dailyData, ...rootProps }: { dailyData: any } & React.HTMLAttributes<HTMLDivElement>) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/activity/ai-brief", JSON.stringify(dailyData)],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/activity/ai-brief", { dailyData });
      if (!res.ok) return { brief: "Activity analysis currently unavailable." };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  return (
    <ModuleBriefing title="Briefing" kicker="Sensei AI"
      content={data?.brief || "Tracking your activity today. Every step counts!"}
      isLoading={isLoading} accentColor="bg-amber-500/10" {...rootProps} />
  );
}
