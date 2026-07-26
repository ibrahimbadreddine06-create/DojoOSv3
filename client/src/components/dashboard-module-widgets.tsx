import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type {
  Course,
  Discipline,
  Goal,
  KnowledgeTopic,
  TimeBlock,
} from "@shared/schema";
import {
  TbBarbell,
  TbBook2,
  TbBrain,
  TbCalendarTime,
  TbFlag3,
  TbHeartbeat,
  TbLanguage,
  TbTargetArrow,
} from "react-icons/tb";
import type { IconType } from "react-icons";
import { EWidgetCard } from "@/components/body/e-widget-card";
import {
  defineWidget,
  type WidgetDefinition,
  type WidgetShape,
  type WidgetSize,
} from "@/components/body/module-grid";

type ModuleKind =
  | "planner"
  | "goals"
  | "second_brain"
  | "languages"
  | "studies"
  | "body"
  | "disciplines";

type VariantKind = "overview" | "focus" | "map";

type MetricRow = {
  topicId?: string;
  courseId?: string;
  completion?: string | number;
  date?: string;
};

type ModuleSummary = {
  primary: string;
  primaryLabel: string;
  meta: string;
  progress: number | null;
  focus: string;
  focusMeta: string;
  items: Array<{ id: string; label: string; value?: number | null; state?: boolean }>;
  empty: string;
};

const supportedSizes: WidgetSize[] = [
  { w: 1, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 1 },
  { w: 2, h: 2 },
];

const modules: Record<ModuleKind, {
  id: string;
  label: string;
  href: string;
  icon: IconType;
  accent: string;
}> = {
  planner: { id: "dashboard.planner", label: "Daily Planner", href: "/planner", icon: TbCalendarTime, accent: "#2563eb" },
  goals: { id: "dashboard.goals", label: "Goals", href: "/goals", icon: TbTargetArrow, accent: "#ea7c16" },
  second_brain: { id: "dashboard.second_brain", label: "Second Brain", href: "/second-brain", icon: TbBrain, accent: "#7c3aed" },
  languages: { id: "dashboard.languages", label: "Languages", href: "/languages", icon: TbLanguage, accent: "#db2777" },
  studies: { id: "dashboard.studies", label: "Studies", href: "/studies", icon: TbBook2, accent: "#0891b2" },
  body: { id: "dashboard.body", label: "Body", href: "/body", icon: TbHeartbeat, accent: "#20a65a" },
  disciplines: { id: "dashboard.disciplines", label: "Disciplines", href: "/disciplines", icon: TbBarbell, accent: "#e5484d" },
};

function percentage(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
}

function latestMetricMap(rows: MetricRow[], key: "topicId" | "courseId") {
  const result = new Map<string, number>();
  [...rows]
    .sort((left, right) => String(left.date ?? "").localeCompare(String(right.date ?? "")))
    .forEach((row) => {
      const id = row[key];
      const value = percentage(row.completion);
      if (id && value !== null) result.set(id, value);
    });
  return result;
}

function useModuleSummary(kind: ModuleKind): ModuleSummary {
  const date = format(new Date(), "yyyy-MM-dd");
  const planner = useQuery<TimeBlock[]>({ queryKey: ["/api/time-blocks", date], enabled: kind === "planner" });
  const goals = useQuery<Goal[]>({ queryKey: ["/api/goals"], enabled: kind === "goals" });
  const secondBrain = useQuery<KnowledgeTopic[]>({ queryKey: ["/api/knowledge-topics", "second_brain"], enabled: kind === "second_brain" });
  const secondBrainMetrics = useQuery<MetricRow[]>({ queryKey: ["/api/knowledge-metrics-all", "second_brain"], enabled: kind === "second_brain" });
  const languages = useQuery<KnowledgeTopic[]>({ queryKey: ["/api/knowledge-topics", "language"], enabled: kind === "languages" });
  const languageMetrics = useQuery<MetricRow[]>({ queryKey: ["/api/knowledge-metrics-all", "language"], enabled: kind === "languages" });
  const studies = useQuery<Course[]>({ queryKey: ["/api/courses"], enabled: kind === "studies" });
  const studyMetrics = useQuery<MetricRow[]>({ queryKey: ["/api/course-metrics-all"], enabled: kind === "studies" });
  const disciplines = useQuery<Discipline[]>({ queryKey: ["/api/disciplines"], enabled: kind === "disciplines" });
  const bodyProfile = useQuery<Record<string, unknown> | null>({ queryKey: ["/api/body-profile"], enabled: kind === "body" });

  return useMemo(() => {
    if (kind === "planner") {
      const blocks = [...(planner.data ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const completed = blocks.filter((block) => block.completed).length;
      const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const upcoming = blocks.find((block) => {
        const [hours, minutes] = block.endTime.split(":").map(Number);
        return hours * 60 + minutes >= currentMinutes && !block.completed;
      }) ?? blocks.find((block) => !block.completed);
      const progress = blocks.length ? completed / blocks.length * 100 : null;
      return {
        primary: blocks.length ? `${completed}/${blocks.length}` : "—",
        primaryLabel: "blocks complete",
        meta: blocks.length ? `${Math.round(progress ?? 0)}% of today` : "No plan yet",
        progress,
        focus: upcoming?.title ?? "Plan your day",
        focusMeta: upcoming ? `${upcoming.startTime}–${upcoming.endTime}` : "Open Daily Planner",
        items: blocks.slice(0, 6).map((block) => ({ id: block.id, label: block.title, state: block.completed })),
        empty: "No time blocks planned",
      };
    }

    if (kind === "goals") {
      const all = goals.data ?? [];
      const active = all.filter((goal) => !goal.completed);
      const completed = all.length - active.length;
      const progress = all.length ? completed / all.length * 100 : null;
      const focus = active.find((goal) => goal.priority === "high") ?? active[0];
      return {
        primary: String(active.length),
        primaryLabel: active.length === 1 ? "active goal" : "active goals",
        meta: all.length ? `${completed} achieved` : "No goals yet",
        progress,
        focus: focus?.title ?? "Define your direction",
        focusMeta: focus ? `${focus.priority} priority` : "Open Goals",
        items: active.slice(0, 6).map((goal) => ({ id: goal.id, label: goal.title, state: goal.priority === "high" })),
        empty: "No active goals",
      };
    }

    if (kind === "second_brain" || kind === "languages") {
      const topics = kind === "second_brain" ? secondBrain.data ?? [] : languages.data ?? [];
      const metrics = latestMetricMap(
        kind === "second_brain" ? secondBrainMetrics.data ?? [] : languageMetrics.data ?? [],
        "topicId",
      );
      const measured = topics.map((topic) => metrics.get(topic.id)).filter((value): value is number => value !== undefined);
      const average = measured.length ? measured.reduce((sum, value) => sum + value, 0) / measured.length : null;
      const focus = [...topics].sort((left, right) => (metrics.get(right.id) ?? -1) - (metrics.get(left.id) ?? -1))[0];
      return {
        primary: String(topics.length),
        primaryLabel: kind === "languages" ? (topics.length === 1 ? "language" : "languages") : (topics.length === 1 ? "knowledge map" : "knowledge maps"),
        meta: average === null ? "Awaiting learning data" : `${Math.round(average)}% average progress`,
        progress: average,
        focus: focus?.name ?? (kind === "languages" ? "Start a language" : "Map an idea"),
        focusMeta: focus && metrics.has(focus.id) ? `${Math.round(metrics.get(focus.id)!)}% mapped` : `Open ${modules[kind].label}`,
        items: topics.slice(0, 7).map((topic) => ({ id: topic.id, label: topic.name, value: metrics.get(topic.id) ?? null })),
        empty: kind === "languages" ? "No languages added" : "No knowledge maps yet",
      };
    }

    if (kind === "studies") {
      const courses = (studies.data ?? []).filter((course) => !course.archived);
      const metrics = latestMetricMap(studyMetrics.data ?? [], "courseId");
      const measured = courses.map((course) => metrics.get(course.id)).filter((value): value is number => value !== undefined);
      const average = measured.length ? measured.reduce((sum, value) => sum + value, 0) / measured.length : null;
      const focus = courses[0];
      return {
        primary: String(courses.length),
        primaryLabel: courses.length === 1 ? "active course" : "active courses",
        meta: average === null ? "Awaiting course data" : `${Math.round(average)}% average progress`,
        progress: average,
        focus: focus?.name ?? "Add your first course",
        focusMeta: focus?.semester ?? "Open Studies",
        items: courses.slice(0, 6).map((course) => ({ id: course.id, label: course.name, value: metrics.get(course.id) ?? null })),
        empty: "No active courses",
      };
    }

    if (kind === "disciplines") {
      const all = disciplines.data ?? [];
      const focus = [...all].sort((a, b) => (b.level ?? 1) - (a.level ?? 1))[0];
      const ratio = focus?.maxXp ? (focus.currentXp ?? 0) / focus.maxXp * 100 : null;
      return {
        primary: String(all.length),
        primaryLabel: all.length === 1 ? "discipline" : "disciplines",
        meta: focus ? `Highest level ${focus.level ?? 1}` : "No practices yet",
        progress: ratio,
        focus: focus?.name ?? "Choose a discipline",
        focusMeta: focus ? `${focus.currentXp ?? 0}/${focus.maxXp ?? 100} XP · level ${focus.level ?? 1}` : "Open Disciplines",
        items: all.slice(0, 6).map((discipline) => ({
          id: discipline.id,
          label: discipline.name,
          value: discipline.maxXp ? (discipline.currentXp ?? 0) / discipline.maxXp * 100 : null,
        })),
        empty: "No disciplines configured",
      };
    }

    const configured = Boolean(bodyProfile.data);
    return {
      primary: configured ? "Ready" : "Start",
      primaryLabel: "body workspace",
      meta: configured ? "Profile connected" : "Setup not completed",
      progress: configured ? 100 : null,
      focus: configured ? "Your body at a glance" : "Set up Body",
      focusMeta: "Activity · Nutrition · Rest · Hygiene",
      items: [
        { id: "activity", label: "Activity" },
        { id: "nutrition", label: "Nutrition" },
        { id: "rest", label: "Rest" },
        { id: "hygiene", label: "Hygiene" },
      ],
      empty: "Body setup is not completed",
    };
  }, [
    bodyProfile.data,
    disciplines.data,
    goals.data,
    kind,
    languageMetrics.data,
    languages.data,
    planner.data,
    secondBrain.data,
    secondBrainMetrics.data,
    studies.data,
    studyMetrics.data,
  ]);
}

function RingVisual({ progress, value, label, itemCount }: { progress: number | null; value: string; label: string; itemCount: number }) {
  const amount = progress ?? 0;
  const nodes = Array.from({ length: Math.min(itemCount, 10) }, (_, index) => {
    const angle = (index / Math.max(1, Math.min(itemCount, 10))) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + Math.cos(angle) * 43, y: 50 + Math.sin(angle) * 43 };
  });
  return (
    <div className="relative mx-auto aspect-square h-full max-h-[132px] max-w-full">
      <svg className="-rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="43" fill="none" stroke="var(--widget-soft)" strokeWidth="9" />
        {progress !== null ? (
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke="var(--widget-accent)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${amount * 2.7018} 270.18`}
          />
        ) : nodes.map((node, index) => (
          <circle key={index} cx={node.x} cy={node.y} r="4.5" fill="var(--widget-accent)" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <strong className="text-[25px] font-semibold leading-none tracking-[-.045em]">{value}</strong>
        <span className="mt-1 max-w-[11ch] text-[10px] leading-tight text-[#747d89]">{label}</span>
      </div>
    </div>
  );
}

function FocusVisual({ summary, shape }: { summary: ModuleSummary; shape: WidgetShape }) {
  const quantified = summary.items
    .slice(0, 5)
    .filter((item) => item.value !== undefined || item.state !== undefined);
  return (
    <div className={shape === "horizontal" ? "grid h-full grid-cols-[minmax(0,1.4fr)_minmax(90px,.6fr)] items-end gap-6" : "flex h-full flex-col justify-end"}>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--widget-accent)]">In focus</p>
        <strong className="mt-2 block max-w-[18ch] text-[24px] font-semibold leading-[1.04] tracking-[-.04em]">{summary.focus}</strong>
        <p className="mt-2 truncate text-[11px] text-[#747d89]">{summary.focusMeta}</p>
      </div>
      {shape === "horizontal" && quantified.length > 0 ? (
        <div className="flex h-full items-end gap-1.5" aria-hidden="true">
          {quantified.map((item) => (
            <i
              key={item.id}
              className="min-w-0 flex-1 rounded-t-[5px] bg-[var(--widget-accent)]"
              style={{
                height: `${item.value == null ? (item.state ? 100 : 34) : Math.max(6, item.value)}%`,
                opacity: item.state === false ? .28 : .82,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MapVisual({ summary, shape }: { summary: ModuleSummary; shape: WidgetShape }) {
  if (summary.items.length === 0) {
    return <div className="flex h-full items-center justify-center text-center text-[12px] text-[#747d89]">{summary.empty}</div>;
  }
  const items = summary.items.slice(0, shape === "horizontal" ? 7 : 5);
  return (
    <div className={shape === "horizontal" ? "grid h-full grid-cols-3 gap-2" : "grid h-full grid-cols-2 gap-2"}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex min-h-0 flex-col justify-between overflow-hidden rounded-[10px] bg-[var(--widget-soft)] p-2.5"
          style={{ gridColumn: shape !== "horizontal" && index === 0 ? "span 2" : undefined }}
        >
          <span className="truncate text-[10px] font-medium">{item.label}</span>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
            <i
              className="block h-full rounded-full bg-[var(--widget-accent)]"
              style={{ width: item.value == null ? "100%" : `${Math.max(5, item.value)}%`, opacity: item.state === false ? .3 : 1 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ModuleWidget({
  kind,
  variant,
  size,
  shape,
  accentColor,
}: {
  kind: ModuleKind;
  variant: VariantKind;
  size: WidgetSize;
  shape: WidgetShape;
  accentColor?: string;
}) {
  const module = modules[kind];
  const summary = useModuleSummary(kind);
  const Icon = module.icon;
  const bottom = variant === "overview" ? summary.meta : variant === "focus" ? summary.primaryLabel : `${summary.items.length} visible`;

  return (
    <EWidgetCard size={size} accentColor={accentColor ?? module.accent}>
      <div
        className="grid h-full min-h-0 gap-[15px]"
        style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 48px" : "33px minmax(0,1fr) 33px" }}
      >
        <header className="flex min-h-0 items-center justify-between overflow-visible">
          <h3 className="min-w-0 truncate text-[18px] font-semibold leading-none tracking-[-.025em]">{module.label}</h3>
          <Icon className="h-[27px] w-[27px] shrink-0 text-[var(--widget-accent)]" />
        </header>

        <div className="min-h-0 overflow-visible">
          {variant === "overview" ? (
            shape === "horizontal" ? (
              <div className="grid h-full grid-cols-[132px_minmax(0,1fr)] items-center gap-6">
                <RingVisual progress={summary.progress} value={summary.primary} label={summary.primaryLabel} itemCount={summary.items.length} />
                <div className="min-w-0">
                  <strong className="block truncate text-[22px] font-semibold tracking-[-.035em]">{summary.focus}</strong>
                  <p className="mt-2 text-[11px] leading-5 text-[#747d89]">{summary.focusMeta}</p>
                </div>
              </div>
            ) : <RingVisual progress={summary.progress} value={summary.primary} label={summary.primaryLabel} itemCount={summary.items.length} />
          ) : variant === "focus" ? (
            <FocusVisual summary={summary} shape={shape} />
          ) : (
            <MapVisual summary={summary} shape={shape} />
          )}
        </div>

        <div className="flex min-h-0 items-end justify-between gap-3 overflow-visible text-[11px]">
          <span className="truncate text-[#747d89]">{bottom}</span>
          <span className="shrink-0 font-medium text-[var(--widget-accent)]">Open →</span>
        </div>
      </div>
    </EWidgetCard>
  );
}

function moduleDefinition(kind: ModuleKind): WidgetDefinition {
  const module = modules[kind];
  return defineWidget({
    id: module.id,
    legacyIds: [kind],
    href: module.href,
    label: module.label,
    icon: module.icon,
    defaultW: 1,
    defaultH: 1,
    defaultAccentColor: module.accent,
    allowedSizes: supportedSizes,
    visualizations: [
      { id: "overview", label: "Overview", defaultSize: { w: 1, h: 1 }, allowedSizes: supportedSizes },
      { id: "focus", label: "Focus", defaultSize: { w: 1, h: 1 }, allowedSizes: supportedSizes },
      { id: "map", label: "Map", defaultSize: { w: 1, h: 1 }, allowedSizes: supportedSizes },
    ],
    render: ({ size, shape, visualizationId, accentColor }) => (
      <ModuleWidget
        kind={kind}
        variant={visualizationId === "focus" ? "focus" : visualizationId === "map" ? "map" : "overview"}
        size={size}
        shape={shape}
        accentColor={accentColor}
      />
    ),
  });
}

export const dashboardModuleWidgets = (Object.keys(modules) as ModuleKind[]).map(moduleDefinition);

export const dashboardFirstRunPreset = {
  gridColumns: 4,
  includeAllWidgets: true,
  items: [
    { widgetId: "dashboard.planner", visualizationId: "focus", size: { w: 2, h: 1 }, accentColor: modules.planner.accent, placement: { row: 0, column: 0 } },
    { widgetId: "dashboard.goals", visualizationId: "overview", size: { w: 1, h: 1 }, accentColor: modules.goals.accent, placement: { row: 0, column: 2 } },
    { widgetId: "dashboard.body", visualizationId: "map", size: { w: 1, h: 1 }, accentColor: modules.body.accent, placement: { row: 0, column: 3 } },
    { widgetId: "dashboard.second_brain", visualizationId: "map", size: { w: 1, h: 1 }, accentColor: modules.second_brain.accent, placement: { row: 1, column: 0 } },
    { widgetId: "dashboard.languages", visualizationId: "focus", size: { w: 1, h: 1 }, accentColor: modules.languages.accent, placement: { row: 1, column: 1 } },
    { widgetId: "dashboard.studies", visualizationId: "overview", size: { w: 1, h: 1 }, accentColor: modules.studies.accent, placement: { row: 1, column: 2 } },
    { widgetId: "dashboard.disciplines", visualizationId: "focus", size: { w: 1, h: 1 }, accentColor: modules.disciplines.accent, placement: { row: 1, column: 3 } },
  ],
};
