import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Info, Watch } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

const METRIC_CONFIG: Record<string, {
  title: string;
  unit: string;
  color: string;
  description: string;
  wearableRequired?: boolean;
}> = {
  // Hero
  restScore: {
    title: "Rest Score",
    unit: "pts",
    color: "#6366f1",
    description: "A composite 0–100 score that combines sleep duration, sleep quality rating, and consistency to give a single daily rest quality number.",
  },
  sleepDuration: {
    title: "Sleep Duration",
    unit: "h",
    color: "#818cf8",
    description: "Total hours of sleep recorded per night. Compare against your personal sleep goal to identify deficits or progress.",
  },
  recoveryReadiness: {
    title: "Recovery Readiness",
    unit: "%",
    color: "#14b8a6",
    description: "A 0–100 score derived from overnight HRV and resting heart rate, indicating how ready your body is for physical or cognitive demands.",
    wearableRequired: true,
  },
  // Last Night Breakdown
  timeInBed: {
    title: "Time in Bed",
    unit: "h",
    color: "#6366f1",
    description: "Total time from when you got into bed to when you got up, including any awake periods.",
  },
  sleepEfficiency: {
    title: "Sleep Efficiency",
    unit: "%",
    color: "#22c55e",
    description: "The ratio of time actually sleeping vs. total time in bed. 85%+ is considered efficient sleep.",
  },
  sleepLatency: {
    title: "Sleep Latency",
    unit: "min",
    color: "#a78bfa",
    description: "How long it takes to fall asleep after getting into bed. Optimal latency is 10–20 minutes.",
    wearableRequired: true,
  },
  rem: {
    title: "REM Sleep",
    unit: "h",
    color: "#818cf8",
    description: "Rapid Eye Movement sleep stage — critical for memory consolidation, emotional regulation, and creativity. Aim for ~90 min per night.",
    wearableRequired: true,
  },
  deepSleep: {
    title: "Deep Sleep",
    unit: "h",
    color: "#6366f1",
    description: "Slow-wave sleep stage — essential for physical restoration, immune function, and growth hormone release. Aim for 1–2 hours per night.",
    wearableRequired: true,
  },
  awakeTime: {
    title: "Awake / Disrupted",
    unit: "min",
    color: "#ef4444",
    description: "Total time awake or restless during the night after initially falling asleep. Under 20 min is normal.",
    wearableRequired: true,
  },
  bedtime: {
    title: "Bedtime",
    unit: "",
    color: "#6366f1",
    description: "The time you went to bed. Tracking this reveals your chronotype and helps improve consistency.",
  },
  wakeTime: {
    title: "Wake Time",
    unit: "",
    color: "#f59e0b",
    description: "The time you woke up. Consistent wake times are one of the strongest anchors for circadian rhythm.",
  },
  napTotal: {
    title: "Nap Total",
    unit: "min",
    color: "#a78bfa",
    description: "Total minutes of daytime napping. Short naps (10–20 min) can restore alertness without affecting nighttime sleep.",
  },
  // Physiology
  overnightHR: {
    title: "Overnight HR",
    unit: "bpm",
    color: "#ef4444",
    description: "Average heart rate during sleep. A lower overnight HR generally indicates better cardiovascular fitness and recovery.",
    wearableRequired: true,
  },
  overnightHRV: {
    title: "Overnight HRV",
    unit: "ms",
    color: "#14b8a6",
    description: "Heart rate variability measured during sleep — the gold standard for autonomic nervous system balance and recovery status.",
    wearableRequired: true,
  },
  respiratoryRate: {
    title: "Respiratory Rate",
    unit: "rpm",
    color: "#3b82f6",
    description: "Breaths per minute during sleep. Changes in baseline respiratory rate can indicate illness, stress, or sleep-disordered breathing.",
    wearableRequired: true,
  },
  tempDeviation: {
    title: "Temperature Deviation",
    unit: "°C",
    color: "#f97316",
    description: "Deviation from your baseline skin temperature during sleep. Elevation may signal illness or inflammation before symptoms appear.",
    wearableRequired: true,
  },
  spO2: {
    title: "SpO₂",
    unit: "%",
    color: "#22c55e",
    description: "Blood oxygen saturation during sleep. Healthy levels are ≥95%. Drops below 90% may indicate sleep apnea or breathing issues.",
    wearableRequired: true,
  },
  // Rhythm
  bedtimeConsistency: {
    title: "Bedtime Consistency",
    unit: "%",
    color: "#f59e0b",
    description: "How consistently you go to bed at the same time each night. Higher consistency (>80%) strongly correlates with better sleep quality.",
  },
  wakeConsistency: {
    title: "Wake Consistency",
    unit: "%",
    color: "#f59e0b",
    description: "How consistently you wake at the same time each morning. This is the most powerful anchor for your circadian rhythm.",
  },
  sleepDebt: {
    title: "Sleep Debt",
    unit: "h",
    color: "#ef4444",
    description: "Cumulative shortfall between your sleep goal and actual sleep over the past 7 days. Negative values mean you're behind.",
  },
  sleepBank: {
    title: "Sleep Bank",
    unit: "h",
    color: "#22c55e",
    description: "Accumulated surplus of sleep vs. your goal over time. A positive sleep bank is associated with improved performance and wellbeing.",
  },
};

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

export default function RestDrilldown() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const [, navigate] = useLocation();
  const [range, setRange] = useState(30);

  const config = METRIC_CONFIG[metricKey || ""] || {
    title: metricKey || "Metric",
    unit: "",
    color: "#6366f1",
    description: "Detailed tracking and historical analysis for this rest metric.",
  };

  // Placeholder chart data (no-data for wearable metrics)
  const chartData = useMemo(() => {
    return Array.from({ length: range }, (_, i) => {
      const date = subDays(new Date(), range - 1 - i);
      return {
        date: format(date, "MMM d"),
        fullDate: format(date, "yyyy-MM-dd"),
        value: config.wearableRequired ? null : Math.floor(Math.random() * 40) + 50,
      };
    });
  }, [range, config.wearableRequired, metricKey]);

  const chartConfig = {
    value: { label: config.title, color: config.color },
  };

  const trendPeriods = [
    { label: "Last 3 days", days: 3 },
    { label: "Last 7 days", days: 7 },
    { label: "Last 14 days", days: 14 },
    { label: "Last 30 days", days: 30 },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl pb-24">
      <div className="space-y-6">
        {/* Back + title */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-2 -ml-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
            onClick={() => navigate("/body/sleep")}
          >
            <ArrowLeft className="w-4 h-4" /> Rest
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: config.color }}>
              {config.title}
            </h1>
            {config.wearableRequired ? (
              <Badge variant="outline" className="gap-1 text-[10px] font-bold px-2">
                <Watch className="w-3 h-3" /> Wearable
              </Badge>
            ) : (
              <div
                className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                style={{ backgroundColor: `${config.color}18`, color: config.color }}
              >
                Live Data
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-bold uppercase tracking-widest text-[10px]">
            Historical Trends & Insights
          </p>
        </div>

        {/* Stats row */}
        {!config.wearableRequired && (
          <div className="grid grid-cols-3 gap-4">
            {["Average", "Range Max", "Range Min"].map((label) => (
              <div key={label} className="bg-card border rounded-xl p-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">{label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tabular-nums">—</span>
                  <span className="text-[10px] text-muted-foreground font-bold">{config.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <Card style={{ borderColor: `${config.color}20` }}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3
                className="text-xs font-black uppercase tracking-widest flex items-center gap-2"
                style={{ color: config.color }}
              >
                <Info className="w-3 h-3" /> Trend Chart
              </h3>
              <div className="flex gap-1">
                {TIME_RANGES.map((tr) => (
                  <Button
                    key={tr.label}
                    size="sm"
                    variant={range === tr.days ? "default" : "outline"}
                    className="text-[10px] h-7 px-3 font-black uppercase tracking-widest rounded-full transition-all"
                    style={
                      range === tr.days
                        ? { backgroundColor: config.color }
                        : { color: config.color, borderColor: `${config.color}30` }
                    }
                    onClick={() => setRange(tr.days)}
                  >
                    {tr.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="h-72 relative">
              {config.wearableRequired ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed rounded-xl gap-2"
                  style={{ borderColor: `${config.color}20` }}
                >
                  <Watch className="w-8 h-8 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Connect a wearable to unlock this data</p>
                  <p className="text-[10px] text-muted-foreground/40">Settings → Integrations</p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: "bold" }} tickLine={false} axisLine={false} dy={6} />
                    <YAxis orientation="right" tick={{ fontSize: 10, fontWeight: "bold" }} tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={config.color}
                      strokeWidth={3}
                      dot={{ r: 3, fill: config.color, strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trend analysis */}
        {!config.wearableRequired && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Trend Analysis</h3>
              <div className="space-y-0">
                {trendPeriods.map((period) => (
                  <div key={period.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{period.label}</span>
                    <span className="text-sm tabular-nums font-medium text-muted-foreground">—</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insight + Definition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card style={{ backgroundColor: `${config.color}08`, borderColor: `${config.color}20` }}>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: config.color }}>Insight</h3>
              <p className="text-sm leading-relaxed italic font-medium text-muted-foreground">
                Log more rest entries to receive personalized insights for this metric.
              </p>
            </CardContent>
          </Card>
          <Card style={{ borderColor: `${config.color}20` }}>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: config.color }}>
                Definition & Importance
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                {config.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
