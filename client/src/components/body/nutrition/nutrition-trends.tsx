import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { type IntakeLog } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

interface NutritionTrendsProps {
  intakeLogs: IntakeLog[];
}

const TREND_METRICS = [
  { label: "Nutrition Score", key: "score", color: "#a855f7" },
  { label: "Calories", key: "calories", color: "#ef4444" },
  { label: "Protein", key: "protein", color: "#3b82f6" },
  { label: "Carbs", key: "carbs", color: "#f59e0b" },
  { label: "Fats", key: "fats", color: "#10b981" },
  { label: "Hydration", key: "water", color: "#0ea5e9" },
];

export function NutritionTrends({ intakeLogs }: NutritionTrendsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline px-1">
        <h2 className="text-xl font-bold tracking-tight">Trends</h2>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">7D Snapshot</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {TREND_METRICS.map(m => (
           <TrendRow key={m.key} metric={m} />
         ))}
      </div>
    </div>
  );
}

function TrendRow({ metric }: { metric: typeof TREND_METRICS[0] }) {
  // Fetch actual trend data
  const { data: trendData } = useQuery<{ date: string, value: number }[]>({
    queryKey: ["/api/nutrition/trends", metric.key, "7d"],
  });

  const displayData = trendData || Array.from({ length: 7 }).map((_, i) => ({ value: Math.random() * 100 }));

  return (
    <div className="bg-card border rounded-xl p-4 flex items-center justify-between group hover:border-purple-500/30 transition-colors cursor-pointer">
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{metric.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight">
             {displayData[displayData.length - 1]?.value.toFixed(0)}
          </span>
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: metric.color }} />
        </div>
      </div>

      <div className="h-10 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={metric.color} 
              strokeWidth={2} 
              dot={false} 
              animationDuration={1500}
            />
            <YAxis hide domain={['dataMin', 'dataMax']} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
    </div>
  );
}
