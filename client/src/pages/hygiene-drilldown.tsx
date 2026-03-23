import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Info, Sparkles } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

const METRIC_CONFIG: Record<string, {
  title: string;
  unit: string;
  color: string;
  description: string;
}> = {
  // Hero
  upkeepScore: {
    title: "Upkeep Score",
    unit: "%",
    color: "#8b5cf6", // Violet
    description: "A composite 0–100 score tracking your overall completion rate of scheduled hygiene and care routines this week.",
  },
  disciplineRate: {
    title: "Discipline Rate",
    unit: "%",
    color: "#60a5fa", // Blue
    description: "Measures how consistently you hit your intended rhythm and frequency targets without slipping past the recommended intervals.",
  },
  glowUpDirection: {
    title: "Glow-up Direction",
    unit: "pts",
    color: "#f59e0b", // Amber
    description: "A momentum metric reflecting your 7-day consistency compared to your historical best streaks. Higher implies upward momentum.",
  },
  // Trends
  skincareConsistency: {
    title: "Skincare Consistency",
    unit: "%",
    color: "#8b5cf6",
    description: "Specifically tracks your adherence to morning and evening facial skincare routines.",
  },
  showerRhythm: {
    title: "Shower Rhythm",
    unit: "",
    color: "#3b82f6",
    description: "Your cadence of daily foundational body care.",
  },
  bodyCareRecency: {
    title: "Body Care Recency",
    unit: "days",
    color: "#14b8a6",
    description: "Measures the time elapsed since deep care routines like exfoliation, hammam, or intensive moisturization.",
  },
  goalAlignment: {
    title: "Goal Alignment",
    unit: "%",
    color: "#22c55e",
    description: "How closely your recent habits match the primary look/aesthetic goals you have set in your planner.",
  },
  disciplineDrift: {
    title: "Discipline Drift",
    unit: "pts",
    color: "#f97316",
    description: "Identifies patterns where late-day fatigue causes you to skip evening routines.",
  },
  glowUpMomentum: {
    title: "Glow-up Momentum",
    unit: "",
    color: "#f59e0b",
    description: "An AI-evaluated trend status summarizing your current trajectory across all care metrics.",
  },
  plannerFollowThrough: {
    title: "Planner Follow-Through",
    unit: "%",
    color: "#8b5cf6",
    description: "The percentage of time blocks dedicated to self-care in your planner that were actually executed.",
  },
  customHabitStreak: {
    title: "Custom Habit Streak",
    unit: "days",
    color: "#10b981",
    description: "Your longest running uninterrupted streak for custom added daily care habits.",
  },
};

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

export default function HygieneDrilldown() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const [, navigate] = useLocation();
  const [range, setRange] = useState(30);

  // If the metric key is not found in the config (e.g. it's a dynamic routine ID), we synthesize a config
  const config = METRIC_CONFIG[metricKey || ""] || {
    title: metricKey?.replace(/([A-Z])/g, " $1").trim().replace(/^./, (str) => str.toUpperCase()) || "Care Routine",
    unit: "%",
    color: "#8b5cf6",
    description: "Detailed tracking, historical analysis, and adherence for this specific care routine.",
  };

  // Generate generic trend data
  const chartData = useMemo(() => {
    return Array.from({ length: range }, (_, i) => {
      const date = subDays(new Date(), range - 1 - i);
      return {
        date: format(date, "MMM d"),
        fullDate: format(date, "yyyy-MM-dd"),
        value: Math.floor(Math.random() * 40) + 50,
      };
    });
  }, [range]);

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
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl pb-24 animate-in fade-in duration-700">
      <div className="space-y-6">
        {/* Back + title */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-2 -ml-2 text-violet-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20"
            onClick={() => navigate("/body/looks")}
          >
            <ArrowLeft className="w-4 h-4" /> Hygiene & Looks
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: config.color }}>
              {config.title}
            </h1>
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
              style={{ backgroundColor: `${config.color}18`, color: config.color }}
            >
              <Sparkles className="w-3 h-3" /> Live Data
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-bold uppercase tracking-widest text-[10px]">
            Historical Trends & Insights
          </p>
        </div>

        {/* Stats row */}
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
            </div>
          </CardContent>
        </Card>

        {/* Trend analysis */}
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

        {/* Insight + Definition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card style={{ backgroundColor: `${config.color}08`, borderColor: `${config.color}20` }}>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: config.color }}>Insight</h3>
              <p className="text-sm leading-relaxed italic font-medium text-muted-foreground">
                Log more care entries to receive personalized insights and AI momentum analysis for this metric.
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
