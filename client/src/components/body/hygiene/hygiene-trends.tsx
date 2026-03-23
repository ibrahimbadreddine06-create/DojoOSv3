import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";

interface TrendCardProps {
  label: string;
  value: number | string | null;
  unit?: string;
  color: string;
  metricKey: string;
  subtitle?: string;
  sparklineData?: number[];
}

function TrendCard({ label, value, unit, color, metricKey, subtitle, sparklineData }: TrendCardProps) {
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
      <CardContent className="p-5 space-y-3">
        {/* Label */}
        <span className="text-xs text-muted-foreground font-medium">{label}</span>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{displayValue}</span>
          {displayValue !== "–" && unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <span className="text-[10px] text-muted-foreground">{subtitle}</span>
        )}

        {/* Sparkline */}
        <div className="h-10">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
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
  const avgStreak =
    routines.length > 0
      ? Math.round(routines.reduce((s, r) => s + (r.streak || 0), 0) / routines.length)
      : null;

  const dailyCount = routines.filter((r) => r.frequency === "daily").length;
  const routineCoverage =
    routines.length > 0 ? Math.round((dailyCount / routines.length) * 100) : null;

  const completedTotal = routines.filter((r) => r.lastCompletedDate).length;
  const goalAlignment =
    routines.length > 0 ? Math.round((completedTotal / routines.length) * 100) : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Trends
        </p>
        <p className="text-xs text-muted-foreground">Tap any to see the full graph and history</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TrendCard
          label="Upkeep Score"
          value={upkeepScore}
          unit="pts"
          color="#8b5cf6"
          metricKey="upkeepScore"
          subtitle="weighted completion"
        />
        <TrendCard
          label="Discipline Rate"
          value={disciplineRate}
          unit="%"
          color="#a78bfa"
          metricKey="disciplineRate"
          subtitle="streak consistency"
        />
        <TrendCard
          label="Streak Momentum"
          value={avgStreak}
          unit="d avg"
          color="#6366f1"
          metricKey="streakMomentum"
          subtitle="across all routines"
        />
        <TrendCard
          label="Routine Coverage"
          value={routineCoverage}
          unit="%"
          color="#ec4899"
          metricKey="routineCoverage"
          subtitle="daily habits tracked"
        />
        <TrendCard
          label="Goal Alignment"
          value={goalAlignment}
          unit="%"
          color="#f59e0b"
          metricKey="goalAlignment"
          subtitle="routines ever logged"
        />
        <TrendCard
          label="Planner Follow-through"
          value={null}
          unit="%"
          color="#14b8a6"
          metricKey="plannerFollowThrough"
          subtitle="linked blocks executed"
        />
      </div>
    </div>
  );
}
