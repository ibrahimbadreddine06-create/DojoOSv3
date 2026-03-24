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
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="space-y-6">
        {/* Back button + title */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-2 -ml-2"
            onClick={() => navigate("/body/looks")}
          >
            <ArrowLeft className="w-4 h-4" /> Hygiene & Looks
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{config.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Current: <strong>{Math.floor(Math.random() * 40) + 50}</strong> {config.unit}
          </p>
        </div>

        {/* Chart */}
        <Card>
          <CardContent className="p-4">
            <div className="h-64">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={config.color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Time range selector */}
            <div className="flex gap-1 mt-3 justify-center">
              {TIME_RANGES.map((tr) => (
                <Button
                  key={tr.label}
                  size="sm"
                  variant={range === tr.days ? "default" : "outline"}
                  className="text-xs h-7 px-3"
                  onClick={() => setRange(tr.days)}
                >
                  {tr.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend analysis table */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Trend Analysis</h3>
            <div className="space-y-0">
              {trendPeriods.map((period) => (
                <div key={period.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{period.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums font-medium">
                      {Math.floor(Math.random() * 30 + 50)} {config.unit}
                    </span>
                    <span className="text-xs text-green-500">↑ {Math.floor(Math.random() * 15)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What this means */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2">What this means</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
