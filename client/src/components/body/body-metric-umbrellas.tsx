import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TbActivityHeartbeat,
  TbBed,
  TbBrain,
  TbDroplet,
  TbHeartbeat,
  TbLungs,
  TbRun,
  TbTemperature,
} from "react-icons/tb";
import { bodyMetrics } from "./body-widget-data";
import { defineWidget, type WidgetDefinition, type WidgetSize } from "./module-grid";

type IconType = ComponentType<{ className?: string }>;
type MetricVariantProps = { size: WidgetSize; accentColor?: string };
type Point = { index: number; value: number };

const fontStack = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const coreSizes = [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 1, h: 2 }] as const;
const squareSizes = [...coreSizes, { w: 2, h: 2 }] as const;
const trendSizes = [...squareSizes, { w: 3, h: 1 }] as const;
const palette = {
  recovery: "#ef3340",
  sleep: "#805adf",
  heart: "#e5484d",
  hrv: "#2563eb",
  stress: "#e09300",
  oxygen: "#00a4c7",
  respiratory: "#00a893",
  temperature: "#f97316",
  strain: "#c346b7",
} as const;

function shape(size: WidgetSize) {
  return {
    wide: size.w > size.h,
    tall: size.h > size.w,
    roomy: size.w > 1 || size.h > 1,
    large: size.w > 1 && size.h > 1,
  };
}

function theme(accent: string) {
  return {
    "--widget-accent": accent,
    "--widget-soft": `color-mix(in oklch, ${accent} 11%, white)`,
    "--widget-medium": `color-mix(in oklch, ${accent} 48%, white)`,
    "--widget-ink": `color-mix(in oklch, ${accent} 58%, black)`,
  } as CSSProperties;
}

function AdaptiveCard({
  size,
  accentColor,
  children,
}: MetricVariantProps & { children: ReactNode }) {
  const cardRef = useRef<HTMLElement>(null);
  const [cardSize, setCardSize] = useState({ width: 288, height: 288 });

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const measure = () => setCardSize({ width: card.clientWidth, height: card.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const scale = Math.max(
    0.35,
    Math.min(cardSize.width / (288 * size.w), cardSize.height / (288 * size.h)),
  );

  return (
    <article
      ref={cardRef}
      className="relative h-full w-full overflow-hidden rounded-[var(--body-widget-radius)] border border-[#e4e7eb] bg-white shadow-[0_8px_22px_rgba(24,32,42,.055)] transition-[border-color,box-shadow] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:border-[#d7dce2] hover:shadow-[0_10px_26px_rgba(24,32,42,.09)] motion-reduce:transition-none"
    >
      <div
        className="absolute left-0 top-0 box-border overflow-visible text-[#18202a]"
        style={{
          width: cardSize.width / scale,
          height: cardSize.height / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily: fontStack,
          ...theme(accentColor ?? "#2563eb"),
        }}
      >
        <div
          className="absolute left-5 top-5 min-h-0 min-w-0 overflow-visible"
          style={{ width: "calc(100% - 40px)", height: "calc(100% - 40px)" }}
        >
          {children}
        </div>
      </div>
    </article>
  );
}

function Frame({
  title,
  meta,
  icon: Icon,
  size,
  center,
  bottom,
}: {
  title: string;
  meta: string;
  icon: IconType;
  size: WidgetSize;
  center: ReactNode;
  bottom: ReactNode;
}) {
  const { tall, large } = shape(size);
  const bottomHeight = large ? 62 : tall ? 54 : 33;
  return (
    <div
      className="grid h-full min-h-0 gap-[15px]"
      style={{ gridTemplateRows: `33px minmax(0,1fr) ${bottomHeight}px` }}
    >
      <header className="flex min-h-0 items-start justify-between overflow-visible">
        <div>
          <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">{title}</h3>
          <p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">{meta}</p>
        </div>
        <Icon className="h-6 w-6 shrink-0 text-[var(--widget-accent)]" />
      </header>
      <div className="min-h-0 min-w-0 overflow-visible">{center}</div>
      <div className="min-h-0 min-w-0 overflow-visible">{bottom}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  align = "left",
  prominent = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  align?: "left" | "center" | "right";
  prominent?: boolean;
}) {
  return (
    <div className={`flex h-full min-w-0 flex-col justify-end overflow-visible ${
      align === "right" ? "items-end text-right" : align === "center" ? "items-center text-center" : "items-start"
    }`}>
      <span className="text-[10px] leading-none text-[#747d89]">{label}</span>
      <strong className={`mt-1 whitespace-nowrap leading-none tracking-[-.035em] tabular-nums ${prominent ? "text-[22px]" : "text-[15px]"}`}>
        {value}
        {unit ? <small className="ml-1 text-[10px] font-medium tracking-normal text-[#747d89]">{unit}</small> : null}
      </strong>
    </div>
  );
}

function Metrics({
  items,
}: {
  items: Array<{ label: string; value: string | number; unit?: string; prominent?: boolean }>;
}) {
  return (
    <div className="grid h-full gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((item, index) => (
        <Metric
          key={item.label}
          {...item}
          align={index === 0 ? "left" : index === items.length - 1 ? "right" : "center"}
        />
      ))}
    </div>
  );
}

function Hint({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="dojo-widget-action group relative block h-full w-full cursor-help border-0 bg-transparent p-0 text-inherit outline-none"
      aria-label={label}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-1/2 z-30 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus:block"
      >
        {label}
      </span>
    </button>
  );
}

function ChartTooltip({
  active,
  payload,
  labels,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: Point }>;
  labels: string[];
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const index = point.payload?.index ?? 0;
  return (
    <div className="pointer-events-none rounded-md border border-[#e4e7eb] bg-white px-2 py-1.5 shadow-[0_6px_16px_rgba(24,32,42,.12)]">
      <span className="block text-[9px] leading-none text-[#747d89]">{labels[index]}</span>
      <strong className="mt-1 block text-[12px] leading-none tabular-nums text-[#18202a]">
        {Number(point.value ?? 0).toFixed(unit === "°C" || unit === "rpm" ? 1 : 0)}
        <small className="ml-1 text-[9px] font-medium text-[#747d89]">{unit}</small>
      </strong>
    </div>
  );
}

function Trend({
  values,
  labels,
  unit,
  strokeWidth = 3,
}: {
  values: readonly number[];
  labels: string[];
  unit: string;
  strokeWidth?: number;
}) {
  const data = useMemo(() => values.map((value, index) => ({ index, value })), [values]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domain: [number, number] = min === max ? [min - 1, max + 1] : [min, max];
  const ticks = [min, (min + max) / 2, max];
  const format = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <div className="grid h-full min-h-0 w-full grid-cols-[minmax(0,1fr)_24px] overflow-visible">
      <div className="min-h-0 min-w-0 overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }} style={{ overflow: "visible" }}>
            <CartesianGrid vertical={false} stroke="#D9DEE5" strokeWidth={0.8} strokeLinecap="butt" />
            <XAxis hide dataKey="index" type="number" domain={[0, data.length - 1]} allowDataOverflow />
            <YAxis hide width={0} domain={domain} ticks={ticks} />
            <Tooltip
              cursor={{ stroke: "#747D89", strokeWidth: 0.8, strokeDasharray: "2 2" }}
              content={<ChartTooltip labels={labels} unit={unit} />}
              isAnimationActive={false}
              wrapperStyle={{ outline: "none", pointerEvents: "none" }}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--widget-accent)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 3.5, fill: "#fff", stroke: "var(--widget-accent)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="pointer-events-none relative h-full min-h-0 text-[9px] leading-none tabular-nums text-[#87909c]">
        <span className="absolute right-0 top-[2px] -translate-y-1/2">{format(max)}</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2">{format(ticks[1])}</span>
        <span className="absolute bottom-[2px] right-0 translate-y-1/2">{format(min)}</span>
      </div>
    </div>
  );
}

function Ring({
  progress,
  value,
  label,
  hint,
}: {
  progress: number;
  value: string | number;
  label: string;
  hint: string;
}) {
  const circumference = Math.PI * 2 * 45;
  return (
    <Hint label={hint}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--widget-soft)" strokeWidth="8" className="transition-opacity duration-150 group-hover:opacity-65 group-focus:opacity-65 motion-reduce:transition-none" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="var(--widget-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, progress)))}
          className="transition-[stroke-width,filter] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:[filter:saturate(1.08)] group-hover:[stroke-width:9] group-focus:[filter:saturate(1.08)] group-focus:[stroke-width:9] motion-reduce:transition-none"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-transform duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-1 group-focus:-translate-y-1 motion-reduce:transition-none">
        <strong className="text-[25px] leading-none tracking-[-.045em] tabular-nums">{value}</strong>
        <span className="mt-1 text-[10px] leading-none text-[#747d89]">{label}</span>
      </div>
    </Hint>
  );
}

function HorizontalBars({
  items,
  max,
  unit = "",
}: {
  items: Array<{ label: string; value: number; display?: string; tone?: "soft" | "medium" | "strong" }>;
  max?: number;
  unit?: string;
}) {
  const ceiling = max ?? Math.max(...items.map((item) => item.value));
  return (
    <div className="grid h-full min-h-0 gap-3" style={{ gridTemplateRows: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="dojo-widget-action group grid min-h-0 grid-rows-[13px_minmax(8px,1fr)] gap-1 border-0 bg-transparent p-0 text-left outline-none"
          aria-label={`${item.label}: ${item.display ?? item.value}${unit}`}
        >
          <span className="flex items-start justify-between text-[10px] leading-none">
            <span className="text-[#747d89]">{item.label}</span>
            <strong className="tabular-nums text-[#18202a]">{item.display ?? item.value}{unit}</strong>
          </span>
          <span className="relative block min-h-[8px] overflow-hidden rounded-md bg-[var(--widget-soft)]">
            <i
              className="absolute inset-y-0 left-0 rounded-md transition-[filter,transform] duration-150 [transform-origin:left_center] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-x-[1.01] group-hover:[filter:saturate(1.08)] group-focus:scale-x-[1.01] group-focus:[filter:saturate(1.08)] motion-reduce:transition-none"
              style={{
                width: `${Math.max(4, (item.value / ceiling) * 100)}%`,
                background: item.tone === "soft"
                  ? "color-mix(in oklch, var(--widget-accent) 28%, white)"
                  : item.tone === "medium"
                    ? "var(--widget-medium)"
                    : "var(--widget-accent)",
              }}
            />
          </span>
        </button>
      ))}
    </div>
  );
}

function VerticalBars({
  values,
  labels,
  unit,
}: {
  values: readonly number[];
  labels: string[];
  unit: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (
    <div className="flex h-full min-h-0 items-end gap-2">
      {values.map((value, index) => (
        <button
          key={labels[index]}
          type="button"
          className="dojo-widget-action group relative min-w-0 flex-1 self-end rounded-t-md border-0 bg-[var(--widget-accent)] p-0 opacity-65 outline-none transition-[opacity,transform] duration-150 [transform-origin:center_bottom] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:scale-y-[1.02] hover:opacity-100 focus:scale-y-[1.02] focus:opacity-100 motion-reduce:transition-none"
          style={{ height: `${28 + ((value - min) / Math.max(1, max - min)) * 72}%` }}
          aria-label={`${labels[index]}: ${value}${unit}`}
        >
          <span role="tooltip" className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden w-max rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus:block ${index < 2 ? "left-0" : index > values.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
            {labels[index]} · {value}{unit}
          </span>
        </button>
      ))}
    </div>
  );
}

function RangeGauge({
  min,
  max,
  value,
  low,
  high,
  unit,
}: {
  min: number;
  max: number;
  value: number;
  low: number;
  high: number;
  unit: string;
}) {
  const position = (number: number) => `${((number - min) / (max - min)) * 100}%`;
  return (
    <Hint label={`${value}${unit} · usual ${low}-${high}${unit}`}>
      <div className="flex h-full flex-col justify-center">
        <strong className="text-[25px] leading-none tracking-[-.045em] tabular-nums">{value}<small className="ml-1 text-[10px] font-medium tracking-normal text-[#747d89]">{unit}</small></strong>
        <div className="relative mt-5 h-4 rounded-full bg-[#eef0f3]">
          <i className="absolute inset-y-0 rounded-full bg-[var(--widget-soft)]" style={{ left: position(low), right: `${100 - Number(position(high).slice(0, -1))}%` }} />
          <i className="absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--widget-accent)] shadow-[0_0_0_3px_white]" style={{ left: position(value) }} />
        </div>
        <div className="mt-2 flex justify-between text-[9px] tabular-nums text-[#87909c]"><span>{min}</span><span>{max}</span></div>
      </div>
    </Hint>
  );
}

function split(size: WidgetSize) {
  const { tall, roomy } = shape(size);
  if (!roomy) return "grid-cols-1 grid-rows-[minmax(0,1fr)]";
  return tall
    ? "grid-rows-[minmax(0,1.15fr)_minmax(92px,.85fr)]"
    : "grid-cols-[minmax(150px,.85fr)_minmax(0,1.35fr)]";
}

function RecoveryFactors({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.recovery;
  const { roomy, tall } = shape(size);
  const factors = data.inputs.map((item, index) => ({
    label: item.label,
    value: item.value,
    tone: index === 0 ? "strong" as const : "medium" as const,
  }));
  const center = roomy ? (
    <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
      <HorizontalBars items={factors} max={100} />
      <div className={tall ? "min-h-0" : "min-h-0"}>
        <Trend values={[68, 70, 69, 72, 71, 73, data.score]} labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"]} unit="%" strokeWidth={2} />
      </div>
    </div>
  ) : <HorizontalBars items={factors} max={100} />;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Recovery" meta="Updated today at 08:42" icon={TbActivityHeartbeat} size={size} center={center} bottom={
        <Metrics items={[
          { label: "7-day change", value: `${data.delta >= 0 ? "+" : ""}${data.delta}%` },
          { label: "Recovery", value: `${data.score}%`, prominent: true },
        ]} />
      } />
    </AdaptiveCard>
  );
}

function RecoveryRing({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.recovery;
  const { roomy } = shape(size);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Recovery" meta="Updated today at 08:42" icon={TbActivityHeartbeat} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
          <Ring progress={data.score / 100} value={data.score} label="recovery" hint={`${data.score}% recovery`} />
          {roomy ? <HorizontalBars items={data.inputs.map((item) => ({ label: item.label, value: item.value }))} max={100} /> : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Status", value: data.status },
        { label: "7-day", value: `${data.delta >= 0 ? "+" : ""}${data.delta}%` },
      ]} />} />
    </AdaptiveCard>
  );
}

const sleepStageColor: Record<string, string> = {
  awake: "var(--widget-soft)",
  light: "var(--widget-medium)",
  deep: "var(--widget-accent)",
  rem: "color-mix(in oklch, var(--widget-accent) 72%, white)",
};

function SleepTimelineGraphic() {
  return (
    <div className="flex h-full min-h-0 items-center gap-1.5">
      {bodyMetrics.sleep.stages.map((stage, index) => (
        <button
          key={`${stage.stage}-${index}`}
          type="button"
          className="dojo-widget-action group relative min-w-[5px] rounded-md border-0 p-0 outline-none transition-[filter,transform] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:[filter:saturate(1.08)] focus:-translate-y-0.5 focus:[filter:saturate(1.08)] motion-reduce:transition-none"
          style={{
            flex: stage.minutes,
            height: stage.stage === "deep" ? "78%" : stage.stage === "rem" ? "62%" : stage.stage === "light" ? "48%" : "28%",
            background: sleepStageColor[stage.stage],
          }}
          aria-label={`${stage.stage}: ${stage.minutes} minutes`}
        >
          <span role="tooltip" className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden w-max rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium capitalize leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus:block ${index < 2 ? "left-0" : index > bodyMetrics.sleep.stages.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
            {stage.stage} · {stage.minutes}m
          </span>
        </button>
      ))}
    </div>
  );
}

function SleepTimeline({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.sleep;
  const { roomy, tall } = shape(size);
  const total = `${Math.floor(data.totalMinutes / 60)}h ${data.totalMinutes % 60}m`;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Sleep" meta="Last night · 23:18–07:06" icon={TbBed} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${roomy ? split(size) : "grid-cols-1"}`}>
          <SleepTimelineGraphic />
          {roomy ? (tall
            ? <Ring progress={data.score / 100} value={data.score} label="sleep score" hint={`${data.score} sleep score`} />
            : <Metrics items={[
              { label: "Deep", value: `${Math.floor(data.deepMinutes / 60)}h ${data.deepMinutes % 60}m` },
              { label: "REM", value: `${Math.floor(data.remMinutes / 60)}h ${data.remMinutes % 60}m` },
              { label: "Awake", value: data.awakeMinutes, unit: "m" },
            ]} />
          ) : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Total", value: total, prominent: true },
        { label: "Score", value: data.score },
      ]} />} />
    </AdaptiveCard>
  );
}

function SleepRing({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.sleep;
  const { roomy } = shape(size);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Sleep" meta="Last night · 7h 48m" icon={TbBed} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
          <Ring progress={data.score / 100} value={data.score} label="sleep score" hint={`${data.score} sleep score`} />
          {roomy ? <SleepTimelineGraphic /> : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Deep", value: `${Math.floor(data.deepMinutes / 60)}h ${data.deepMinutes % 60}m` },
        { label: "REM", value: `${Math.floor(data.remMinutes / 60)}h ${data.remMinutes % 60}m` },
        ...(roomy ? [{ label: "Awake", value: data.awakeMinutes, unit: "m" }] : []),
      ]} />} />
    </AdaptiveCard>
  );
}

const heartLabels = ["08:00", "08:06", "08:12", "08:18", "08:24", "08:30", "08:36", "08:42", "08:48", "08:54", "Now"];

function HeartTrend({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.heart;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Heart rate" meta="Live · updated now" icon={TbHeartbeat} size={size} center={
        <Trend values={data.samples} labels={heartLabels} unit="bpm" />
      } bottom={<Metrics items={[
        { label: "Current", value: data.current, unit: "bpm", prominent: true },
        { label: "Resting", value: data.resting, unit: "bpm" },
        ...(shape(size).roomy ? [{ label: "High", value: data.high, unit: "bpm" }] : []),
      ]} />} />
    </AdaptiveCard>
  );
}

function HeartRange({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.heart;
  const { roomy } = shape(size);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Heart rate" meta="Today · live range" icon={TbHeartbeat} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
          <RangeGauge min={45} max={140} low={data.resting} high={95} value={data.current} unit=" bpm" />
          {roomy ? <Trend values={data.samples} labels={heartLabels} unit="bpm" strokeWidth={2} /> : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Resting", value: data.resting, unit: "bpm" },
        { label: "High", value: data.high, unit: "bpm" },
      ]} />} />
    </AdaptiveCard>
  );
}

const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

function HrvBars({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.hrv;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="HRV" meta="7-day recovery signal" icon={TbActivityHeartbeat} size={size} center={
        <VerticalBars values={data.samples} labels={weekLabels} unit=" ms" />
      } bottom={<Metrics items={[
        { label: "Current", value: data.current, unit: "ms", prominent: true },
        { label: "Average", value: data.average, unit: "ms" },
        ...(shape(size).roomy ? [{ label: "Change", value: `+${data.deltaPercent}%` }] : []),
      ]} />} />
    </AdaptiveCard>
  );
}

function HrvBalance({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.hrv;
  const { roomy } = shape(size);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="HRV" meta="Compared with your baseline" icon={TbActivityHeartbeat} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
          <RangeGauge min={30} max={90} low={48} high={72} value={data.current} unit=" ms" />
          {roomy ? <VerticalBars values={data.samples} labels={weekLabels} unit=" ms" /> : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Status", value: "Balanced" },
        { label: "7-day", value: `+${data.deltaPercent}%` },
      ]} />} />
    </AdaptiveCard>
  );
}

const stressLabels = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "Now"];

function StressTrend({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.stress;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Stress" meta="Today · continuous" icon={TbBrain} size={size} center={
        <Trend values={data.samples} labels={stressLabels} unit="" />
      } bottom={<Metrics items={[
        { label: "Current", value: data.current, prominent: true },
        { label: "Peak", value: data.peak },
        ...(shape(size).roomy ? [{ label: "Calm", value: data.calmMinutes, unit: "min" }] : []),
      ]} />} />
    </AdaptiveCard>
  );
}

function StressBands({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.stress;
  const low = Math.min(...data.samples);
  const average = Math.round(data.samples.reduce((sum, value) => sum + value, 0) / data.samples.length);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Stress" meta="Today · load distribution" icon={TbBrain} size={size} center={
        <HorizontalBars items={[
          { label: "Low", value: low, tone: "soft" },
          { label: "Average", value: average, tone: "medium" },
          { label: "Peak", value: data.peak, tone: "strong" },
        ]} max={100} />
      } bottom={<Metrics items={[
        { label: "Current", value: data.current, prominent: true },
        { label: "Calm time", value: data.calmMinutes, unit: "min" },
      ]} />} />
    </AdaptiveCard>
  );
}

function OxygenTilesGraphic() {
  const data = bodyMetrics.oxygen;
  return (
    <div className="grid h-full min-h-0 grid-cols-4 grid-rows-3 gap-2">
      {data.samples.map((value, index) => (
        <button
          key={index}
          type="button"
          className="dojo-widget-action group relative rounded-md border-0 p-0 outline-none transition-[filter,transform] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.025] hover:[filter:saturate(1.08)] focus:scale-[1.025] focus:[filter:saturate(1.08)] motion-reduce:transition-none"
          style={{ background: `color-mix(in oklch, var(--widget-accent) ${28 + (value - data.low) * 20}%, white)` }}
          aria-label={`${index + 1}: ${value}% blood oxygen`}
        >
          <span role="tooltip" className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden w-max rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus:block ${index % 4 === 0 ? "left-0" : index % 4 === 3 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>{value}%</span>
        </button>
      ))}
    </div>
  );
}

function OxygenTiles({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.oxygen;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Blood oxygen" meta="Last night · 12 samples" icon={TbDroplet} size={size} center={<OxygenTilesGraphic />} bottom={
        <Metrics items={[
          { label: "Average", value: data.average, unit: "%", prominent: true },
          { label: "Low", value: data.low, unit: "%" },
          ...(shape(size).roomy ? [{ label: "High", value: data.high, unit: "%" }] : []),
        ]} />
      } />
    </AdaptiveCard>
  );
}

function OxygenRange({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.oxygen;
  const { roomy } = shape(size);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Blood oxygen" meta="Last night · overnight range" icon={TbDroplet} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
          <RangeGauge min={90} max={100} low={95} high={100} value={data.average} unit="%" />
          {roomy ? <OxygenTilesGraphic /> : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Range", value: `${data.low}–${data.high}%` },
        { label: "Drops", value: data.drops },
      ]} />} />
    </AdaptiveCard>
  );
}

const respiratoryLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Last night"];

function RespiratoryTrend({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.respiratory;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Respiratory rate" meta="Last night average" icon={TbLungs} size={size} center={
        <Trend values={data.samples} labels={respiratoryLabels} unit="rpm" />
      } bottom={<Metrics items={[
        { label: "Average", value: data.average, unit: "rpm", prominent: true },
        { label: "Range", value: `${data.low}–${data.high}` },
      ]} />} />
    </AdaptiveCard>
  );
}

function RespiratoryRhythm({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.respiratory;
  const { roomy } = shape(size);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Respiratory rate" meta="Seven-night rhythm" icon={TbLungs} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
          <VerticalBars values={data.samples} labels={respiratoryLabels} unit=" rpm" />
          {roomy ? <RangeGauge min={10} max={20} low={12} high={16} value={data.average} unit=" rpm" /> : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Average", value: data.average, unit: "rpm", prominent: true },
        { label: "Status", value: "Stable" },
      ]} />} />
    </AdaptiveCard>
  );
}

const temperatureLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

function TemperatureTrend({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.temperature;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Temperature" meta="Compared with baseline" icon={TbTemperature} size={size} center={
        <Trend values={data.deviations} labels={temperatureLabels} unit="°C" />
      } bottom={<Metrics items={[
        { label: "Latest", value: `${data.latest >= 0 ? "+" : ""}${data.latest}`, unit: "°C", prominent: true },
        { label: "7-day avg", value: `${data.average >= 0 ? "+" : ""}${data.average}`, unit: "°C" },
      ]} />} />
    </AdaptiveCard>
  );
}

function TemperatureDeviations({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.temperature;
  const max = Math.max(...data.deviations.map((value) => Math.abs(value)), 0.5);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Temperature" meta="Seven-day deviation" icon={TbTemperature} size={size} center={
        <div className="relative flex h-full min-h-0 items-center gap-2">
          <i className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#d9dee5]" />
          {data.deviations.map((value, index) => (
            <button
              key={temperatureLabels[index]}
              type="button"
              className="dojo-widget-action group relative h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
              aria-label={`${temperatureLabels[index]}: ${value >= 0 ? "+" : ""}${value} degrees`}
            >
              <i
                className="absolute left-1/2 w-[70%] -translate-x-1/2 rounded-md bg-[var(--widget-accent)] opacity-65 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 motion-reduce:transition-none"
                style={{
                  height: `${Math.max(8, (Math.abs(value) / max) * 45)}%`,
                  bottom: value >= 0 ? "50%" : "auto",
                  top: value < 0 ? "50%" : "auto",
                }}
              />
              <span role="tooltip" className={`pointer-events-none absolute bottom-full z-30 mb-1.5 hidden w-max rounded-md border border-[#e4e7eb] bg-white px-2 py-1 text-[10px] font-medium leading-none text-[#374151] shadow-[0_5px_12px_rgba(24,32,42,.1)] group-hover:block group-focus:block ${index < 2 ? "left-0" : index > 4 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>{value >= 0 ? "+" : ""}{value}°C</span>
            </button>
          ))}
        </div>
      } bottom={<Metrics items={[
        { label: "Latest", value: `+${data.latest}`, unit: "°C", prominent: true },
        { label: "Baseline", value: "0.0", unit: "°C" },
        ...(shape(size).roomy ? [{ label: "Average", value: `+${data.average}`, unit: "°C" }] : []),
      ]} />} />
    </AdaptiveCard>
  );
}

function StrainActivities({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.strain;
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Daily strain" meta="Today · active load" icon={TbRun} size={size} center={
        <HorizontalBars items={data.activities.map((activity, index) => ({
          label: activity.label,
          value: activity.load,
          display: activity.load.toFixed(1),
          tone: index === 1 ? "strong" : "medium",
        }))} max={6} />
      } bottom={<Metrics items={[
        { label: "Strain", value: data.score, prominent: true },
        { label: "Target", value: `${data.targetLow}–${data.targetHigh}` },
      ]} />} />
    </AdaptiveCard>
  );
}

function StrainTarget({ size, accentColor }: MetricVariantProps) {
  const data = bodyMetrics.strain;
  const { roomy } = shape(size);
  return (
    <AdaptiveCard size={size} accentColor={accentColor}>
      <Frame title="Daily strain" meta="Today · target progress" icon={TbRun} size={size} center={
        <div className={`grid h-full min-h-0 gap-4 ${split(size)}`}>
          <Ring progress={data.score / data.targetHigh} value={data.score} label="strain" hint={`${data.score} of ${data.targetHigh} target`} />
          {roomy ? <HorizontalBars items={data.activities.map((activity) => ({ label: activity.label, value: activity.load, display: activity.load.toFixed(1) }))} max={6} /> : null}
        </div>
      } bottom={<Metrics items={[
        { label: "Target", value: `${data.targetLow}–${data.targetHigh}` },
        { label: "Status", value: data.score >= data.targetLow && data.score <= data.targetHigh ? "Productive" : "Outside target" },
      ]} />} />
    </AdaptiveCard>
  );
}

function umbrella({
  id,
  label,
  icon,
  accent,
  variants,
}: {
  id: string;
  label: string;
  icon: IconType;
  accent: string;
  variants: Array<{
    id: string;
    label: string;
    sizes: readonly WidgetSize[];
    component: (props: MetricVariantProps) => ReactNode;
  }>;
}): WidgetDefinition {
  return defineWidget({
    id: `body-widget-${id}`,
    label,
    icon,
    defaultW: 1,
    defaultH: 1,
    defaultAccentColor: accent,
    visualizations: variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      defaultSize: { w: 1, h: 1 },
      allowedSizes: [...variant.sizes],
    })),
    render: ({ visualizationId, size, accentColor }) => {
      const variant = variants.find((option) => option.id === visualizationId) ?? variants[0];
      return variant.component({ size, accentColor: accentColor ?? accent });
    },
  });
}

export const bodyMetricUmbrellas: WidgetDefinition[] = [
  umbrella({
    id: "recovery",
    label: "Recovery",
    icon: TbActivityHeartbeat,
    accent: palette.recovery,
    variants: [
      { id: "factors", label: "Recovery factors", sizes: squareSizes, component: RecoveryFactors },
      { id: "readiness-ring", label: "Readiness ring", sizes: squareSizes, component: RecoveryRing },
    ],
  }),
  umbrella({
    id: "sleep",
    label: "Sleep",
    icon: TbBed,
    accent: palette.sleep,
    variants: [
      { id: "stage-timeline", label: "Stage timeline", sizes: trendSizes, component: SleepTimeline },
      { id: "sleep-score", label: "Sleep score", sizes: squareSizes, component: SleepRing },
    ],
  }),
  umbrella({
    id: "heart-rate",
    label: "Heart rate",
    icon: TbHeartbeat,
    accent: palette.heart,
    variants: [
      { id: "live-trend", label: "Live trend", sizes: trendSizes, component: HeartTrend },
      { id: "daily-range", label: "Daily range", sizes: squareSizes, component: HeartRange },
    ],
  }),
  umbrella({
    id: "hrv",
    label: "HRV",
    icon: TbActivityHeartbeat,
    accent: palette.hrv,
    variants: [
      { id: "seven-day-bars", label: "Seven-day bars", sizes: trendSizes, component: HrvBars },
      { id: "baseline-balance", label: "Baseline balance", sizes: squareSizes, component: HrvBalance },
    ],
  }),
  umbrella({
    id: "stress",
    label: "Stress",
    icon: TbBrain,
    accent: palette.stress,
    variants: [
      { id: "daily-trend", label: "Daily trend", sizes: trendSizes, component: StressTrend },
      { id: "load-bands", label: "Load bands", sizes: squareSizes, component: StressBands },
    ],
  }),
  umbrella({
    id: "blood-oxygen",
    label: "Blood oxygen",
    icon: TbDroplet,
    accent: palette.oxygen,
    variants: [
      { id: "night-samples", label: "Night samples", sizes: squareSizes, component: OxygenTiles },
      { id: "overnight-range", label: "Overnight range", sizes: squareSizes, component: OxygenRange },
    ],
  }),
  umbrella({
    id: "respiratory-rate",
    label: "Respiratory rate",
    icon: TbLungs,
    accent: palette.respiratory,
    variants: [
      { id: "nightly-trend", label: "Nightly trend", sizes: trendSizes, component: RespiratoryTrend },
      { id: "seven-night-rhythm", label: "Seven-night rhythm", sizes: squareSizes, component: RespiratoryRhythm },
    ],
  }),
  umbrella({
    id: "temperature",
    label: "Temperature",
    icon: TbTemperature,
    accent: palette.temperature,
    variants: [
      { id: "baseline-trend", label: "Baseline trend", sizes: trendSizes, component: TemperatureTrend },
      { id: "deviation-bars", label: "Deviation bars", sizes: squareSizes, component: TemperatureDeviations },
    ],
  }),
  umbrella({
    id: "daily-strain",
    label: "Daily strain",
    icon: TbRun,
    accent: palette.strain,
    variants: [
      { id: "activity-load", label: "Activity load", sizes: squareSizes, component: StrainActivities },
      { id: "target-ring", label: "Target ring", sizes: squareSizes, component: StrainTarget },
    ],
  }),
];
