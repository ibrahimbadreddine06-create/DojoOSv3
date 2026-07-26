import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TbClock, TbDatabase, TbLayoutDashboard } from "react-icons/tb";
import { bodyLocalDateKey, EWidgetCard } from "@/components/body/e-widget-card";
import { defineWidget, type WidgetSize } from "@/components/body/module-grid";

type Subject = { id: string; subjectType: string; titleSnapshot: string };
type Commitment = { id: string; subjectId: string; status: string; plannedStartAt: string | null };
type Execution = { id: string; subjectId: string; status: string; actualStartAt: string | null };
type Snapshot = { subjects: Subject[]; commitments: Commitment[]; executions: Execution[] };
const sizes = [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 1, h: 2 }, { w: 2, h: 2 }] as const;
const today = bodyLocalDateKey;
const time = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "Any time";

function Frame({ size, accentColor, title, icon: Icon, children, bottom }: {
  size: WidgetSize; accentColor?: string; title: string; icon: typeof TbClock;
  children: React.ReactNode; bottom: React.ReactNode;
}) {
  return <EWidgetCard size={size} accentColor={accentColor}>
    <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}>
      <header className="flex items-start justify-between"><div><h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">{title}</h3><p className="mt-1 text-[11px] text-[#747d89]">Across Body</p></div><Icon className="h-6 w-6 text-[var(--widget-accent)]" /></header>
      <div className="min-h-0 overflow-visible">{children}</div>
      <div className="flex h-full items-end justify-between">{bottom}</div>
    </div>
  </EWidgetCard>;
}

function useToday() {
  const query = useQuery<Snapshot>({ queryKey: [`/api/body/operations?date=${today()}`], refetchInterval: 30_000 });
  const subjects = useMemo(() => new Map((query.data?.subjects ?? []).map((item) => [item.id, item])), [query.data?.subjects]);
  return { query, subjects };
}

function TodayCard({ size, accentColor, visualizationId }: { size: WidgetSize; accentColor?: string; visualizationId: string }) {
  const [, navigate] = useLocation();
  const { query, subjects } = useToday();
  const active = query.data?.executions.find((item) => item.status === "in_progress");
  const next = [...(query.data?.commitments ?? [])].filter((item) => ["planned", "ready"].includes(item.status)).sort((a, b) => (a.plannedStartAt ?? "").localeCompare(b.plannedStartAt ?? ""))[0];
  const focus = active ? subjects.get(active.subjectId) : next ? subjects.get(next.subjectId) : null;
  const completed = query.data?.executions.filter((item) => item.status === "completed").length ?? 0;
  const planned = query.data?.commitments.length ?? 0;
  const total = Math.max(1, planned + completed + (active ? 1 : 0));
  return <Frame size={size} accentColor={accentColor} title="Today" icon={TbLayoutDashboard}
    bottom={<><span className="text-[11px] text-[#747d89]">{completed} completed</span><span className="text-[11px] font-medium">{active ? "Active now" : next ? time(next.plannedStartAt) : "Clear"}</span></>}>
    {visualizationId === "day-map" ? <div className="flex h-full min-h-0 flex-col justify-center">
      <div className="flex min-h-[42px] items-center gap-1.5">
        {Array.from({ length: total }, (_, index) => <i key={index} className={`h-full min-h-[42px] min-w-0 flex-1 rounded-lg ${index < completed ? "bg-[var(--widget-accent)]" : index === completed && active ? "bg-[var(--widget-medium)]" : "bg-[var(--widget-soft)]"}`} />)}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <strong className="truncate text-[17px] font-semibold leading-none">{focus?.titleSnapshot ?? "Nothing pending"}</strong>
        <span className="shrink-0 text-[11px] font-medium text-[var(--widget-accent)]">{completed}/{total}</span>
      </div>
    </div> : <div className="flex h-full flex-col justify-center">
      {query.isPending ? <span className="h-9 w-28 animate-pulse rounded bg-[#eef0f3]" /> : focus ? (
        <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/body/history/${focus.id}`); }} className="flex flex-col items-start text-left"><span className="mb-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--widget-accent)]">{active ? "Now" : "Next"} · {focus.subjectType.replaceAll("_", " ")}</span><strong className="max-w-[16ch] text-[26px] font-semibold leading-[1.02] tracking-[-.04em]">{focus.titleSnapshot}</strong></button>
      ) : <><strong className="text-[22px] font-semibold leading-none tracking-[-.035em]">Nothing pending</strong><span className="mt-2 text-[11px] text-[#747d89]">This overview only reflects real Body records.</span></>}
    </div>}
  </Frame>;
}

function TimelineCard({ size, accentColor, visualizationId }: { size: WidgetSize; accentColor?: string; visualizationId: string }) {
  const [, navigate] = useLocation();
  const { query, subjects } = useToday();
  const items = [
    ...(query.data?.commitments ?? []).map((item) => ({ id: `c-${item.id}`, at: item.plannedStartAt, label: subjects.get(item.subjectId)?.titleSnapshot ?? "Planned item", state: "Planned" })),
    ...(query.data?.executions ?? []).map((item) => ({ id: `e-${item.id}`, at: item.actualStartAt, label: subjects.get(item.subjectId)?.titleSnapshot ?? "Body event", state: item.status === "in_progress" ? "Live" : "Done" })),
  ].sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));
  return <Frame size={size} accentColor={accentColor} title="Body Timeline" icon={TbClock}
    bottom={<><span className="text-[11px] text-[#747d89]">{items.length} events</span><span className="text-[11px] font-medium">One shared truth</span></>}>
    {visualizationId === "day-rail" ? <div className="relative flex h-full min-h-0 items-center">
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--widget-soft)]" />
      {items.slice(0, size.w > 1 || size.h > 1 ? 8 : 5).map((item, index, visible) => {
        const date = item.at ? new Date(item.at) : null;
        const position = date ? ((date.getHours() * 60 + date.getMinutes()) / 1440) * 100 : ((index + 1) / (visible.length + 1)) * 100;
        return <button key={item.id} type="button" title={`${time(item.at)} · ${item.label}`} className="absolute top-1/2 h-8 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--widget-accent)] outline-none transition-[height] hover:h-11 focus-visible:h-11" style={{ left: `${position}%`, opacity: item.state === "Done" ? .52 : 1 }} />;
      })}
      <span className="absolute bottom-0 left-0 text-[9px] text-[#87909c]">00</span><span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-[#87909c]">12</span><span className="absolute bottom-0 right-0 text-[9px] text-[#87909c]">24</span>
    </div> : <div className="flex h-full flex-col justify-center gap-2">
      {items.length ? items.slice(0, size.h > 1 ? 6 : 3).map((item) => {
        const rawId = item.id.slice(2);
        const source = item.id.startsWith("c-") ? query.data?.commitments.find((entry) => entry.id === rawId) : query.data?.executions.find((entry) => entry.id === rawId);
        return <button type="button" onClick={(event) => { event.stopPropagation(); if (source) navigate(`/body/history/${source.subjectId}`); }} key={item.id} className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2 text-left text-[11px]"><span className="text-[#747d89]">{time(item.at)}</span><span className="truncate font-medium">{item.label}</span><span className="text-[10px] text-[var(--widget-accent)]">{item.state}</span></button>;
      }) : <span className="text-[12px] text-[#747d89]">No operational events today.</span>}
    </div>}
  </Frame>;
}

export const productionTodayWidget = defineWidget({ id: "hub.today", label: "Today", icon: TbLayoutDashboard, defaultW: 1, defaultH: 1, defaultAccentColor: "#2563eb", visualizations: [{ id: "day-map", label: "Day map", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "focus", label: "Current focus", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <TodayCard size={size} accentColor={accentColor} visualizationId={visualizationId} /> });
export const productionBodyTimelineWidget = defineWidget({ id: "hub.body_timeline", legacyIds: ["hub.body-timeline"], label: "Body Timeline", icon: TbClock, defaultW: 1, defaultH: 1, defaultAccentColor: "#20a65a", visualizations: [{ id: "day-rail", label: "Day rail", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "event-list", label: "Event list", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <TimelineCard size={size} accentColor={accentColor} visualizationId={visualizationId} /> });

type SyncStatus = {
  storageReady: boolean;
  connectors: Array<{
    id: string;
    label: string;
    availability: string;
    connection: { status: string; lastSuccessfulSyncAt: string | null } | null;
  }>;
};
function DataCoverageCard({ size, accentColor, visualizationId }: { size: WidgetSize; accentColor?: string; visualizationId: string }) {
  const query = useQuery<SyncStatus>({ queryKey: ["/api/health-sync/status"], refetchInterval: 60_000 });
  const connected = (query.data?.connectors ?? []).filter((item) => item.connection?.status === "connected");
  const available = (query.data?.connectors ?? []).filter((item) => item.availability !== "unavailable").length;
  const ratio = available ? connected.length / available : 0;
  const lastSync = connected.map((item) => item.connection?.lastSuccessfulSyncAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  return <Frame size={size} accentColor={accentColor} title="Data Coverage" icon={TbDatabase}
    bottom={<><span className="text-[11px] text-[#747d89]">{query.data?.storageReady === false ? "Storage unavailable" : `${connected.length} connected`}</span><span className="text-[11px] font-medium">{lastSync ? time(lastSync) : "No sync yet"}</span></>}>
    {visualizationId === "connection-field" ? <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-5">
      <div className="grid h-full min-h-0 grid-cols-3 gap-2">
        {Array.from({ length: Math.max(3, Math.min(9, available || 3)) }, (_, index) => <i key={index} className={`rounded-xl ${index < connected.length ? "bg-[var(--widget-accent)]" : "bg-[var(--widget-soft)]"}`} />)}
      </div>
      <div className="flex flex-col items-end"><strong className="text-[28px] leading-none tracking-[-.05em] tabular-nums">{Math.round(ratio * 100)}%</strong><span className="mt-1 text-[10px] text-[#747d89]">connected</span></div>
    </div> : <div className="flex h-full flex-col justify-center">
      <strong className="text-[36px] font-semibold leading-none tracking-[-.055em] tabular-nums">{query.isPending ? "…" : connected.length}</strong>
      <span className="mt-2 text-[11px] text-[#747d89]">{connected.length === 1 ? "active data source" : "active data sources"}</span>
      {connected.length ? <div className="mt-4 flex flex-wrap gap-1.5">{connected.slice(0, 4).map((item) => <span key={item.id} className="rounded-full bg-[var(--widget-soft)] px-2 py-1 text-[10px] font-medium text-[var(--widget-accent)]">{item.label}</span>)}</div> : null}
    </div>}
  </Frame>;
}
export const productionDataCoverageWidget = defineWidget({ id: "hub.data_coverage", legacyIds: ["hub.data-coverage"], label: "Data Coverage", icon: TbDatabase, defaultW: 1, defaultH: 1, defaultAccentColor: "#0891b2", visualizations: [{ id: "connection-field", label: "Connection field", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "connections", label: "Connection count", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <DataCoverageCard size={size} accentColor={accentColor} visualizationId={visualizationId} /> });
