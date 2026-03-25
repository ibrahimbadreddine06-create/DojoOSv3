import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import { SectionHeader } from "../section-header";

interface TrendCardProps {
  label: string;
  value: number | string | null;
  unit?: string;
  color: string;
  metricKey: string;
  wearableRequired?: boolean;
  sparklineData?: number[];
}

function TrendCard({ label, value, unit, color, metricKey, wearableRequired, sparklineData }: TrendCardProps) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;
  const hasData = sparklineData && sparklineData.length > 0;
  const data = hasData ? sparklineData.map((v) => ({ v })) : [];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col border-border/60 rounded-2xl shadow-sm"
      onClick={() => navigate(`/body/rest/metric/${metricKey}`)}
    >
      <CardContent className="p-5 flex flex-col justify-between flex-1 min-h-[120px] gap-2">
        <div className="flex flex-col flex-1">
          <div className="flex items-start justify-between flex-wrap gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
            {wearableRequired && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 shrink-0 font-bold uppercase tracking-tighter">
                <Watch className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 flex-1">
            <span className="text-2xl font-black tabular-nums tracking-tight">{displayValue}</span>
            {displayValue !== "–" && unit && (
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">{unit}</span>
            )}
          </div>
        </div>
        <div className="h-8 mt-2">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
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

function TrendRow({
  label, value, unit, metricKey, wearableRequired,
}: { label: string; value: null; unit?: string; metricKey: string; wearableRequired?: boolean }) {
  const [, navigate] = useLocation();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-border/60 rounded-2xl shadow-sm"
      onClick={() => navigate(`/body/rest/metric/${metricKey}`)}
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-start gap-3 max-w-[70%]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
          {wearableRequired && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 shrink-0 font-bold uppercase tracking-tighter">
              <Watch className="w-2.5 h-2.5" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-black tabular-nums tracking-tight">
            {value !== null && value !== undefined ? `${value}${unit ? ` ${unit}` : ""}` : "–"}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

interface RestTrendsProps {
  restScore?: number | null;
  sleepDuration?: number | null;
}

export function RestTrends({ restScore = null, sleepDuration = null }: RestTrendsProps) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Performance Trends" kicker="Sleep Tracking" />

      {/* ── Sleep Trends ── */}
      <div>
        <SectionHeader title="Sleep Trends" className="mb-2.5" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <TrendCard label="Rest Score" value={restScore} unit="pts" color="#6366f1" metricKey="restScore" />
          <TrendCard label="Sleep Duration" value={sleepDuration} unit="h" color="#818cf8" metricKey="sleepDuration" />
          <TrendCard label="REM" value={null} unit="h" color="#a78bfa" metricKey="rem" wearableRequired />
          <TrendCard label="Deep Sleep" value={null} unit="h" color="#6366f1" metricKey="deepSleep" wearableRequired />
        </div>
        <div className="space-y-2">
          <TrendRow label="Efficiency" value={null} unit="%" metricKey="sleepEfficiency" />
          <TrendRow label="Sleep latency" value={null} unit="min" metricKey="sleepLatency" wearableRequired />
        </div>
      </div>

      {/* ── Rhythm Trends ── */}
      <div>
        <SectionHeader title="Rhythm Trends" className="mb-2.5" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <TrendCard label="Bedtime Consistency" value={null} unit="%" color="#f59e0b" metricKey="bedtimeConsistency" />
          <TrendCard label="Wake Consistency" value={null} unit="%" color="#f59e0b" metricKey="wakeConsistency" />
        </div>
        <div className="space-y-2">
          <TrendRow label="Sleep Debt" value={null} unit="h" metricKey="sleepDebt" />
          <TrendRow label="Sleep Bank" value={null} unit="h" metricKey="sleepBank" />
        </div>
      </div>

      {/* ── Physiology Trends ── */}
      <div>
        <SectionHeader title="Physiology Trends" className="mb-2.5" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <TrendCard label="Overnight HR" value={null} unit="bpm" color="#ef4444" metricKey="overnightHR" wearableRequired />
          <TrendCard label="Overnight HRV" value={null} unit="ms" color="#14b8a6" metricKey="overnightHRV" wearableRequired />
        </div>
        <div className="space-y-2">
          <TrendRow label="Respiratory rate" value={null} unit="rpm" metricKey="respiratoryRate" wearableRequired />
          <TrendRow label="Temperature deviation" value={null} unit="°C" metricKey="tempDeviation" wearableRequired />
          <TrendRow label="SpO₂" value={null} unit="%" metricKey="spO2" wearableRequired />
        </div>
      </div>
    </div>
  );
}
