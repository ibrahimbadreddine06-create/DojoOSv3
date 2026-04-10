import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { ModuleBriefing } from "../module-briefing";
import {
  Plus, Timer, Activity as ActivityIcon, MapPin, Heart,
  Zap, Flame, TrendingUp, Dumbbell, Gauge, CalendarDays,
  Waves, BarChart2, ListChecks, Sparkles,
} from "lucide-react";
import { format, startOfWeek, isAfter } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { KpiTile } from "./kpi-tile";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition } from "@/components/body/module-grid";
import { WeeklyEffortGauge } from "./weekly-effort-gauge";
import { PlannedActivities } from "./planned-activities";
import { ActivityLogCalendar } from "./activity-log-calendar";
import { ExercisesMusclesSection } from "./exercises-muscles-section";
import { HrZonesSection } from "./hr-zones-section";
import { TrendsSection } from "./trends-section";
import { LogActivityModal } from "./log-activity-modal";
import { TodaySessions } from "@/components/today-sessions";

import type { Workout, BodyProfile, DailyState } from "@shared/schema";

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
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => <ActivityAiBrief dailyData={dailyState} />,
    },
    // ── Effort ring ──────────────────────────────────────────────────────────
    {
      id: "effort_ring", label: "Effort Ring", icon: Zap,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/activity/metric/effortScore")}>
          <CardContent className="p-2 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={effortScore ?? 0} max={100} label="Effort" color="#f59e0b" size="lg" sublabel="score" />
          </CardContent>
        </Card>
      ),
    },
    // ── Energy ring ──────────────────────────────────────────────────────────
    {
      id: "energy_ring", label: "Energy Ring", icon: Flame,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/activity/metric/energyBurned")}>
          <CardContent className="p-2 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={caloriesBurned ?? 0} max={dailyEnergyGoal} label="Energy" unit="kcal" color="#f59e0b" size="lg" sublabel="today" />
          </CardContent>
        </Card>
      ),
    },
    // ── Recovery ring ────────────────────────────────────────────────────────
    {
      id: "recovery_ring", label: "Recovery Ring", icon: TrendingUp,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/sleep")}>
          <CardContent className="p-2 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={recoveryScore ?? 0} max={100} label="Recovery" color="#14b8a6" size="lg" sublabel="readiness" />
          </CardContent>
        </Card>
      ),
    },
    // ── KPI tiles ────────────────────────────────────────────────────────────
    {
      id: "active_time", label: "Active Time", icon: Timer,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Active time" value={activeMinutes || null} unit="min" goal={activeTimeGoal} goalUnit="min" metricKey="activeTime" />,
    },
    {
      id: "steps", label: "Steps", icon: ActivityIcon,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Steps" value={steps} unit="steps" goal={8000} wearableRequired metricKey="steps" />,
    },
    {
      id: "distance", label: "Distance", icon: MapPin,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Distance" value={distanceKm} unit="km" goal={5} goalUnit="km" wearableRequired metricKey="distance" />,
    },
    {
      id: "avg_hr", label: "Avg HR", icon: Heart,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Avg HR" value={avgHeartRate} unit="bpm" wearableRequired metricKey="avgHR" />,
    },
    {
      id: "effort_score", label: "Effort Score", icon: Zap,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Effort Score" value={effortScore} unit="" metricKey="effortScore" />,
    },
    {
      id: "calories_tile", label: "Calories Burned", icon: Flame,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Calories" value={caloriesBurned} unit="kcal" metricKey="energyBurned" />,
    },
    {
      id: "recovery_tile", label: "Recovery Score", icon: TrendingUp,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Recovery" value={recoveryScore} unit="" metricKey="recoveryScore" />,
    },
    {
      id: "volume", label: "Total Volume", icon: Dumbbell,
      defaultW: 1, defaultH: 1,
      visualizations: [{ id: "tile", label: "KPI Tile" }],
      render: () => <KpiTile label="Total Volume" value={totalVolume} unit="kg" metricKey="volume" />,
    },
    // ── Sections ─────────────────────────────────────────────────────────────
    {
      id: "weekly_effort", label: "Weekly Effort", icon: Gauge,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Gauge" }],
      render: () => <WeeklyEffortGauge currentEffort={weeklyEffort} target={weeklyEffortTarget} />,
    },
    {
      id: "today_sessions", label: "Today's Sessions", icon: ListChecks,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="activity" />,
    },
    {
      id: "planned_activities", label: "Planned Activities", icon: CalendarDays,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Activity List" }],
      render: () => <PlannedActivities />,
    },
    {
      id: "log_calendar", label: "Log Calendar", icon: CalendarDays,
      defaultW: 3, defaultH: 4,
      visualizations: [{ id: "default", label: "Calendar" }],
      render: () => <ActivityLogCalendar />,
    },
    {
      id: "exercises_muscles", label: "Exercises & Muscles", icon: Dumbbell,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Muscle Map" }],
      render: () => <ExercisesMusclesSection />,
    },
    {
      id: "hr_zones", label: "HR Zones", icon: Waves,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Zone Bars" }],
      render: () => <HrZonesSection />,
    },
    {
      id: "trends", label: "Trends", icon: BarChart2,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Trend Chart" }],
      render: () => (
        <TrendsSection
          effortScore={effortScore} energyBurned={caloriesBurned}
          steps={steps} distance={distanceKm}
          exerciseDuration={activeMinutes || null}
          avgHR={avgHeartRate} strengthVolume={totalVolume}
        />
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [activeMinutes, activeTimeGoal, steps, distanceKm, avgHeartRate, effortScore, caloriesBurned, recoveryScore, totalVolume, dailyEnergyGoal, weeklyEffort, weeklyEffortTarget, dailyState]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-end mb-3">
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

function ActivityAiBrief({ dailyData }: { dailyData: any }) {
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
      isLoading={isLoading} accentColor="bg-amber-500/10" />
  );
}
