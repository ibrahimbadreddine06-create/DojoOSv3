import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { type IntakeLog } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ChevronRight } from "lucide-react";
import { SectionHeader } from "../section-header";

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
  const allMetrics = [...TOP_METRICS, ...SECONDARY_METRICS].map(m => m.key);
  const metricsQueryString = allMetrics.join(",");

  const { data: batchData, isLoading } = useQuery<Record<string, { date: string, value: number }[]>>({
    queryKey: [`/api/nutrition/trends/batch?metrics=${metricsQueryString}&range=7d`],
  });

  if (isLoading) {
    return <div className="h-48 bg-card border rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline px-1">
        <SectionHeader title="Performance Trends" kicker="Analytics" className="mb-0" />
        <span className="text-[10px] text-muted-foreground/50 font-medium">7D Snapshot</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TOP_METRICS.map(m => (
          <TrendCard key={m.key} metric={m} data={batchData?.[m.key]} />
        ))}
      </div>

      <div className="space-y-2">
        {SECONDARY_METRICS.map(m => (
          <TrendRow key={m.key} metric={m} data={batchData?.[m.key]} />
        ))}
      </div>
    </div>
  );
}

function TrendCard({ metric, data }: { metric: any, data?: { date: string, value: number }[] }) {
  const displayData = data || Array.from({ length: 7 }).map(() => ({ value: 0 }));
  const lastValue = displayData.length > 0 ? displayData[displayData.length - 1].value : 0;

  return (
    <div className="bg-card border-border/60 rounded-2xl p-5 sm:p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group shadow-sm min-h-[110px]">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">{metric.label}</p>
          <p className="text-2xl font-black tracking-tight tabular-nums leading-none">
            {metric.key === 'score' ? Math.round(lastValue) : Math.round(lastValue).toLocaleString()}
          </p>
        </div>
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />
      </div>

      <div className="h-8 w-full mt-2">
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

function TrendRow({ metric, data }: { metric: any, data?: { date: string, value: number }[] }) {
  const displayData = data || Array.from({ length: 7 }).map(() => ({ value: 0 }));
  const lastValue = displayData.length > 0 ? displayData[displayData.length - 1].value : 0;

  return (
    <div className="bg-card border-border/60 rounded-2xl px-5 py-4 sm:py-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: metric.color }} />
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">{metric.label}</p>
          <p className="text-sm font-black tracking-tight tabular-nums leading-none">{Math.round(lastValue)} {metric.key === 'vitaminD' ? 'mcg' : 'g'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-6 w-16 opacity-60">
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
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-foreground/40 transition-colors ml-1" />
      </div>
    </div>
  );
}
