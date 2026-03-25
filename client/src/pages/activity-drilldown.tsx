import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

const METRIC_CONFIG: Record<string, {
  title: string;
  unit: string;
  color: string;
  description: string;
  wearableRequired?: boolean;
}> = {
  effortScore: {
    title: "Effort Score",
    unit: "pts",
    color: "#f59e0b",
    description: "A composite score (0–100) based on your workout volume, intensity, and duration. Higher scores indicate more demanding training sessions.",
  },
  energyBurned: {
    title: "Energy Burned",
    unit: "kcal",
    color: "hsl(0, 84.2%, 60.2%)",
    description: "Total calories burned today from your basal metabolic rate plus any physical activity. Tracked via workout logs and wearable data when available.",
  },
  recovery: {
    title: "Recovery Score",
    unit: "%",
    color: "#14b8a6",
    description: "A 0–100 score measuring how recovered your body is, based on heart rate variability (HRV) and resting heart rate. Requires a wearable device.",
    wearableRequired: true,
  },
  activeTime: {
    title: "Active Time",
    unit: "min",
    color: "hsl(0, 84.2%, 60.2%)",
    description: "Total minutes spent exercising or performing physical activity today.",
  },
  steps: {
    title: "Steps",
    unit: "steps",
    color: "#6b7280",
    description: "Total step count for the day, tracked via your phone's motion sensors or a connected wearable.",
    wearableRequired: true,
  },
  distance: {
    title: "Distance",
    unit: "km",
    color: "#3b82f6",
    description: "Total distance covered today from walking, running, cycling, or other GPS-tracked activities.",
    wearableRequired: true,
  },
  avgHR: {
    title: "Average Heart Rate",
    unit: "bpm",
    color: "#ef4444",
    description: "Your average heart rate across all activity today. Also known as 'FC en journée' — a key indicator of cardiovascular load.",
    wearableRequired: true,
  },
  weeklyEffort: {
    title: "Weekly Effort vs Target",
    unit: "%",
    color: "hsl(0, 84.2%, 60.2%)",
    description: "How your total weekly training effort compares to your personal target. 100% means you hit your goal.",
  },
  cardioLoad: {
    title: "Cardio Load",
    unit: "pts",
    color: "#14b8a6",
    description: "A measure of cardiovascular stress from your activities, based on heart rate data and exercise duration.",
    wearableRequired: true,
  },
  exerciseDuration: {
    title: "Exercise Duration",
    unit: "min",
    color: "hsl(0, 84.2%, 60.2%)",
    description: "Total time spent exercising per day, including warm-up and cool-down periods.",
  },
  rfc: {
    title: "Cardiac Recovery Speed (RFC)",
    unit: "bpm/min",
    color: "#14b8a6",
    description: "How quickly your heart rate drops after exercise. A faster recovery indicates better cardiovascular fitness.",
    wearableRequired: true,
  },
  strengthVolume: {
    title: "Strength Volume",
    unit: "kg",
    color: "#f59e0b",
    description: "Total weekly training volume calculated as sets × reps × weight for all strength exercises.",
  },
};

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

export default function ActivityDrilldown() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const [, navigate] = useLocation();
  const [range, setRange] = useState(30);

  const config = METRIC_CONFIG[metricKey || ""] || {
    title: metricKey || "Metric",
    unit: "",
    color: "#6b7280",
    description: "",
  };

  const { data: trends = [], isLoading } = useQuery<{ date: string; value: number }[]>({
    queryKey: ["/api/activity/trends", metricKey, range],
    queryFn: async () => {
      const res = await fetch(`/api/activity/trends?metric=${metricKey}&days=${range}`);
      if (!res.ok) throw new Error("Failed to fetch trends");
      return res.json();
    },
    enabled: !!metricKey,
  });

  const chartData = useMemo(() => {
    return trends.map(t => ({
      date: format(new Date(t.date), "MMM d"),
      fullDate: t.date,
      value: t.value
    }));
  }, [trends]);

  const currentMetricValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData[chartData.length - 1].value;
  }, [chartData]);

  const chartConfig = {
    value: { label: config.title, color: config.color },
  };

  // Trend analysis table data
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
            onClick={() => navigate("/body/activity")}
          >
            <ArrowLeft className="w-4 h-4" /> Activity
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Current: <strong>{isLoading ? "..." : (config.wearableRequired && currentMetricValue === 0) ? "–" : `${currentMetricValue}`}</strong> {config.unit}
          </p>
        </div>

        {/* Chart */}
        <Card>
          <CardContent className="p-4">
            {config.wearableRequired ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Connect a wearable in Settings → Integrations to see this data.
              </div>
            ) : (
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
            )}

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

        {/* Trend Analysis */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Trend Analysis</h3>
            <div className="space-y-0">
              {useMemo(() => {
                const calculateAvg = (days: number) => {
                  const sliced = trends.slice(-days);
                  if (sliced.length === 0) return 0;
                  const sum = sliced.reduce((acc, curr) => acc + curr.value, 0);
                  return Math.round(sum / sliced.length);
                };
                return [
                  { label: "Last 3 days", days: 3 },
                  { label: "Last 7 days", days: 7 },
                  { label: "Last 14 days", days: 14 },
                  { label: "Last 30 days", days: 30 },
                ].map((period) => {
                  const avg = calculateAvg(period.days);
                  return (
                    <div key={period.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{period.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm tabular-nums font-medium">
                          {isLoading ? "..." : (config.wearableRequired && avg === 0) ? "–" : `${avg}`} {config.unit}
                        </span>
                      </div>
                    </div>
                  );
                });
              }, [trends, isLoading, config.wearableRequired, config.unit])}
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
