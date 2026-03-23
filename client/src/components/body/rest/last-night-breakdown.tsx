import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Watch } from "lucide-react";
import { useLocation } from "wouter";
import { SectionLabel } from "./section-label";

interface BreakdownMetric {
  label: string;
  value: number | string | null;
  unit?: string;
  color?: string;
  metricKey: string;
  wearableRequired?: boolean;
}

function BreakdownTile({
  label, value, unit, color, metricKey, wearableRequired = false,
}: BreakdownMetric) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;
  const showWearable = wearableRequired && displayValue === "–";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/body/rest/metric/${metricKey}`)}
    >
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
          {showWearable && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5">
              <Watch className="w-2 h-2" />
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold tabular-nums"
            style={color && displayValue !== "–" ? { color } : undefined}
          >
            {displayValue}
          </span>
          {displayValue !== "–" && unit && (
            <span className="text-[10px] text-muted-foreground">{unit}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LastNightBreakdownProps {
  timeInBed?: number | null;        // hours
  efficiency?: number | null;        // %
  latency?: number | null;           // minutes
  rem?: number | null;               // hours
  deepSleep?: number | null;         // hours
  awake?: number | null;             // minutes
  bedtime?: string | null;           // "23:14"
  wakeTime?: string | null;          // "07:02"
  napTotal?: number | null;          // minutes
}

export function LastNightBreakdown({
  timeInBed = null,
  efficiency = null,
  latency = null,
  rem = null,
  deepSleep = null,
  awake = null,
  bedtime = null,
  wakeTime = null,
  napTotal = null,
}: LastNightBreakdownProps) {
  const metrics: BreakdownMetric[] = [
    { label: "Time in bed", value: timeInBed, unit: "h", metricKey: "timeInBed", color: "#6366f1" },
    {
      label: "Efficiency",
      value: efficiency,
      unit: "%",
      metricKey: "sleepEfficiency",
      color: efficiency === null ? undefined : efficiency >= 85 ? "#22c55e" : efficiency >= 70 ? "#eab308" : "#ef4444",
    },
    { label: "Sleep latency", value: latency, unit: "min", metricKey: "sleepLatency", wearableRequired: true },
    { label: "REM", value: rem, unit: "h", metricKey: "rem", color: "#818cf8", wearableRequired: true },
    { label: "Deep sleep", value: deepSleep, unit: "h", metricKey: "deepSleep", color: "#6366f1", wearableRequired: true },
    {
      label: "Awake / disrupted",
      value: awake,
      unit: "min",
      metricKey: "awakeTime",
      color: awake === null ? undefined : awake < 20 ? "#22c55e" : "#ef4444",
      wearableRequired: true,
    },
    { label: "Bedtime", value: bedtime, metricKey: "bedtime" },
    { label: "Wake time", value: wakeTime, metricKey: "wakeTime" },
    { label: "Nap total", value: napTotal, unit: "min", metricKey: "napTotal" },
  ];

  return (
    <div>
      <SectionLabel>Last night breakdown</SectionLabel>
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <BreakdownTile key={m.metricKey} {...m} />
        ))}
      </div>
    </div>
  );
}
