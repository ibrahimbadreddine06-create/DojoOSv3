import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Plus, Sparkles, ListChecks, Waves, Clock, Activity, TrendingUp, Brain, Dumbbell, Coffee, Zap } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

import { MetricRing } from "@/components/body/metric-ring";
import { LogRestDialog } from "./log-rest-dialog";
import { TonightRhythmCard } from "./tonight-rhythm-card";
import { TodaySessions } from "@/components/today-sessions";
import { RestChronology } from "./rest-chronology";
import { Button } from "@/components/ui/button";
import { ModuleBriefing } from "../module-briefing";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition, WidgetRenderContext } from "@/components/body/module-grid";

const SLEEP_GOAL = 8;

function ringSizeFor(ctx: WidgetRenderContext): "sm" | "md" | "lg" {
  if (ctx.size.h <= 1 || ctx.size.w <= 1 && ctx.shape === "square") return "sm";
  if (ctx.shape === "horizontal" || ctx.size.h === 2) return "md";
  return "lg";
}

function RestMetricCard({ label, value, unit, color, onClick, icon: Icon = Activity, detail, ...rootProps }: {
  label: string;
  value: number | string | null;
  unit?: string;
  color?: string;
  onClick?: () => void;
  icon?: any;
  detail?: string;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const displayValue = value === null || value === undefined ? "-" : value;
  return (
    <button {...rootProps} type="button" onClick={onClick} className={`flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md ${rootProps.className ?? ""}`}>
      {rootProps.children}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/40" />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tabular-nums tracking-tight leading-none" style={color && displayValue !== "-" ? { color } : undefined}>
            {displayValue}
          </span>
          {displayValue !== "-" && unit && <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{unit}</span>}
        </div>
        {detail && <p className="mt-2 text-xs font-medium text-muted-foreground">{detail}</p>}
      </div>
    </button>
  );
}

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
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
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
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/sleep/metric/restScore")}>
          <CardContent className="p-5 flex items-center justify-center h-full">
            <MetricRing value={restScore ?? 0} max={100} label="Rest Score"
              color={restScoreColor} size={ringSizeFor(ctx)} sublabel="last night" />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "duration_ring", label: "Sleep Duration", icon: Clock,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/sleep/metric/sleepDuration")}>
          <CardContent className="p-5 flex items-center justify-center h-full">
            <MetricRing value={sleepDuration ?? 0} max={sleepGoal} label="Duration"
              unit="h" color="#6366f1" size={ringSizeFor(ctx)} sublabel={`/ ${sleepGoal}h goal`} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "readiness_ring", label: "Readiness", icon: Activity,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
            <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full">
              <CardContent className="p-5 flex items-center justify-center h-full">
                {recoveryReadiness !== null ? (
                  <MetricRing value={recoveryReadiness} max={100} label="Readiness"
                    color={recoveryColor} size={ringSizeFor(ctx)} sublabel="recovery" />
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
      ),
    },
    // ── Sections ─────────────────────────────────────────────────────────────
    {
      id: "tonight_rhythm", label: "Tonight's Rhythm", icon: Moon,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 3 }, { w: 3, h: 4 }],
      visualizations: [
        { id: "timeline", label: "Timeline" },
        { id: "wave", label: "Wave" },
      ],
      render: () => (
        <TonightRhythmCard windDownTime={bodyProfile?.windDownTime ?? "22:00"}
          bedTarget={bodyProfile?.bedTarget ?? "23:00"} wakeTarget={bodyProfile?.wakeTarget ?? "07:00"}
          sleepNeeded={sleepGoal} />
      ),
    },
    {
      id: "today_sessions", label: "Today's Sessions", icon: ListChecks,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="rest" />,
    },
    ...([
      { id: "time_in_bed", label: "Time in Bed", value: lastLog ? parseFloat(lastLog.actualHours || 0) : null, unit: "h", metric: "timeInBed", color: "#6366f1", icon: Moon },
      { id: "sleep_efficiency", label: "Efficiency", value: lastLog ? Math.min(100, Math.round((parseFloat(lastLog.actualHours || 0) / parseFloat(lastLog.plannedHours || sleepGoal)) * 100)) : null, unit: "%", metric: "sleepEfficiency", color: "#22c55e", icon: TrendingUp },
      { id: "bedtime", label: "Bedtime", value: lastLog?.bedtime ?? null, metric: "bedtime", icon: Clock },
      { id: "wake_time", label: "Wake Time", value: lastLog?.wakeTime ?? null, metric: "wakeTime", icon: Clock },
      { id: "sleep_latency", label: "Sleep Latency", value: null, unit: "min", metric: "sleepLatency", icon: Activity },
      { id: "rem_sleep", label: "REM", value: null, unit: "h", metric: "rem", color: "#818cf8", icon: Waves },
      { id: "deep_sleep", label: "Deep Sleep", value: null, unit: "h", metric: "deepSleep", color: "#6366f1", icon: Moon },
      { id: "awake_time", label: "Awake", value: null, unit: "min", metric: "awakeTime", color: "#ef4444", icon: Activity },
      { id: "overnight_hr", label: "Overnight HR", value: null, unit: "bpm", metric: "overnightHR", color: "#ef4444", icon: Activity },
      { id: "overnight_hrv", label: "Overnight HRV", value: null, unit: "ms", metric: "overnightHRV", color: "#14b8a6", icon: Activity },
      { id: "respiratory_rate", label: "Respiratory Rate", value: null, unit: "rpm", metric: "respiratoryRate", color: "#3b82f6", icon: Waves },
      { id: "temperature_deviation", label: "Temperature", value: null, unit: "C", metric: "tempDeviation", color: "#f59e0b", icon: Activity },
      { id: "spo2", label: "SpO2", value: null, unit: "%", metric: "spO2", color: "#22c55e", icon: Activity },
    ].map((metric) => ({
      id: metric.id, label: metric.label, icon: metric.icon,
      defaultW: 1, defaultH: 1,
      visualizations: metric.id === "sleep_efficiency"
        ? [{ id: "gauge", label: "Gauge" }, { id: "bar", label: "Bar" }]
        : metric.id === "bedtime" || metric.id === "wake_time"
          ? [{ id: "timeline", label: "Timeline" }, { id: "number", label: "Number" }]
          : metric.id === "rem_sleep" || metric.id === "deep_sleep" || metric.id === "awake_time"
            ? [{ id: "stacked", label: "Stacked" }, { id: "timeline", label: "Timeline" }]
            : metric.id.startsWith("overnight") || metric.id === "respiratory_rate" || metric.id === "temperature_deviation" || metric.id === "spo2"
              ? [{ id: "sparkline", label: "Sparkline" }, { id: "bar", label: "Bar" }]
              : [{ id: "bar", label: "Bar" }, { id: "number", label: "Number" }],
      render: () => <RestMetricCard label={metric.label} value={metric.value} unit={metric.unit} color={metric.color} icon={metric.icon} onClick={() => navigate(`/body/rest/metric/${metric.metric}`)} />,
    }))),
    ...([
      { id: "focus_capacity", label: "Focus Capacity", value: recoveryReadiness === null && restScore === null ? "-" : (recoveryReadiness ?? restScore ?? 0) >= 70 ? "High" : (recoveryReadiness ?? restScore ?? 0) >= 40 ? "Moderate" : "Low", detail: "Mental output guidance", icon: Brain },
      { id: "workout_readiness", label: "Workout Readiness", value: recoveryReadiness === null && restScore === null ? "-" : (recoveryReadiness ?? restScore ?? 0) >= 75 ? "Ready" : (recoveryReadiness ?? restScore ?? 0) >= 45 ? "Light only" : "Rest day", detail: "Training guidance", icon: Dumbbell },
      { id: "energy_dip", label: "Energy Dip", value: "14:00", detail: "Likely dip window", icon: Zap },
      { id: "nap_recommendation", label: "Nap", value: (recoveryReadiness ?? restScore ?? 100) < 60 ? "Recommended" : "Optional", detail: "Before 15:00", icon: Coffee },
    ].map((impact) => ({
      id: impact.id, label: impact.label, icon: impact.icon,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "impact", label: "Impact Card" },
        { id: "number", label: "Number" },
      ],
      render: () => <RestMetricCard label={impact.label} value={impact.value} detail={impact.detail} icon={impact.icon} onClick={() => navigate("/planner")} />,
    }))),
    {
      id: "rest_chronology", label: "Rest Chronology", icon: Waves,
      defaultW: 3, defaultH: 3,
      allowedSizes: [{ w: 3, h: 3 }, { w: 3, h: 4 }, { w: 3, h: 5 }],
      visualizations: [
        { id: "timeline", label: "Timeline" },
        { id: "stacked", label: "Stacked Blocks" },
      ],
      render: () => <RestChronology />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [restScore, sleepDuration, recoveryReadiness, sleepGoal, lastLog, bodyProfile, dailyState, showNoDataBanner, showWarningBanner, restScoreColor, recoveryColor]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Rest</h1>
        </div>
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

function RestAiBrief({ dailyState, showNoDataWarning, lowRecoveryWarning, ...rootProps }: {
  dailyState: any; showNoDataWarning?: boolean; lowRecoveryWarning?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
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
      isLoading={isLoading} accentColor="bg-indigo-500/10" {...rootProps} />
  );
}
