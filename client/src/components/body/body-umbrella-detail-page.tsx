import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Database,
  ShieldCheck,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type MetricPoint = {
  id: string;
  at: string;
  localDate: string | null;
  value: unknown;
  unit: string | null;
  state: string;
  source: string | null;
  coverageRatio: number | null;
  uncertainty: string[];
  specificationVersion: string;
};

type OperationalRecord = {
  id: string;
  subjectId: string;
  label: string;
  subjectType: string;
  source: string;
  status: string;
  at: string;
  endAt: string | null;
  durationSeconds: number | null;
  evidence: unknown;
  privacyClass: string | null;
};

type DetailModel = {
  umbrella: {
    id: string;
    name: string;
    submodule: string;
    disposition: string;
  };
  metricId: string;
  lens: "metric" | "observation" | "operational";
  storageAvailable: boolean;
  current: MetricPoint | null;
  history: MetricPoint[];
  records: OperationalRecord[];
  plans: Array<{
    id: string;
    subjectId: string;
    label: string;
    localDate: string | null;
    plannedStartAt: string | null;
    plannedEndAt: string | null;
    status: string;
    source: string;
  }>;
  sources: string[];
};

function dateLabel(value: string | null | undefined, long = false) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", long
    ? { dateStyle: "medium", timeStyle: "short" }
    : { month: "short", day: "numeric" }).format(date);
}

function displayValue(value: unknown, unit?: string | null) {
  if (value === null || value === undefined) return "No reading";
  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
    return unit ? `${formatted} ${unit}` : formatted;
  }
  if (typeof value === "string") return unit ? `${value} ${unit}` : value;
  return "Recorded";
}

function Section({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[26px] border border-[#e5e8ec] bg-white p-5 sm:p-6", className)}>
      <div className="mb-5">
        {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#7a838f]">{eyebrow}</p> : null}
        <h2 className="mt-1 text-[17px] font-semibold tracking-[-.025em] text-[#15181d]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricHistory({ points, accent }: { points: MetricPoint[]; accent: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const numeric = points
    .filter((point) => typeof point.value === "number")
    .map((point) => ({
      ...point,
      timestamp: new Date(point.at).getTime(),
      date: dateLabel(point.at),
      numericValue: point.value as number,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportWidth(entry.contentRect.width);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || numeric.length < 2) return;
    const frame = requestAnimationFrame(() => {
      viewport.scrollLeft = viewport.scrollWidth;
    });
    return () => cancelAnimationFrame(frame);
  }, [numeric.length]);

  if (numeric.length < 2) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-[20px] bg-[#f5f6f7] px-6 text-center">
        <div>
          <Database className="mx-auto h-5 w-5 text-[#8a929d]" />
          <p className="mt-3 text-sm font-medium text-[#343a43]">
            {numeric.length === 1 ? "One real reading recorded" : "No metric history yet"}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-[#7a838f]">
            A trend appears after a second comparable reading. Nothing is inferred to fill the gap.
          </p>
        </div>
      </div>
    );
  }

  const values = numeric.map((point) => point.numericValue);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.12, Math.abs(rawMax || 1) * 0.015);
  const domainMin = rawMin - padding;
  const domainMax = rawMax + padding;
  const middle = (domainMin + domainMax) / 2;
  const chartWidth = Math.max(viewportWidth, numeric.length * 24);
  const formatRailValue = (value: number) =>
    new Intl.NumberFormat("en", {
      maximumFractionDigits: Math.abs(domainMax - domainMin) < 10 ? 1 : 0,
    }).format(value);
  const firstDate = dateLabel(numeric[0]?.at);
  const lastDate = dateLabel(numeric.at(-1)?.at);

  return (
    <div className="min-w-0" aria-label={`Recorded metric history from ${firstDate} to ${lastDate}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-[11px] font-medium text-[#747d88]">
          {firstDate} <span className="mx-1 text-[#b0b6be]">—</span> {lastDate}
        </p>
        <p className="hidden text-[10px] font-medium text-[#9199a3] sm:block">Scroll to travel through time</p>
      </div>
      <div className="grid h-64 min-w-0 grid-cols-[42px_minmax(0,1fr)]">
        <div className="flex flex-col justify-between pb-[26px] pr-2 pt-[10px] text-right text-[10px] tabular-nums text-[#7a838f]" aria-hidden="true">
          <span>{formatRailValue(domainMax)}</span>
          <span>{formatRailValue(middle)}</span>
          <span>{formatRailValue(domainMin)}</span>
        </div>
        <div
          ref={viewportRef}
          className="body-history-scroll min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain"
          style={{ touchAction: "pan-x" }}
          onWheel={(event) => {
            const viewport = viewportRef.current;
            if (!viewport || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
            event.preventDefault();
            viewport.scrollLeft += event.deltaY;
          }}
          onKeyDown={(event) => {
            const viewport = viewportRef.current;
            if (!viewport) return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              viewport.scrollBy({
                left: event.key === "ArrowLeft" ? -viewport.clientWidth * 0.7 : viewport.clientWidth * 0.7,
                behavior: "smooth",
              });
            } else if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              viewport.scrollTo({
                left: event.key === "Home" ? 0 : viewport.scrollWidth,
                behavior: "smooth",
              });
            }
          }}
          aria-label="Scrollable history timeline"
          tabIndex={0}
        >
          <LineChart
            width={chartWidth}
            height={256}
            data={numeric}
            margin={{ top: 10, right: 2, bottom: 0, left: 2 }}
          >
            <CartesianGrid vertical={false} stroke="#dfe3e8" strokeWidth={0.8} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#7a838f", fontSize: 10 }} interval="preserveStartEnd" minTickGap={38} />
            <YAxis hide domain={[domainMin, domainMax]} />
            <Tooltip
              cursor={{ stroke: "#b8bec7", strokeWidth: 1 }}
              contentStyle={{ borderRadius: 14, border: "1px solid #e2e5e9", boxShadow: "none", fontSize: 12 }}
              formatter={(value) => [displayValue(value, numeric[0]?.unit), "Recorded"]}
              labelFormatter={(_, payload) => dateLabel(payload?.[0]?.payload?.at, true)}
            />
            <Line dataKey="numericValue" type="natural" stroke={accent} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" dot={false} activeDot={{ r: 4, fill: accent, stroke: "#fff", strokeWidth: 2 }} />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

function RecordHistory({ records }: { records: OperationalRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-[20px] bg-[#f5f6f7] px-6 text-center">
        <div>
          <CalendarDays className="mx-auto h-5 w-5 text-[#8a929d]" />
          <p className="mt-3 text-sm font-medium text-[#343a43]">Nothing recorded yet</p>
          <p className="mt-1 text-xs leading-5 text-[#7a838f]">Completed and manually recorded events will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {records.map((record) => (
        <li key={record.id} className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] bg-[#f5f6f7] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--detail-accent)]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#20242a]">{record.label}</p>
            <p className="mt-0.5 text-[11px] text-[#7a838f]">{record.source} · {record.status.replaceAll("_", " ")}</p>
          </div>
          <time className="text-right text-[11px] text-[#646d78]">{dateLabel(record.at, true)}</time>
        </li>
      ))}
    </ol>
  );
}

const submodulePaths: Record<string, string> = {
  hub: "/body",
  activity: "/body/activity",
  nutrition: "/body/nutrition",
  rest_recovery: "/body/sleep",
  hygiene_looks: "/body/looks",
};

const submoduleAccents: Record<string, string> = {
  hub: "#2563eb",
  activity: "#20a65a",
  nutrition: "#ea7c16",
  rest_recovery: "#7c3aed",
  hygiene_looks: "#db2777",
};

export function BodyUmbrellaDetailPage() {
  const { umbrellaId = "" } = useParams<{ umbrellaId: string }>();
  const [, navigate] = useLocation();
  const query = useQuery<DetailModel>({
    queryKey: [`/api/body/umbrellas/${umbrellaId}/detail`],
  });
  const model = query.data;
  const accent = model ? submoduleAccents[model.umbrella.submodule] ?? "#2563eb" : "#2563eb";

  const history = useMemo(
    () => model?.history ?? [],
    [model?.history],
  );
  const records = useMemo(
    () => model?.records ?? [],
    [model?.records],
  );

  if (query.isPending) {
    return (
      <main className="min-h-[100dvh] bg-background px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-10 w-32 rounded-full bg-white" />
          <div className="mt-5 h-44 rounded-[30px] bg-white" />
          <div className="mt-4 h-80 rounded-[30px] bg-white" />
        </div>
      </main>
    );
  }

  if (query.isError || !model) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background p-5">
        <div className="max-w-md rounded-[28px] border border-[#e5e8ec] bg-white p-8 text-center">
          <CircleAlert className="mx-auto h-6 w-6 text-[#7a838f]" />
          <h1 className="mt-4 text-xl font-semibold">Detail unavailable</h1>
          <p className="mt-2 text-sm text-[#7a838f]">This widget could not be loaded. Your retained records were not changed.</p>
          <button type="button" onClick={() => window.history.back()} className="mt-6 rounded-full bg-[#17191d] px-5 py-2.5 text-sm font-medium text-white">Go back</button>
        </div>
      </main>
    );
  }

  const currentRecord = records[0];
  const hasCurrent = Boolean(model.current || currentRecord);
  const isSensitive = model.umbrella.disposition.includes("sensitive");

  return (
    <main className="min-h-[100dvh] bg-background px-4 pb-16 pt-5 sm:px-8 sm:pt-8" style={{ "--detail-accent": accent } as React.CSSProperties}>
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(submodulePaths[model.umbrella.submodule] ?? "/body")}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#3b424b] transition-colors hover:bg-[#eaecf0]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {model.umbrella.submodule.replaceAll("_", " ")}
        </button>

        <header className="mt-4 rounded-[30px] border border-[#e5e8ec] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--detail-accent)]">
                {model.lens === "metric" ? "Metric history" : model.lens === "observation" ? "Observation history" : "Activity history"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#15181d] sm:text-4xl">{model.umbrella.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#717985]">
                The complete retained view for this widget, with recorded history, source context and data limitations kept visible.
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-[.1em] text-[#858d98]">Current</p>
                <p className="mt-1 text-3xl font-semibold tracking-[-.045em] text-[#171a1f]">
                  {model.current
                    ? displayValue(model.current.value, model.current.unit)
                    : currentRecord?.label ?? "—"}
                </p>
              </div>
              <span className={cn("mb-1 h-3 w-3 rounded-full", hasCurrent ? "bg-[var(--detail-accent)]" : "bg-[#c7ccd3]")} />
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
          <Section title={model.lens === "metric" ? "Recorded trend" : "Retained records"} eyebrow={`Complete history · ${model.lens}`}>
            {model.lens === "metric"
              ? <MetricHistory points={history} accent={accent} />
              : <RecordHistory records={records} />}
          </Section>

          <div className="grid gap-4">
            <Section title="Data state">
              <dl className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#77808b]">Status</dt>
                  <dd className="font-medium text-[#252a31]">{model.current?.state?.replaceAll("_", " ") ?? (hasCurrent ? "recorded" : "awaiting data")}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#77808b]">Records</dt>
                  <dd className="font-medium text-[#252a31]">{model.lens === "metric" ? model.history.length : model.records.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#77808b]">Coverage</dt>
                  <dd className="font-medium text-[#252a31]">{model.current?.coverageRatio == null ? "Not reported" : `${Math.round(model.current.coverageRatio * 100)}%`}</dd>
                </div>
              </dl>
            </Section>

            <Section title="Sources">
              {model.sources.length > 0 ? (
                <ul className="space-y-2">
                  {model.sources.map((source) => (
                    <li key={source} className="flex items-center gap-2 rounded-[14px] bg-[#f5f6f7] px-3 py-2.5 text-xs font-medium text-[#4a525c]">
                      <Database className="h-3.5 w-3.5 text-[var(--detail-accent)]" />
                      {source}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm leading-6 text-[#7a838f]">No source has contributed a retained record yet.</p>}
            </Section>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Section title="Meaning and limits" eyebrow="Interpretation">
            <div className="space-y-3 text-sm leading-6 text-[#656e79]">
              <p>This page reports what was recorded for {model.umbrella.name.toLowerCase()}. It does not invent missing intervals or silently combine incompatible sources.</p>
              <p>{model.lens === "metric" ? "Trends compare retained results that use this metric definition." : "The timeline follows the actual event or observation time."}</p>
              {model.current?.specificationVersion ? <p className="text-xs">Specification: {model.current.specificationVersion}</p> : null}
            </div>
          </Section>

          <Section title={isSensitive ? "Sensitive data" : "Data handling"} eyebrow="Privacy">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--detail-accent)]" />
              <div>
                <p className="text-sm font-medium text-[#343a43]">{isSensitive ? "This widget can contain sensitive health information." : "Only retained account data appears here."}</p>
                <p className="mt-2 text-sm leading-6 text-[#707985]">Missing data remains missing. Removing or correcting a source record should flow through to this history rather than being concealed.</p>
              </div>
            </div>
          </Section>
        </div>

        {!model.storageAvailable ? (
          <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-[#eadfc7] bg-[#fffaf0] p-4 text-sm text-[#6e5b32]">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Canonical storage is temporarily unavailable. Operational records are shown where available; no substitute data was generated.
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 px-2 text-xs text-[#7d8590]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Showing retained records only
          </div>
        )}
      </div>
    </main>
  );
}
