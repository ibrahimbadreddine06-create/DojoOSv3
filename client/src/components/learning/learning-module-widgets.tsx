import type { ComponentType } from "react";
import { TbChartLine, TbGridDots, TbRoute } from "react-icons/tb";
import type { IconType } from "react-icons";
import { EWidgetCard } from "@/components/body/e-widget-card";
import {
  defineWidget,
  type ModuleGridPreset,
  type WidgetDefinition,
  type WidgetShape,
  type WidgetSize,
} from "@/components/body/module-grid";
import { ScrollableHistoryChart } from "@/components/charts/scrollable-history-chart";
import { PlannerBridgeWidget } from "@/components/planner/planner-bridge-widget";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";

export type LearningModuleKind =
  | "second_brain"
  | "languages"
  | "studies"
  | "disciplines";

export type LearningEntity = {
  id: string;
  name: string;
  href: string;
  description?: string | null;
  completion?: number | null;
  readiness?: number | null;
  itemCount?: number | null;
  itemLabel?: string;
  secondaryValue?: string | number | null;
  secondaryLabel?: string;
  archived?: boolean;
  onDelete?: () => void;
  onArchive?: () => void;
};

export type LearningHistoryPoint = {
  date: string;
  fullDate?: string;
  [series: string]: string | number | null | undefined;
};

export type LearningHistorySeries = {
  key: string;
  label: string;
  color: string;
};

export type LearningModuleWidgetConfig = {
  kind: LearningModuleKind;
  label: string;
  href: string;
  icon: IconType;
  accent: string;
  entities: LearningEntity[];
  history: LearningHistoryPoint[];
  historySeries: LearningHistorySeries[];
  historyLabel?: string;
  gridColumns?: 2 | 3 | 4;
  entityDefaultSize?: WidgetSize;
  entityAllowedSizes?: WidgetSize[];
  historyDefaultSize?: WidgetSize;
  historyAllowedSizes?: WidgetSize[];
  plannerDefaultSize?: WidgetSize;
  plannerAllowedSizes?: WidgetSize[];
};

const supportedSizes: WidgetSize[] = [
  { w: 1, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 1 },
  { w: 2, h: 2 },
];

function percent(value: number | null | undefined) {
  return value == null || !Number.isFinite(value)
    ? null
    : Math.max(0, Math.min(100, value));
}

function learningEntityWidgetId(kind: LearningModuleKind, entityId: string) {
  return `learning.${kind}.entity.${entityId}`;
}

function EntityRing({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  const amount = value ?? 0;
  return (
    <div className="relative mx-auto aspect-square h-full max-h-[136px] max-w-full">
      <svg className="-rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="43" fill="none" stroke="var(--widget-soft)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="var(--widget-accent)"
          strokeDasharray={`${amount * 2.7018} 270.18`}
          strokeLinecap="round"
          strokeWidth="9"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <strong className="text-[25px] font-semibold leading-none tracking-[-.045em]">
          {value == null ? "—" : `${Math.round(value)}%`}
        </strong>
        <span className="mt-1 text-[10px] text-[#747d89]">{label}</span>
      </div>
    </div>
  );
}

function EntityPath({
  entity,
  shape,
}: {
  entity: LearningEntity;
  shape: WidgetShape;
}) {
  const completion = percent(entity.completion) ?? 0;
  const readiness = percent(entity.readiness);
  const nodes = shape === "horizontal" ? 7 : 5;
  return (
    <div className="flex h-full min-h-0 flex-col justify-center">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: nodes }, (_, index) => {
          const filled = index / Math.max(1, nodes - 1) <= completion / 100;
          return (
            <span key={index} className="contents">
              <i
                className="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                style={{
                  borderColor: "var(--widget-accent)",
                  backgroundColor: filled ? "var(--widget-accent)" : "white",
                }}
              />
              {index < nodes - 1 ? (
                <i className="h-[3px] min-w-0 flex-1 rounded-full bg-[var(--widget-soft)]">
                  {filled ? <i className="block h-full w-full rounded-full bg-[var(--widget-accent)]" /> : null}
                </i>
              ) : null}
            </span>
          );
        })}
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <strong className="text-[24px] font-semibold leading-none tracking-[-.04em]">
            {Math.round(completion)}%
          </strong>
          <p className="mt-1 text-[10px] text-[#747d89]">complete</p>
        </div>
        {readiness !== null ? (
          <div className="text-right">
            <strong className="text-[17px] font-semibold">{Math.round(readiness)}%</strong>
            <p className="text-[10px] text-[#747d89]">ready</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EntityMap({
  entity,
  shape,
}: {
  entity: LearningEntity;
  shape: WidgetShape;
}) {
  const completion = percent(entity.completion);
  const readiness = percent(entity.readiness);
  const values = [
    { label: "Progress", value: completion == null ? "—" : `${Math.round(completion)}%` },
    ...(readiness == null ? [] : [{ label: "Readiness", value: `${Math.round(readiness)}%` }]),
    ...(entity.itemCount == null
      ? []
      : [{ label: entity.itemLabel ?? "Items", value: String(entity.itemCount) }]),
    ...(entity.secondaryValue == null
      ? []
      : [{ label: entity.secondaryLabel ?? "Status", value: String(entity.secondaryValue) }]),
  ].slice(0, shape === "horizontal" ? 4 : 3);

  return (
    <div className={shape === "horizontal" ? "grid h-full grid-cols-2 gap-2" : "grid h-full grid-cols-2 gap-2"}>
      {values.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="flex min-h-0 flex-col justify-between rounded-[10px] bg-[var(--widget-soft)] p-2.5"
          style={shape !== "horizontal" && index === 0 ? { gridColumn: "span 2" } : undefined}
        >
          <span className="truncate text-[10px] text-[#747d89]">{item.label}</span>
          <strong className="mt-2 truncate text-[17px] font-semibold tracking-[-.025em]">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function EntityWidgetContent({
  entity,
  module,
  variant,
  size,
  shape,
  accentColor,
}: {
  entity: LearningEntity;
  module: Pick<LearningModuleWidgetConfig, "label" | "icon" | "accent">;
  variant: "progress" | "path" | "map";
  size: WidgetSize;
  shape: WidgetShape;
  accentColor?: string;
}) {
  const Icon = module.icon;
  const progress = percent(entity.completion);
  return (
    <EWidgetCard size={size} accentColor={accentColor ?? module.accent}>
      <div
        className="grid h-full min-h-0 gap-[15px]"
        style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 48px" : "33px minmax(0,1fr) 33px" }}
      >
        <header className="flex min-h-0 items-center justify-between overflow-visible">
          <h3 className="min-w-0 truncate text-[18px] font-semibold leading-none tracking-[-.025em]">
            {entity.name}
          </h3>
          <Icon className="h-[27px] w-[27px] shrink-0 text-[var(--widget-accent)]" />
        </header>

        <div className="min-h-0 overflow-visible">
          {variant === "progress" ? (
            shape === "horizontal" ? (
              <div className="grid h-full grid-cols-[136px_minmax(0,1fr)] items-center gap-6">
                <EntityRing value={progress} label="complete" />
                <div className="min-w-0">
                  <strong className="block text-[22px] font-semibold leading-tight tracking-[-.035em]">
                    {entity.secondaryValue ?? entity.itemCount ?? "Open"}
                  </strong>
                  <p className="mt-2 truncate text-[11px] text-[#747d89]">
                    {entity.secondaryLabel ?? entity.itemLabel ?? module.label}
                  </p>
                </div>
              </div>
            ) : <EntityRing value={progress} label="complete" />
          ) : variant === "path" ? (
            <EntityPath entity={entity} shape={shape} />
          ) : (
            <EntityMap entity={entity} shape={shape} />
          )}
        </div>

        <div className="flex min-h-0 items-end justify-between gap-3 overflow-visible text-[11px]">
          <span className="truncate text-[#747d89]">
            {entity.archived ? "Archived" : entity.description || module.label}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {entity.onArchive ? (
              <button
                type="button"
                aria-label={`${entity.archived ? "Restore" : "Archive"} ${entity.name}`}
                className="grid size-7 place-items-center rounded-full text-[#747d89] transition-colors hover:bg-[var(--widget-soft)] hover:text-[var(--widget-accent)]"
                onClick={(event) => {
                  event.stopPropagation();
                  entity.onArchive?.();
                }}
              >
                {entity.archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
              </button>
            ) : null}
            {entity.onDelete ? (
              <button
                type="button"
                aria-label={`Delete ${entity.name}`}
                className="grid size-7 place-items-center rounded-full text-[#747d89] transition-colors hover:bg-red-50 hover:text-red-600"
                onClick={(event) => {
                  event.stopPropagation();
                  if (window.confirm(`Delete "${entity.name}"? This cannot be undone.`)) {
                    entity.onDelete?.();
                  }
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
            <span className="font-medium text-[var(--widget-accent)]">Open →</span>
          </span>
        </div>
      </div>
    </EWidgetCard>
  );
}

export function createLearningEntityWidget(
  config: Pick<LearningModuleWidgetConfig, "kind" | "label" | "icon" | "accent" | "entityDefaultSize" | "entityAllowedSizes">,
  entity: LearningEntity,
): WidgetDefinition {
  const allowedSizes = config.entityAllowedSizes ?? supportedSizes;
  const defaultEntitySize = config.entityDefaultSize ?? { w: 1, h: 1 };
  return defineWidget({
    id: learningEntityWidgetId(config.kind, entity.id),
    href: entity.href,
    label: entity.name,
    icon: config.icon,
    defaultW: defaultEntitySize.w,
    defaultH: defaultEntitySize.h,
    defaultAccentColor: config.accent,
    allowedSizes,
    visualizations: [
      { id: "progress", label: "Progress", defaultSize: defaultEntitySize, allowedSizes },
      { id: "path", label: "Path", defaultSize: defaultEntitySize, allowedSizes },
      { id: "map", label: "Map", defaultSize: defaultEntitySize, allowedSizes },
    ],
    render: ({ size, shape, visualizationId, accentColor }) => (
      <EntityWidgetContent
        entity={entity}
        module={config}
        variant={visualizationId === "path" ? "path" : visualizationId === "map" ? "map" : "progress"}
        size={size}
        shape={shape}
        accentColor={accentColor}
      />
    ),
  });
}

function HistoryWidgetContent({
  config,
  size,
  variant,
  accentColor,
}: {
  config: LearningModuleWidgetConfig;
  size: WidgetSize;
  variant: "timeline" | "latest" | "range";
  accentColor?: string;
}) {
  const Icon = variant === "timeline" ? TbChartLine : variant === "range" ? TbRoute : TbGridDots;
  const latest = config.history.at(-1);
  const primarySeries = config.historySeries[0];
  const latestValue = latest && primarySeries ? latest[primarySeries.key] : null;

  return (
    <EWidgetCard size={size} accentColor={accentColor ?? config.accent}>
      <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: "33px minmax(0,1fr) 33px" }}>
        <header className="flex items-center justify-between overflow-visible">
          <h3 className="truncate text-[18px] font-semibold leading-none tracking-[-.025em]">
            {config.historyLabel ?? `${config.label} history`}
          </h3>
          <Icon className="h-[27px] w-[27px] shrink-0 text-[var(--widget-accent)]" />
        </header>
        <div className="min-h-0 overflow-visible">
          {variant === "latest" ? (
            <div className="flex h-full flex-col justify-end">
              <strong className="text-[38px] font-semibold leading-none tracking-[-.055em]">
                {typeof latestValue === "number" ? `${Math.round(latestValue)}%` : "—"}
              </strong>
              <p className="mt-2 text-[11px] text-[#747d89]">{primarySeries?.label ?? "Latest recorded value"}</p>
            </div>
          ) : (
            <ScrollableHistoryChart
              data={config.history}
              xKey="date"
              series={variant === "range" ? config.historySeries.slice(0, 2) : config.historySeries}
              height={size.h > 1 ? 420 : 220}
              leftAxis={{ domain: [0, 100], formatter: (value) => `${Math.round(value)}%` }}
            />
          )}
        </div>
        <div className="flex items-end justify-between gap-3 text-[11px]">
          <span className="truncate text-[#747d89]">{config.history.length} recorded points</span>
          <span className="font-medium text-[var(--widget-accent)]">{config.label}</span>
        </div>
      </div>
    </EWidgetCard>
  );
}

export function createLearningHistoryWidget(config: LearningModuleWidgetConfig): WidgetDefinition {
  const defaultHistorySize = config.historyDefaultSize ?? { w: config.gridColumns ?? 4, h: 2 };
  const historyAllowedSizes = config.historyAllowedSizes ?? Array.from(
    { length: defaultHistorySize.w },
    (_, widthIndex) => Array.from(
      { length: defaultHistorySize.h },
      (_, heightIndex) => ({ w: widthIndex + 1, h: heightIndex + 1 }),
    ),
  ).flat();
  return defineWidget({
    id: `learning.${config.kind}.history`,
    href: config.href,
    label: config.historyLabel ?? `${config.label} history`,
    icon: TbChartLine as ComponentType<{ className?: string }>,
    defaultW: defaultHistorySize.w,
    defaultH: defaultHistorySize.h,
    defaultAccentColor: config.accent,
    allowedSizes: historyAllowedSizes,
    visualizations: [
      { id: "timeline", label: "Timeline", defaultSize: defaultHistorySize, allowedSizes: historyAllowedSizes },
      { id: "latest", label: "Latest", defaultSize: { w: 1, h: 1 }, allowedSizes: historyAllowedSizes },
      { id: "range", label: "Range", defaultSize: defaultHistorySize, allowedSizes: historyAllowedSizes },
    ],
    render: ({ size, visualizationId, accentColor }) => (
      <HistoryWidgetContent
        config={config}
        size={size}
        variant={visualizationId === "latest" ? "latest" : visualizationId === "range" ? "range" : "timeline"}
        accentColor={accentColor}
      />
    ),
  });
}

export function createLearningPlannerWidget(config: LearningModuleWidgetConfig): WidgetDefinition {
  const defaultPlannerSize = config.plannerDefaultSize ?? { w: config.gridColumns ?? 4, h: 1 };
  const plannerAllowedSizes = config.plannerAllowedSizes ?? Array.from(
    { length: defaultPlannerSize.w },
    (_, widthIndex) => Array.from(
      { length: Math.max(2, defaultPlannerSize.h) },
      (_, heightIndex) => ({ w: widthIndex + 1, h: heightIndex + 1 }),
    ),
  ).flat();
  return defineWidget({
    id: `learning.${config.kind}.planner`,
    href: "/planner",
    label: `${config.label} today`,
    icon: TbRoute,
    defaultW: defaultPlannerSize.w,
    defaultH: defaultPlannerSize.h,
    defaultAccentColor: config.accent,
    allowedSizes: plannerAllowedSizes,
    visualizations: [
      { id: "next", label: "Next session", defaultSize: { w: 1, h: 1 }, allowedSizes: plannerAllowedSizes },
      { id: "today", label: "Today", defaultSize: defaultPlannerSize, allowedSizes: plannerAllowedSizes },
      { id: "schedule", label: "Schedule", defaultSize: defaultPlannerSize, allowedSizes: plannerAllowedSizes },
    ],
    render: ({ size, visualizationId, accentColor }) => (
      <EWidgetCard size={size} accentColor={accentColor ?? config.accent}>
        <PlannerBridgeWidget
          module={config.kind}
          title={visualizationId === "next" ? "Next session" : visualizationId === "schedule" ? `${config.label} schedule` : "Today"}
          accentColor={accentColor ?? config.accent}
          maxVisibleBlocks={visualizationId === "next" ? 1 : visualizationId === "schedule" || size.h > 1 ? 6 : 3}
          className="bg-transparent"
        />
      </EWidgetCard>
    ),
  });
}

export function createLearningModuleWidgets(config: LearningModuleWidgetConfig): WidgetDefinition[] {
  return [
    createLearningHistoryWidget(config),
    createLearningPlannerWidget(config),
    ...config.entities.map((entity) => createLearningEntityWidget(config, entity)),
  ];
}

export function createLearningModulePreset(config: LearningModuleWidgetConfig): ModuleGridPreset {
  const columns = config.gridColumns ?? 4;
  const historySize = config.historyDefaultSize ?? { w: columns, h: 2 };
  const plannerSize = config.plannerDefaultSize ?? { w: columns, h: 1 };
  const entitySize = config.entityDefaultSize ?? { w: 1, h: 1 };
  const entityRows = Math.max(
    1,
    Math.ceil((config.entities.length * entitySize.w) / columns) * entitySize.h,
  );
  const items: ModuleGridPreset["items"] = [
    ...config.entities.map((entity, index) => ({
      widgetId: learningEntityWidgetId(config.kind, entity.id),
      visualizationId: "progress",
      size: entitySize,
      accentColor: config.accent,
      placement: {
        row: Math.floor((index * entitySize.w) / columns) * entitySize.h,
        column: (index * entitySize.w) % columns,
      },
    })),
    {
      widgetId: `learning.${config.kind}.planner`,
      visualizationId: "today",
      size: plannerSize,
      accentColor: config.accent,
      placement: { row: entityRows, column: 0 },
    },
    {
      widgetId: `learning.${config.kind}.history`,
      visualizationId: "timeline",
      size: historySize,
      accentColor: config.accent,
      placement: { row: entityRows + plannerSize.h, column: 0 },
    },
  ];

  return {
    gridColumns: columns,
    includeAllWidgets: true,
    items,
  };
}

export const learningModuleSupportedSizes = supportedSizes;
