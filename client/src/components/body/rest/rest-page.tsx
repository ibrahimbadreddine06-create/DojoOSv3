import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Moon, AlertCircle, Watch, Info } from "lucide-react";
import { format, subDays } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { SectionLabel } from "./section-label";
import { LogRestDialog } from "./log-rest-dialog";
import { TonightRhythmCard } from "./tonight-rhythm-card";
import { LinkedRestBlocks } from "./linked-rest-blocks";
import { LastNightBreakdown } from "./last-night-breakdown";
import { RecoveryPhysiology } from "./recovery-physiology";
import { TodaysRestImpact } from "./todays-rest-impact";
import { RestChronology } from "./rest-chronology";
import { RestTrends } from "./rest-trends";
import { RestInsights } from "./rest-insights";

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
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700">
      <div className="space-y-6">

        {/* ── 1. Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Rest</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Recovery, sleep & rhythm</p>
          </div>
          <LogRestDialog />
        </div>

        {/* ── 2. Status Banner ── */}
        {showNoDataBanner && (
          <div className="flex items-start gap-3 bg-indigo-500/8 border border-indigo-500/20 rounded-2xl px-5 py-4">
            <Moon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">No rest data yet</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Tap <strong>Log rest</strong> to record your first entry, or connect a wearable in
                Settings → Integrations for automatic tracking.
              </p>
            </div>
          </div>
        )}

        {showWarningBanner && (
          <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-600 dark:text-red-400">Low recovery detected</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Your rest score is below 40. Prioritize sleep tonight and keep training light today.
              </p>
            </div>
          </div>
        )}

        {/* ── 3. Hero Metrics Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Rest Score */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/rest/metric/restScore")}
          >
            <CardContent className="p-5 flex items-center justify-center">
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

          {/* Sleep Duration */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/rest/metric/sleepDuration")}
          >
            <CardContent className="p-5 flex items-center justify-center">
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

          {/* Recovery Readiness */}
          <Popover>
            <PopoverTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-center">
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
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative" style={{ width: 130, height: 130 }}>
                        <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={65} cy={65} r={58} fill="none" stroke="#e5e7eb" strokeWidth={12} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-mono font-black text-muted-foreground">–</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] font-semibold tracking-wide text-muted-foreground">Readiness</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">wearable needed</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PopoverTrigger>
            {recoveryReadiness === null && (
              <PopoverContent className="w-72">
                <div className="flex items-start gap-2">
                  <Watch className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Recovery Readiness</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Calculated from overnight HRV and resting HR data. Requires a connected wearable.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Connect in <strong>Settings → Integrations</strong>.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            )}
          </Popover>
        </div>

        {/* ── 4. Tonight & Rhythm ── */}
        <TonightRhythmCard
          windDownTime={bodyProfile?.windDownTime ?? "22:00"}
          bedTarget={bodyProfile?.bedTarget ?? "23:00"}
          wakeTarget={bodyProfile?.wakeTarget ?? "07:00"}
          sleepNeeded={sleepGoal}
        />

        {/* ── 5. Linked Time Blocks ── */}
        <LinkedRestBlocks />

        {/* ── 6. Last Night Breakdown ── */}
        <LastNightBreakdown
          timeInBed={lastLog ? parseFloat(lastLog.actualHours || 0) : null}
          efficiency={
            lastLog
              ? Math.min(
                  100,
                  Math.round(
                    (parseFloat(lastLog.actualHours || 0) /
                      parseFloat(lastLog.plannedHours || sleepGoal)) *
                      100
                  )
                )
              : null
          }
          bedtime={lastLog?.bedtime ?? null}
          wakeTime={lastLog?.wakeTime ?? null}
        />

        {/* ── 7. Recovery Physiology ── */}
        <RecoveryPhysiology />

        {/* ── 8. Today's Rest Impact ── */}
        <TodaysRestImpact restScore={restScore} recoveryReadiness={recoveryReadiness} />

        {/* ── 9. Chronology ── */}
        <RestChronology />

        {/* ── 10. Trends ── */}
        <RestTrends restScore={restScore} sleepDuration={sleepDuration} />

        {/* ── 11. Insights / Education ── */}
        <RestInsights hasData={hasData} />

        <div className="h-4" />
      </div>
    </div>
  );
}
