import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Watch } from "lucide-react";
import { useLocation } from "wouter";
import { SectionHeader } from "../section-header";

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
      className="cursor-pointer hover:shadow-md transition-shadow border-border/60 rounded-2xl shadow-sm"
      onClick={() => navigate(`/body/rest/metric/${metricKey}`)}
    >
      <CardContent className="p-5 flex flex-col gap-2 min-h-[90px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
          {showWearable && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 font-bold uppercase tracking-tighter">
              <Watch className="w-2.5 h-2.5" />
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 mt-auto">
          <span
            className="text-2xl font-black tabular-nums tracking-tight"
            style={color && displayValue !== "–" ? { color } : undefined}
          >
            {displayValue}
          </span>
          {displayValue !== "–" && unit && (
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">{unit}</span>
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
      <SectionHeader title="Last Night Breakdown" kicker="Logs" />
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <BreakdownTile key={m.metricKey} {...m} />
        ))}
      </div>
    </div>
  );
}
