import { useEffect, useMemo, useRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Datum = Record<string, unknown>;

export type HistorySeries = {
  key: string;
  label: string;
  color: string;
  axis?: "left" | "right";
};

type Axis = {
  domain?: [number, number];
  formatter?: (value: number) => string;
};

type ScrollableHistoryChartProps = {
  data: Datum[];
  xKey: string;
  series: HistorySeries[];
  height?: number;
  pointWidth?: number;
  leftAxis?: Axis;
  rightAxis?: Axis;
  kind?: "line" | "area";
  xLabelFormatter?: (value: unknown) => string;
  tooltipLabelFormatter?: (value: unknown, payload: any[]) => string;
};

function numericExtent(data: Datum[], keys: string[], domain?: [number, number]) {
  if (domain) return domain;
  const values = data.flatMap((datum) =>
    keys.map((key) => datum[key]).filter((value): value is number => typeof value === "number"),
  );
  if (!values.length) return [0, 1] as [number, number];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.12, Math.abs(max || 1) * 0.015);
  return [min - padding, max + padding] as [number, number];
}

function ScaleRail({
  domain,
  formatter,
  side,
  bottomInset,
}: {
  domain: [number, number];
  formatter?: (value: number) => string;
  side: "left" | "right";
  bottomInset: number;
}) {
  const format = formatter ?? ((value: number) => new Intl.NumberFormat("en", {
    maximumFractionDigits: Math.abs(domain[1] - domain[0]) < 10 ? 1 : 0,
  }).format(value));
  const middle = (domain[0] + domain[1]) / 2;
  return (
    <div
      className={`flex flex-col justify-between pt-[10px] text-[10px] tabular-nums text-[#7a838f] ${
        side === "left" ? "pr-2 text-right" : "pl-2 text-left"
      }`}
      style={{ paddingBottom: bottomInset }}
      aria-hidden="true"
    >
      <span>{format(domain[1])}</span>
      <span>{format(middle)}</span>
      <span>{format(domain[0])}</span>
    </div>
  );
}

export function ScrollableHistoryChart({
  data,
  xKey,
  series,
  height = 320,
  pointWidth = 24,
  leftAxis,
  rightAxis,
  kind = "line",
  xLabelFormatter,
  tooltipLabelFormatter,
}: ScrollableHistoryChartProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const leftSeries = series.filter((item) => (item.axis ?? "left") === "left");
  const rightSeries = series.filter((item) => item.axis === "right");
  const leftDomain = useMemo(
    () => numericExtent(data, leftSeries.map((item) => item.key), leftAxis?.domain),
    [data, leftSeries, leftAxis?.domain],
  );
  const rightDomain = useMemo(
    () => numericExtent(data, rightSeries.map((item) => item.key), rightAxis?.domain),
    [data, rightSeries, rightAxis?.domain],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || data.length < 2) return;
    const frame = requestAnimationFrame(() => {
      viewport.scrollLeft = viewport.scrollWidth;
    });
    return () => cancelAnimationFrame(frame);
  }, [data.length]);

  if (!data.length || !series.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No history yet
      </div>
    );
  }

  const hasRightAxis = rightSeries.length > 0;
  const bottomInset = 31;
  const Chart = kind === "area" ? AreaChart : LineChart;

  return (
    <div className="min-w-0">
      <div
        className="grid min-w-0"
        style={{ gridTemplateColumns: hasRightAxis ? "46px minmax(0,1fr) 46px" : "46px minmax(0,1fr)" }}
      >
        <ScaleRail domain={leftDomain} formatter={leftAxis?.formatter} side="left" bottomInset={bottomInset} />
        <div
          ref={viewportRef}
          className="body-history-scroll min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain"
          style={{ height, touchAction: "pan-x" }}
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
          <div style={{ width: `max(100%, ${data.length * pointWidth}px)`, height }}>
            <ResponsiveContainer width="100%" height="100%">
              <Chart data={data} margin={{ top: 10, right: 2, bottom: 0, left: 2 }}>
                <CartesianGrid vertical={false} stroke="#dfe3e8" strokeWidth={0.8} />
                <XAxis
                  dataKey={xKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7a838f", fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={38}
                  tickFormatter={xLabelFormatter}
                />
                <YAxis yAxisId="left" hide domain={leftDomain} />
                {hasRightAxis ? <YAxis yAxisId="right" hide orientation="right" domain={rightDomain} /> : null}
                <Tooltip
                  cursor={{ stroke: "#b8bec7", strokeWidth: 1 }}
                  contentStyle={{ borderRadius: 14, border: "1px solid #e2e5e9", boxShadow: "none", fontSize: 12 }}
                  labelFormatter={tooltipLabelFormatter}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 7 }} />
                {series.map((item, index) => kind === "area" && index === 0 ? (
                  <Area
                    key={item.key}
                    yAxisId={item.axis ?? "left"}
                    type="natural"
                    dataKey={item.key}
                    name={item.label}
                    stroke={item.color}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={item.color}
                    fillOpacity={0.1}
                    dot={false}
                    activeDot={{ r: 4, fill: item.color, stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ) : (
                  <Line
                    key={item.key}
                    yAxisId={item.axis ?? "left"}
                    type="natural"
                    dataKey={item.key}
                    name={item.label}
                    stroke={item.color}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{ r: 4, fill: item.color, stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ))}
              </Chart>
            </ResponsiveContainer>
          </div>
        </div>
        {hasRightAxis ? <ScaleRail domain={rightDomain} formatter={rightAxis?.formatter} side="right" bottomInset={bottomInset} /> : null}
      </div>
      <p className="mt-2 text-right text-[10px] font-medium text-[#9199a3]">Scroll to travel through time</p>
    </div>
  );
}
