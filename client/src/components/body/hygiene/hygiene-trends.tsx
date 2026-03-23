import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import { SectionLabel } from "./section-label";

interface TrendCardProps {
  label: string;
  value: number | string | null;
  unit?: string;
  color: string;
  metricKey: string;
  sparklineData?: number[];
}

function TrendCard({ label, value, unit, color, metricKey, sparklineData }: TrendCardProps) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;
  const hasData = sparklineData && sparklineData.length > 0;
  const data = hasData ? sparklineData!.map((v) => ({ v })) : [];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/body/looks/metric/${metricKey}`)}
      data-testid={`trend-card-${metricKey}`}
    >
      <CardContent className="p-4 flex flex-col justify-between min-h-[120px]">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold tabular-nums">{displayValue}</span>
            {displayValue !== "–" && unit && (
              <span className="text-[10px] text-muted-foreground">{unit}</span>
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

interface HygieneTrendsProps {
  upkeepScore?: number | null;
  disciplineRate?: number | null;
  routines?: any[];
}

export function HygieneTrends({ upkeepScore = null, disciplineRate = null, routines = [] }: HygieneTrendsProps) {
  // Calculate streak momentum from routines
  const avgStreak =
    routines.length > 0
      ? Math.round(routines.reduce((s, r) => s + (r.streak || 0), 0) / routines.length)
      : null;

  const dailyCount = routines.filter((r) => r.frequency === "daily").length;
  const routineCoverage =
    routines.length > 0
      ? Math.round((dailyCount / routines.length) * 100)
      : null;

  return (
    <div className="space-y-4">
      <SectionLabel>Trends — tap any to see full graph</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <TrendCard
          label="Upkeep Score"
          value={upkeepScore}
          unit="pts"
          color="#8b5cf6"
          metricKey="upkeepScore"
        />
        <TrendCard
          label="Discipline Rate"
          value={disciplineRate}
          unit="%"
          color="#a78bfa"
          metricKey="disciplineRate"
        />
        <TrendCard
          label="Streak Momentum"
          value={avgStreak}
          unit="days"
          color="#6366f1"
          metricKey="streakMomentum"
        />
        <TrendCard
          label="Routine Coverage"
          value={routineCoverage}
          unit="%"
          color="#ec4899"
          metricKey="routineCoverage"
        />
        <TrendCard
          label="Skincare Consistency"
          value={null}
          unit="%"
          color="#f59e0b"
          metricKey="skincareConsistency"
        />
        <TrendCard
          label="Planner Follow-through"
          value={null}
          unit="%"
          color="#14b8a6"
          metricKey="plannerFollowThrough"
        />
      </div>
    </div>
  );
}
