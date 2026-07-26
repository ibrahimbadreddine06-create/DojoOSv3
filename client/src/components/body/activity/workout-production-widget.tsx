import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TbBarbell, TbChevronRight, TbPlus } from "react-icons/tb";
import { AddWorkoutDialog } from "@/components/dialogs/add-workout-dialog";
import { bodyLocalDateKey, EWidgetCard } from "@/components/body/e-widget-card";
import {
  defineWidget,
  type WidgetSize,
} from "@/components/body/module-grid";

type Workout = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  completed: boolean;
  exercises?: Array<{ id: string }>;
};

const sizes = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
] as const;

function WorkoutProductionCard({
  size,
  accentColor,
  variant,
}: {
  size: WidgetSize;
  accentColor?: string;
  variant: "session-map" | "workout-control";
}) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const endpoint = `/api/workouts/${bodyLocalDateKey()}`;
  const query = useQuery<Workout[]>({ queryKey: [endpoint] });
  const workouts = query.data ?? [];
  const active = workouts.find(
    (workout) => Boolean(workout.startTime) && !workout.completed,
  );
  const ready = workouts.find(
    (workout) => !workout.startTime && !workout.completed,
  );
  const completed = workouts.filter((workout) => workout.completed);
  const primary = active ?? ready ?? completed.at(-1);
  const state = active
    ? "In progress"
    : ready
      ? "Ready"
      : primary
        ? "Completed"
        : "No workout yet";
  const exerciseCount = primary?.exercises?.length ?? 0;

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
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">
              Workout
            </h3>
            <p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">
              Today
            </p>
          </div>
          <TbBarbell className="h-6 w-6 text-[var(--widget-accent)]" />
        </header>

        <div className="flex min-h-0 flex-col justify-center overflow-visible">
          {query.isPending ? (
            <>
              <span className="h-8 w-32 animate-pulse rounded-md bg-[#eef0f3]" />
              <span className="mt-3 h-3 w-16 animate-pulse rounded bg-[#f1f3f5]" />
            </>
          ) : query.isError ? (
            <>
              <strong className="text-[20px] leading-none tracking-[-.03em]">
                Workout unavailable
              </strong>
              <span className="mt-2 text-[11px] text-[#747d89]">
                Your records could not be loaded.
              </span>
            </>
          ) : primary && variant === "session-map" ? (
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--widget-accent)]">
                    {state}
                  </span>
                  <strong className="mt-1 block truncate text-[20px] font-semibold leading-none tracking-[-.035em]">
                    {primary.title}
                  </strong>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-[#747d89]">
                  {exerciseCount} exercises
                </span>
              </div>
              <div
                className="flex min-h-0 items-stretch gap-2"
                aria-label={`${exerciseCount} exercises in ${primary.title}`}
              >
                {Array.from({ length: Math.max(1, exerciseCount) }).map((_, index) => (
                  <i
                    key={index}
                    className="min-w-[7px] flex-1 rounded-[8px] bg-[var(--widget-accent)]"
                    style={{
                      opacity: exerciseCount
                        ? 0.32 + (index / Math.max(1, exerciseCount - 1)) * 0.58
                        : 0.12,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : primary ? (
            <>
              <span className="mb-2 w-fit rounded-full bg-[var(--widget-soft)] px-2 py-1 text-[10px] font-semibold leading-none text-[var(--widget-accent)]">
                {state}
              </span>
              <strong className="max-w-[16ch] text-[26px] font-semibold leading-[1.02] tracking-[-.04em]">
                {primary.title}
              </strong>
              <span className="mt-2 text-[11px] text-[#747d89]">
                {primary.exercises?.length ?? 0} exercises
              </span>
            </>
          ) : (
            <>
              <strong className="text-[22px] font-semibold leading-none tracking-[-.035em]">
                Build today’s workout
              </strong>
              <span className="mt-2 max-w-[23ch] text-[11px] leading-[1.35] text-[#747d89]">
                Create the workout first, then execute that same record.
              </span>
            </>
          )}
        </div>

        <div className="flex h-full items-end justify-between gap-3">
          <span className="text-[11px] leading-none text-[#747d89]">
            {completed.length} completed
          </span>
          {primary && !primary.completed ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/body/activity/active/${primary.id}`);
              }}
              className="flex items-center gap-1 rounded-full bg-[var(--widget-accent)] px-2.5 py-1.5 text-[10px] font-semibold leading-none text-white"
            >
              {active ? "Continue" : "Start"}
              <TbChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <AddWorkoutDialog
              onCreated={() =>
                queryClient.invalidateQueries({ queryKey: [endpoint] })
              }
              trigger={
                <button
                  type="button"
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center gap-1 rounded-full bg-[var(--widget-accent)] px-2.5 py-1.5 text-[10px] font-semibold leading-none text-white"
                >
                  <TbPlus className="h-3.5 w-3.5" />
                  New
                </button>
              }
            />
          )}
        </div>
      </div>
    </EWidgetCard>
  );
}

export const productionWorkoutWidget = defineWidget({
  id: "activity.workout",
  legacyIds: ["activity-next-workout"],
  label: "Workout",
  icon: TbBarbell,
  defaultW: 1,
  defaultH: 1,
  defaultAccentColor: "#7c3aed",
  visualizations: [
    {
      id: "session-map",
      label: "Session map",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
    {
      id: "workout-control",
      label: "Workout control",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
  ],
  render: ({ visualizationId, size, accentColor }) => (
    <WorkoutProductionCard
      size={size}
      accentColor={accentColor}
      variant={visualizationId === "workout-control" ? "workout-control" : "session-map"}
    />
  ),
});
