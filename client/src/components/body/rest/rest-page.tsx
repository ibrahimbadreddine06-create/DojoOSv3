import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Moon, Plus, Sparkles, BarChart2, ListChecks, Waves, Clock, Activity, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { LogRestDialog } from "./log-rest-dialog";
import { TonightRhythmCard } from "./tonight-rhythm-card";
import { TodaySessions } from "@/components/today-sessions";
import { LastNightBreakdown } from "./last-night-breakdown";
import { RecoveryPhysiology } from "./recovery-physiology";
import { TodaysRestImpact } from "./todays-rest-impact";
import { RestChronology } from "./rest-chronology";
import { RestTrends } from "./rest-trends";
import { Button } from "@/components/ui/button";
import { ModuleBriefing } from "../module-briefing";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition } from "@/components/body/module-grid";

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

  const { data: allLogs, isLoading } = useQuery<any[]>({ queryKey: ["/api/sleep-logs/all"] });
  const { data: bodyProfile }        = useQuery<any>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState }         = useQuery<any>({ queryKey: [`/api/daily-state/${today}`] });

  const sleepGoal         = parseFloat(bodyProfile?.sleepGoalHours || SLEEP_GOAL);
  const todayLog          = allLogs?.find((l) => l.date === today);
  const lastLog           = allLogs?.[0] ?? null;
  const restScore         = todayLog ? calcRestScore(todayLog) : null;
  const sleepDuration     = todayLog ? parseFloat(todayLog.actualHours || 0) : null;
  const recoveryReadiness = dailyState?.recoveryScore ?? null;

  const showNoDataBanner  = !isLoading && (!allLogs || allLogs.length === 0);
  const showWarningBanner = !showNoDataBanner && restScore !== null && restScore < 40;

  const restScoreColor =
    restScore === null ? "#6b7280" : restScore >= 70 ? "#22c55e" : restScore >= 40 ? "#eab308" : "#ef4444";
  const recoveryColor =
    recoveryReadiness === null ? "#6b7280" : recoveryReadiness >= 70 ? "#22c55e" : recoveryReadiness >= 40 ? "#eab308" : "#ef4444";

  const widgets: WidgetDefinition[] = useMemo(() => [
    // ── AI Briefing ──────────────────────────────────────────────────────────
    {
      id: "briefing", label: "AI Briefing", icon: Sparkles,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => (
        <RestAiBrief dailyState={dailyState}
          showNoDataWarning={showNoDataBanner} lowRecoveryWarning={showWarningBanner} />
      ),
    },
    // ── Hero rings ───────────────────────────────────────────────────────────
    {
      id: "rest_score_ring", label: "Rest Score", icon: Moon,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/sleep/metric/restScore")}>
          <CardContent className="p-5 flex items-center justify-center h-full">
            <MetricRing value={restScore ?? 0} max={100} label="Rest Score"
              color={restScoreColor} size="lg" sublabel="last night" />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "duration_ring", label: "Sleep Duration", icon: Clock,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/sleep/metric/sleepDuration")}>
          <CardContent className="p-5 flex items-center justify-center h-full">
            <MetricRing value={sleepDuration ?? 0} max={sleepGoal} label="Duration"
              unit="h" color="#6366f1" size="lg" sublabel={`/ ${sleepGoal}h goal`} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "readiness_ring", label: "Readiness", icon: Activity,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Popover>
          <PopoverTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full">
              <CardContent className="p-5 flex items-center justify-center h-full">
                {recoveryReadiness !== null ? (
                  <MetricRing value={recoveryReadiness} max={100} label="Readiness"
                    color={recoveryColor} size="lg" sublabel="recovery" />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative" style={{ width: 140, height: 140 }}>
                      <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx={70} cy={70} r={63.5} fill="none" stroke="#e5e7eb" strokeWidth={13} strokeOpacity={0.18} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-mono font-bold text-muted-foreground opacity-40">–</span>
                      </div>
                    </div>
                    <div className="text-center mt-1.5 text-xs">
                      <p className="font-semibold tracking-wide text-muted-foreground leading-none">Readiness</p>
                      <p className="text-muted-foreground/60 leading-none mt-0.5">wearable needed</p>
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
                Calculated from overnight HRV and resting HR. Requires a connected wearable.
              </p>
            </PopoverContent>
          )}
        </Popover>
      ),
    },
    // ── Sections ─────────────────────────────────────────────────────────────
    {
      id: "tonight_rhythm", label: "Tonight's Rhythm", icon: Moon,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Rhythm Card" }],
      render: () => (
        <TonightRhythmCard windDownTime={bodyProfile?.windDownTime ?? "22:00"}
          bedTarget={bodyProfile?.bedTarget ?? "23:00"} wakeTarget={bodyProfile?.wakeTarget ?? "07:00"}
          sleepNeeded={sleepGoal} />
      ),
    },
    {
      id: "today_sessions", label: "Today's Sessions", icon: ListChecks,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="rest" />,
    },
    {
      id: "last_night", label: "Last Night Breakdown", icon: Moon,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Breakdown Card" }],
      render: () => (
        <LastNightBreakdown
          timeInBed={lastLog ? parseFloat(lastLog.actualHours || 0) : null}
          efficiency={lastLog
            ? Math.min(100, Math.round((parseFloat(lastLog.actualHours || 0) / parseFloat(lastLog.plannedHours || sleepGoal)) * 100))
            : null}
          bedtime={lastLog?.bedtime ?? null} wakeTime={lastLog?.wakeTime ?? null} />
      ),
    },
    {
      id: "recovery_physiology", label: "Recovery Physiology", icon: Activity,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Physiology Card" }],
      render: () => <RecoveryPhysiology />,
    },
    {
      id: "rest_impact", label: "Today's Rest Impact", icon: TrendingUp,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Impact Card" }],
      render: () => <TodaysRestImpact restScore={restScore} recoveryReadiness={recoveryReadiness} />,
    },
    {
      id: "rest_chronology", label: "Rest Chronology", icon: Waves,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Sleep Timeline" }],
      render: () => <RestChronology />,
    },
    {
      id: "rest_trends", label: "Rest Trends", icon: BarChart2,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Trend Chart" }],
      render: () => <RestTrends restScore={restScore} sleepDuration={sleepDuration} />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [restScore, sleepDuration, recoveryReadiness, sleepGoal, lastLog, bodyProfile, dailyState, showNoDataBanner, showWarningBanner, restScoreColor, recoveryColor]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-end mb-3">
        <LogRestDialog>
          <Button size="sm"
            className="gap-1.5 shadow-sm rounded-xl bg-indigo-500 hover:bg-indigo-600 border-none text-white">
            <Plus className="w-4 h-4" /> Log rest
          </Button>
        </LogRestDialog>
      </div>

      <ModuleGrid widgets={widgets} storageKey="moduleGrid_rest_v1" />
    </div>
  );
}

function RestAiBrief({ dailyState, showNoDataWarning, lowRecoveryWarning }: {
  dailyState: any; showNoDataWarning?: boolean; lowRecoveryWarning?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/rest/ai-brief", JSON.stringify(dailyState)],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/rest/ai-brief", { dailyState });
      if (!res.ok) return { brief: "Rest & recovery analysis currently unavailable." };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const warningPrefix = lowRecoveryWarning ? "⚠️ LOW RECOVERY: Prioritize sleep tonight.\n\n" : "";
  const fallback = "No rest data yet. Tap Log rest to record your first entry.";
  return (
    <ModuleBriefing title="Briefing" kicker="Sensei AI"
      content={data?.brief ? warningPrefix + data.brief : (showNoDataWarning ? fallback : data?.brief)}
      isLoading={isLoading} accentColor="bg-indigo-500/10" />
  );
}
