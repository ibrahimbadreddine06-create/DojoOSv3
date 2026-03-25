import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Moon, Watch, Info, Plus } from "lucide-react";
import { format, subDays } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../section-header";
import { LogRestDialog } from "./log-rest-dialog";
import { TonightRhythmCard } from "./tonight-rhythm-card";
import { TodaySessions } from "@/components/today-sessions";
import { LastNightBreakdown } from "./last-night-breakdown";
import { RecoveryPhysiology } from "./recovery-physiology";
import { TodaysRestImpact } from "./todays-rest-impact";
import { RestChronology } from "./rest-chronology";
import { RestTrends } from "./rest-trends";
import { RestInsights } from "./rest-insights";
import { StatusBanner } from "../status-banner";
import { Button } from "@/components/ui/button";
import { ModuleBriefing } from "../module-briefing";

const SLEEP_GOAL = 8;

function calcRestScore(log: any): number {
  const quality = log?.quality || 3;
  const actual = parseFloat(log?.actualHours || 0);
  const goalRatio = Math.min(1, actual / SLEEP_GOAL);
  return Math.round(quality * 10 + goalRatio * 50);
}

export function RestPage() {
  const [, navigate] = useLocation();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: allLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sleep-logs/all"],
  });

  const { data: bodyProfile } = useQuery<any>({
    queryKey: ["/api/body-profile"],
  });

  const { data: dailyState } = useQuery<any>({
    queryKey: [`/api/daily-state/${today}`],
  });

  const sleepGoal = parseFloat(bodyProfile?.sleepGoalHours || SLEEP_GOAL);
  const todayLog = allLogs?.find((l) => l.date === today);
  const lastLog = allLogs?.[0] ?? null;

  // Hero metrics
  const restScore = todayLog ? calcRestScore(todayLog) : null;
  const sleepDuration = todayLog ? parseFloat(todayLog.actualHours || 0) : null;
  const recoveryReadiness = dailyState?.recoveryScore ?? null;

  const hasData = !!todayLog || (allLogs && allLogs.length > 0);

  // Status banner logic
  const showNoDataBanner = !isLoading && (!allLogs || allLogs.length === 0);
  const showWarningBanner =
    !showNoDataBanner && restScore !== null && restScore < 40;

  // Color helpers
  const restScoreColor =
    restScore === null ? "#6b7280"
      : restScore >= 70 ? "#22c55e"
        : restScore >= 40 ? "#eab308"
          : "#ef4444";

  const recoveryColor =
    recoveryReadiness === null ? "#6b7280"
      : recoveryReadiness >= 70 ? "#22c55e"
        : recoveryReadiness >= 40 ? "#eab308"
          : "#ef4444";

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700 pb-24">
      <div className="space-y-8">

        {/* ── 1. Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rest</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Recovery, sleep & rhythm</p>
          </div>
          <LogRestDialog>
            <Button
              className="gap-1.5 shrink-0 shadow-sm rounded-xl bg-indigo-500 hover:bg-indigo-600 border-none text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Log rest
            </Button>
          </LogRestDialog>
        </div>

        {/* ── 2. Status Banner ── */}
        <RestAiBrief dailyState={dailyState} showNoDataWarning={showNoDataBanner} lowRecoveryWarning={showWarningBanner} />

        {/* ── 3. Hero Metrics Row ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/sleep/metric/restScore")}
          >
            <CardContent className="p-2.5 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={restScore ?? 0}
                max={100}
                label="Rest Score"
                color={restScoreColor}
                size="lg"
                sublabel="last night"
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/sleep/metric/sleepDuration")}
          >
            <CardContent className="p-2.5 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={sleepDuration ?? 0}
                max={sleepGoal}
                label="Duration"
                unit="h"
                color="#6366f1"
                size="lg"
                sublabel={`/ ${sleepGoal}h goal`}
              />
            </CardContent>
          </Card>

          <Popover>
            <PopoverTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm">
                <CardContent className="p-2.5 sm:p-5 flex items-center justify-center">
                  {recoveryReadiness !== null ? (
                    <MetricRing
                      value={recoveryReadiness}
                      max={100}
                      label="Readiness"
                      color={recoveryColor}
                      size="lg"
                      sublabel="recovery"
                    />
                  ) : (
                    <div className="flex flex-col items-center relative">
                      <div className="invisible pointer-events-none select-none text-center mb-1.5">
                        <p className="text-[12px] font-semibold tracking-wide leading-none">Readiness</p>
                        <p className="text-[11px] leading-none mt-0.5">wearable needed</p>
                      </div>

                      <div className="relative" style={{ width: 140, height: 140 }}>
                        <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={70} cy={70} r={63.5} fill="none" stroke="#e5e7eb" strokeWidth={13} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-mono font-bold text-muted-foreground">–</span>
                        </div>
                      </div>

                      <div className="text-center mt-1.5">
                        <p className="text-[12px] font-semibold tracking-wide text-muted-foreground leading-none">Readiness</p>
                        <p className="text-[11px] text-muted-foreground/60 leading-none mt-0.5">wearable needed</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PopoverTrigger>
            {recoveryReadiness === null && (
              <PopoverContent className="w-72">
                <h4 className="text-sm font-semibold mb-1">Recovery Readiness</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Calculated from overnight HRV and resting HR data. Requires a connected wearable.
                </p>
              </PopoverContent>
            )}
          </Popover>
        </div>

        <TonightRhythmCard
          windDownTime={bodyProfile?.windDownTime ?? "22:00"}
          bedTarget={bodyProfile?.bedTarget ?? "23:00"}
          wakeTarget={bodyProfile?.wakeTarget ?? "07:00"}
          sleepNeeded={sleepGoal}
        />

        <TodaySessions module="rest" />
        <LastNightBreakdown
          timeInBed={lastLog ? parseFloat(lastLog.actualHours || 0) : null}
          efficiency={
            lastLog
              ? Math.min(100, Math.round((parseFloat(lastLog.actualHours || 0) / parseFloat(lastLog.plannedHours || sleepGoal)) * 100))
              : null
          }
          bedtime={lastLog?.bedtime ?? null}
          wakeTime={lastLog?.wakeTime ?? null}
        />
        <RecoveryPhysiology />
        <TodaysRestImpact restScore={restScore} recoveryReadiness={recoveryReadiness} />
        <RestChronology />
        <RestTrends restScore={restScore} sleepDuration={sleepDuration} />
        <RestInsights hasData={hasData} />
      </div>
    </div>
  );
}

function RestAiBrief({ dailyState, showNoDataWarning, lowRecoveryWarning }: { dailyState: any, showNoDataWarning?: boolean, lowRecoveryWarning?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/rest/ai-brief", JSON.stringify(dailyState)],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/rest/ai-brief", { dailyState });
      if (!res.ok) return { brief: "Rest & recovery analysis currently unavailable." };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const warningPrefix = lowRecoveryWarning ? "⚠️ LOW RECOVERY DETECTED: Your rest score is low. Prioritize sleep tonight and keep training light today.\n\n" : "";
  const fallbackText = "No rest data yet. Tap Log rest to record your first entry, or connect a wearable in Settings → Integrations for automatic tracking.";

  return (
    <ModuleBriefing
      title="Briefing"
      kicker="Sensei AI"
      content={data?.brief ? (warningPrefix + data.brief) : (showNoDataWarning ? fallbackText : data?.brief)}
      isLoading={isLoading}
      accentColor="bg-indigo-500/10"
    />
  );
}
