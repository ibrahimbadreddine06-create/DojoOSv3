import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TbBed, TbCalendarTime, TbMoonStars, TbPlus } from "react-icons/tb";
import { bodyLocalDateKey, EWidgetCard } from "@/components/body/e-widget-card";
import { defineWidget, type WidgetSize } from "@/components/body/module-grid";
import { apiRequest } from "@/lib/queryClient";

type SleepLog = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  plannedHours: string | null;
  actualHours: string | null;
  quality: number | null;
};

const coreSizes = [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 1, h: 2 }] as const;
const richSizes = [...coreSizes, { w: 2, h: 2 }] as const;
const today = bodyLocalDateKey;

function RestShell({
  size,
  accentColor,
  title,
  metadata,
  icon: Icon,
  center,
  bottom,
}: {
  size: WidgetSize;
  accentColor?: string;
  title: string;
  metadata: string;
  icon: typeof TbBed;
  center: React.ReactNode;
  bottom: React.ReactNode;
}) {
  return (
    <EWidgetCard size={size} accentColor={accentColor}>
      <div
        className="grid h-full min-h-0 gap-[15px]"
        style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 52px" : "33px minmax(0,1fr) 33px" }}
      >
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">{title}</h3>
            <p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">{metadata}</p>
          </div>
          <Icon className="h-6 w-6 shrink-0 text-[var(--widget-accent)]" />
        </header>
        <div className="min-h-0 overflow-visible">{center}</div>
        <div className="min-h-0 overflow-visible">{bottom}</div>
      </div>
    </EWidgetCard>
  );
}

function Metric({
  label,
  value,
  align = "left",
  large = false,
}: {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
  large?: boolean;
}) {
  return (
    <div className={align === "right" ? "text-right" : align === "center" ? "text-center" : ""}>
      <p className="text-[10px] font-medium leading-none text-[#747d89]">{label}</p>
      <p className={`${large ? "mt-1 text-[22px]" : "mt-1 text-[13px]"} font-semibold leading-none tracking-[-.025em] tabular-nums`}>
        {value}
      </p>
    </div>
  );
}

function latestSleep(logs: SleepLog[]) {
  return [...logs]
    .filter((log) => log.actualHours)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function clock(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function sleepDurationHours(log: SleepLog | undefined) {
  if (!log?.actualHours) return null;
  const value = Number(log.actualHours);
  return Number.isFinite(value) ? value : null;
}

function DurationOrb({ hours }: { hours: number }) {
  const progress = Math.min(1, Math.max(0, hours / 10));
  return (
    <div
      className="relative grid aspect-square h-full max-h-[142px] place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--widget-accent) ${progress * 360}deg, color-mix(in srgb, var(--widget-accent) 11%, white) 0)` }}
      aria-label={`${hours.toFixed(1)} recorded sleep hours`}
    >
      <div className="absolute inset-[10px] rounded-full bg-white" />
      <div className="relative text-center">
        <strong className="block text-[30px] font-semibold leading-none tracking-[-.055em] tabular-nums">{hours.toFixed(1)}h</strong>
        <span className="mt-1 block text-[10px] text-[#747d89]">recorded</span>
      </div>
    </div>
  );
}

function LastSleepCard({
  size,
  accentColor,
  visualizationId,
}: {
  size: WidgetSize;
  accentColor?: string;
  visualizationId: string;
}) {
  const query = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs/all"] });
  const latest = latestSleep(query.data ?? []);
  const hours = sleepDurationHours(latest);
  const visualFirst = visualizationId === "duration-orb";

  const empty = (
    <div className="flex h-full flex-col justify-center">
      <strong className="max-w-[18ch] text-[19px] font-semibold leading-[1.08] tracking-[-.025em]">No recorded sleep</strong>
      <span className="mt-2 text-[11px] text-[#747d89]">A plan is never shown as an observation.</span>
    </div>
  );

  return (
    <RestShell
      size={size}
      accentColor={accentColor}
      title="Last Sleep"
      metadata={latest?.date ?? "Latest recorded episode"}
      icon={TbBed}
      center={query.isPending ? <div className="h-full animate-pulse rounded-[16px] bg-[#eef0f3]" /> : hours === null ? empty : visualFirst ? (
        <div className="flex h-full items-center justify-center"><DurationOrb hours={hours} /></div>
      ) : (
        <div className="flex h-full flex-col justify-center">
          <strong className="text-[42px] font-semibold leading-none tracking-[-.06em] tabular-nums">{hours.toFixed(1)}h</strong>
          <span className="mt-2 text-[11px] text-[#747d89]">recorded sleep</span>
        </div>
      )}
      bottom={hours === null ? <span className="flex h-full items-end text-[11px] text-[#747d89]">Awaiting an eligible record</span> : (
        <div className="grid h-full grid-cols-3 items-end">
          <Metric label="Sleep" value={clock(latest?.startTime)} />
          <Metric label="Wake" value={clock(latest?.endTime)} align="center" />
          <Metric label="Quality" value={latest?.quality ? `${latest.quality}/5` : "—"} align="right" />
        </div>
      )}
    />
  );
}

function NightWindow({
  plannedHours,
  bedtime = 23,
}: {
  plannedHours: number;
  bedtime?: number;
}) {
  const start = ((bedtime - 18 + 24) % 24) / 18 * 100;
  const width = Math.min(100 - start, plannedHours / 18 * 100);
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="relative h-[54px]">
        <div className="absolute inset-x-0 top-1/2 h-[12px] -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--widget-accent)_10%,white)]" />
        <div
          className="absolute top-1/2 h-[26px] -translate-y-1/2 rounded-full bg-[var(--widget-accent)]"
          style={{ left: `${start}%`, width: `${Math.max(5, width)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium text-[#747d89]">
        <span>18:00</span><span>00:00</span><span>06:00</span><span>12:00</span>
      </div>
    </div>
  );
}

function RestPlanCard({
  size,
  accentColor,
  visualizationId,
}: {
  size: WidgetSize;
  accentColor?: string;
  visualizationId: string;
}) {
  const endpoint = `/api/sleep-logs/${today()}`;
  const client = useQueryClient();
  const query = useQuery<SleepLog[]>({ queryKey: [endpoint] });
  const [hours, setHours] = useState("8");
  const plan = (query.data ?? []).find((log) => log.plannedHours && !log.actualHours);
  const planned = plan?.plannedHours ? Number(plan.plannedHours) : Number(hours);
  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sleep-logs", { date: today(), plannedHours: Number(hours) }),
    onSuccess: () => client.invalidateQueries({ queryKey: [endpoint] }),
  });
  const visualFirst = visualizationId === "night-window";

  const editor = (
    <div className="flex h-full items-end gap-2">
      <input
        value={hours}
        onChange={(event) => setHours(event.target.value)}
        inputMode="decimal"
        aria-label="Planned rest hours"
        className="h-8 min-w-0 flex-1 rounded-[10px] border border-[#e4e7eb] px-2.5 text-[11px] outline-none focus:border-[var(--widget-accent)]"
      />
      <button
        type="button"
        disabled={!Number(hours) || mutation.isPending}
        onClick={(event) => { event.stopPropagation(); mutation.mutate(); }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--widget-accent)] text-white disabled:opacity-40"
        aria-label="Save tonight's rest plan"
      >
        <TbPlus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <RestShell
      size={size}
      accentColor={accentColor}
      title="Rest Plan"
      metadata="Tonight · day-bound"
      icon={TbCalendarTime}
      center={visualFirst ? <NightWindow plannedHours={planned || 0} /> : (
        <div className="flex h-full flex-col justify-center">
          <strong className="text-[42px] font-semibold leading-none tracking-[-.06em] tabular-nums">{planned ? planned.toFixed(1) : "—"}h</strong>
          <span className="mt-2 text-[11px] text-[#747d89]">{plan ? "planned tonight" : "set a sleep opportunity"}</span>
        </div>
      )}
      bottom={plan ? (
        <div className="flex h-full items-end justify-between">
          <span className="text-[11px] text-[#747d89]">Plan, not observed sleep</span>
          <strong className="text-[15px] font-semibold tabular-nums">{Number(plan.plannedHours).toFixed(1)}h</strong>
        </div>
      ) : editor}
    />
  );
}

function timeOfDay(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() + date.getMinutes() / 60;
}

function normalizedNightHour(value: string | null) {
  const hour = timeOfDay(value);
  if (hour === null) return null;
  return hour < 12 ? hour + 24 : hour;
}

function SleepRhythm({ logs }: { logs: SleepLog[] }) {
  const nights = logs
    .filter((log) => normalizedNightHour(log.startTime) !== null && normalizedNightHour(log.endTime) !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
  if (!nights.length) return <div className="flex h-full items-center text-[13px] font-medium">No timed episodes yet</div>;
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {nights.map((night) => {
        const start = normalizedNightHour(night.startTime)!;
        let end = normalizedNightHour(night.endTime)!;
        if (end < start) end += 24;
        const left = Math.max(0, Math.min(100, (start - 18) / 18 * 100));
        const width = Math.max(3, Math.min(100 - left, (end - start) / 18 * 100));
        return (
          <div key={night.id} className="grid grid-cols-[34px_1fr] items-center gap-2">
            <span className="text-[9px] font-medium text-[#747d89]">{night.date.slice(5)}</span>
            <div className="relative h-[10px] rounded-full bg-[color-mix(in_srgb,var(--widget-accent)_9%,white)]">
              <span className="absolute inset-y-0 rounded-full bg-[var(--widget-accent)]" style={{ left: `${left}%`, width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SleepScheduleCard({
  size,
  accentColor,
  visualizationId,
}: {
  size: WidgetSize;
  accentColor?: string;
  visualizationId: string;
}) {
  const query = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs/all"] });
  const valid = useMemo(
    () => (query.data ?? []).filter((item) => item.startTime && item.endTime).sort((a, b) => b.date.localeCompare(a.date)),
    [query.data],
  );
  const latest = valid[0];
  const visualFirst = visualizationId === "seven-night-rhythm";
  return (
    <RestShell
      size={size}
      accentColor={accentColor}
      title="Sleep Schedule"
      metadata={visualFirst ? "Seven-night timing pattern" : "Latest recorded window"}
      icon={TbMoonStars}
      center={query.isPending ? <div className="h-full animate-pulse rounded-[16px] bg-[#eef0f3]" /> : visualFirst ? (
        <SleepRhythm logs={valid} />
      ) : (
        <div className="grid h-full grid-cols-2 items-center gap-5">
          <Metric label="Sleep" value={clock(latest?.startTime)} large />
          <Metric label="Wake" value={clock(latest?.endTime)} align="right" large />
        </div>
      )}
      bottom={
        <div className="flex h-full items-end justify-between">
          <span className="text-[11px] text-[#747d89]">{valid.length} timed {valid.length === 1 ? "night" : "nights"}</span>
          <span className="text-[11px] font-medium">{latest?.date ?? "No window"}</span>
        </div>
      }
    />
  );
}

export const productionLastSleepWidget = defineWidget({
  id: "rest.last_sleep",
  legacyIds: ["rest.last-sleep"],
  label: "Last Sleep",
  icon: TbBed,
  defaultW: 1,
  defaultH: 1,
  defaultAccentColor: "#7c3aed",
  visualizations: [
    { id: "duration-orb", label: "Duration orb", defaultSize: { w: 1, h: 1 }, allowedSizes: [...richSizes] },
    { id: "duration-metric", label: "Duration metric", defaultSize: { w: 1, h: 1 }, allowedSizes: [...coreSizes] },
  ],
  render: ({ size, accentColor, visualizationId }) => <LastSleepCard size={size} accentColor={accentColor} visualizationId={visualizationId} />,
});

export const productionRestPlanWidget = defineWidget({
  id: "rest.rest_plan",
  legacyIds: ["rest.rest-plan"],
  label: "Rest Plan",
  icon: TbCalendarTime,
  defaultW: 1,
  defaultH: 1,
  defaultAccentColor: "#2563eb",
  visualizations: [
    { id: "night-window", label: "Night window", defaultSize: { w: 1, h: 1 }, allowedSizes: [...richSizes] },
    { id: "planned-hours", label: "Planned hours", defaultSize: { w: 1, h: 1 }, allowedSizes: [...coreSizes] },
  ],
  render: ({ size, accentColor, visualizationId }) => <RestPlanCard size={size} accentColor={accentColor} visualizationId={visualizationId} />,
});

export const productionSleepScheduleWidget = defineWidget({
  id: "rest.sleep_schedule",
  label: "Sleep Schedule",
  icon: TbMoonStars,
  defaultW: 1,
  defaultH: 1,
  defaultAccentColor: "#2563eb",
  visualizations: [
    { id: "seven-night-rhythm", label: "Seven-night rhythm", defaultSize: { w: 1, h: 1 }, allowedSizes: [...richSizes] },
    { id: "latest-window", label: "Latest window", defaultSize: { w: 1, h: 1 }, allowedSizes: [...coreSizes] },
  ],
  render: ({ size, accentColor, visualizationId }) => <SleepScheduleCard size={size} accentColor={accentColor} visualizationId={visualizationId} />,
});
