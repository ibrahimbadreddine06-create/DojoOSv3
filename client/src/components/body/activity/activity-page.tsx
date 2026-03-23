import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Watch } from "lucide-react";
import { format, startOfWeek, isAfter } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { AiBriefCard } from "./ai-brief-card";
import { KpiTile } from "./kpi-tile";
import { WeeklyEffortGauge } from "./weekly-effort-gauge";
import { PlannedActivities } from "./planned-activities";
import { ActivityLogCalendar } from "./activity-log-calendar";
import { ExercisesMusclesSection } from "./exercises-muscles-section";
import { HrZonesSection } from "./hr-zones-section";
import { TrendsSection } from "./trends-section";
import { LogActivityModal } from "./log-activity-modal";
import { SectionLabel } from "./section-label";

import type { Workout, BodyProfile, DailyState } from "@shared/schema";

export function ActivityPage() {
  const [, navigate] = useLocation();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  // Data queries
  const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
  const { data: bodyProfile } = useQuery<BodyProfile>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState } = useQuery<DailyState | null>({
    queryKey: [`/api/daily-state/${today}`],
  });

  // Compute metrics from data
  const todaysWorkouts = workouts?.filter(
    (w) => w.date && format(new Date(w.date), "yyyy-MM-dd") === today
  ) || [];

  const activeMinutes = dailyState?.activeMinutes ??
    todaysWorkouts.reduce((sum, w) => sum + (w.endTime && w.startTime
      ? Math.round((new Date(w.endTime).getTime() - new Date(w.startTime).getTime()) / 60000)
      : 0), 0);

  const effortScore = dailyState?.effortScore ?? null;
  const caloriesBurned = dailyState?.caloriesBurned ?? null;
  const recoveryScore = dailyState?.recoveryScore ?? null;
  const steps = dailyState?.steps ?? null;
  const distanceKm = dailyState?.distanceKm ? parseFloat(String(dailyState.distanceKm)) : null;
  const avgHeartRate = dailyState?.avgHeartRate ?? null;

  const dailyEnergyGoal = bodyProfile?.dailyEnergyGoal ?? 2500;
  const activeTimeGoal = bodyProfile?.activeTimeGoal ?? 45;
  const weeklyEffortTarget = bodyProfile?.weeklyEffortTarget ?? 500;

  // Weekly effort calculation
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyEffort = useMemo(() => {
    if (!workouts) return 0;
    return workouts
      .filter((w) => w.date && isAfter(new Date(w.date), weekStart) && w.completed)
      .length * 50; // Placeholder: 50 points per completed workout
  }, [workouts, weekStart]);

  // Total volume for strength
  const totalVolume = dailyState?.totalVolume ?? null;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
      <div className="space-y-6">
        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Activity</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Movement & training</p>
          </div>
          <Button
            onClick={() => setLogModalOpen(true)}
            className="gap-1.5 shrink-0"
            style={{ backgroundColor: "hsl(0 84.2% 60.2%)" }}
          >
            <Plus className="w-4 h-4" /> Log activity
          </Button>
        </div>

        {/* 2. AI Brief */}
        <AiBriefCard dailyData={dailyState} />

        {/* 3a. Three Rings */}
        <div className="grid grid-cols-3 gap-3">
          {/* Effort */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/activity/metric/effortScore")}
          >
            <div className="h-[3px] rounded-t-xl" style={{ backgroundColor: "#f59e0b" }} />
            <CardContent className="p-4 flex flex-col items-center">
              <MetricRing
                value={effortScore ?? 0}
                max={100}
                label="Effort"
                color="#f59e0b"
                size="lg"
                sublabel="composite score"
              />
            </CardContent>
          </Card>

          {/* Energy */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/activity/metric/energyBurned")}
          >
            <div className="h-[3px] rounded-t-xl" style={{ backgroundColor: "hsl(0 84.2% 60.2%)" }} />
            <CardContent className="p-4 flex flex-col items-center">
              <MetricRing
                value={caloriesBurned ?? 0}
                max={dailyEnergyGoal}
                label="Energy"
                unit="kcal"
                color="hsl(0, 84.2%, 60.2%)"
                size="lg"
                sublabel={`goal: ${dailyEnergyGoal} kcal`}
              />
            </CardContent>
          </Card>

          {/* Recovery */}
          <Popover>
            <PopoverTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-[3px] rounded-t-xl" style={{ backgroundColor: recoveryScore != null ? "#14b8a6" : "#d1d5db" }} />
                <CardContent className="p-4 flex flex-col items-center">
                  {recoveryScore != null ? (
                    <MetricRing
                      value={recoveryScore}
                      max={100}
                      label="Recovery"
                      color="#14b8a6"
                      size="lg"
                      sublabel="tap → history"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      {/* Empty gray ring */}
                      <div className="relative" style={{ width: 140, height: 140 }}>
                        <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={70} cy={70} r={63.5} fill="none" stroke="#e5e7eb" strokeWidth={13} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-mono font-black text-muted-foreground">–</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] font-semibold tracking-wide text-muted-foreground">Recovery</p>
                        <p className="text-[12px] text-muted-foreground/60 mt-0.5">tap → learn more</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PopoverTrigger>
            {recoveryScore == null && (
              <PopoverContent className="w-72">
                <h4 className="text-sm font-semibold mb-1">Recovery Score</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your recovery score (0–100) is calculated from heart rate variability (HRV) and resting heart rate data.
                  It tells you how ready your body is for training.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Connect a wearable in <strong>Settings → Integrations</strong> to unlock this metric.
                </p>
              </PopoverContent>
            )}
          </Popover>
        </div>

        {/* 3b. Four KPI Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <KpiTile
            label="Active time"
            value={activeMinutes || null}
            unit="min"
            color="hsl(0, 84.2%, 60.2%)"
            goal={activeTimeGoal}
            goalUnit="min"
            progress={activeTimeGoal > 0 ? ((activeMinutes || 0) / activeTimeGoal) * 100 : 0}
            metricKey="activeTime"
          />
          <KpiTile
            label="Steps"
            value={steps}
            unit="steps"
            color="#6b7280"
            goal={8000}
            progress={steps ? (steps / 8000) * 100 : 0}
            wearableRequired
            metricKey="steps"
          />
          <KpiTile
            label="Distance"
            value={distanceKm}
            unit="km"
            color="#3b82f6"
            goal={5}
            goalUnit="km"
            progress={distanceKm ? (distanceKm / 5) * 100 : 0}
            wearableRequired
            metricKey="distance"
          />
          <KpiTile
            label="Avg HR today"
            value={avgHeartRate}
            unit="bpm"
            color="#ef4444"
            wearableRequired
            metricKey="avgHR"
            subtitle="FC en journée"
          />
        </div>

        {/* 4. Weekly Effort Gauge */}
        <WeeklyEffortGauge currentEffort={weeklyEffort} target={weeklyEffortTarget} />

        {/* 5. Planned Activities */}
        <PlannedActivities />

        {/* 6. Activity Log Calendar */}
        <ActivityLogCalendar />

        {/* 7. Exercises & Muscles */}
        <ExercisesMusclesSection />

        {/* 8. HR Zones & Cardio Focus */}
        <HrZonesSection />

        {/* 9. Trends */}
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

      {/* Log Activity Modal */}
      <LogActivityModal open={logModalOpen} onOpenChange={setLogModalOpen} />
    </div>
  );
}
