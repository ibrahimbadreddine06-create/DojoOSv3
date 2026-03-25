import { useLocation } from "wouter";
import { SectionHeader } from "../section-header";

interface TrendTileProps {
  label: string;
  value: string | number | null;
  metricKey: string;
}

function TrendTile({ label, value, metricKey }: TrendTileProps) {
  const [, navigate] = useLocation();
  const display = value === null || value === undefined ? "–" : String(value);

  return (
    <button
      className="text-left border border-border/60 rounded-2xl bg-card p-5 flex flex-col gap-2 hover:shadow-md transition-all cursor-pointer shadow-sm group min-h-[100px]"
      onClick={() => navigate(`/body/looks/metric/${metricKey}`)}
      data-testid={`trend-tile-${metricKey}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 leading-tight">{label}</p>
      <p className="text-2xl font-black tracking-tight tabular-nums leading-none mt-auto">{display}</p>
    </button>
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

  const bestStreak =
    routines.length > 0
      ? routines.reduce((m, r) => Math.max(m, r.bestStreak || 0), 0)
      : null;

  const dailyRatio =
    routines.length > 0
      ? `${routines.filter((r) => r.frequency === "daily").length} / day`
      : null;

  // Glow-up momentum direction
  const glowMomentum = (() => {
    if (routines.length === 0) return "–";
    const avgS = routines.reduce((a, r) => a + (r.streak || 0), 0) / routines.length;
    const avgB = routines.reduce((a, r) => a + (r.bestStreak || 0), 0) / routines.length;
    if (avgS >= avgB * 0.8 && avgS > 0) return "up";
    if (avgS < avgB * 0.4 && avgB > 0) return "dipping";
    return "steady";
  })();

  const tiles = [
    {
      label: "Skincare consistency",
      value: upkeepScore !== null ? `${upkeepScore}%` : "–",
      metricKey: "skincareConsistency",
    },
    {
      label: "Shower rhythm",
      value: dailyRatio,
      metricKey: "showerRhythm",
    },
    {
      label: "Body care recency",
      value: routines.length > 0
        ? (routines.some((r) => !r.lastCompletedDate) ? "slipping" : "tracked")
        : "–",
      metricKey: "bodyCareRecency",
    },
    {
      label: "Goal alignment",
      value: disciplineRate !== null ? `${disciplineRate}%` : "–",
      metricKey: "goalAlignment",
    },
    {
      label: "Discipline drift",
      value: disciplineRate !== null
        ? (disciplineRate < 40 ? "late-day drop" : disciplineRate < 70 ? "moderate" : "on track")
        : "–",
      metricKey: "disciplineDrift",
    },
    {
      label: "Glow-up momentum",
      value: glowMomentum,
      metricKey: "glowUpMomentum",
    },
    {
      label: "Planner follow-through",
      value: "–",
      metricKey: "plannerFollowThrough",
    },
    {
      label: "Custom habit streak",
      value: bestStreak !== null && bestStreak > 0 ? `${bestStreak}d` : "–",
      metricKey: "customHabitStreak",
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="Performance insights" kicker="Trends" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <TrendTile key={t.metricKey} label={t.label} value={t.value} metricKey={t.metricKey} />
        ))}
      </div>
    </div>
  );
}
