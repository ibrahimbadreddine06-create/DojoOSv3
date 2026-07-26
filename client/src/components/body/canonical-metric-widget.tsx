import { useQuery } from "@tanstack/react-query";
import {
  TbActivity,
  TbActivityHeartbeat,
  TbBarbell,
  TbBolt,
  TbChartDots,
  TbClock,
  TbDroplet,
  TbFlame,
  TbHeartbeat,
  TbLungs,
  TbMoon,
  TbRoute,
  TbScale,
  TbStairs,
  TbTemperature,
} from "react-icons/tb";
import type { IconType } from "react-icons";
import { EWidgetCard } from "@/components/body/e-widget-card";
import { defineWidget, type WidgetDefinition, type WidgetSize } from "@/components/body/module-grid";

type MetricModel = {
  metricId: string;
  state: string;
  value: unknown;
  unit: string | null;
  localDate: string | null;
  coverageRatio: number | null;
  generatedAt: string | null;
  sourceNamespace: string | null;
  uncertainty: string[];
  contributions: unknown[];
};

type VisualKind = "ring" | "range" | "columns" | "paired" | "ladder" | "pulse";
type MetricWidgetSpec = {
  id: string;
  label: string;
  metricId: string;
  accent: string;
  icon: IconType;
  visual: VisualKind;
  domain?: [number, number];
  sensitive?: boolean;
};

const sizes = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
] as const;

function displayValue(value: unknown) {
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") return "Recorded";
  return "—";
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const hours = value.match(/(\d+(?:\.\d+)?)\s*h/i);
    const minutes = value.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (hours || minutes) {
      return Number(hours?.[1] ?? 0) * 60 + Number(minutes?.[1] ?? 0);
    }
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function stateCopy(state: string) {
  if (state === "not_configured") return "Connect an eligible source";
  if (state === "permission_lost") return "Source permission required";
  if (state === "unsupported") return "Not supported by this source";
  if (state === "conflict") return "Source records need review";
  if (state === "provider_delayed") return "Provider sync is delayed";
  if (state === "error") return "Metric unavailable";
  return "Awaiting a valid record";
}

function MetricFrame({
  spec,
  size,
  accentColor,
  children,
  bottom,
}: {
  spec: MetricWidgetSpec;
  size: WidgetSize;
  accentColor?: string;
  children: React.ReactNode;
  bottom: React.ReactNode;
}) {
  const Icon = spec.icon;
  return (
    <EWidgetCard size={size} accentColor={accentColor}>
      <div
        className="grid h-full min-h-0 gap-[15px]"
        style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}
      >
        <header className="flex items-start justify-between overflow-visible">
          <div>
            <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">{spec.label}</h3>
            <p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">
              {spec.sensitive ? "Private health data" : "Latest valid record"}
            </p>
          </div>
          <Icon className="h-6 w-6 shrink-0 text-[var(--widget-accent)]" />
        </header>
        <div className="min-h-0 min-w-0 overflow-visible">{children}</div>
        <div className="min-h-0 min-w-0 overflow-visible">{bottom}</div>
      </div>
    </EWidgetCard>
  );
}

function ValueMark({ model, large = false }: { model: MetricModel; large?: boolean }) {
  return (
    <strong className={`${large ? "text-[34px]" : "text-[25px]"} whitespace-nowrap font-semibold leading-none tracking-[-.05em] tabular-nums`}>
      {displayValue(model.value)}
      {model.unit ? <small className="ml-1 text-[10px] font-medium tracking-normal text-[#747d89]">{model.unit}</small> : null}
    </strong>
  );
}

function VisualComposition({ spec, model, size }: { spec: MetricWidgetSpec; model: MetricModel; size: WidgetSize }) {
  const raw = numericValue(model.value) ?? 0;
  const magnitude = raw === 0 ? 1 : 10 ** Math.floor(Math.log10(Math.abs(raw)));
  const automaticMaximum = Math.ceil(Math.abs(raw) / magnitude) * magnitude;
  const [minimum, maximum] = spec.domain ?? [Math.min(0, raw), Math.max(1, automaticMaximum)];
  const ratio = Math.max(0.04, Math.min(1, (raw - minimum) / Math.max(1, maximum - minimum)));
  const roomy = size.w > 1 || size.h > 1;

  if (spec.visual === "ring") {
    const circumference = 2 * Math.PI * 43;
    return (
      <div className={`grid h-full min-h-0 items-center gap-5 ${roomy ? (size.h > size.w ? "grid-rows-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_minmax(90px,.72fr)]") : ""}`}>
        <div className="relative mx-auto aspect-square h-full max-h-[152px] max-w-full">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="43" fill="none" stroke="var(--widget-soft)" strokeWidth="9" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="var(--widget-accent)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><ValueMark model={model} /></div>
        </div>
        {roomy ? <div className="flex min-w-0 flex-col justify-center"><span className="text-[11px] text-[#747d89]">Recorded position</span><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--widget-soft)]"><i className="block h-full rounded-full bg-[var(--widget-accent)]" style={{ width: `${ratio * 100}%` }} /></div></div> : null}
      </div>
    );
  }

  if (spec.visual === "paired") {
    const parts = String(model.value).split("/");
    return (
      <div className="grid h-full min-h-0 grid-cols-2 items-end gap-4">
        {parts.slice(0, 2).map((part, index) => (
          <div key={`${part}-${index}`} className="flex h-full min-h-0 flex-col justify-end">
            <div className="relative min-h-[30px] flex-1 overflow-hidden rounded-xl bg-[var(--widget-soft)]">
              <i className="absolute inset-x-0 bottom-0 rounded-xl bg-[var(--widget-accent)]" style={{ height: `${Math.max(18, Math.min(100, Number(part) / 1.6))}%`, opacity: index ? .58 : 1 }} />
            </div>
            <strong className="mt-2 text-[20px] leading-none tabular-nums">{part}</strong>
            <span className="mt-1 text-[9px] uppercase tracking-[.08em] text-[#747d89]">{index ? "diastolic" : "systolic"}</span>
          </div>
        ))}
      </div>
    );
  }

  if (spec.visual === "columns" || spec.visual === "ladder") {
    const count = spec.visual === "ladder" ? 7 : 5;
    return (
      <div className="flex h-full min-h-0 items-end gap-2">
        {Array.from({ length: count }, (_, index) => {
          const threshold = (index + 1) / count;
          const reached = ratio >= threshold;
          const height = spec.visual === "ladder" ? 28 + threshold * 72 : 100;
          return (
            <i
              key={index}
              className="min-w-0 flex-1 rounded-md"
              style={{
                height: `${height}%`,
                background: reached ? "var(--widget-accent)" : "var(--widget-soft)",
                opacity: reached ? .58 + threshold * .42 : 1,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (spec.visual === "pulse") {
    return (
      <div className="flex h-full min-h-0 flex-col justify-center">
        <ValueMark model={model} large />
        <div className="relative mt-6 h-10">
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--widget-soft)]" />
          <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--widget-accent)]" style={{ width: `${ratio * 100}%` }} />
          <i className="absolute top-1/2 h-9 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--widget-accent)] shadow-[0_0_0_4px_white]" style={{ left: `${ratio * 100}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-[#87909c]"><span>{minimum}</span><span>{maximum}</span></div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col justify-center">
      <ValueMark model={model} large />
      <div className="relative mt-6 h-4 rounded-full bg-[#eef0f3]">
        <i className="absolute inset-y-0 left-0 rounded-full bg-[var(--widget-soft)]" style={{ width: `${ratio * 100}%` }} />
        <i className="absolute top-1/2 h-6 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--widget-accent)] shadow-[0_0_0_3px_white]" style={{ left: `${ratio * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-[#87909c]"><span>{minimum}</span><span>{maximum}</span></div>
    </div>
  );
}

function CanonicalMetricCard({
  spec,
  size,
  accentColor,
  visualizationId,
}: {
  spec: MetricWidgetSpec;
  size: WidgetSize;
  accentColor?: string;
  visualizationId: string;
}) {
  const query = useQuery<MetricModel>({ queryKey: [`/api/body/metrics/${spec.metricId}/latest`], refetchInterval: 5 * 60_000 });
  const model = query.data;
  const hasValue = model && ["valid", "partial", "stale"].includes(model.state) && model.value !== null;
  const bottom = model ? (
    <div className="flex h-full items-end justify-between gap-3 text-[11px]">
      <span className="truncate text-[#747d89]">{model.sourceNamespace ?? "No source"}</span>
      <span className="shrink-0 font-medium">{model.coverageRatio == null ? "Coverage unknown" : `${Math.round(model.coverageRatio * 100)}% covered`}</span>
    </div>
  ) : <span className="flex h-full items-end text-[11px] text-[#747d89]">No source</span>;

  return (
    <MetricFrame spec={spec} size={size} accentColor={accentColor} bottom={bottom}>
      {query.isPending ? (
        <div className="flex h-full items-center"><span className="h-9 w-28 animate-pulse rounded-lg bg-[#eef0f3]" /></div>
      ) : hasValue ? (
        visualizationId === "latest-value"
          ? <div className="flex h-full flex-col justify-center"><ValueMark model={model} large /><span className="mt-2 text-[11px] text-[#747d89]">Latest recorded value</span></div>
          : <VisualComposition spec={spec} model={model} size={size} />
      ) : (
        <div className="flex h-full flex-col justify-center">
          <strong className="max-w-[18ch] text-[19px] font-semibold leading-[1.08] tracking-[-.025em]">{stateCopy(model?.state ?? "error")}</strong>
          <span className="mt-2 text-[11px] text-[#747d89]">No value is fabricated.</span>
        </div>
      )}
    </MetricFrame>
  );
}

export function canonicalMetricWidget(spec: MetricWidgetSpec): WidgetDefinition {
  return defineWidget({
    id: spec.id,
    label: spec.label,
    icon: spec.icon,
    defaultW: 1,
    defaultH: 1,
    defaultAccentColor: spec.accent,
    visualizations: [
      { id: "visual", label: "Visual", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
      { id: "latest-value", label: "Latest value", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
    ],
    render: ({ size, accentColor, visualizationId }) => (
      <CanonicalMetricCard spec={spec} size={size} accentColor={accentColor} visualizationId={visualizationId} />
    ),
  });
}

export const hubCanonicalMetricWidgets = [
  canonicalMetricWidget({ id: "hub.heart_rate", label: "Heart Rate", metricId: "cardio.heart_rate", accent: "#e5484d", icon: TbHeartbeat, visual: "pulse", domain: [40, 180] }),
  canonicalMetricWidget({ id: "hub.weight", label: "Weight", metricId: "body.weight", accent: "#2563eb", icon: TbScale, visual: "range", domain: [45, 125] }),
  canonicalMetricWidget({ id: "hub.body_composition", label: "Body Composition", metricId: "body.composition", accent: "#7c3aed", icon: TbChartDots, visual: "ring", domain: [0, 40] }),
  canonicalMetricWidget({ id: "hub.blood_pressure", label: "Blood Pressure", metricId: "cardio.blood_pressure", accent: "#e5484d", icon: TbActivityHeartbeat, visual: "paired", sensitive: true }),
  canonicalMetricWidget({ id: "hub.blood_glucose", label: "Blood Glucose", metricId: "metabolic.blood_glucose", accent: "#ea7c16", icon: TbDroplet, visual: "range", domain: [55, 180], sensitive: true }),
];

export const activityCanonicalMetricWidgets = [
  canonicalMetricWidget({ id: "activity.active_minutes", label: "Active Minutes", metricId: "activity.active_minutes", accent: "#20a65a", icon: TbClock, visual: "ring" }),
  canonicalMetricWidget({ id: "activity.sedentary_time", label: "Sedentary Time", metricId: "activity.sedentary_time", accent: "#ea7c16", icon: TbActivity, visual: "range" }),
  canonicalMetricWidget({ id: "activity.distance", label: "Distance", metricId: "activity.distance", accent: "#2563eb", icon: TbRoute, visual: "ladder" }),
  canonicalMetricWidget({ id: "activity.active_energy", label: "Active Energy", metricId: "activity.active_energy", accent: "#e5484d", icon: TbFlame, visual: "ring" }),
  canonicalMetricWidget({ id: "activity.floors_climbed", label: "Floors Climbed", metricId: "activity.floors", accent: "#7c3aed", icon: TbStairs, visual: "ladder" }),
  canonicalMetricWidget({ id: "activity.heart_rate_zones", label: "Heart Rate Zones", metricId: "exercise.heart_rate_zone_duration", accent: "#e5484d", icon: TbHeartbeat, visual: "columns" }),
  canonicalMetricWidget({ id: "activity.cardio_fitness", label: "Cardio Fitness", metricId: "fitness.vo2_max", accent: "#0891b2", icon: TbLungs, visual: "range", domain: [20, 70] }),
  canonicalMetricWidget({ id: "activity.training_load", label: "Training Load", metricId: "load.acute_chronic_trends", accent: "#db2777", icon: TbBarbell, visual: "columns" }),
];

export const restCanonicalMetricWidgets = [
  canonicalMetricWidget({ id: "rest.sleep_duration", label: "Sleep Duration", metricId: "sleep.total_sleep", accent: "#7c3aed", icon: TbMoon, visual: "ring", domain: [0, 9] }),
  canonicalMetricWidget({ id: "rest.sleep_stages", label: "Sleep Stages", metricId: "sleep.stage_duration", accent: "#2563eb", icon: TbMoon, visual: "range", domain: [0, 480] }),
  canonicalMetricWidget({ id: "rest.sleep_efficiency", label: "Sleep Efficiency", metricId: "sleep.efficiency", accent: "#20a65a", icon: TbMoon, visual: "ring", domain: [0, 100] }),
  canonicalMetricWidget({ id: "rest.recovery", label: "Recovery", metricId: "provider.recovery.score", accent: "#20a65a", icon: TbActivityHeartbeat, visual: "ring", domain: [0, 100] }),
  canonicalMetricWidget({ id: "rest.hrv", label: "HRV", metricId: "cardio.hrv.rmssd", accent: "#2563eb", icon: TbActivityHeartbeat, visual: "range" }),
  canonicalMetricWidget({ id: "rest.resting_heart_rate", label: "Resting Heart Rate", metricId: "cardio.heart_rate.resting", accent: "#e5484d", icon: TbHeartbeat, visual: "pulse", domain: [35, 100] }),
  canonicalMetricWidget({ id: "rest.respiratory_rate", label: "Respiratory Rate", metricId: "respiration.rate", accent: "#0891b2", icon: TbLungs, visual: "pulse", domain: [8, 24] }),
  canonicalMetricWidget({ id: "rest.skin_temperature", label: "Skin Temperature", metricId: "temperature.skin", accent: "#ea7c16", icon: TbTemperature, visual: "range", domain: [-2, 2] }),
  canonicalMetricWidget({ id: "rest.blood_oxygen", label: "Blood Oxygen", metricId: "oxygen.saturation", accent: "#2563eb", icon: TbDroplet, visual: "ring", domain: [85, 100] }),
  canonicalMetricWidget({ id: "rest.physiological_stress", label: "Physiological Stress", metricId: "provider.stress.score", accent: "#e5484d", icon: TbBolt, visual: "columns", domain: [0, 100] }),
  canonicalMetricWidget({ id: "rest.sleep_debt", label: "Sleep Debt", metricId: "sleep.debt_or_need", accent: "#7c3aed", icon: TbMoon, visual: "range" }),
];
