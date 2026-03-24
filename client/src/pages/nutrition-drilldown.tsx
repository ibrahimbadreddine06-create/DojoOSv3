import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { useTheme } from "@/contexts/theme-context";
import { useQuery } from "@tanstack/react-query";

const METRIC_CONFIG: Record<string, {
  title: string;
  unit: string;
  color: string;
  description: string;
}> = {
  calories: {
    title: "Daily Calories",
    unit: "kcal",
    color: "#a855f7", // Purple
    description: "Total caloric intake tracked throughout the day. Consistent tracking helps in managing energy balance and body composition goals.",
  },
  protein: {
    title: "Protein Intake",
    unit: "g",
    color: "#3b82f6", // Blue
    description: "Essential for muscle repair and growth. Your target is based on your body weight and activity level.",
  },
  carbs: {
    title: "Carbohydrates",
    unit: "g",
    color: "#f59e0b", // Amber
    description: "Your primary energy source. High-quality complex carbs are prioritized for sustained performance.",
  },
  fats: {
    title: "Healthy Fats",
    unit: "g",
    color: "#ec4899", // Pink
    description: "Crucial for hormone production and nutrient absorption. Focus on unsaturated sources like avocados and nuts.",
  },
  fiber: {
    title: "Dietary Fiber",
    unit: "g",
    color: "#10b981", // Emerald
    description: "Important for digestive health and blood sugar regulation. A high-fiber diet promotes satiety.",
  },
  water: {
    title: "Hydration",
    unit: "ml",
    color: "#0ea5e9", // Sky
    description: "Crucial for every metabolic process. Aim for consistent intake throughout the day.",
  },
  score: {
    title: "Nutrition Score",
    unit: "pts",
    color: "#8b5cf6", // Violet
    description: "A composite 0–100 score based on how well your actual intake aligns with your nutritional goals and food quality targets.",
  },
  balance: {
    title: "Energy Balance",
    unit: "kcal",
    color: "#f43f5e", // Rose
    description: "The difference between calories consumed and calories burned. Maintaining a slight deficit is key for weight loss, while a surplus supports muscle gain.",
  },
  fuel: {
    title: "Fuel Quality",
    unit: "%",
    color: "#06b6d4", // Cyan
    description: "An assessment of your food choices based on nutrient density and processing levels. High coverage of nourishing categories improves long-term health.",
  },
  // Micronutrients
  vitaminD: { title: "Vitamin D", unit: "mcg", color: "#fbbf24", description: "Essential for bone health and immune function." },
  vitaminC: { title: "Vitamin C", unit: "mg", color: "#f97316", description: "A powerful antioxidant that supports skin health and immunity." },
  vitaminB12: { title: "Vitamin B12", unit: "mcg", color: "#ec4899", description: "Crucial for nerve function and red blood cell production." },
  magnesium: { title: "Magnesium", unit: "mg", color: "#8b5cf6", description: "Involved in over 300 biochemical reactions in the body." },
  zinc: { title: "Zinc", unit: "mg", color: "#6366f1", description: "Supports immune function and metabolism." },
  iron: { title: "Iron", unit: "mg", color: "#ef4444", description: "Necessary for oxygen transport in the blood." },
  omega3: { title: "Omega-3", unit: "g", color: "#06b6d4", description: "Essential fatty acids for heart and brain health." },
  calcium: { title: "Calcium", unit: "mg", color: "#94a3b8", description: "Vital for strong bones and teeth." },
  potassium: { title: "Potassium", unit: "mg", color: "#14b8a6", description: "Helps maintain fluid balance and nerve signals." },
};

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
];

export default function NutritionDrilldown() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const [, navigate] = useLocation();
  const [range, setRange] = useState(7);
  const { getModuleTheme } = useTheme();
  const theme = getModuleTheme("nutrition");

  const config = METRIC_CONFIG[metricKey || ""] || {
    title: metricKey || "Metric",
    unit: "",
    color: theme.color || "#8b5cf6",
    description: "Detailed tracking and historical analysis for this nutritional metric.",
  };

  const { data: trends, isLoading } = useQuery<{ date: string; value: number }[]>({
    queryKey: ["/api/nutrition/trends", metricKey, range],
    queryFn: async () => {
      const res = await fetch(`/api/nutrition/trends?metric=${metricKey}&days=${range}`);
      if (!res.ok) throw new Error("Failed to fetch trends");
      return res.json();
    },
    enabled: !!metricKey,
  });

  const chartData = useMemo(() => {
    if (!trends) return [];
    return trends.map(t => ({
      date: format(parseISO(t.date), "MMM d"),
      fullDate: t.date,
      value: t.value,
    }));
  }, [trends]);

  const stats = useMemo(() => {
    if (!trends || trends.length === 0) return { avg: 0, max: 0, min: 0 };
    const values = trends.map(t => t.value);
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      max: Math.round(Math.max(...values)),
      min: Math.round(Math.min(...values)),
    };
  }, [trends]);

  const chartConfig = {
    value: { label: config.title, color: config.color },
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="space-y-6">
        {/* Back button + title */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-2 -ml-2"
            onClick={() => navigate("/body/nutrition")}
          >
            <ArrowLeft className="w-4 h-4" /> Nutrition
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Current: <strong>{stats.avg > 0 ? stats.avg : "—"}</strong> {config.unit}
          </p>
        </div>

        {/* Chart */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30" />
              </div>
            ) : chartData.length > 0 ? (
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
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No data logged for this period.
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

        {/* Trend analysis table */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Trend Analysis</h3>
            <div className="space-y-0">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Period Average</span>
                <span className="text-sm tabular-nums font-medium">
                  {stats.avg > 0 ? stats.avg : "—"} {config.unit}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Highest Logged</span>
                <span className="text-sm tabular-nums font-medium">
                  {stats.max > 0 ? stats.max : "—"} {config.unit}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Lowest Logged</span>
                <span className="text-sm tabular-nums font-medium">
                  {stats.min > 0 ? stats.min : "—"} {config.unit}
                </span>
              </div>
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
