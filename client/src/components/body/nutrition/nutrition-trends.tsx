import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { type IntakeLog } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { SectionLabel } from "../activity/section-label";

interface NutritionTrendsProps {
  intakeLogs: IntakeLog[];
}

const TOP_METRICS = [
  { label: "Nutrition Score", key: "score",     color: "#a855f7" },
  { label: "Calories",        key: "calories",  color: "#ef4444" },
  { label: "Protein",         key: "protein",   color: "#3b82f6" },
  { label: "Hydration",       key: "hydration", color: "#0ea5e9" },
];

const SECONDARY_METRICS = [
  { label: "Carbs",     key: "carbs",    color: "#f59e0b" },
  { label: "Fats",      key: "fats",     color: "#10b981" },
  { label: "Fiber",     key: "fiber",    color: "#14b8a6" },
  { label: "Vitamin D", key: "vitaminD", color: "#facc15" },
];

export function NutritionTrends({ intakeLogs }: NutritionTrendsProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline px-1">
        <SectionLabel className="mb-0">Trends</SectionLabel>
        <span className="text-[10px] text-muted-foreground/50 font-medium">7D Snapshot</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TOP_METRICS.map(m => (
          <TrendCard key={m.key} metric={m} />
        ))}
      </div>

      <div className="space-y-2">
        {SECONDARY_METRICS.map(m => (
          <TrendRow key={m.key} metric={m} />
        ))}
      </div>
    </div>
  );
}

function TrendCard({ metric }: { metric: any }) {
  const { data: trendData } = useQuery<{ date: string, value: number }[]>({
    queryKey: [`/api/nutrition/trends?metric=${metric.key}&days=7`],
  });

  const displayData = trendData || Array.from({ length: 7 }).map(() => ({ value: 0 }));
  const lastValue = displayData.length > 0 ? displayData[displayData.length - 1].value : 0;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3 hover:border-purple-500/30 transition-all cursor-pointer group">
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground/60">{metric.label}</p>
          <p className="text-2xl font-black tracking-tighter">
            {metric.key === 'score' ? Math.round(lastValue) : Math.round(lastValue).toLocaleString()}
          </p>
        </div>
        <div className="h-2 w-2 rounded-full mt-1" style={{ backgroundColor: metric.color }} />
      </div>

      <div className="h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={metric.color}
              strokeWidth={2.5}
              dot={false}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrendRow({ metric }: { metric: any }) {
  const { data: trendData } = useQuery<{ date: string, value: number }[]>({
    queryKey: [`/api/nutrition/trends?metric=${metric.key}&days=7`],
  });

  const displayData = trendData || Array.from({ length: 7 }).map(() => ({ value: 0 }));
  const lastValue = displayData.length > 0 ? displayData[displayData.length - 1].value : 0;

  return (
    <div className="bg-card border rounded-xl p-4 flex items-center justify-between hover:border-purple-500/30 transition-all cursor-pointer group">
      <div className="flex items-center gap-3 flex-1">
        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: metric.color }} />
        <div className="min-w-[90px]">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground/60">{metric.label}</p>
          <p className="text-sm font-black tracking-tight">{Math.round(lastValue)} {metric.key === 'vitaminD' ? 'mcg' : 'g'}</p>
        </div>
      </div>

      <div className="h-8 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={metric.color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all ml-3" />
    </div>
  );
}
