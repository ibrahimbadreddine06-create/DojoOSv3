import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { SectionHeader } from "../section-header";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";

interface TrendCardProps {
  label: string;
  value: number | string | null;
  unit?: string;
  color: string;
  trend?: { direction: "up" | "down" | "flat"; percent: number };
  sparklineData?: number[];
  metricKey: string;
  wearableRequired?: boolean;
  wearableConnected?: boolean;
}

function TrendCard({
  label, value, unit, color, trend, sparklineData, metricKey,
  wearableRequired, wearableConnected,
}: TrendCardProps) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;
  const showWearableBadge = wearableRequired && !wearableConnected;

  const hasData = sparklineData && sparklineData.length > 0;
  const data = hasData ? sparklineData.map((v) => ({ v })) : [];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
      onClick={() => navigate(`/body/activity/metric/${metricKey}`)}
    >
      <CardContent className="p-5 pt-5 sm:p-5 sm:pt-5 flex flex-col justify-between flex-1 min-h-[110px]">
        <div className="flex flex-col flex-1">
          <div className="flex items-start justify-between flex-wrap gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 leading-none">{label}</span>
            {showWearableBadge && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 shrink-0 font-bold uppercase tracking-tighter">
                <Watch className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-2 flex-1">
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight">{displayValue}</span>
            {displayValue !== "–" && unit && (
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none mb-0.5">{unit}</span>
            )}
          </div>
          {trend && displayValue !== "–" && (
            <div className={`flex items-center gap-0.5 text-[9px] mt-1 font-bold uppercase tracking-tight ${
              trend.direction === "up" ? "text-green-500/80" : trend.direction === "down" ? "text-red-500/80" : "text-muted-foreground/60"
            }`}>
              {trend.direction === "up" ? <ArrowUp className="w-2.5 h-2.5" /> : trend.direction === "down" ? <ArrowDown className="w-2.5 h-2.5" /> : null}
              {trend.percent}% vs last week
            </div>
          )}
        </div>
        <div className="h-8 mt-2">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center">
              <div className="w-full h-px bg-border" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendRowProps {
  label: string;
  value: number | string | null;
  unit?: string;
  color: string;
  metricKey: string;
  wearableRequired?: boolean;
  wearableConnected?: boolean;
  tooltip?: string;
}

function TrendRow({ label, value, unit, color, metricKey, wearableRequired, wearableConnected, tooltip }: TrendRowProps) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;
  const showWearableBadge = wearableRequired && !wearableConnected;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/body/activity/metric/${metricKey}`)}
    >
      <CardContent className="px-5 py-4 pt-4 sm:pt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <span className="text-sm font-semibold tracking-tight text-foreground/90">{label}</span>
          {showWearableBadge && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 shrink-0 opacity-60">
              <Watch className="w-2 h-2" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm tabular-nums font-bold text-muted-foreground">
            {displayValue}{displayValue !== "–" && unit ? ` ${unit}` : ""}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-foreground/40 transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendsSectionProps {
  effortScore?: number | null;
  energyBurned?: number | null;
  steps?: number | null;
  distance?: number | null;
  exerciseDuration?: number | null;
  avgHR?: number | null;
  strengthVolume?: number | null;
  wearableConnected?: boolean;
}

export function TrendsSection({
  effortScore, energyBurned, steps, distance,
  exerciseDuration, avgHR, strengthVolume,
  wearableConnected = false,
}: TrendsSectionProps) {
  return (
    <div>
      <SectionHeader title="Trends" kicker="Tap any to see full graph" />

      {/* Top 4 sparkline cards */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <TrendCard
          label="Effort score"
          value={effortScore ?? null}
          color="#f59e0b"
          metricKey="effortScore"
        />
        <TrendCard
          label="Energy burned"
          value={energyBurned ?? null}
          unit="kcal"
          color="#f59e0b"
          metricKey="energyBurned"
        />
        <TrendCard
          label="Steps / day"
          value={steps ?? null}
          color="#6b7280"
          metricKey="steps"
          wearableRequired
          wearableConnected={wearableConnected}
        />
        <TrendCard
          label="Distance / day"
          value={distance ?? null}
          unit="km"
          color="#3b82f6"
          metricKey="distance"
          wearableRequired
          wearableConnected={wearableConnected}
        />
      </div>

      {/* Remaining trends as rows */}
      <div className="space-y-2">
        <TrendRow
          label="Exercise duration"
          value={exerciseDuration ?? null}
          unit="min"
          color="#f59e0b"
          metricKey="exerciseDuration"
        />
        <TrendRow
          label="FC en journée"
          value={avgHR ?? null}
          unit="bpm"
          color="#f59e0b"
          metricKey="avgHR"
          wearableRequired
          wearableConnected={wearableConnected}
        />
        <TrendRow
          label="RFC — cardiac recovery speed"
          value={null}
          color="#14b8a6"
          metricKey="rfc"
          wearableRequired
          wearableConnected={wearableConnected}
          tooltip="Rate of cardiac recovery — how fast your heart rate drops after exercise"
        />
        <TrendRow
          label="Strength volume"
          value={strengthVolume ?? null}
          unit="kg"
          color="#f59e0b"
          metricKey="strengthVolume"
        />
      </div>
    </div>
  );
}
