import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Info } from "lucide-react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type MetricSnapshot = {
  key: string;
  label: string;
  calculationClass: "evidence-backed" | "industry-inspired" | "proxy" | "ai-derived";
  value: number | null;
  unit: string | null;
  status: string;
  accent: string;
  confidence: "high" | "medium" | "low" | "unavailable";
  missingInputs: string[];
  explanation: string;
  components?: Record<string, number | string | null>;
};

type MetricsResponse = {
  date: string;
  metrics: MetricSnapshot[];
};

type HistoryResponse = {
  metricKey: string;
  history: Array<{
    date: string;
    value: number | null;
    status: string;
    confidence: MetricSnapshot["confidence"];
    calculationClass: MetricSnapshot["calculationClass"];
  }>;
};

const ranges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const todayKey = () => format(new Date(), "yyyy-MM-dd");

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function formatMetricValue(value: number | null | undefined, unit?: string | null) {
  if (value == null) return "--";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return `${rounded}${unit ? ` ${unit}` : ""}`;
}

function classLabel(value: MetricSnapshot["calculationClass"]) {
  if (value === "evidence-backed") return "Evidence-backed";
  if (value === "industry-inspired") return "Industry-inspired";
  return "Proxy";
}

export default function BodyMetricDetail() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const [, navigate] = useLocation();
  const [range, setRange] = useState(30);
  const date = todayKey();

  const { data: snapshot } = useQuery<MetricsResponse>({
    queryKey: ["/api/body/metrics", date],
    queryFn: () => fetchJson(`/api/body/metrics/${date}`),
  });

  const { data: history, isLoading } = useQuery<HistoryResponse>({
    queryKey: ["/api/body/metrics/history", metricKey, date, range],
    queryFn: () => fetchJson(`/api/body/metrics/${date}/history/${metricKey}?days=${range}`),
    enabled: Boolean(metricKey),
  });

  const metric = snapshot?.metrics.find((item) => item.key === metricKey);
  const accent = metric?.accent ?? "#2563eb";
  const chartData = useMemo(() => (
    history?.history.map((point) => ({
      date: format(new Date(`${point.date}T12:00:00`) as any, "MMM d"),
      value: point.value,
      status: point.status,
    })) ?? []
  ), [history]);

  const components = Object.entries(metric?.components ?? {}).filter(([, value]) => value != null);

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in p-4 pb-24 duration-500 sm:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 gap-1.5 rounded-xl text-slate-500 hover:text-slate-950"
        onClick={() => navigate("/body")}
      >
        <ArrowLeft className="h-4 w-4" />
        Body
      </Button>

      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.09)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Body metric</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {metric?.label ?? metricKey}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              {metric?.explanation ?? "Historical view for this Body metric."}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-6 py-5 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Current</p>
            <p className="mt-1 text-5xl font-black leading-none text-slate-950">
              {formatMetricValue(metric?.value, metric?.unit)}
            </p>
            <p className="mt-2 text-sm font-black" style={{ color: accent }}>{metric?.status ?? "Unknown"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Confidence</p>
            <p className="mt-1 text-lg font-black text-slate-950">{metric?.confidence ?? "--"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Calculation</p>
            <p className="mt-1 text-lg font-black text-slate-950">{metric ? classLabel(metric.calculationClass) : "--"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Inputs missing</p>
            <p className="mt-1 text-lg font-black text-slate-950">{metric?.missingInputs.length ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">Trend</h2>
          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
            {ranges.map((item) => (
              <button
                key={item.days}
                type="button"
                className="rounded-xl px-3 py-1.5 text-xs font-black text-slate-500 data-[active=true]:bg-white data-[active=true]:text-slate-950 data-[active=true]:shadow-sm"
                data-active={range === item.days}
                onClick={() => setRange(item.days)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-72 items-center justify-center text-sm font-semibold text-slate-400">Loading trend...</div>
        ) : (
          <ChartContainer config={{ value: { label: metric?.label ?? "Metric", color: accent } }} className="h-72 w-full">
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis orientation="right" width={36} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={4} dot={{ r: 2.5 }} activeDot={{ r: 6 }} strokeLinecap="round" />
            </LineChart>
          </ChartContainer>
        )}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
          <h2 className="text-lg font-black text-slate-950">Components</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {components.length ? components.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-3">
                <span className="text-sm font-bold capitalize text-slate-500">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-sm font-black text-slate-950">{String(value)}</span>
              </div>
            )) : (
              <p className="py-4 text-sm font-medium text-slate-500">No component breakdown available yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-400" />
            <h2 className="text-lg font-black text-slate-950">How to read it</h2>
          </div>
          <p className="mt-4 text-sm font-medium leading-relaxed text-slate-500">
            This page shows the real calculation output for the selected Body card. When wearable or external inputs are missing, the metric marks that honestly and uses the local fallback defined in the Body calculation layer.
          </p>
        </div>
      </section>
    </div>
  );
}
