import React, { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";
import { getModuleTheme } from "@/contexts/theme-context";

const METRIC_CONFIG: Record<string, {
  title: string;
  unit: string;
  color: string;
  description: string;
}> = {
  calories: {
    title: "Daily Calories",
    unit: "kcal",
    color: "#8b5cf6", // Lavender
    description: "Total caloric intake tracked throughout the day. Consistent tracking helps in managing energy balance and body composition goals.",
  },
  protein: {
    title: "Protein Intake",
    unit: "g",
    color: "#8b5cf6",
    description: "Essential for muscle repair and growth. Your target is based on your body weight and activity level.",
  },
  carbs: {
    title: "Carbohydrates",
    unit: "g",
    color: "#8b5cf6",
    description: "Your primary energy source. High-quality complex carbs are prioritized for sustained performance.",
  },
  fats: {
    title: "Healthy Fats",
    unit: "g",
    color: "#8b5cf6",
    description: "Crucial for hormone production and nutrient absorption. Focus on unsaturated sources like avocados and nuts.",
  },
  fiber: {
    title: "Dietary Fiber",
    unit: "g",
    color: "#8b5cf6",
    description: "Important for digestive health and blood sugar regulation. A high-fiber diet promotes satiety.",
  },
  water: {
    title: "Hydration",
    unit: "ml",
    color: "#3b82f6", // Blue for water
    description: "Crucial for every metabolic process. Aim for consistent intake throughout the day.",
  },
  score: {
    title: "Nutrition Score",
    unit: "pts",
    color: "#8b5cf6",
    description: "A composite 0–100 score based on how well your actual intake aligns with your nutritional goals and food quality targets.",
  },
};

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

export default function NutritionDrilldown() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const [, navigate] = useLocation();
  const [range, setRange] = useState(30);

  const config = METRIC_CONFIG[metricKey || ""] || {
    title: metricKey || "Metric",
    unit: "",
    color: "#8b5cf6",
    description: "",
  };

  // Generate placeholder chart data
  const chartData = useMemo(() => {
    return Array.from({ length: range }, (_, i) => {
      const date = subDays(new Date(), range - 1 - i);
      const baseValue = metricKey === 'water' ? 2000 : metricKey === 'calories' ? 2200 : 50;
      return {
        date: format(date, "MMM d"),
        fullDate: format(date, "yyyy-MM-dd"),
        value: Math.floor(Math.random() * (baseValue * 0.4)) + (baseValue * 0.8),
      };
    });
  }, [range, metricKey]);

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
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-2 -ml-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={() => navigate("/body/nutrition")}
          >
            <ArrowLeft className="w-4 h-4" /> Nutrition
          </Button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-bold uppercase tracking-widest text-[10px]">
            Historical Trends & Insights
          </p>
        </div>

        <Card className="border-purple-100 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="h-72">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      orientation="right"
                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={config.color}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>

            <div className="flex gap-1 mt-6 justify-center">
              {TIME_RANGES.map((tr) => (
                <Button
                  key={tr.label}
                  size="sm"
                  variant={range === tr.days ? "default" : "outline"}
                  className={`text-[10px] h-7 px-4 font-black uppercase tracking-widest rounded-full ${range === tr.days ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20" : "border-purple-100 text-purple-600 hover:bg-purple-50"}`}
                  onClick={() => setRange(tr.days)}
                >
                  {tr.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-purple-100 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-4">Trend Analysis</h3>
                    <div className="space-y-4">
                        {trendPeriods.map((period) => (
                        <div key={period.label} className="flex items-center justify-between py-2 border-b border-purple-50 last:border-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">{period.label}</span>
                            <div className="flex items-center gap-3">
                            <span className="text-sm tabular-nums font-black">
                                {Math.floor(Math.random() * 50 + 70)}% <span className="text-[10px] text-muted-foreground font-bold">Goal</span>
                            </span>
                            </div>
                        </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-sm bg-purple-50/30">
                <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-2">Insight</h3>
                    <p className="text-sm text-purple-900/80 leading-relaxed italic font-medium">
                        "Your {config.title.toLowerCase()} has been consistent over the last 7 days. Increasing fiber by 5g could improve your overall digestion score."
                    </p>
                </CardContent>
            </Card>
        </div>

        <Card className="border-purple-100 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-2">Metric Definition</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {config.description}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
