import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { SectionLabel } from "./section-label";
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
      <CardContent className="p-4 flex flex-col justify-between flex-1 min-h-[120px]">
        <div className="flex flex-col flex-1">
          <div className="flex items-start justify-between flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
            {showWearableBadge && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 shrink-0">
                <Watch className="w-2 h-2" />
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 flex-1">
            <span className="text-xl font-bold tabular-nums leading-none">{displayValue}</span>
            {displayValue !== "–" && unit && (
              <span className="text-[10px] text-muted-foreground leading-none">{unit}</span>
            )}
          </div>
          {trend && displayValue !== "–" && (
            <div className={`flex items-center gap-0.5 text-[10px] mt-1 ${
              trend.direction === "up" ? "text-green-500" : trend.direction === "down" ? "text-red-500" : "text-muted-foreground"
            }`}>
              {trend.direction === "up" ? <ArrowUp className="w-2.5 h-2.5" /> : trend.direction === "down" ? <ArrowDown className="w-2.5 h-2.5" /> : null}
              {trend.percent > 0 ? `${trend.direction === "up" ? "↑" : "↓"} ${trend.percent}% vs last week` : "no change"}
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
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-start gap-2 max-w-[60%]">
          <span className="text-sm font-medium leading-tight">{label}</span>
          {showWearableBadge && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 shrink-0 mt-px">
              <Watch className="w-2 h-2" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums">
            {displayValue}{displayValue !== "–" && unit ? ` ${unit}` : ""}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
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
      <SectionLabel>Trends — tap any to see full graph</SectionLabel>

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
          color="hsl(0 84.2% 60.2%)"
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
          color="hsl(0 84.2% 60.2%)"
          metricKey="exerciseDuration"
        />
        <TrendRow
          label="FC en journée"
          value={avgHR ?? null}
          unit="bpm"
          color="#ef4444"
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
