import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TbBarbell } from "react-icons/tb";
import { EWidgetCard } from "@/components/body/e-widget-card";
import { defineWidget, type WidgetSize } from "@/components/body/module-grid";

type Exercise = { id: string; name: string };
type ProgressPoint = { date: string; maxWeight: number; totalVolume: number };
type StrengthVariant = "volume-history" | "load-focus";

const sizes = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
  { w: 3, h: 1 },
] as const;

function StrengthProgressCard({
  size,
  accentColor,
  variant,
}: {
  size: WidgetSize;
  accentColor?: string;
  variant: StrengthVariant;
}) {
  const exercises = useQuery<Exercise[]>({ queryKey: ["/api/exercise-library"] });
  const [exerciseId, setExerciseId] = useState("");
  useEffect(() => {
    if (!exerciseId && exercises.data?.[0]) setExerciseId(exercises.data[0].id);
  }, [exerciseId, exercises.data]);
  const progress = useQuery<ProgressPoint[]>({
    queryKey: [`/api/exercises/${exerciseId}/progress`],
    enabled: Boolean(exerciseId),
  });
  const selected = exercises.data?.find((item) => item.id === exerciseId);
  const points = progress.data ?? [];
  const latest = points.at(-1);
  const previous = points.at(-2);
  const visible = points.slice(size.w > 1 ? -12 : -6);
  const maxVolume = Math.max(1, ...visible.map((point) => point.totalVolume));
  const change =
    latest && previous ? latest.totalVolume - previous.totalVolume : null;
  const bars = useMemo(
    () =>
      visible.map((point) => ({
        ...point,
        height: Math.max(8, (point.totalVolume / maxVolume) * 100),
      })),
    [maxVolume, visible],
  );

  return (
    <EWidgetCard size={size} accentColor={accentColor}>
      <div
        className="grid h-full min-h-0 gap-[15px]"
        style={{
          gridTemplateRows:
            size.h > size.w
              ? "33px minmax(0,1fr) 54px"
              : "33px minmax(0,1fr) 33px",
        }}
      >
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">
              Strength Progress
            </h3>
            <p className="mt-1 truncate text-[11px] leading-[1.2] text-[#747d89]">
              {selected?.name ?? "Select an exercise"}
            </p>
          </div>
          <TbBarbell className="h-6 w-6 shrink-0 text-[var(--widget-accent)]" />
        </header>

        {variant === "volume-history" ? (
          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div
              className="flex h-full min-h-[48px] items-end gap-1.5"
              aria-label="Recorded exercise volume history"
            >
              {bars.length ? (
                bars.map((point) => (
                  <button
                    key={point.date}
                    type="button"
                    className="group relative min-w-0 flex-1 rounded-t-[5px] border-0 bg-[var(--widget-accent)] p-0 opacity-70 outline-none transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
                    style={{ height: `${point.height}%` }}
                    aria-label={`${point.date}: ${point.totalVolume.toLocaleString()} kilogram repetitions`}
                  >
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max -translate-x-1/2 rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus-visible:block"
                    >
                      {point.totalVolume.toLocaleString()} kg·reps
                    </span>
                  </button>
                ))
              ) : (
                <span className="self-center text-[11px] text-[#747d89]">
                  No completed set history.
                </span>
              )}
            </div>
            <div className="pb-0.5 text-right">
              <strong className="block text-[26px] font-semibold leading-none tracking-[-.045em] tabular-nums">
                {latest ? latest.maxWeight.toLocaleString() : "—"}
              </strong>
              <span className="mt-1 block text-[10px] text-[#747d89]">best load</span>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col justify-center">
            <strong className="text-[38px] font-semibold leading-none tracking-[-.06em] tabular-nums">
              {latest ? latest.maxWeight.toLocaleString() : "—"}
            </strong>
            <span className="mt-2 text-[11px] text-[#747d89]">best recorded load</span>
            {latest ? (
              <div className="mt-4 h-3 w-full overflow-hidden rounded-md bg-[var(--widget-soft)]">
                <i className="block h-full w-full rounded-md bg-[var(--widget-accent)]" />
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <select
            value={exerciseId}
            onChange={(event) => setExerciseId(event.target.value)}
            aria-label="Exercise for strength progress"
            className="min-w-0 max-w-[65%] truncate rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] outline-none focus:border-[var(--widget-accent)]"
          >
            {(exercises.data ?? []).map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] font-medium tabular-nums">
            {change === null
              ? "Need 2 sessions"
              : `${change >= 0 ? "+" : ""}${change.toLocaleString()} volume`}
          </span>
        </div>
      </div>
    </EWidgetCard>
  );
}

export const productionStrengthProgressWidget = defineWidget({
  id: "activity.strength_progress",
  label: "Strength Progress",
  icon: TbBarbell,
  defaultW: 1,
  defaultH: 1,
  defaultAccentColor: "#7c3aed",
  visualizations: [
    {
      id: "volume-history",
      label: "Volume history",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
    {
      id: "load-focus",
      label: "Load focus",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
  ],
  render: ({ visualizationId, size, accentColor }) => (
    <StrengthProgressCard
      size={size}
      accentColor={accentColor}
      variant={visualizationId === "load-focus" ? "load-focus" : "volume-history"}
    />
  ),
});
