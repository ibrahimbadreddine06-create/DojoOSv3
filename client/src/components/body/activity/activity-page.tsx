import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleBriefing } from "../module-briefing";
import {
  Plus,
  Timer,
  Activity as ActivityIcon,
  MapPin,
  Heart,
  Zap,
  Flame,
  TrendingUp,
  Dumbbell,
} from "lucide-react";
import { format, startOfWeek, isAfter } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { KpiTile } from "./kpi-tile";
import { KpiGrid } from "@/components/body/kpi-grid";
import type { KpiDefinition } from "@/components/body/kpi-grid";
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

  // ── Data queries ─────────────────────────────────────────────────────────────
  const { data: workouts } = useQuery<Workout[]>({ queryKey: [`/api/workouts/${today}`] });
  const { data: bodyProfile } = useQuery<BodyProfile>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState } = useQuery<DailyState | null>({
    queryKey: [`/api/daily-state/${today}`],
  });

  // ── Derived metrics ───────────────────────────────────────────────────────────
  const todaysWorkouts = workouts?.filter(
    (w) => w.date && format(new Date(w.date), "yyyy-MM-dd") === today,
  ) || [];

  const activeMinutes =
    dailyState?.activeMinutes ??
    todaysWorkouts.reduce(
      (sum, w) =>
        sum +
        (w.endTime && w.startTime
          ? Math.round(
              (new Date(w.endTime).getTime() - new Date(w.startTime).getTime()) / 60000,
            )
          : 0),
      0,
    );

  const effortScore     = dailyState?.effortScore     ?? null;
  const caloriesBurned  = dailyState?.caloriesBurned  ?? null;
  const recoveryScore   = dailyState?.recoveryScore   ?? null;
  const steps           = dailyState?.steps           ?? null;
  const distanceKm      = dailyState?.distanceKm
    ? parseFloat(String(dailyState.distanceKm))
    : null;
  const avgHeartRate    = dailyState?.avgHeartRate    ?? null;
  const totalVolume     = dailyState?.totalVolume     ?? null;

  const dailyEnergyGoal    = bodyProfile?.dailyEnergyGoal    ?? 2500;
  const activeTimeGoal     = bodyProfile?.activeTimeGoal     ?? 45;
  const weeklyEffortTarget = bodyProfile?.weeklyEffortTarget ?? 500;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyEffort = useMemo(() => {
    if (!workouts) return 0;
    return workouts
      .filter((w) => w.date && isAfter(new Date(w.date), weekStart) && w.completed)
      .length * 50;
  }, [workouts, weekStart]);

  // ── KPI definitions ───────────────────────────────────────────────────────────
  // Each KpiDefinition is memoized so the grid doesn't re-initialise on every
  // render. `render` is a closure that captures the latest metric values.
  const kpis: KpiDefinition[] = useMemo(
    () => [
      {
        id: "active_time",
        label: "Active Time",
        icon: Timer,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Active time"
            value={activeMinutes || null}
            unit="min"
            goal={activeTimeGoal}
            goalUnit="min"
            metricKey="activeTime"
          />
        ),
      },
      {
        id: "steps",
        label: "Steps",
        icon: ActivityIcon,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Steps"
            value={steps}
            unit="steps"
            goal={8000}
            wearableRequired
            metricKey="steps"
          />
        ),
      },
      {
        id: "distance",
        label: "Distance",
        icon: MapPin,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Distance"
            value={distanceKm}
            unit="km"
            goal={5}
            goalUnit="km"
            wearableRequired
            metricKey="distance"
          />
        ),
      },
      {
        id: "avg_hr",
        label: "Avg HR",
        icon: Heart,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Avg HR today"
            value={avgHeartRate}
            unit="bpm"
            wearableRequired
            metricKey="avgHR"
            subtitle="FC en journée"
          />
        ),
      },
      {
        id: "effort_score",
        label: "Effort Score",
        icon: Zap,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Effort Score"
            value={effortScore}
            unit=""
            metricKey="effortScore"
          />
        ),
      },
      {
        id: "calories",
        label: "Calories Burned",
        icon: Flame,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Calories"
            value={caloriesBurned}
            unit="kcal"
            metricKey="energyBurned"
          />
        ),
      },
      {
        id: "recovery",
        label: "Recovery",
        icon: TrendingUp,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Recovery"
            value={recoveryScore}
            unit=""
            metricKey="recoveryScore"
          />
        ),
      },
      {
        id: "volume",
        label: "Total Volume",
        icon: Dumbbell,
        defaultW: 1,
        defaultH: 1,
        visualizations: [{ id: "tile", label: "KPI Tile" }],
        render: () => (
          <KpiTile
            label="Total Volume"
            value={totalVolume}
            unit="kg"
            metricKey="volume"
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeMinutes, activeTimeGoal,
      steps, distanceKm, avgHeartRate,
      effortScore, caloriesBurned, recoveryScore, totalVolume,
    ],
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700 pb-24">
      <div className="space-y-8">
        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Movement & training</p>
          </div>
          <Button
            onClick={() => setLogModalOpen(true)}
            size="sm"
            className="gap-1.5 shrink-0 shadow-sm rounded-xl bg-amber-500 hover:bg-amber-600 border-none text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Log activity
          </Button>
        </div>

        {/* 2. AI Briefing */}
        <ActivityAiBrief dailyData={dailyState} />

        {/* 3. Hero metric rings (Effort / Energy / Recovery) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/activity/metric/effortScore")}
          >
            <CardContent className="p-2 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={effortScore ?? 0}
                max={100}
                label="Effort"
                color="#f59e0b"
                size="lg"
                sublabel="score"
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/activity/metric/energyBurned")}
          >
            <CardContent className="p-2 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={caloriesBurned ?? 0}
                max={dailyEnergyGoal}
                label="Energy"
                unit="kcal"
                color="#f59e0b"
                size="lg"
                sublabel="today"
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/sleep")}
          >
            <CardContent className="p-2 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={recoveryScore ?? 0}
                max={100}
                label="Recovery"
                color="#14b8a6"
                size="lg"
                sublabel="readiness"
              />
            </CardContent>
          </Card>
        </div>

        {/* 4. KPI Grid — drag, resize, add/remove */}
        <KpiGrid kpis={kpis} storageKey="kpiGrid_activity_v1" />

        {/* 5. Rest of the page */}
        <WeeklyEffortGauge currentEffort={weeklyEffort} target={weeklyEffortTarget} />
        <TodaySessions module="activity" />
        <PlannedActivities />
        <ActivityLogCalendar />
        <ExercisesMusclesSection />
        <HrZonesSection />
        <TrendsSection
          effortScore={effortScore}
          energyBurned={caloriesBurned}
          steps={steps}
          distance={distanceKm}
          exerciseDuration={activeMinutes || null}
          avgHR={avgHeartRate}
          strengthVolume={totalVolume}
        />
      </div>

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
    <ModuleBriefing
      title="Briefing"
      kicker="Sensei AI"
      content={
        data?.brief ||
        "It looks like we're just getting started with tracking your activity today! Every step counts, and we're here to cheer you on for whatever you choose to do. Let's make it a great one!"
      }
      isLoading={isLoading}
      accentColor="bg-amber-500/10"
    />
  );
}
