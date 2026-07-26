import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TbBed,
  TbBottle,
  TbBrain,
  TbCalendarHeart,
  TbCoffee,
  TbDroplet,
  TbPhoto,
  TbSparkles,
} from "react-icons/tb";
import type { IconType } from "react-icons";
import { EWidgetCard } from "@/components/body/e-widget-card";
import { defineWidget, type WidgetDefinition, type WidgetSize } from "@/components/body/module-grid";
import { apiRequest } from "@/lib/queryClient";

type ManualObservation = {
  id: string;
  actualStartAt: string;
  evidence: {
    value?: number | string | boolean | null;
    unit?: string | null;
    scaleVersion?: string | null;
    confidence?: "exact" | "estimated" | "unknown";
  } | null;
};
type ObservationResponse = {
  umbrellaId: string;
  observations: ManualObservation[];
};
type ObservationSpec = {
  id: string;
  label: string;
  prompt: string;
  empty: string;
  icon: IconType;
  accent: string;
  input: "number" | "text";
  unit?: string;
  scaleVersion?: string;
  min?: number;
  max?: number;
  step?: number;
  sensitive?: boolean;
  visual?: "caffeine-timing" | "alcohol-records" | "stress-history" | "nap-duration" | "cycle-rhythm" | "skin-comparison" | "appearance-sequence" | "product-rotation" | "symptom-timeline";
};
const sizes = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
] as const;

function formatValue(observation: ManualObservation | undefined) {
  const value = observation?.evidence?.value;
  if (value === undefined || value === null || value === "") return "—";
  return `${value}${observation?.evidence?.unit ? ` ${observation.evidence.unit}` : ""}`;
}

function ManualObservationCard({
  spec,
  size,
  accentColor,
}: {
  spec: ObservationSpec;
  size: WidgetSize;
  accentColor?: string;
}) {
  const client = useQueryClient();
  const [value, setValue] = useState("");
  const queryKey = [`/api/body/manual-observations/${spec.id}`];
  const query = useQuery<ObservationResponse>({ queryKey });
  const create = useMutation({
    mutationFn: () => {
      const observedValue =
        spec.input === "number" ? Number(value) : value.trim();
      return apiRequest("POST", "/api/body/manual-observations", {
        umbrellaId: spec.id,
        entityKey: "default",
        label: spec.label,
        value: observedValue,
        unit: spec.unit ?? null,
        scaleVersion: spec.scaleVersion ?? null,
        confidence: "exact",
        privacyClass: spec.sensitive === false ? "general_wellness" : "sensitive_health",
        observedAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        clientRecordId: crypto.randomUUID(),
        attributes: {},
      });
    },
    onSuccess: () => {
      setValue("");
      client.invalidateQueries({ queryKey });
    },
  });
  const latest = query.data?.observations[0];
  const Icon = spec.icon;
  const valid =
    value.trim() !== "" &&
    (spec.input === "text" ||
      (Number.isFinite(Number(value)) &&
        (spec.min === undefined || Number(value) >= spec.min) &&
        (spec.max === undefined || Number(value) <= spec.max)));

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
              {spec.label}
            </h3>
            <p className="mt-1 text-[11px] text-[#747d89]">
              {latest
                ? new Date(latest.actualStartAt).toLocaleDateString()
                : spec.sensitive === false
                  ? "Manual record"
                  : "Private manual record"}
            </p>
          </div>
          <Icon className="h-6 w-6 text-[var(--widget-accent)]" />
        </header>
        <div className="flex min-h-0 flex-col justify-center">
          <strong className="break-words text-[30px] font-semibold leading-[1.02] tracking-[-.045em] tabular-nums">
            {latest ? formatValue(latest) : spec.empty}
          </strong>
          <span className="mt-2 text-[11px] text-[#747d89]">
            {latest
              ? latest.evidence?.scaleVersion ?? "Latest recorded observation"
              : "Nothing is inferred from missing data."}
          </span>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (valid) create.mutate();
          }}
        >
          <input
            type={spec.input}
            inputMode={spec.input === "number" ? "decimal" : "text"}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={spec.prompt}
            aria-label={`${spec.label} observation`}
            className="min-w-0 flex-1 rounded-lg border border-[#e4e7eb] bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[var(--widget-accent)]"
          />
          <button
            type="submit"
            disabled={!valid || create.isPending}
            className="shrink-0 rounded-full bg-[var(--widget-accent)] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
          >
            Log
          </button>
        </form>
      </div>
    </EWidgetCard>
  );
}

function ObservationVisualCard({
  spec,
  size,
  accentColor,
}: {
  spec: ObservationSpec;
  size: WidgetSize;
  accentColor?: string;
}) {
  const query = useQuery<ObservationResponse>({ queryKey: [`/api/body/manual-observations/${spec.id}`] });
  const observations = query.data?.observations ?? [];
  const latest = observations[0];
  const visible = observations.slice(0, size.h > 1 ? 8 : size.w > 1 ? 6 : 4);
  const Icon = spec.icon;
  const gridRows = size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px";
  const header = <header className="flex items-start justify-between"><div><h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">{spec.label}</h3><p className="mt-1 text-[11px] text-[#747d89]">{latest ? new Date(latest.actualStartAt).toLocaleDateString() : "Private manual record"}</p></div><Icon className="h-6 w-6 text-[var(--widget-accent)]" /></header>;
  let center: React.ReactNode;
  let bottom: React.ReactNode;

  if (spec.visual === "caffeine-timing") {
    center = <div className="relative flex h-full min-h-0 items-center">
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--widget-soft)]" />
      {visible.length ? visible.map((observation, index) => {
        const date = new Date(observation.actualStartAt);
        const position = ((date.getHours() * 60 + date.getMinutes()) / 1440) * 100;
        const amount = Number(observation.evidence?.value ?? 0);
        const height = Math.max(18, Math.min(52, 18 + amount / 8));
        return <i key={observation.id} title={`${formatValue(observation)} · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`} className="absolute top-1/2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--widget-accent)]" style={{ left: `${position}%`, height, opacity: 1 - index * .08 }} />;
      }) : <span className="relative mx-auto bg-white px-2 text-[12px] text-[#747d89]">{spec.empty}</span>}
      <span className="absolute bottom-0 left-0 text-[9px] text-[#87909c]">00</span><span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-[#87909c]">12</span><span className="absolute bottom-0 right-0 text-[9px] text-[#87909c]">24</span>
    </div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Timing & amount</span><span className="font-medium">{latest ? formatValue(latest) : "No record"}</span></div>;
  } else if (spec.visual === "alcohol-records") {
    center = <div className="flex h-full min-h-0 items-end gap-2">{visible.length ? visible.map((observation, index) => {
      const servings = Math.max(0, Number(observation.evidence?.value ?? 0));
      return <div key={observation.id} title={formatValue(observation)} className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-[var(--widget-soft)]"><i className="absolute inset-x-0 bottom-0 rounded-xl bg-[var(--widget-accent)]" style={{ height: `${Math.max(8, Math.min(100, servings * 24))}%`, opacity: 1 - index * .08 }} /></div>;
    }) : <span className="self-center text-[12px] text-[#747d89]">{spec.empty}</span>}</div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{observations.length} records</span><span className="font-medium">{latest ? formatValue(latest) : "Nothing inferred"}</span></div>;
  } else if (spec.visual === "stress-history") {
    center = <div className="flex h-full min-h-0 items-end gap-2">{visible.length ? [...visible].reverse().map((observation, index) => {
      const rating = Math.max(0, Math.min(10, Number(observation.evidence?.value ?? 0)));
      return <i key={observation.id} title={formatValue(observation)} className="min-w-0 flex-1 rounded-md bg-[var(--widget-accent)]" style={{ height: `${Math.max(8, rating * 10)}%`, opacity: .45 + ((index + 1) / visible.length) * .55 }} />;
    }) : <span className="self-center text-[12px] text-[#747d89]">{spec.empty}</span>}</div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Recent check-ins</span><span className="font-medium">{latest ? formatValue(latest) : "No check-in"}</span></div>;
  } else if (spec.visual === "nap-duration") {
    center = <div className="grid h-full min-h-0 gap-2" style={{ gridTemplateRows: `repeat(${Math.max(1, visible.length)}, minmax(0,1fr))` }}>{visible.length ? visible.map((observation, index) => {
      const minutes = Math.max(0, Number(observation.evidence?.value ?? 0));
      return <div key={observation.id} title={formatValue(observation)} className="relative min-h-[8px] overflow-hidden rounded-md bg-[var(--widget-soft)]"><i className="absolute inset-y-0 left-0 rounded-md bg-[var(--widget-accent)]" style={{ width: `${Math.max(5, Math.min(100, minutes / 1.2))}%`, opacity: 1 - index * .08 }} /></div>;
    }) : <span className="self-center text-[12px] text-[#747d89]">{spec.empty}</span>}</div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Recorded duration</span><span className="font-medium">{latest ? formatValue(latest) : "No nap"}</span></div>;
  } else if (spec.visual === "cycle-rhythm") {
    const ringEvents = visible.slice(0, 8);
    center = <div className="flex h-full min-h-0 items-center justify-center"><div className="relative aspect-square h-full max-h-[138px] rounded-full border-[8px] border-[var(--widget-soft)]">{ringEvents.map((observation, index) => {
      const angle = -90 + (index / Math.max(ringEvents.length, 1)) * 360;
      const x = 50 + Math.cos(angle * Math.PI / 180) * 50;
      const y = 50 + Math.sin(angle * Math.PI / 180) * 50;
      return <div key={observation.id} title={formatValue(observation)} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--widget-accent)]" style={{ left: `${x}%`, top: `${y}%`, opacity: 1 - index * .08 }} />;
    })}<div className="absolute inset-0 flex items-center justify-center px-3 text-center"><strong className="line-clamp-3 text-[15px] font-semibold leading-tight">{latest ? formatValue(latest) : spec.empty}</strong></div></div></div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{observations.length} records</span><span className="font-medium">Logged timeline</span></div>;
  } else if (spec.visual === "skin-comparison") {
    center = <div className={`grid h-full min-h-0 ${size.w > size.h ? "grid-cols-3" : "grid-rows-3"} gap-2`}>{[0, 1, 2].map((index) => <div key={index} className="flex min-h-0 flex-col justify-between overflow-hidden rounded-[12px] bg-[var(--widget-soft)] p-2"><div className="h-2 w-2 rounded-full bg-[var(--widget-accent)]" style={{ opacity: visible[index] ? 1 - index * .18 : .15 }} /><span className="truncate text-[9px] font-medium">{visible[index] ? formatValue(visible[index]) : "No record"}</span>{visible[index] ? <span className="text-[8px] text-[#747d89]">{new Date(visible[index].actualStartAt).toLocaleDateString()}</span> : null}</div>)}</div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Comparable records</span><span className="font-medium">{visible.length} visible</span></div>;
  } else if (spec.visual === "appearance-sequence") {
    center = <div className={`grid h-full min-h-0 ${size.w > size.h ? "grid-cols-4" : "grid-cols-2"} gap-2`}>{visible.length ? visible.map((observation, index) => <div key={observation.id} className="flex min-h-0 flex-col justify-end overflow-hidden rounded-[12px] bg-[var(--widget-soft)] p-2"><div className="mb-auto h-2 w-2 rounded-full bg-[var(--widget-accent)]" style={{ opacity: 1 - index * .12 }} /><span className="line-clamp-2 text-[10px] font-medium leading-tight">{formatValue(observation)}</span></div>) : <span className="col-span-full self-center text-[12px] text-[#747d89]">{spec.empty}</span>}</div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Self-chosen observations</span><span className="font-medium">Newest first</span></div>;
  } else if (spec.visual === "product-rotation") {
    center = <div className={`flex h-full min-h-0 ${size.w > size.h ? "items-end" : "flex-col justify-center"} gap-2`}>{visible.length ? visible.map((observation, index) => <div key={observation.id} className={`${size.w > size.h ? "min-w-0 flex-1" : "w-full"} rounded-[11px] border border-[#e4e7eb] bg-white p-2.5`}><div className="mb-2 h-1.5 rounded-full bg-[var(--widget-accent)]" style={{ opacity: 1 - index * .14 }} /><span className="block truncate text-[10px] font-medium">{formatValue(observation)}</span></div>) : <span className="self-center text-[12px] text-[#747d89]">{spec.empty}</span>}</div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Recorded rotation</span><span className="font-medium">{observations.length} uses</span></div>;
  } else {
    center = <div className="relative flex h-full min-h-0 items-center"><div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--widget-soft)]" />{visible.length ? visible.map((observation, index) => <div key={observation.id} className="relative flex min-w-0 flex-1 justify-center"><div className="h-4 w-4 rounded-full border-[4px] border-white bg-[var(--widget-accent)]" style={{ opacity: 1 - index * .12 }} title={formatValue(observation)} /></div>) : <span className="relative mx-auto bg-white px-2 text-[12px] text-[#747d89]">{spec.empty}</span>}</div>;
    bottom = <div className="flex items-end justify-between text-[11px]"><span className="max-w-[70%] truncate text-[#747d89]">{latest ? formatValue(latest) : "Nothing inferred"}</span><span className="font-medium">{observations.length} records</span></div>;
  }

  return <EWidgetCard size={size} accentColor={accentColor}><div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: gridRows }}>{header}{center}{bottom}</div></EWidgetCard>;
}

function observationWidget(spec: ObservationSpec): WidgetDefinition {
  const visualizations = spec.visual
    ? [
        { id: spec.visual, label: spec.visual.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "), defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
        { id: "latest-and-log", label: "Latest & log", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
      ]
    : [{ id: "latest-and-log", label: "Latest & log", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }];
  return defineWidget({
    id: spec.id,
    label: spec.label,
    icon: spec.icon,
    defaultW: 1,
    defaultH: 1,
    defaultAccentColor: spec.accent,
    visualizations,
    render: ({ size, accentColor, visualizationId }) => spec.visual && visualizationId !== "latest-and-log"
      ? <ObservationVisualCard spec={spec} size={size} accentColor={accentColor} />
      : <ManualObservationCard spec={spec} size={size} accentColor={accentColor} />,
  });
}

export const nutritionObservationWidgets = [
  observationWidget({
    id: "nutrition.caffeine",
    label: "Caffeine",
    prompt: "Amount",
    empty: "No caffeine logged",
    icon: TbCoffee,
    accent: "#8b5e3c",
    input: "number",
    unit: "mg",
    min: 0,
    step: 1,
    sensitive: false,
    visual: "caffeine-timing",
  }),
  observationWidget({
    id: "nutrition.alcohol",
    label: "Alcohol",
    prompt: "Servings",
    empty: "No alcohol logged",
    icon: TbBottle,
    accent: "#7c3aed",
    input: "number",
    unit: "servings",
    min: 0,
    step: 0.1,
    visual: "alcohol-records",
  }),
];

export const restObservationWidgets = [
  observationWidget({
    id: "rest.perceived_stress",
    label: "Perceived Stress",
    prompt: "0–10",
    empty: "No check-in",
    icon: TbBrain,
    accent: "#e5484d",
    input: "number",
    unit: "/10",
    scaleVersion: "numeric-rating-scale.0-10.v1",
    min: 0,
    max: 10,
    step: 1,
    visual: "stress-history",
  }),
  observationWidget({
    id: "rest.naps",
    label: "Naps",
    prompt: "Minutes",
    empty: "No nap recorded",
    icon: TbBed,
    accent: "#7c3aed",
    input: "number",
    unit: "min",
    min: 1,
    step: 1,
    sensitive: false,
    visual: "nap-duration",
  }),
];

export const hygieneObservationWidgets = [
  observationWidget({
    id: "hygiene.cycle",
    label: "Cycle",
    prompt: "Status or event",
    empty: "Not configured",
    icon: TbCalendarHeart,
    accent: "#db2777",
    input: "text",
    visual: "cycle-rhythm",
  }),
  observationWidget({
    id: "hygiene.skin_progress",
    label: "Skin Progress",
    prompt: "Comparable observation",
    empty: "No observation",
    icon: TbDroplet,
    accent: "#0ea5a4",
    input: "text",
    visual: "skin-comparison",
  }),
  observationWidget({
    id: "hygiene.appearance_progress",
    label: "Appearance Progress",
    prompt: "Chosen observation",
    empty: "No observation",
    icon: TbPhoto,
    accent: "#7c3aed",
    input: "text",
    visual: "appearance-sequence",
  }),
  observationWidget({
    id: "hygiene.products",
    label: "Products",
    prompt: "Product used",
    empty: "No product recorded",
    icon: TbBottle,
    accent: "#ea7c16",
    input: "text",
    visual: "product-rotation",
  }),
  observationWidget({
    id: "hygiene.symptoms",
    label: "Symptoms",
    prompt: "Anything you track",
    empty: "No observation",
    icon: TbSparkles,
    accent: "#e5484d",
    input: "text",
    visual: "symptom-timeline",
  }),
];
