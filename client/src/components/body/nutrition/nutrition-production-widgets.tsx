import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TbCalendarTime, TbDroplet, TbFlame, TbHourglass, TbPill, TbPlus, TbSalad, TbToolsKitchen2 } from "react-icons/tb";
import { bodyLocalDateKey, EWidgetCard } from "@/components/body/e-widget-card";
import { defineWidget, type WidgetSize } from "@/components/body/module-grid";
import { apiRequest } from "@/lib/queryClient";

type Intake = {
  id: string;
  date: string;
  mealName: string | null;
  mealType: string | null;
  calories: string | null;
  protein?: string | null;
  carbs?: string | null;
  fats?: string | null;
  fiber?: string | null;
  water?: string | null;
  sodium?: string | null;
  magnesium?: string | null;
  vitaminD?: string | null;
  iron?: string | null;
  status: "planned" | "consumed";
};

const sizes = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
] as const;
const today = bodyLocalDateKey;

function Header({
  title,
  icon: Icon,
}: {
  title: string;
  icon: typeof TbPlus;
}) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">{title}</h3>
        <p className="mt-1 text-[11px] leading-[1.2] text-[#747d89]">Today</p>
      </div>
      <Icon className="h-6 w-6 text-[var(--widget-accent)]" />
    </header>
  );
}

function Layout({ size, children }: { size: WidgetSize; children: React.ReactNode }) {
  return (
    <div
      className="grid h-full min-h-0 gap-[15px]"
      style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}
    >
      {children}
    </div>
  );
}

function RingVisual({ value, max, label, valueLabel }: { value: number; max: number; label: string; valueLabel: string }) {
  const progress = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="relative aspect-square h-full max-h-[138px]">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(var(--widget-accent) ${progress * 360}deg, var(--widget-soft) 0deg)` }}
      />
      <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white text-center">
        <strong className="text-[25px] font-semibold leading-none tracking-[-.045em] tabular-nums">{valueLabel}</strong>
        <span className="mt-1.5 text-[10px] leading-none text-[#747d89]">{label}</span>
      </div>
    </div>
  );
}

function BarField({ values, labels, empty = "No recorded values" }: { values: number[]; labels?: string[]; empty?: string }) {
  const max = Math.max(...values, 0);
  if (!max) return <span className="self-center text-[12px] text-[#747d89]">{empty}</span>;
  return (
    <div className="flex h-full min-h-0 items-end gap-2">
      {values.map((value, index) => (
        <div key={`${index}-${value}`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
          <div className="flex min-h-0 flex-1 items-end">
            <div
              className="w-full rounded-[7px] bg-[var(--widget-accent)] transition-[height] duration-150"
              style={{ height: `${Math.max(10, (value / max) * 100)}%`, opacity: .48 + (value / max) * .52 }}
            />
          </div>
          {labels?.[index] ? <span className="mt-1.5 truncate text-center text-[9px] leading-none text-[#747d89]">{labels[index]}</span> : null}
        </div>
      ))}
    </div>
  );
}

function LogIntakeCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const endpoint = `/api/intake-logs/${today()}`;
  const client = useQueryClient();
  const query = useQuery<Intake[]>({ queryKey: [endpoint] });
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/intake-logs", {
        date: `${today()}T12:00:00.000Z`,
        mealName: name.trim(),
        calories: calories ? Number(calories) : undefined,
        status: "consumed",
      }),
    onSuccess: () => {
      setName("");
      setCalories("");
      client.invalidateQueries({ queryKey: [endpoint] });
    },
  });
  const consumed = (query.data ?? []).filter((entry) => entry.status === "consumed");
  if (variant === "day-rhythm") {
    const slots = ["breakfast", "lunch", "dinner", "snack"];
    const counts = slots.map((slot) => consumed.filter((entry) => (entry.mealType ?? "").toLowerCase().includes(slot)).length);
    const uncategorized = consumed.length - counts.reduce((sum, value) => sum + value, 0);
    return (
      <EWidgetCard size={size} accentColor={accentColor}>
        <Layout size={size}>
          <Header title="Log Intake" icon={TbToolsKitchen2} />
          <div className={`grid h-full min-h-0 ${size.w > size.h ? "grid-cols-[1fr_auto] items-center gap-6" : "grid-rows-[1fr_auto] gap-3"}`}>
            <BarField values={counts} labels={size.w > size.h ? ["Breakfast", "Lunch", "Dinner", "Snack"] : ["AM", "Noon", "PM", "Snack"]} empty="Nothing recorded today" />
            <strong className="text-[28px] font-semibold leading-none tracking-[-.045em] tabular-nums">{consumed.length}</strong>
          </div>
          <div className="flex items-end justify-between text-[11px] leading-none">
            <span className="text-[#747d89]">{uncategorized ? `${uncategorized} uncategorized` : "Meal rhythm"}</span>
            <span className="font-medium">recorded today</span>
          </div>
        </Layout>
      </EWidgetCard>
    );
  }

  return (
    <EWidgetCard size={size} accentColor={accentColor}>
      <Layout size={size}>
        <Header title="Log Intake" icon={TbToolsKitchen2} />
        <div className="flex min-h-0 flex-col justify-center">
          <strong className="text-[28px] font-semibold leading-none tracking-[-.045em] tabular-nums">
            {consumed.length}
          </strong>
          <span className="mt-2 text-[11px] text-[#747d89]">recorded today</span>
          <div className="mt-4 flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What did you have?"
              aria-label="Consumed intake name"
              className="min-w-0 flex-1 rounded-lg border border-[#e4e7eb] px-2.5 py-2 text-[11px] outline-none focus:border-[var(--widget-accent)]"
            />
            <input
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              inputMode="decimal"
              placeholder="kcal"
              aria-label="Calories, optional"
              className="w-14 rounded-lg border border-[#e4e7eb] px-2 py-2 text-[11px] outline-none focus:border-[var(--widget-accent)]"
            />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[11px] leading-none text-[#747d89]">
            {mutation.isError ? "Could not save" : "Manual capture"}
          </span>
          <button
            type="button"
            disabled={!name.trim() || mutation.isPending}
            onClick={(event) => { event.stopPropagation(); mutation.mutate(); }}
            className="flex items-center gap-1 rounded-full bg-[var(--widget-accent)] px-2.5 py-1.5 text-[10px] font-semibold leading-none text-white disabled:opacity-40"
          >
            <TbPlus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </Layout>
    </EWidgetCard>
  );
}

function MealPlanCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const endpoint = `/api/intake-logs/${today()}`;
  const client = useQueryClient();
  const [name, setName] = useState("");
  const query = useQuery<Intake[]>({ queryKey: [endpoint] });
  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/intake-logs", {
        date: `${today()}T12:00:00.000Z`,
        mealName: name.trim(),
        status: "planned",
      }),
    onSuccess: () => {
      setName("");
      client.invalidateQueries({ queryKey: [endpoint] });
    },
  });
  const consume = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/intake-logs/${id}/consume`, { date: today() }),
    onSuccess: () => client.invalidateQueries({ queryKey: [endpoint] }),
  });
  const planned = (query.data ?? []).filter((entry) => entry.status === "planned");
  if (variant === "plan-rail") {
    const visible = planned.slice(0, size.h > 1 ? 6 : size.w > 1 ? 4 : 3);
    return (
      <EWidgetCard size={size} accentColor={accentColor}>
        <Layout size={size}>
          <Header title="Meal Plan" icon={TbCalendarTime} />
          <div className={`grid h-full min-h-0 ${size.w > size.h ? "grid-cols-[auto_1fr] items-center gap-5" : "grid-rows-[auto_1fr] gap-3"}`}>
            <strong className="text-[30px] font-semibold leading-none tracking-[-.05em] tabular-nums">{planned.length}</strong>
            <div className={`min-h-0 ${size.w > size.h ? "flex items-center gap-2" : "flex flex-col justify-center gap-2"}`}>
              {visible.length ? visible.map((entry, index) => (
                <div key={entry.id} className={`min-w-0 ${size.w > size.h ? "flex-1" : "flex items-center gap-2"}`}>
                  <div className={`${size.w > size.h ? "h-2 w-full" : "h-2 w-2 shrink-0"} rounded-full bg-[var(--widget-accent)]`} style={{ opacity: 1 - index * .12 }} />
                  <span className={`${size.w > size.h ? "mt-2 block" : ""} truncate text-[10px] font-medium`}>{entry.mealName ?? entry.mealType ?? "Planned intake"}</span>
                </div>
              )) : <span className="text-[12px] text-[#747d89]">Nothing planned</span>}
            </div>
          </div>
          <div className="flex items-end justify-between text-[11px] leading-none"><span className="text-[#747d89]">Today’s sequence</span><span className="font-medium">Plan ≠ consumed</span></div>
        </Layout>
      </EWidgetCard>
    );
  }
  return (
    <EWidgetCard size={size} accentColor={accentColor}>
      <Layout size={size}>
        <Header title="Meal Plan" icon={TbCalendarTime} />
        <div className="flex min-h-0 flex-col justify-center">
          {planned.length ? planned.slice(0, size.h > 1 ? 4 : 2).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-b border-[#eef0f3] py-2 last:border-0">
              <span className="truncate text-[12px] font-medium">{entry.mealName ?? entry.mealType ?? "Planned intake"}</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); consume.mutate(entry.id); }} disabled={consume.isPending} className="ml-2 rounded-full bg-[var(--widget-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--widget-accent)] disabled:opacity-40">Consumed</button>
            </div>
          )) : (
            <>
              <strong className="text-[21px] font-semibold leading-none tracking-[-.03em]">Nothing planned</strong>
              <span className="mt-2 text-[11px] text-[#747d89]">Plans stay separate from consumed intake.</span>
            </>
          )}
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Plan an intake"
              aria-label="Planned intake name"
              className="min-w-0 flex-1 rounded-lg border border-[#e4e7eb] px-2.5 py-2 text-[11px] outline-none focus:border-[var(--widget-accent)]"
            />
            <button
              type="button"
              disabled={!name.trim() || mutation.isPending}
              onClick={(event) => { event.stopPropagation(); mutation.mutate(); }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--widget-accent)] text-white disabled:opacity-40"
              aria-label="Plan intake"
            >
              <TbPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-end justify-between text-[11px] leading-none">
          <span className="text-[#747d89]">{planned.length} planned</span>
          <span className="font-medium">Plan ≠ consumed</span>
        </div>
      </Layout>
    </EWidgetCard>
  );
}

export const productionLogIntakeWidget = defineWidget({
  id: "nutrition.log_intake", legacyIds: ["nutrition.log-intake"], label: "Log Intake", icon: TbToolsKitchen2,
  defaultW: 1, defaultH: 1, defaultAccentColor: "#ea7c16",
  visualizations: [
    { id: "day-rhythm", label: "Day rhythm", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
    { id: "quick-capture", label: "Quick capture", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
  ],
  render: ({ size, accentColor, visualizationId }) => <LogIntakeCard size={size} accentColor={accentColor} variant={visualizationId} />,
});

export const productionMealPlanWidget = defineWidget({
  id: "nutrition.meal_plan", legacyIds: ["nutrition.meal-plan"], label: "Meal Plan", icon: TbCalendarTime,
  defaultW: 1, defaultH: 1, defaultAccentColor: "#20a65a",
  visualizations: [
    { id: "plan-rail", label: "Plan rail", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
    { id: "today-plan", label: "Today", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
  ],
  render: ({ size, accentColor, visualizationId }) => <MealPlanCard size={size} accentColor={accentColor} variant={visualizationId} />,
});

function CaloriesCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const query = useQuery<Intake[]>({ queryKey: [`/api/intake-logs/${today()}`] });
  const consumed = (query.data ?? []).filter((entry) => entry.status === "consumed");
  const known = consumed.filter((entry) => entry.calories !== null);
  const total = known.reduce((sum, entry) => sum + Number(entry.calories), 0);
  if (variant === "meal-distribution") {
    const visible = known.slice(-(size.h > 1 ? 7 : size.w > 1 ? 6 : 4));
    return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
      <Header title="Calories" icon={TbFlame} />
      <div className={`grid h-full min-h-0 ${size.w > size.h ? "grid-cols-[1fr_auto] items-center gap-6" : "grid-rows-[1fr_auto] gap-3"}`}>
        <BarField values={visible.map((entry) => Number(entry.calories))} labels={size.w > 1 ? visible.map((entry) => (entry.mealName ?? entry.mealType ?? "Entry").slice(0, 7)) : undefined} />
        <div><strong className="block text-[28px] font-semibold leading-none tracking-[-.05em] tabular-nums">{known.length ? Math.round(total).toLocaleString() : "—"}</strong><span className="mt-1.5 block text-[10px] text-[#747d89]">recorded kcal</span></div>
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{known.length}/{consumed.length} covered</span><span className="font-medium">By entry</span></div>
    </Layout></EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
    <Header title="Calories" icon={TbFlame} />
    <div className="flex h-full flex-col justify-center"><strong className="text-[36px] font-semibold leading-none tracking-[-.055em] tabular-nums">{known.length ? Math.round(total).toLocaleString() : "—"}</strong><span className="mt-2 text-[11px] text-[#747d89]">{known.length ? "recorded kcal" : "No known calorie values"}</span></div>
    <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{known.length}/{consumed.length} entries covered</span><span className="font-medium">Unknown stays unknown</span></div>
  </Layout></EWidgetCard>;
}

function MacrosCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const query = useQuery<Intake[]>({ queryKey: [`/api/intake-logs/${today()}`] });
  const consumed = (query.data ?? []).filter((entry) => entry.status === "consumed");
  const sum = (key: "protein" | "carbs" | "fats") => {
    const values = consumed.map((entry) => entry[key]).filter((value): value is string => value !== null && value !== undefined);
    return { value: values.reduce((total, value) => total + Number(value), 0), covered: values.length };
  };
  const metrics = [["Protein", sum("protein")], ["Carbs", sum("carbs")], ["Fat", sum("fats")]] as const;
  if (variant === "macro-composition") {
    const total = metrics.reduce((sumValue, [, metric]) => sumValue + metric.value, 0);
    return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
      <Header title="Macronutrients" icon={TbSalad} />
      <div className={`flex h-full min-h-0 ${size.h > size.w ? "flex-col justify-center gap-4" : "items-center gap-5"}`}>
        <div className="flex h-14 min-w-0 flex-1 overflow-hidden rounded-[12px] bg-[var(--widget-soft)]">
          {metrics.map(([label, metric], index) => total > 0 ? <div key={label} className="h-full bg-[var(--widget-accent)]" style={{ width: `${metric.value / total * 100}%`, opacity: 1 - index * .22 }} title={`${label}: ${Math.round(metric.value)} g`} /> : null)}
        </div>
        <div className={`${size.h > size.w ? "grid grid-cols-3" : "grid shrink-0 gap-2"} text-[10px]`}>
          {metrics.map(([label, metric]) => <div key={label}><strong className="mr-1 font-semibold tabular-nums">{metric.covered ? Math.round(metric.value) : "—"}</strong><span className="text-[#747d89]">{label}</span></div>)}
        </div>
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Recorded grams</span><span className="font-medium">Composition</span></div>
    </Layout></EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
    <Header title="Macronutrients" icon={TbToolsKitchen2} />
    <div className="grid h-full grid-cols-3 items-center gap-3">{metrics.map(([label, metric]) => <div key={label}><strong className="block text-[22px] font-semibold leading-none tracking-[-.04em] tabular-nums">{metric.covered ? Math.round(metric.value) : "—"}</strong><span className="mt-2 block text-[10px] text-[#747d89]">{label} · g</span></div>)}</div>
    <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Consumed records</span><span className="font-medium">Per-field coverage</span></div>
  </Layout></EWidgetCard>;
}

type Fast = { id: string; startTime: string; endTime: string | null; targetHours: string | null; status: "active" | "completed" | "cancelled" };
function FastingCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const client = useQueryClient();
  const query = useQuery<Fast | null>({ queryKey: ["/api/fasting-logs/active"], refetchInterval: 30_000 });
  const start = useMutation({ mutationFn: () => apiRequest("POST", "/api/fasting-logs", { startTime: new Date(), targetHours: 16, status: "active" }), onSuccess: () => client.invalidateQueries({ queryKey: ["/api/fasting-logs/active"] }) });
  const complete = useMutation({ mutationFn: (id: string) => apiRequest("POST", `/api/fasting-logs/${id}/complete`, {}), onSuccess: () => client.invalidateQueries({ queryKey: ["/api/fasting-logs/active"] }) });
  const fast = query.data;
  const elapsed = fast ? Math.max(0, (Date.now() - new Date(fast.startTime).getTime()) / 3_600_000) : 0;
  if (variant === "progress-dial") {
    const target = Number(fast?.targetHours ?? 16);
    return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
      <Header title="Fasting" icon={TbHourglass} />
      <div className={`flex h-full min-h-0 ${size.w > size.h ? "items-center justify-between" : "items-center justify-center"}`}>
        <RingVisual value={fast ? elapsed : 0} max={target} valueLabel={fast ? `${elapsed.toFixed(1)}h` : "Ready"} label={fast ? `of ${target}h` : "No active fast"} />
        {size.w > size.h ? <div className="max-w-[42%]"><strong className="block text-[18px] font-semibold">{fast ? `${Math.max(0, target - elapsed).toFixed(1)}h` : "16h"}</strong><span className="mt-1 block text-[10px] text-[#747d89]">{fast ? "remaining" : "default start"}</span></div> : null}
      </div>
      <div className="flex items-end justify-between"><span className="text-[11px] text-[#747d89]">{fast ? "Active" : "Optional"}</span><button type="button" disabled={start.isPending || complete.isPending} onClick={(event) => { event.stopPropagation(); fast ? complete.mutate(fast.id) : start.mutate(); }} className="rounded-full bg-[var(--widget-accent)] px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40">{fast ? "Complete" : "Start 16h"}</button></div>
    </Layout></EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
    <Header title="Fasting" icon={TbHourglass} />
    <div className="flex h-full flex-col justify-center"><strong className="text-[34px] font-semibold leading-none tracking-[-.05em] tabular-nums">{fast ? `${elapsed.toFixed(1)}h` : "Ready"}</strong><span className="mt-2 text-[11px] text-[#747d89]">{fast ? `of ${fast.targetHours ?? "—"}h target` : "No active fast"}</span></div>
    <div className="flex items-end justify-between"><span className="text-[11px] text-[#747d89]">{fast ? "Active execution" : "Optional"}</span><button type="button" disabled={start.isPending || complete.isPending} onClick={(event) => { event.stopPropagation(); fast ? complete.mutate(fast.id) : start.mutate(); }} className="rounded-full bg-[var(--widget-accent)] px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40">{fast ? "Complete" : "Start 16h"}</button></div>
  </Layout></EWidgetCard>;
}

export const productionCaloriesWidget = defineWidget({ id: "nutrition.calories", label: "Calories", icon: TbFlame, defaultW: 1, defaultH: 1, defaultAccentColor: "#e5484d", visualizations: [{ id: "meal-distribution", label: "Meal distribution", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "recorded-total", label: "Recorded total", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <CaloriesCard size={size} accentColor={accentColor} variant={visualizationId} /> });
export const productionMacrosWidget = defineWidget({ id: "nutrition.macronutrients", label: "Macronutrients", icon: TbSalad, defaultW: 1, defaultH: 1, defaultAccentColor: "#0891b2", visualizations: [{ id: "macro-composition", label: "Composition", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "totals", label: "Recorded totals", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <MacrosCard size={size} accentColor={accentColor} variant={visualizationId} /> });
export const productionFastingWidget = defineWidget({ id: "nutrition.fasting", label: "Fasting", icon: TbHourglass, defaultW: 1, defaultH: 1, defaultAccentColor: "#7c3aed", visualizations: [{ id: "progress-dial", label: "Progress dial", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "session", label: "Session", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <FastingCard size={size} accentColor={accentColor} variant={visualizationId} /> });

function LoggedFieldCard({ size, accentColor, title, field, unit, variant }: { size: WidgetSize; accentColor?: string; title: string; field: "fiber" | "water"; unit: string; variant: string }) {
  const query = useQuery<Intake[]>({ queryKey: [`/api/intake-logs/${today()}`] });
  const consumed = (query.data ?? []).filter((entry) => entry.status === "consumed");
  const values = consumed.map((entry) => entry[field]).filter((value): value is string => value !== null && value !== undefined);
  const total = values.reduce((sum, value) => sum + Number(value), 0);
  if (variant === "entry-pattern") {
    const recent = values.slice(-(size.h > 1 ? 8 : size.w > 1 ? 7 : 5)).map(Number);
    const Icon = field === "water" ? TbDroplet : TbSalad;
    return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
      <Header title={title} icon={Icon} />
      <div className={`grid h-full min-h-0 ${size.w > size.h ? "grid-cols-[1fr_auto] items-center gap-6" : "grid-rows-[1fr_auto] gap-3"}`}>
        {field === "water" ? (
          <div className="flex h-full min-h-0 items-end gap-1.5">
            {recent.length ? recent.map((value, index) => {
              const max = Math.max(...recent);
              return <div key={`${value}-${index}`} className="min-h-[12px] flex-1 rounded-[8px] bg-[var(--widget-accent)]" style={{ height: `${Math.max(12, value / max * 100)}%`, opacity: .45 + index / Math.max(1, recent.length - 1) * .55 }} />;
            }) : <span className="self-center text-[12px] text-[#747d89]">No known water values</span>}
          </div>
        ) : <BarField values={recent} empty="No known fiber values" />}
        <div><strong className="block text-[28px] font-semibold leading-none tracking-[-.05em] tabular-nums">{values.length ? Math.round(total).toLocaleString() : "—"}</strong><span className="mt-1.5 block text-[10px] text-[#747d89]">{unit} recorded</span></div>
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{values.length}/{consumed.length} entries</span><span className="font-medium">Entry pattern</span></div>
    </Layout></EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
    <Header title={title} icon={TbToolsKitchen2} />
    <div className="flex h-full flex-col justify-center"><strong className="text-[36px] font-semibold leading-none tracking-[-.055em] tabular-nums">{values.length ? Math.round(total).toLocaleString() : "—"}</strong><span className="mt-2 text-[11px] text-[#747d89]">{values.length ? `recorded ${unit}` : `No known ${title.toLowerCase()} values`}</span></div>
    <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{values.length}/{consumed.length} entries</span><span className="font-medium">Known values only</span></div>
  </Layout></EWidgetCard>;
}

function MicronutrientsCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const query = useQuery<Intake[]>({ queryKey: [`/api/intake-logs/${today()}`] });
  const consumed = (query.data ?? []).filter((entry) => entry.status === "consumed");
  const fields = [["Sodium", "sodium"], ["Magnesium", "magnesium"], ["Vitamin D", "vitaminD"], ["Iron", "iron"]] as const;
  const metrics = fields.map(([label, field]) => {
    const values = consumed.map((entry) => entry[field]).filter((value): value is string => value !== null && value !== undefined);
    return { label, value: values.reduce((sum, value) => sum + Number(value), 0), covered: values.length };
  });
  if (variant === "recorded-profile") {
    const max = Math.max(...metrics.map((metric) => metric.value), 0);
    return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
      <Header title="Micronutrients" icon={TbSalad} />
      <div className="flex h-full min-h-0 flex-col justify-center gap-2.5">
        {metrics.map((metric, index) => <div key={metric.label} className="grid grid-cols-[58px_1fr_auto] items-center gap-2">
          <span className="truncate text-[10px] text-[#747d89]">{metric.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--widget-soft)]"><div className="h-full rounded-full bg-[var(--widget-accent)]" style={{ width: `${max ? metric.value / max * 100 : 0}%`, opacity: 1 - index * .13 }} /></div>
          <strong className="w-8 text-right text-[10px] font-semibold tabular-nums">{metric.covered ? Math.round(metric.value) : "—"}</strong>
        </div>)}
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Relative recorded amounts</span><span className="font-medium">No adequacy claim</span></div>
    </Layout></EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
    <Header title="Micronutrients" icon={TbToolsKitchen2} />
    <div className="grid h-full grid-cols-2 content-center gap-x-4 gap-y-3">{fields.map(([label, field]) => {
      const values = consumed.map((entry) => entry[field]).filter((value): value is string => value !== null && value !== undefined);
      const total = values.reduce((sum, value) => sum + Number(value), 0);
      return <div key={field}><strong className="block text-[18px] font-semibold leading-none tabular-nums">{values.length ? Math.round(total) : "—"}</strong><span className="mt-1 block text-[9px] text-[#747d89]">{label}</span></div>;
    })}</div>
    <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Per-field coverage</span><span className="font-medium">No zero filling</span></div>
  </Layout></EWidgetCard>;
}

function RecentMealsCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const query = useQuery<Intake[]>({ queryKey: [`/api/intake-logs/${today()}`] });
  const meals = (query.data ?? []).filter((entry) => entry.status === "consumed").slice(-5).reverse();
  if (variant === "meal-timeline") {
    const visible = meals.slice(0, size.h > 1 ? 5 : size.w > 1 ? 4 : 3);
    return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
      <Header title="Recent Meals" icon={TbToolsKitchen2} />
      <div className={`${size.w > size.h ? "flex items-center" : "flex flex-col justify-center"} h-full min-h-0 gap-2`}>
        {visible.length ? visible.map((meal, index) => <div key={meal.id} className={`${size.w > size.h ? "min-w-0 flex-1" : "grid grid-cols-[10px_1fr_auto] items-center"} gap-2`}>
          <div className={`${size.w > size.h ? "mb-2 h-2 w-full" : "h-2.5 w-2.5"} rounded-full bg-[var(--widget-accent)]`} style={{ opacity: 1 - index * .15 }} />
          <span className="truncate text-[11px] font-medium">{meal.mealName ?? meal.mealType ?? "Recorded intake"}</span>
          <span className="text-[10px] text-[#747d89]">{meal.calories ? `${meal.calories}` : "—"}</span>
        </div>) : <span className="text-[12px] text-[#747d89]">No consumed meals today.</span>}
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{meals.length} records</span><span className="font-medium">Newest first</span></div>
    </Layout></EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
    <Header title="Recent Meals" icon={TbToolsKitchen2} />
    <div className="flex h-full flex-col justify-center gap-2">{meals.length ? meals.slice(0, size.h > 1 ? 5 : 3).map((meal) => <div key={meal.id} className="flex items-center justify-between text-[11px]"><span className="truncate font-medium">{meal.mealName ?? meal.mealType ?? "Recorded intake"}</span><span className="ml-2 text-[#747d89]">{meal.calories ? `${meal.calories} kcal` : "Details"}</span></div>) : <span className="text-[12px] text-[#747d89]">No consumed meals today.</span>}</div>
    <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{meals.length} records</span><span className="font-medium">Consumed only</span></div>
  </Layout></EWidgetCard>;
}

export const productionFiberWidget = defineWidget({ id: "nutrition.fiber", label: "Fiber", icon: TbSalad, defaultW: 1, defaultH: 1, defaultAccentColor: "#20a65a", visualizations: [{ id: "entry-pattern", label: "Entry pattern", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "total", label: "Recorded total", allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <LoggedFieldCard size={size} accentColor={accentColor} title="Fiber" field="fiber" unit="g" variant={visualizationId} /> });
export const productionWaterWidget = defineWidget({ id: "nutrition.water_intake", label: "Water Intake", icon: TbDroplet, defaultW: 1, defaultH: 1, defaultAccentColor: "#0891b2", visualizations: [{ id: "entry-pattern", label: "Intake pattern", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "total", label: "Recorded total", allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <LoggedFieldCard size={size} accentColor={accentColor} title="Water Intake" field="water" unit="ml" variant={visualizationId} /> });
export const productionMicronutrientsWidget = defineWidget({ id: "nutrition.micronutrients", label: "Micronutrients", icon: TbSalad, defaultW: 1, defaultH: 1, defaultAccentColor: "#7c3aed", visualizations: [{ id: "recorded-profile", label: "Recorded profile", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "known", label: "Known values", allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <MicronutrientsCard size={size} accentColor={accentColor} variant={visualizationId} /> });
export const productionRecentMealsWidget = defineWidget({ id: "nutrition.recent_meals", label: "Recent Meals", icon: TbToolsKitchen2, defaultW: 1, defaultH: 1, defaultAccentColor: "#ea7c16", visualizations: [{ id: "meal-timeline", label: "Meal timeline", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "recent", label: "Recent", allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <RecentMealsCard size={size} accentColor={accentColor} variant={visualizationId} /> });

type IntakeRoutine = { id: string; name: string; dose: string | null; unit: string | null; type: string };
type IntakeCheckin = { id: string; routineId: string; date: string };
function SupplementsCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const client = useQueryClient();
  const routinesQuery = useQuery<IntakeRoutine[]>({ queryKey: ["/api/intake-routines"] });
  const checkinsQuery = useQuery<IntakeCheckin[]>({ queryKey: [`/api/intake-routine-checkins/${today()}`] });
  const checked = new Set((checkinsQuery.data ?? []).map((item) => item.routineId));
  const routines = (routinesQuery.data ?? []).filter((item) => item.type === "supplement");
  const toggle = useMutation({
    mutationFn: (routineId: string) => apiRequest("POST", "/api/intake-routine-checkins", { routineId, date: today() }),
    onSuccess: () => client.invalidateQueries({ queryKey: [`/api/intake-routine-checkins/${today()}`] }),
  });
  if (variant === "completion-ring") {
    const completed = routines.filter((item) => checked.has(item.id)).length;
    const next = routines.find((item) => !checked.has(item.id));
    return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
      <Header title="Supplements" icon={TbPill} />
      <div className={`flex h-full min-h-0 items-center ${size.w > size.h ? "justify-between" : "justify-center"}`}>
        <RingVisual value={completed} max={routines.length || 1} valueLabel={routines.length ? `${completed}/${routines.length}` : "—"} label={routines.length ? "taken today" : "No routines"} />
        {size.w > size.h ? <div className="max-w-[44%]"><span className="block text-[10px] text-[#747d89]">Next due</span><strong className="mt-1 block truncate text-[15px] font-semibold">{next?.name ?? (routines.length ? "Complete" : "Not configured")}</strong></div> : null}
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Dated check-ins</span><span className="font-medium">{next ? "Remaining" : routines.length ? "Complete" : "Optional"}</span></div>
    </Layout></EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}><Layout size={size}>
    <Header title="Supplements" icon={TbPill} />
    <div className="flex h-full flex-col justify-center gap-2">{routines.length ? routines.slice(0, size.h > 1 ? 6 : 3).map((routine) => <button type="button" key={routine.id} onClick={(event) => { event.stopPropagation(); toggle.mutate(routine.id); }} className="flex items-center justify-between rounded-lg border border-[#e4e7eb] px-2.5 py-2 text-left text-[11px]"><span className="truncate font-medium">{routine.name}</span><span className={checked.has(routine.id) ? "font-semibold text-[var(--widget-accent)]" : "text-[#747d89]"}>{checked.has(routine.id) ? "Taken" : [routine.dose, routine.unit].filter(Boolean).join(" ") || "Due"}</span></button>) : <span className="text-[12px] text-[#747d89]">No supplements configured.</span>}</div>
    <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">{checked.size}/{routines.length} checked</span><span className="font-medium">Dated check-ins</span></div>
  </Layout></EWidgetCard>;
}
export const productionSupplementsWidget = defineWidget({ id: "nutrition.supplements", label: "Supplements", icon: TbPill, defaultW: 1, defaultH: 1, defaultAccentColor: "#20a65a", visualizations: [{ id: "completion-ring", label: "Completion ring", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] }, { id: "due", label: "Due today", allowedSizes: [...sizes] }], render: ({ size, accentColor, visualizationId }) => <SupplementsCard size={size} accentColor={accentColor} variant={visualizationId} /> });
