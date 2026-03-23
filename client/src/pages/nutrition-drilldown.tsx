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
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl pb-24">
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.color }}>{config.title}</h1>
            <div className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${theme.cssVar}15`, color: theme.color }}>
              Live Data
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-bold uppercase tracking-widest text-[10px]">
            Historical Trends & Insights
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
           <div className="bg-card border rounded-xl p-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Average</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tabular-nums">{stats.avg}</span>
                <span className="text-[10px] text-muted-foreground font-bold">{config.unit}</span>
              </div>
           </div>
           <div className="bg-card border rounded-xl p-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Range Max</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tabular-nums">{stats.max}</span>
                <span className="text-[10px] text-muted-foreground font-bold">{config.unit}</span>
              </div>
           </div>
           <div className="bg-card border rounded-xl p-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Range Min</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tabular-nums">{stats.min}</span>
                <span className="text-[10px] text-muted-foreground font-bold">{config.unit}</span>
              </div>
           </div>
        </div>

        <Card className="border-purple-100 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-2" style={{ color: theme.color }}>
                 <Info className="w-3 h-3" /> Trend Chart
               </h3>
               <div className="flex gap-1">
                {TIME_RANGES.map((tr) => (
                  <Button
                    key={tr.label}
                    size="sm"
                    variant={range === tr.days ? "default" : "outline"}
                    className={`text-[10px] h-7 px-3 font-black uppercase tracking-widest rounded-full transition-all ${range === tr.days ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 text-white" : "border-purple-100 text-purple-600 hover:bg-purple-50"}`}
                    style={range === tr.days ? { backgroundColor: theme.color } : { color: theme.color, borderColor: `${theme.cssVar}30` }}
                    onClick={() => setRange(tr.days)}
                  >
                    {tr.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="h-72 relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500/50" style={{ color: theme.color }} />
                  </div>
                ) : chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        dy={6}
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
                        dot={{ r: 3, fill: config.color, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed rounded-xl" style={{ borderColor: `${theme.cssVar}20` }}>
                    <p className="text-xs font-black uppercase tracking-widest">No data for this period</p>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-purple-100 shadow-sm transition-colors" style={{ backgroundColor: `${theme.cssVar}10`, borderColor: `${theme.cssVar}20` }}>
                <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-2" style={{ color: theme.color }}>Insight</h3>
                    <p className="text-sm text-purple-900/80 leading-relaxed italic font-medium">
                        {trends && trends.length > 0 ? (
                          `Based on your ${range}-day trend, your ${config.title.toLowerCase()} is ${stats.avg < stats.max * 0.7 ? 'slightly below optimal levels' : 'looking very consistent'}.`
                        ) : (
                          "Log more entries to receive personalized insights about this metric."
                        )}
                    </p>
                </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-sm" style={{ borderColor: `${theme.cssVar}20` }}>
                <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-2 font-black" style={{ color: theme.color }}>Definition & Importance</h3>
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
