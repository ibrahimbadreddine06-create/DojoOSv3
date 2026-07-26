import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TbActivity, TbCalendarPlus, TbCheck, TbPlayerPlay } from "react-icons/tb";
import { bodyLocalDateKey, EWidgetCard } from "@/components/body/e-widget-card";
import {
  defineWidget,
  type WidgetSize,
} from "@/components/body/module-grid";
import { apiRequest } from "@/lib/queryClient";

type ActivityDefinition = {
  id: string;
  name: string;
  category: string | null;
};

type Subject = {
  id: string;
  entityId: string;
  titleSnapshot: string;
};

type Commitment = {
  id: string;
  subjectId: string;
  status: string;
  scheduleKind: "timed" | "day_bound";
  plannedStartAt: string | null;
};

type Execution = {
  id: string;
  subjectId: string;
  commitmentId: string | null;
  status: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
};

type ActivitySnapshot = {
  subjects: Subject[];
  commitments: Commitment[];
  executions: Execution[];
};

const sizes = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
] as const;

function elapsedLabel(start: string | null) {
  if (!start) return "In progress";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(start).getTime()) / 60_000),
  );
  if (minutes < 1) return "Started now";
  if (minutes < 60) return `${minutes} min active`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m active`;
}

function timeLabel(value: string | null) {
  if (!value) return "Any time";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Header({ title = "Activities" }: { title?: string } = {}) {
  return (
    <header className="flex min-h-0 items-start justify-between overflow-visible">
      <div>
        <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">
          {title}
        </h3>
        <p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">Today</p>
      </div>
      <TbActivity className="h-6 w-6 shrink-0 text-[var(--widget-accent)]" />
    </header>
  );
}

function ActivityCard({
  size,
  accentColor,
}: {
  size: WidgetSize;
  accentColor?: string;
}) {
  const date = bodyLocalDateKey();
  const queryClient = useQueryClient();
  const [selectedDefinitionId, setSelectedDefinitionId] = useState("");
  const snapshotQuery = useQuery<ActivitySnapshot>({
    queryKey: [`/api/body/operations?date=${date}&subjectType=activity`],
    refetchInterval: 30_000,
  });
  const definitionsQuery = useQuery<ActivityDefinition[]>({
    queryKey: ["/api/body/activity-definitions"],
  });

  const subjects = useMemo(
    () =>
      new Map(
        (snapshotQuery.data?.subjects ?? []).map((subject) => [
          subject.id,
          subject,
        ]),
      ),
    [snapshotQuery.data?.subjects],
  );
  const active = snapshotQuery.data?.executions.find(
    (execution) => execution.status === "in_progress",
  );
  const activeSubject = active ? subjects.get(active.subjectId) : undefined;
  const nextCommitment = [...(snapshotQuery.data?.commitments ?? [])]
    .filter((commitment) =>
      ["planned", "ready"].includes(commitment.status),
    )
    .sort((left, right) =>
      (left.plannedStartAt ?? "").localeCompare(right.plannedStartAt ?? ""),
    )[0];
  const nextSubject = nextCommitment
    ? subjects.get(nextCommitment.subjectId)
    : undefined;
  const completedCount = snapshotQuery.data?.executions.filter(
    (execution) => execution.status === "completed",
  ).length ?? 0;
  const selectedId =
    selectedDefinitionId || definitionsQuery.data?.[0]?.id || "";

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [`/api/body/operations?date=${date}&subjectType=activity`],
    });

  const startMutation = useMutation({
    mutationFn: async (planned?: {
      activityDefinitionId: string;
      commitmentId: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/body/activity-executions",
        planned ?? { activityDefinitionId: selectedId },
      );
      return response.json();
    },
    onSuccess: refresh,
  });
  const planMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/body/activity-plans", {
        activityDefinitionId: selectedId,
        scheduleKind: "day_bound",
        localDate: date,
      });
      return response.json();
    },
    onSuccess: refresh,
  });
  const completeMutation = useMutation({
    mutationFn: async (executionId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/body/activity-executions/${executionId}/complete`,
        {},
      );
      return response.json();
    },
    onSuccess: refresh,
  });

  const busy =
    startMutation.isPending ||
    planMutation.isPending ||
    completeMutation.isPending;
  const error =
    startMutation.error instanceof Error
      ? startMutation.error.message.replace(/^\d+:\s*/, "")
      : completeMutation.error instanceof Error
        ? completeMutation.error.message.replace(/^\d+:\s*/, "")
        : planMutation.error instanceof Error
          ? planMutation.error.message.replace(/^\d+:\s*/, "")
        : null;

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
        <Header />
        <div className="min-h-0 overflow-visible">
          {snapshotQuery.isPending || definitionsQuery.isPending ? (
            <div className="flex h-full flex-col justify-center">
              <span className="h-8 w-28 animate-pulse rounded-md bg-[#eef0f3]" />
              <span className="mt-3 h-3 w-20 animate-pulse rounded bg-[#f1f3f5]" />
            </div>
          ) : active && activeSubject ? (
            <div className="flex h-full min-h-0 flex-col justify-center">
              <span className="mb-2 w-fit rounded-full bg-[var(--widget-soft)] px-2 py-1 text-[10px] font-semibold leading-none text-[var(--widget-accent)]">
                Live
              </span>
              <strong className="max-w-[15ch] text-[26px] font-semibold leading-[1.02] tracking-[-.04em]">
                {activeSubject.titleSnapshot}
              </strong>
              <span className="mt-2 text-[11px] text-[#747d89]">
                {elapsedLabel(active.actualStartAt)}
              </span>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col justify-center">
              {nextSubject ? (
                <>
                  <span className="text-[11px] font-medium text-[var(--widget-accent)]">
                    Next · {timeLabel(nextCommitment?.plannedStartAt ?? null)}
                  </span>
                  <strong className="mt-2 max-w-[16ch] text-[24px] font-semibold leading-[1.04] tracking-[-.035em]">
                    {nextSubject.titleSnapshot}
                  </strong>
                </>
              ) : (
                <>
                  <strong className="text-[22px] font-semibold leading-none tracking-[-.035em]">
                    Ready when you are
                  </strong>
                  <span className="mt-2 max-w-[24ch] text-[11px] leading-[1.35] text-[#747d89]">
                    Start a spontaneous activity without inventing a plan.
                  </span>
                </>
              )}
              <div className="mt-4 flex items-center gap-2">
                <select
                  value={selectedId}
                  onChange={(event) =>
                    setSelectedDefinitionId(event.target.value)
                  }
                  aria-label="Activity"
                  className="min-w-0 flex-1 rounded-lg border border-[#e4e7eb] bg-white px-2.5 py-2 text-[11px] font-medium outline-none focus:border-[var(--widget-accent)]"
                >
                  {(definitionsQuery.data ?? []).map((definition) => (
                    <option key={definition.id} value={definition.id}>
                      {definition.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedId || busy}
                  onClick={(event) => {
                    event.stopPropagation();
                    planMutation.mutate();
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e4e7eb] bg-white text-[var(--widget-accent)] transition-transform hover:scale-105 disabled:opacity-45 motion-reduce:transition-none"
                  aria-label="Plan activity for today"
                >
                  <TbCalendarPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!selectedId || busy}
                  onClick={(event) => {
                    event.stopPropagation();
                    startMutation.mutate(undefined);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-[var(--widget-accent)] text-white transition-transform hover:scale-105 disabled:opacity-45 motion-reduce:transition-none"
                  aria-label="Start activity"
                >
                  <TbPlayerPlay className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex h-full items-end justify-between gap-3">
          {active ? (
            <>
              <span className="text-[11px] leading-none text-[#747d89]">
                Started {timeLabel(active.actualStartAt)}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  completeMutation.mutate(active.id);
                }}
                className="flex items-center gap-1 rounded-full bg-[var(--widget-accent)] px-2.5 py-1.5 text-[10px] font-semibold leading-none text-white disabled:opacity-45"
              >
                <TbCheck className="h-3.5 w-3.5" />
                Finish
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] leading-none text-[#747d89]">
                {error ?? `${completedCount} completed`}
              </span>
              {nextCommitment && nextSubject ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={(event) => {
                    event.stopPropagation();
                    startMutation.mutate({
                      activityDefinitionId: nextSubject.entityId,
                      commitmentId: nextCommitment.id,
                    });
                  }}
                  className="flex items-center gap-1 rounded-full bg-[var(--widget-accent)] px-2.5 py-1.5 text-[10px] font-semibold leading-none text-white disabled:opacity-45"
                >
                  <TbPlayerPlay className="h-3.5 w-3.5" />
                  Start plan
                </button>
              ) : (
                <span className="text-[11px] font-medium leading-none text-[#18202a]">
                  No plan required
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </EWidgetCard>
  );
}

function ActivityDayFlowCard({
  size,
  accentColor,
}: {
  size: WidgetSize;
  accentColor?: string;
}) {
  const date = bodyLocalDateKey();
  const query = useQuery<ActivitySnapshot>({
    queryKey: [`/api/body/operations?date=${date}&subjectType=activity`],
    refetchInterval: 30_000,
  });
  const commitments = query.data?.commitments ?? [];
  const executions = query.data?.executions ?? [];
  const completed = executions.filter((item) => item.status === "completed").length;
  const active = executions.some((item) => item.status === "in_progress");
  const plannedHours = commitments
    .map((item) => item.plannedStartAt ? new Date(item.plannedStartAt).getHours() : null)
    .filter((value): value is number => value !== null);
  const executedHours = executions
    .map((item) => item.actualStartAt ? new Date(item.actualStartAt).getHours() : null)
    .filter((value): value is number => value !== null);
  const hourState = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    planned: plannedHours.includes(hour),
    executed: executedHours.includes(hour),
  }));

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
        <Header />
        <div className="grid min-h-0 grid-cols-6 gap-2" aria-label="Activity timing across today">
          {hourState.map((slot) => (
            <i
              key={slot.hour}
              className="rounded-md"
              style={{
                background: slot.executed
                  ? "var(--widget-accent)"
                  : slot.planned
                    ? "var(--widget-soft)"
                    : "#f1f3f5",
                opacity: slot.executed ? 1 : slot.planned ? 0.82 : 0.7,
              }}
              title={`${String(slot.hour).padStart(2, "0")}:00${
                slot.executed ? " · recorded" : slot.planned ? " · planned" : ""
              }`}
            />
          ))}
        </div>
        <div className="flex h-full items-end justify-between gap-3 text-[11px] leading-none">
          <span className={active ? "font-medium text-[var(--widget-accent)]" : "text-[#747d89]"}>
            {active ? "Activity in progress" : `${commitments.length} planned`}
          </span>
          <span className="font-medium text-[#18202a]">{completed} completed</span>
        </div>
      </div>
    </EWidgetCard>
  );
}

export const productionActivitiesWidget = defineWidget({
  id: "activity.activities",
  label: "Activities",
  icon: TbActivity,
  defaultW: 1,
  defaultH: 1,
  defaultAccentColor: "#2563eb",
  visualizations: [
    {
      id: "day-flow",
      label: "Day flow",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
    {
      id: "today-control",
      label: "Today",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
  ],
  render: ({ visualizationId, size, accentColor }) =>
    visualizationId === "today-control" ? (
      <ActivityCard size={size} accentColor={accentColor} />
    ) : (
      <ActivityDayFlowCard size={size} accentColor={accentColor} />
    ),
});

function RecentActivitiesCard({ size, accentColor }: { size: WidgetSize; accentColor?: string }) {
  const date = bodyLocalDateKey();
  const query = useQuery<ActivitySnapshot>({ queryKey: [`/api/body/operations?date=${date}&subjectType=activity`] });
  const subjects = new Map((query.data?.subjects ?? []).map((item) => [item.id, item]));
  const recent = [...(query.data?.executions ?? [])]
    .filter((item) => ["completed", "cancelled"].includes(item.status))
    .sort((a, b) => (b.actualStartAt ?? "").localeCompare(a.actualStartAt ?? ""));
  return <EWidgetCard size={size} accentColor={accentColor}>
    <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}>
      <Header title="Recent Activities" />
      <div className="flex h-full flex-col justify-center gap-2">{recent.length ? recent.slice(0, size.h > 1 ? 6 : 3).map((item) => <div key={item.id} className="flex items-center justify-between text-[11px]"><span className="truncate font-medium">{subjects.get(item.subjectId)?.titleSnapshot ?? "Activity"}</span><span className="ml-2 text-[#747d89]">{timeLabel(item.actualStartAt)}</span></div>) : <span className="text-[12px] text-[#747d89]">No completed activities today.</span>}</div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{recent.length} records</span><span className="font-medium">Execution history</span></div>
    </div>
  </EWidgetCard>;
}

function RecentActivityRhythmCard({ size, accentColor }: { size: WidgetSize; accentColor?: string }) {
  const date = bodyLocalDateKey();
  const query = useQuery<ActivitySnapshot>({ queryKey: [`/api/body/operations?date=${date}&subjectType=activity`] });
  const recent = [...(query.data?.executions ?? [])]
    .filter((item) => item.status === "completed" && item.actualStartAt)
    .sort((a, b) => (a.actualStartAt ?? "").localeCompare(b.actualStartAt ?? ""));
  const bars = recent.slice(size.w > 1 || size.h > 1 ? -8 : -5).map((item) => {
    const start = item.actualStartAt ? Date.parse(item.actualStartAt) : Number.NaN;
    const end = item.actualEndAt ? Date.parse(item.actualEndAt) : Number.NaN;
    const duration = Number.isFinite(start) && Number.isFinite(end)
      ? Math.max(1, Math.round((end - start) / 60_000))
      : 1;
    return { ...item, duration };
  });
  const max = Math.max(1, ...bars.map((item) => item.duration));
  return <EWidgetCard size={size} accentColor={accentColor}>
    <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}>
      <Header title="Recent Activities" />
      <div className="flex min-h-0 items-end gap-2" aria-label="Recorded activity duration">
        {bars.length ? bars.map((item) => <button
          key={item.id}
          type="button"
          className="group relative min-w-[8px] flex-1 rounded-t-md border-0 bg-[var(--widget-accent)] p-0 opacity-70 outline-none transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
          style={{ height: `${Math.max(12, item.duration / max * 100)}%` }}
          aria-label={`${item.duration} recorded minutes`}
        ><span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max -translate-x-1/2 rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus-visible:block">{item.duration} min</span></button>) : <span className="self-center text-[12px] text-[#747d89]">No completed activities today.</span>}
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Today</span><span className="font-medium">{bars.length} recorded</span></div>
    </div>
  </EWidgetCard>;
}
export const productionRecentActivitiesWidget = defineWidget({
  id: "activity.recent_activities", label: "Recent Activities", icon: TbActivity, defaultW: 1, defaultH: 1, defaultAccentColor: "#0891b2",
  visualizations: [
    { id: "duration-rhythm", label: "Duration rhythm", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
    { id: "today-list", label: "Today list", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
  ],
  render: ({ visualizationId, size, accentColor }) =>
    visualizationId === "today-list"
      ? <RecentActivitiesCard size={size} accentColor={accentColor} />
      : <RecentActivityRhythmCard size={size} accentColor={accentColor} />,
});
