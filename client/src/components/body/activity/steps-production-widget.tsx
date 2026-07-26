import {
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { TbWalk } from "react-icons/tb";
import { EWidgetCard } from "@/components/body/e-widget-card";
import {
  defineWidget,
  type WidgetSize,
} from "@/components/body/module-grid";

type StepsContribution = {
  id: string;
  value: number | null;
  unit: string | null;
  observedAt: string | null;
  intervalStart: string | null;
  intervalEnd: string | null;
  localDate: string | null;
  timezone: string | null;
  providerId: string;
  sourceAppId: string | null;
  sourceDeviceId: string | null;
};

type StepsReadModel = {
  metricId: "activity.steps";
  specificationVersion?: string;
  disposition?: string;
  state:
    | "not_configured"
    | "awaiting_data"
    | "valid"
    | "partial"
    | "stale"
    | "unsupported"
    | "permission_lost"
    | "conflict"
    | "provider_delayed"
    | "error";
  value: number | null;
  unit: string | null;
  localDate: string | null;
  coverageRatio: number | null;
  freshUntil?: string | null;
  generatedAt: string | null;
  sourceNamespace: string | null;
  uncertainty: string[];
  contributions: StepsContribution[];
};

type StepsVariant = "recorded-total" | "recorded-pattern";

const sizes = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
] as const;

function formatDate(localDate: string | null) {
  if (!localDate) return "Today";
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  if (localDate === todayKey) return "Today";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${localDate}T12:00:00`));
}

function Header({ date }: { date: string | null }) {
  return (
    <header className="flex min-h-0 items-start justify-between overflow-visible">
      <div>
        <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">
          Steps
        </h3>
        <p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">
          {formatDate(date)}
        </p>
      </div>
      <TbWalk className="h-6 w-6 shrink-0 text-[var(--widget-accent)]" />
    </header>
  );
}

function StateMessage({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex h-full flex-col justify-center">
      <strong className="max-w-[17ch] text-[18px] leading-[1.08] tracking-[-.025em]">
        {title}
      </strong>
      <span className="mt-2 max-w-[25ch] text-[11px] leading-[1.35] text-[#747d89]">
        {detail}
      </span>
    </div>
  );
}

function MetricState({
  state,
  hasValue,
}: {
  state: StepsReadModel["state"];
  hasValue: boolean;
}) {
  if (hasValue) return null;

  const copy: Record<
    Exclude<StepsReadModel["state"], "valid" | "partial" | "stale">,
    { title: string; detail: string }
  > = {
    not_configured: {
      title: "Set up step tracking",
      detail: "Connect an eligible source or add a recorded total.",
    },
    awaiting_data: {
      title: "No steps received yet",
      detail: "Your first eligible step record will appear here.",
    },
    unsupported: {
      title: "Source not supported",
      detail: "This connection cannot provide step records.",
    },
    permission_lost: {
      title: "Permission required",
      detail: "Restore step access for this connection.",
    },
    conflict: {
      title: "Sources need review",
      detail: "Competing records cannot be combined safely.",
    },
    provider_delayed: {
      title: "Sync is delayed",
      detail: "Known history is safe; new records are still pending.",
    },
    error: {
      title: "Steps unavailable",
      detail: "The data service could not load this result.",
    },
  };

  const message =
    state === "valid" || state === "partial" || state === "stale"
      ? copy.error
      : copy[state];
  return <StateMessage {...message} />;
}

type PatternPoint = {
  id: string;
  value: number;
  label: string;
};

function safePattern(contributions: StepsContribution[]) {
  const points: PatternPoint[] = [];

  for (const item of contributions) {
    if (
      item.value === null ||
      item.value < 0 ||
      !item.intervalStart ||
      !item.intervalEnd
    ) {
      return [];
    }

    const start = Date.parse(item.intervalStart);
    const end = Date.parse(item.intervalEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return [];
    }

    // A contribution that spans more than one hour cannot be assigned to one
    // visual time bucket without inventing an intra-interval distribution.
    if (end - start > 60 * 60 * 1000) return [];

    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: item.timezone ?? undefined,
    });
    points.push({
      id: item.id,
      value: item.value,
      label: formatter.format(new Date(start)),
    });
  }

  return points.sort((left, right) => left.label.localeCompare(right.label));
}

function Pattern({ points }: { points: PatternPoint[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex h-full min-h-0 items-end gap-1.5">
      {points.map((point, index) => (
        <button
          key={point.id}
          type="button"
          className="group relative min-w-[4px] flex-1 rounded-t-md border-0 bg-[var(--widget-accent)] p-0 opacity-65 outline-none transition-[opacity,transform] duration-150 [transform-origin:center_bottom] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:scale-y-[1.02] hover:opacity-100 focus-visible:scale-y-[1.02] focus-visible:opacity-100 motion-reduce:transition-none"
          style={{ height: `${Math.max(7, (point.value / max) * 100)}%` }}
          aria-label={`${point.label}: ${point.value.toLocaleString()} recorded steps`}
        >
          <span
            role="tooltip"
            className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden w-max rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus-visible:block ${
              index < 2
                ? "left-0"
                : index > points.length - 3
                  ? "right-0"
                  : "left-1/2 -translate-x-1/2"
            }`}
          >
            {point.label} · {point.value.toLocaleString()}
          </span>
        </button>
      ))}
    </div>
  );
}

function Bottom({
  model,
  points,
}: {
  model: StepsReadModel;
  points: PatternPoint[];
}) {
  const sourceCount = new Set(
    model.contributions.map(
      (item) =>
        `${item.providerId}:${item.sourceAppId ?? ""}:${item.sourceDeviceId ?? ""}`,
    ),
  ).size;

  const left =
    model.state === "partial"
      ? "Partial coverage"
      : model.state === "stale"
        ? "Last recorded total"
        : model.coverageRatio === 1
          ? "Complete coverage"
          : "Recorded total";
  const right =
    points.length > 0
      ? `${points.length} intervals`
      : sourceCount > 0
        ? `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`
        : "No source yet";

  return (
    <div className="flex h-full items-end justify-between gap-3 text-[11px] leading-none">
      <span
        className={
          model.state === "partial" || model.state === "stale"
            ? "font-medium text-[var(--widget-accent)]"
            : "text-[#747d89]"
        }
      >
        {left}
      </span>
      <span className="text-right text-[#747d89]">{right}</span>
    </div>
  );
}

function Value({
  value,
  state,
}: {
  value: number;
  state: StepsReadModel["state"];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col justify-center">
      <strong className="text-[36px] font-semibold leading-none tracking-[-.055em] tabular-nums">
        {Math.round(value).toLocaleString()}
      </strong>
      <span className="mt-2 text-[11px] leading-none text-[#747d89]">
        {state === "partial"
          ? "recorded so far"
          : state === "stale"
            ? "last recorded"
            : "recorded steps"}
      </span>
    </div>
  );
}

function Content({
  model,
  variant,
  size,
}: {
  model: StepsReadModel;
  variant: StepsVariant;
  size: WidgetSize;
}) {
  const points = useMemo(
    () => safePattern(model.contributions),
    [model.contributions],
  );
  const hasValue =
    typeof model.value === "number" &&
    Number.isFinite(model.value) &&
    ["valid", "partial", "stale"].includes(model.state);
  const wide = size.w > size.h;
  const tall = size.h > size.w;
  const roomy = size.w > 1 || size.h > 1;

  const primary =
    variant === "recorded-pattern" && points.length > 0 ? (
      <Pattern points={points} />
    ) : hasValue ? (
      <Value value={model.value as number} state={model.state} />
    ) : (
      <MetricState state={model.state} hasValue={false} />
    );

  const supplementary =
    hasValue && points.length > 0 ? (
      variant === "recorded-pattern" ? (
        <Value value={model.value as number} state={model.state} />
      ) : (
        <Pattern points={points} />
      )
    ) : null;

  return (
    <div
      className="grid h-full min-h-0 gap-[15px]"
      style={{
        gridTemplateRows: tall
          ? "33px minmax(0,1fr) 54px"
          : "33px minmax(0,1fr) 33px",
      }}
    >
      <Header date={model.localDate} />
      <div
        className={`grid min-h-0 min-w-0 gap-4 overflow-visible ${
          roomy && supplementary
            ? wide
              ? "grid-cols-[minmax(120px,.8fr)_minmax(0,1.4fr)]"
              : "grid-rows-[minmax(110px,.8fr)_minmax(0,1.2fr)]"
            : "grid-cols-1"
        }`}
      >
        <div className="min-h-0 min-w-0 overflow-visible">{primary}</div>
        {roomy && supplementary ? (
          <div className="min-h-0 min-w-0 overflow-visible">
            {supplementary}
          </div>
        ) : null}
      </div>
      <Bottom model={model} points={points} />
    </div>
  );
}

function LoadingContent({ size }: { size: WidgetSize }) {
  return (
    <div
      className="grid h-full min-h-0 gap-[15px]"
      style={{
        gridTemplateRows:
          size.h > size.w
            ? "33px minmax(0,1fr) 54px"
            : "33px minmax(0,1fr) 33px",
      }}
    >
      <Header date={null} />
      <div className="flex flex-col justify-center motion-reduce:animate-none">
        <span className="h-9 w-32 animate-pulse rounded-md bg-[#eef0f3] motion-reduce:animate-none" />
        <span className="mt-3 h-3 w-20 animate-pulse rounded bg-[#f1f3f5] motion-reduce:animate-none" />
      </div>
      <div className="flex items-end justify-between">
        <span className="h-2.5 w-20 animate-pulse rounded bg-[#f1f3f5] motion-reduce:animate-none" />
        <span className="h-2.5 w-12 animate-pulse rounded bg-[#f1f3f5] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function StepsProductionCard({
  size,
  accentColor,
  variant,
}: {
  size: WidgetSize;
  accentColor?: string;
  variant: StepsVariant;
}) {
  const query = useQuery<StepsReadModel>({
    queryKey: ["/api/body/metrics/activity.steps/latest"],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const errorModel: StepsReadModel = {
    metricId: "activity.steps",
    state: "error",
    value: null,
    unit: null,
    localDate: null,
    coverageRatio: null,
    generatedAt: null,
    sourceNamespace: null,
    uncertainty: [],
    contributions: [],
  };

  return (
    <EWidgetCard size={size} accentColor={accentColor}>
      {query.isPending ? (
        <LoadingContent size={size} />
      ) : (
        <Content
          model={query.isError ? errorModel : query.data ?? errorModel}
          variant={variant}
          size={size}
        />
      )}
    </EWidgetCard>
  );
}

export const productionStepsWidget = defineWidget({
  id: "activity.steps",
  legacyIds: ["activity-daily-movement"],
  label: "Steps",
  icon: TbWalk,
  defaultW: 1,
  defaultH: 1,
  defaultAccentColor: "#20a65a",
  visualizations: [
    {
      id: "recorded-pattern",
      label: "Recorded pattern",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
    {
      id: "recorded-total",
      label: "Recorded total",
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...sizes],
    },
  ],
  render: ({ visualizationId, size, accentColor }) => (
    <StepsProductionCard
      variant={
        visualizationId === "recorded-pattern"
          ? "recorded-pattern"
          : "recorded-total"
      }
      size={size}
      accentColor={accentColor}
    />
  ),
});
