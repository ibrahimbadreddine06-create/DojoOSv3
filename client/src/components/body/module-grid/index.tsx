import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Clock, ImageIcon, Plus, Settings2, Type, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Visualization {
  id: string;
  label: string;
}

/**
 * Body-module language for Vision 2:
 * - A body page is one section of the Body module, for example Hub, Rest,
 *   Activity, Nutrition, or Hygiene.
 * - A card is the conceptual unit on a body page, for example Effort Score.
 *   The current code still calls this a WidgetDefinition for historical reasons.
 * - A widget is a display form inside that card, for example Ring, Bar,
 *   Gauge, Sparkline, Heatmap, Timeline, List, or Number.
 *   The current code stores these under `visualizations`.
 * - A size is the grid footprint for that widget/card, for example 1x1,
 *   2x1, 1x2, 2x2, or 3x2.
 *
 * So "Effort Score" is one card. "Effort Score Ring" and "Effort Score Bar"
 * are widgets/display forms inside that card, not separate cards.
 */
export type WidgetSize = {
  w: number;
  h: number;
};

export type WidgetShape = "square" | "horizontal" | "vertical";

export interface WidgetRenderContext {
  size: WidgetSize;
  shape: WidgetShape;
  isEditing: boolean;
  visualizationId: string;
}

export interface WidgetDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultW: number;
  defaultH: number;
  /**
   * Returns widget content only.
   * ModuleGrid owns the outer shell, controls, sizing, drag, and resize behavior.
   */
  render: (context: WidgetRenderContext) => React.ReactNode;
  visualizations: Visualization[];
  allowedSizes?: WidgetSize[];
}

export function defineWidget(definition: WidgetDefinition): WidgetDefinition {
  return {
    ...definition,
    visualizations: definition.visualizations?.length
      ? definition.visualizations
      : [{ id: "default", label: "Default" }],
  };
}

interface ModuleGridState {
  activeIds: string[];
  sizes: Record<string, WidgetSize>;
  visualizations: Record<string, string>;
  gridColumns?: number;
  customWidgets?: CustomWidget[];
}

type CustomWidgetType = "image" | "text" | "clock";

type CustomWidget = {
  id: string;
  type: CustomWidgetType;
  label: string;
  imageData?: string;
  text?: string;
  borderless?: boolean;
};

type DragOverlay = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type GridMetrics = {
  columns: number;
  cellWidth: number;
  rowHeight: number;
  columnGap: number;
  rowGap: number;
  left: number;
  top: number;
};

type GridPlacement = {
  id: string;
  cell: number;
  row: number;
  column: number;
};

type ActiveWidget = {
  key: string;
  widget: WidgetDefinition;
  visualizationId: string;
  label: string;
};

type ResizeHandle = "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

const STORAGE_VERSION = 18;
const MIN_CELL_SIZE = 112;
const MAX_GRID_COLUMNS = 12;
const MAX_WIDGET_ROWS = 8;
const DRAG_SETTLE_MS = 0;
const DRAG_START_THRESHOLD = 8;

const ALL_WIDGET_SIZES: WidgetSize[] = Array.from({ length: MAX_GRID_COLUMNS }, (_, wIndex) =>
  Array.from({ length: MAX_WIDGET_ROWS }, (_, hIndex) => ({
    w: wIndex + 1,
    h: hIndex + 1,
  })),
).flat();


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function defaultSize(widget: WidgetDefinition): WidgetSize {
  return {
    w: Math.max(1, Math.round(widget.defaultW)),
    h: Math.max(1, Math.round(widget.defaultH)),
  };
}

function shapeFor(size: WidgetSize): WidgetShape {
  if (size.w > size.h) return "horizontal";
  if (size.h > size.w) return "vertical";
  return "square";
}

function allowedSizes(widget: WidgetDefinition): WidgetSize[] {
  const sizes = widget.allowedSizes?.length ? widget.allowedSizes : ALL_WIDGET_SIZES;
  const fallback = defaultSize(widget);
  const all = sizes.some((size) => size.w === fallback.w && size.h === fallback.h)
    ? sizes
    : [fallback, ...sizes];
  return Array.from(new Map(all.map((size) => [`${size.w}x${size.h}`, size])).values());
}

function visualizationOptions(widget: WidgetDefinition): Visualization[] {
  return widget.visualizations.length
    ? widget.visualizations
    : [{ id: "default", label: "Current" }];
}

function widgetVariantKey(widgetId: string, visualizationId: string) {
  return `${widgetId}::${visualizationId}`;
}

function defaultVisualizationId(widget: WidgetDefinition) {
  return visualizationOptions(widget)[0]?.id ?? "default";
}

function defaultWidgetKey(widget: WidgetDefinition) {
  return widgetVariantKey(widget.id, defaultVisualizationId(widget));
}

function widgetVariantLabel(widget: WidgetDefinition, visualizationId: string) {
  const options = visualizationOptions(widget);
  if (options.length <= 1) return widget.label;
  const visualization = options.find((option) => option.id === visualizationId);
  return visualization ? `${widget.label} ${visualization.label}` : widget.label;
}

function realVisualizationId(widget: WidgetDefinition, visualizationId: string) {
  return widget.visualizations.some((visualization) => visualization.id === visualizationId)
    ? visualizationId
    : widget.visualizations[0]?.id ?? "default";
}

function nearestAllowed(widget: WidgetDefinition, wanted: WidgetSize): WidgetSize {
  const sizes = allowedSizes(widget);
  return sizes.reduce((winner, size) => {
    const winnerScore = Math.abs(winner.w - wanted.w) * 2 + Math.abs(winner.h - wanted.h);
    const sizeScore = Math.abs(size.w - wanted.w) * 2 + Math.abs(size.h - wanted.h);
    return sizeScore < winnerScore ? size : winner;
  }, sizes[0]);
}

function fitSizeToColumns(size: WidgetSize, columns: number): WidgetSize {
  return { ...size, w: clamp(Math.round(size.w), 1, columns) };
}

function freshState(widgets: WidgetDefinition[], initialActiveWidgetIds?: string[]): ModuleGridState {
  const activeIds = initialActiveWidgetIds?.length
    ? widgets
      .filter((widget) => initialActiveWidgetIds.includes(widget.id))
      .map(defaultWidgetKey)
    : widgets.map(defaultWidgetKey);
  return {
    activeIds,
    sizes: Object.fromEntries(widgets.map((widget) => [defaultWidgetKey(widget), defaultSize(widget)])),
    visualizations: Object.fromEntries(widgets.map((widget) => {
      const visualizationId = defaultVisualizationId(widget);
      return [widgetVariantKey(widget.id, visualizationId), visualizationId];
    })),
    gridColumns: undefined,
    customWidgets: [],
  };
}

function loadState(key: string, widgets: WidgetDefinition[], initialActiveWidgetIds?: string[]): ModuleGridState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return freshState(widgets, initialActiveWidgetIds);

    const parsed = JSON.parse(raw) as ModuleGridState & { version?: number };
    if (parsed.version !== STORAGE_VERSION && parsed.version !== 12) return freshState(widgets, initialActiveWidgetIds);

    const customWidgets = parsed.customWidgets ?? [];
    const widgetById = new Map(widgets.map((widget) => [widget.id, widget]));
    const validKeys = new Set<string>();
    widgets.forEach((widget) => {
      visualizationOptions(widget).forEach((visualization) => {
        validKeys.add(widgetVariantKey(widget.id, visualization.id));
      });
    });
    customWidgets.forEach((widget) => validKeys.add(widgetVariantKey(widget.id, widget.type)));

    const normalizeActiveId = (id: string) => {
      if (validKeys.has(id)) return id;
      const widget = widgetById.get(id);
      if (widget) {
        const savedVisualization = parsed.visualizations?.[id] ?? defaultVisualizationId(widget);
        return widgetVariantKey(widget.id, realVisualizationId(widget, savedVisualization));
      }
      const custom = customWidgets.find((widget) => widget.id === id);
      if (custom) return widgetVariantKey(custom.id, custom.type);
      return null;
    };

    const activeIds = Array.from(new Set((parsed.activeIds ?? [])
      .map(normalizeActiveId)
      .filter((id): id is string => id !== null && validKeys.has(id))));

    const sizes: Record<string, WidgetSize> = {};
    widgets.forEach((widget) => {
      visualizationOptions(widget).forEach((visualization) => {
        const variantKey = widgetVariantKey(widget.id, visualization.id);
        const saved = parsed.sizes?.[variantKey] ?? parsed.sizes?.[widget.id];
        sizes[variantKey] = saved ? nearestAllowed(widget, saved) : defaultSize(widget);
      });
    });
    customWidgets.forEach((widget) => {
      const variantKey = widgetVariantKey(widget.id, widget.type);
      sizes[variantKey] = parsed.sizes?.[variantKey] ?? parsed.sizes?.[widget.id] ?? { w: widget.type === "text" ? 2 : 1, h: 1 };
    });

    return {
      activeIds,
      sizes,
      visualizations: {
        ...Object.fromEntries(widgets.flatMap((widget) => (
          visualizationOptions(widget).map((visualization) => [
            widgetVariantKey(widget.id, visualization.id),
            visualization.id,
          ])
        ))),
        ...Object.fromEntries(customWidgets.map((widget) => [widgetVariantKey(widget.id, widget.type), widget.type])),
      },
      gridColumns: parsed.gridColumns,
      customWidgets,
    };
  } catch {
    return freshState(widgets, initialActiveWidgetIds);
  }
}

function saveState(key: string, state: ModuleGridState) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...state, version: STORAGE_VERSION }));
  } catch {
    // Local customization is nice-to-have; rendering should never depend on it.
  }
}

function getGridMetrics(grid: HTMLElement): GridMetrics {
  const rect = grid.getBoundingClientRect();
  const styles = window.getComputedStyle(grid);
  const columns = styles.gridTemplateColumns.split(" ").filter(Boolean).length || 3;
  const columnGap = parseFloat(styles.columnGap) || 0;
  const rowGap = parseFloat(styles.rowGap) || 0;
  const rowHeight = parseFloat(styles.gridAutoRows) || 118;
  const cellWidth = (rect.width - columnGap * (columns - 1)) / columns;

  return {
    columns,
    cellWidth,
    rowHeight,
    columnGap,
    rowGap,
    left: rect.left,
    top: rect.top,
  };
}

function canPlace(occupied: boolean[][], row: number, column: number, size: WidgetSize, columns: number) {
  if (column + size.w > columns) return false;
  for (let y = row; y < row + size.h; y += 1) {
    for (let x = column; x < column + size.w; x += 1) {
      if (occupied[y]?.[x]) return false;
    }
  }
  return true;
}

function markPlaced(occupied: boolean[][], row: number, column: number, size: WidgetSize) {
  for (let y = row; y < row + size.h; y += 1) {
    occupied[y] ??= [];
    for (let x = column; x < column + size.w; x += 1) {
      occupied[y][x] = true;
    }
  }
}

function buildPlacements(
  ids: string[],
  sizes: Record<string, WidgetSize>,
  columns: number,
  pinned?: { id: string; row: number; column: number },
): GridPlacement[] {
  const occupied: boolean[][] = [];
  const placements: GridPlacement[] = [];
  let cursorCell = 0;

  if (pinned) {
    const pinnedSize = fitSizeToColumns(sizes[pinned.id] ?? { w: 1, h: 1 }, columns);
    const column = clamp(pinned.column, 0, Math.max(0, columns - pinnedSize.w));
    const row = Math.max(0, pinned.row);
    markPlaced(occupied, row, column, pinnedSize);
    placements.push({ id: pinned.id, row, column, cell: row * columns + column });
  }

  ids.forEach((id) => {
    if (id === pinned?.id) return;
    const size = fitSizeToColumns(sizes[id] ?? { w: 1, h: 1 }, columns);
    let cell = cursorCell;
    let placed = false;

    while (!placed) {
      const row = Math.floor(cell / columns);
      const column = cell % columns;
      if (canPlace(occupied, row, column, size, columns)) {
        markPlaced(occupied, row, column, size);
        placements.push({ id, row, column, cell });
        cursorCell = cell + size.w;
        placed = true;
      } else {
        cell += 1;
      }
    }
  });

  return placements;
}

function hardPlacementFromPointer(
  grid: HTMLElement,
  clientX: number,
  clientY: number,
  size: WidgetSize,
): { row: number; column: number } {
  const metrics = getGridMetrics(grid);
  const column = clamp(
    Math.round(((clientX - metrics.left) - metrics.cellWidth / 2) / (metrics.cellWidth + metrics.columnGap)),
    0,
    Math.max(0, metrics.columns - size.w),
  );
  const row = Math.max(
    0,
    Math.round(((clientY - metrics.top) - metrics.rowHeight / 2) / (metrics.rowHeight + metrics.rowGap)),
  );
  return { row, column };
}

function hardPlacementFromRect(
  grid: HTMLElement,
  rect: { left: number; top: number },
  size: WidgetSize,
): { row: number; column: number } {
  const metrics = getGridMetrics(grid);
  const stepX = metrics.cellWidth + metrics.columnGap;
  const stepY = metrics.rowHeight + metrics.rowGap;
  const column = clamp(
    Math.round((rect.left - metrics.left) / stepX),
    0,
    Math.max(0, metrics.columns - size.w),
  );
  const row = Math.max(0, Math.round((rect.top - metrics.top) / stepY));
  return { row, column };
}

function orderIdsForTargetCell(
  ids: string[],
  sizes: Record<string, WidgetSize>,
  columns: number,
  dragId: string,
  targetCell: number,
) {
  const remainingIds = ids.filter((id) => id !== dragId);
  const remainingPlacements = buildPlacements(remainingIds, sizes, columns);
  const insertIndex = remainingPlacements.findIndex((placement) => placement.cell >= targetCell);
  const nextIds = [...remainingIds];
  nextIds.splice(insertIndex === -1 ? nextIds.length : insertIndex, 0, dragId);
  return nextIds;
}

function orderIdsWithPinnedDrop(
  ids: string[],
  sizes: Record<string, WidgetSize>,
  columns: number,
  pinned: { id: string; row: number; column: number },
) {
  return buildPlacements(ids, sizes, columns, pinned)
    .sort((a, b) => a.cell - b.cell)
    .map((placement) => placement.id);
}

function CustomClockWidget(rootProps: React.HTMLAttributes<HTMLDivElement>) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div {...rootProps} className={cn("flex h-full w-full flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm", rootProps.className)}>
      {rootProps.children}
      <div className="font-mono text-3xl font-black tracking-tight sm:text-4xl">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">
        {time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
      </div>
    </div>
  );
}

function CustomTextWidget({
  text,
  borderless,
  ...rootProps
}: { text?: string; borderless?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rootProps}
      className={cn(
        "flex h-full w-full items-center rounded-2xl p-5",
        borderless ? "bg-transparent shadow-none" : "border border-border/60 bg-card shadow-sm",
        rootProps.className,
      )}
    >
      {rootProps.children}
      <p className="w-full whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-foreground/85">
        {text || "Double click while customizing to edit this text."}
      </p>
    </div>
  );
}

function CustomImageWidget({
  imageData,
  onImageChange,
  ...rootProps
}: {
  imageData?: string;
  onImageChange: (data: string) => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => onImageChange(String(loadEvent.target?.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div {...rootProps} className={cn("h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm", rootProps.className)}>
      {rootProps.children}
      {imageData ? (
        <img src={imageData} alt="Custom widget" className="h-full w-full object-cover" />
      ) : (
        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-muted-foreground transition-colors hover:bg-muted/25">
          <Upload className="h-6 w-6" />
          <span className="text-xs font-bold uppercase tracking-widest">Upload image</span>
          <Input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      )}
    </div>
  );
}

function AvailableWidgetPanel({
  widget,
  activeVisualizationIds,
  selectedVisualizationId,
  onSelectVisualization,
  onAdd,
}: {
  widget: WidgetDefinition;
  activeVisualizationIds: string[];
  selectedVisualizationId?: string;
  onSelectVisualization: (id: string) => void;
  onAdd: (visualizationId?: string) => void;
}) {
  const options = visualizationOptions(widget).filter((visualization) => !activeVisualizationIds.includes(visualization.id));
  const selected = selectedVisualizationId && options.some((option) => option.id === selectedVisualizationId)
    ? selectedVisualizationId
    : options[0]?.id ?? defaultVisualizationId(widget);
  const renderVisualization = realVisualizationId(widget, selected);
  const previewSize = defaultSize(widget);
  const preview = widget.render({
    size: previewSize,
    shape: shapeFor(previewSize),
    isEditing: false,
    visualizationId: renderVisualization,
  });

  return (
    <div className="space-y-3">
      <div>
        <p className="truncate text-sm font-black">{widget.label}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">Pick a widget variant, then click the preview to add it.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {options.map((visualization) => (
          <button
            key={visualization.id}
            type="button"
            className={cn("dojo-visual-tab", selected === visualization.id && "is-active")}
            onClick={() => onSelectVisualization(visualization.id)}
          >
            {visualization.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="dojo-available-preview"
        onClick={() => onAdd(renderVisualization)}
        aria-label={`Add ${widgetVariantLabel(widget, renderVisualization)}`}
      >
        <div className="dojo-available-preview-content">
          {preview}
        </div>
        <span className="dojo-available-preview-overlay">
          <Plus className="h-5 w-5" />
        </span>
      </button>
    </div>
  );
}

export interface ModuleGridProps {
  widgets: WidgetDefinition[];
  storageKey: string;
  initialActiveWidgetIds?: string[];
}

export function ModuleGrid({ widgets, storageKey, initialActiveWidgetIds }: ModuleGridProps) {
  return <ModuleGridInstance key={storageKey} widgets={widgets} storageKey={storageKey} initialActiveWidgetIds={initialActiveWidgetIds} />;
}

function ModuleGridInstance({ widgets, storageKey, initialActiveWidgetIds }: ModuleGridProps) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<ModuleGridState>(() => loadState(storageKey, widgets, initialActiveWidgetIds));
  const [addPopoverOpen, setAddPopoverOpen] = useState(false);
  const [availablePopoverId, setAvailablePopoverId] = useState<string | null>(null);
  const [availableVisualizationId, setAvailableVisualizationId] = useState<string | undefined>();
  const [customEditorId, setCustomEditorId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftBorderless, setDraftBorderless] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [resizeId, setResizeId] = useState<string | null>(null);
  const [hardPlacement, setHardPlacement] = useState<{ id: string; row: number; column: number } | null>(null);
  const [dragOverlay, setDragOverlay] = useState<DragOverlay | null>(null);
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const placementAnimationsRef = useRef<Map<string, Animation>>(new Map());
  const pendingPlacementRef = useRef<{ id: string; row: number; column: number } | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const resizingRef = useRef(false);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    hasMoved: boolean;
    offsetX: number;
    offsetY: number;
    placement: { row: number; column: number } | null;
    latestPlacement: { row: number; column: number } | null;
    size: WidgetSize;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    saveState(storageKey, state);
  }, [state, storageKey]);

  useEffect(() => {
    if (!addPopoverOpen && !availablePopoverId) return;

    const closeFloatingPanels = () => {
      setAddPopoverOpen(false);
      setAvailablePopoverId(null);
    };

    window.addEventListener("scroll", closeFloatingPanels, true);
    return () => window.removeEventListener("scroll", closeFloatingPanels, true);
  }, [addPopoverOpen, availablePopoverId]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateGridWidth = () => setGridWidth(grid.getBoundingClientRect().width);

    updateGridWidth();
    const observer = new ResizeObserver(updateGridWidth);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  const maxColumns = useMemo(() => {
    if (!gridWidth) return 3;
    const gap = gridWidth >= 1180 ? 18 : gridWidth >= 760 ? 16 : 14;
    return clamp(
      Math.floor((gridWidth + gap) / (MIN_CELL_SIZE + gap)),
      1,
      MAX_GRID_COLUMNS,
    );
  }, [gridWidth]);

  const effectiveColumns = clamp(state.gridColumns ?? 3, 1, maxColumns);

  const cellSize = useMemo(() => {
    if (!gridWidth) return null;
    const gap = gridWidth >= 1180 ? 18 : gridWidth >= 760 ? 16 : 14;
    return (gridWidth - gap * (effectiveColumns - 1)) / effectiveColumns;
  }, [effectiveColumns, gridWidth]);

  const setGridColumns = useCallback((columns: number) => {
    setState((prev) => ({
      ...prev,
      gridColumns: clamp(columns, 1, maxColumns),
      sizes: Object.fromEntries(
        Object.entries(prev.sizes).map(([id, size]) => [
          id,
          { ...size, w: Math.min(size.w, clamp(columns, 1, maxColumns)) },
        ]),
      ),
    }));
  }, [maxColumns]);

  const updateCustomWidget = useCallback((id: string, patch: Partial<CustomWidget>) => {
    setState((prev) => ({
      ...prev,
      customWidgets: (prev.customWidgets ?? []).map((widget) =>
        widget.id === id ? { ...widget, ...patch } : widget,
      ),
    }));
  }, []);

  const openCustomTextEditor = useCallback((widget: CustomWidget) => {
    if (!editing || widget.type !== "text") return;
    setCustomEditorId(widget.id);
    setDraftText(widget.text ?? "");
    setDraftBorderless(Boolean(widget.borderless));
  }, [editing]);

  const addCustomWidget = useCallback((type: CustomWidgetType) => {
    const id = `${type}_${Date.now()}`;
    const customWidget: CustomWidget = {
      id,
      type,
      label: type === "image" ? "Image" : type === "clock" ? "Clock" : "Text",
      text: type === "text" ? "Write something..." : undefined,
      borderless: type === "text",
    };
    const size = type === "text" ? { w: Math.min(2, effectiveColumns), h: 1 } : { w: 1, h: 1 };

    setState((prev) => ({
      ...prev,
      customWidgets: [...(prev.customWidgets ?? []), customWidget],
      activeIds: [...prev.activeIds, widgetVariantKey(id, type)],
      sizes: { ...prev.sizes, [widgetVariantKey(id, type)]: size },
      visualizations: { ...prev.visualizations, [widgetVariantKey(id, type)]: type },
    }));
    setAddPopoverOpen(false);
    if (type === "text") {
      setCustomEditorId(id);
      setDraftText(customWidget.text ?? "");
      setDraftBorderless(true);
    }
  }, [effectiveColumns]);

  const customDefinitions = useMemo<WidgetDefinition[]>(() => (
    (state.customWidgets ?? []).map((customWidget) => ({
      id: customWidget.id,
      label: customWidget.label,
      icon: customWidget.type === "image" ? ImageIcon : customWidget.type === "clock" ? Clock : Type,
      defaultW: customWidget.type === "text" ? 2 : 1,
      defaultH: 1,
      visualizations: [{ id: customWidget.type, label: customWidget.label }],
      render: () => {
        if (customWidget.type === "clock") return <CustomClockWidget />;
        if (customWidget.type === "image") {
          return (
            <CustomImageWidget
              imageData={customWidget.imageData}
              onImageChange={(data) => updateCustomWidget(customWidget.id, { imageData: data })}
            />
          );
        }
        return (
          <CustomTextWidget
            text={customWidget.text}
            borderless={customWidget.borderless}
            onDoubleClick={() => openCustomTextEditor(customWidget)}
          />
        );
      },
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [state.customWidgets]);

  const allWidgets = useMemo(() => [...widgets, ...customDefinitions], [customDefinitions, widgets]);

  const activeWidgets = useMemo(() => {
    const byId = new Map(allWidgets.map((widget) => [widget.id, widget]));
    return state.activeIds
      .map((key) => {
        const [widgetId, savedVisualizationId] = key.split("::");
        const widget = byId.get(widgetId);
        if (!widget) return null;
        const visualizationId = realVisualizationId(widget, state.visualizations[key] ?? savedVisualizationId ?? defaultVisualizationId(widget));
        return {
          key,
          widget,
          visualizationId,
          label: widgetVariantLabel(widget, visualizationId),
        };
      })
      .filter((entry): entry is ActiveWidget => Boolean(entry));
  }, [allWidgets, customDefinitions, state.activeIds, state.visualizations]);

  const hiddenWidgets = useMemo(
    () => widgets.filter((widget) => visualizationOptions(widget).some((visualization) => (
      !state.activeIds.includes(widgetVariantKey(widget.id, visualization.id))
    ))),
    [widgets, state.activeIds],
  );

  const draggedWidget = useMemo(
    () => activeWidgets.find((entry) => entry.key === dragOverlay?.id) ?? null,
    [activeWidgets, dragOverlay?.id],
  );

  const renderWidgetShell = useCallback((
    content: React.ReactNode,
    shellProps: React.HTMLAttributes<HTMLDivElement>,
    controls?: React.ReactNode,
  ) => {
    if (React.isValidElement<{ className?: string; children?: React.ReactNode; style?: React.CSSProperties }>(content) && content.type !== React.Fragment) {
      return React.cloneElement(content, {
        ...shellProps,
        className: cn("dojo-widget-root cursor-pointer", content.props.className, shellProps.className),
        style: { ...content.props.style, ...shellProps.style },
        children: (
          <>
            {controls}
            {content.props.children}
          </>
        ),
      });
    }

    return (
      <div
        {...shellProps}
        className={cn(
          "dojo-widget-root bg-card border border-border/60 shadow-sm rounded-2xl flex flex-col p-4 transition-shadow hover:shadow-md cursor-pointer overflow-visible",
          shellProps.className,
        )}
      >
        {controls}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {content}
        </div>
      </div>
    );
  }, []);

  const placementsById = useMemo(() => {
    return new Map(
      buildPlacements(state.activeIds, state.sizes, effectiveColumns, hardPlacement ?? undefined)
        .map((placement) => [placement.id, placement]),
    );
  }, [effectiveColumns, hardPlacement, state.activeIds, state.sizes]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const previousRects = previousRectsRef.current;
    const nextRects = new Map<string, DOMRect>();
    const elements = Array.from(grid.querySelectorAll<HTMLElement>("[data-widget-id]"));

    if (resizingRef.current) {
      elements.forEach((element) => {
        const id = element.dataset.widgetId;
        if (id) nextRects.set(id, element.getBoundingClientRect());
      });
      previousRectsRef.current = nextRects;
      return;
    }

    elements.forEach((element) => {
      const id = element.dataset.widgetId;
      if (!id) return;
      const currentRect = element.getBoundingClientRect();
      const previousRect = previousRects.get(id);
      nextRects.set(id, currentRect);

      if (!previousRect || dragId === id) return;
      const dx = previousRect.left - currentRect.left;
      const dy = previousRect.top - currentRect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      placementAnimationsRef.current.get(id)?.cancel();
      const animation = element.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0, 0)" },
        ],
        {
          duration: dragId ? 420 : 320,
          easing: dragId ? "cubic-bezier(0.16, 1, 0.3, 1)" : "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
      placementAnimationsRef.current.set(id, animation);
      animation.onfinish = () => {
        if (placementAnimationsRef.current.get(id) === animation) {
          placementAnimationsRef.current.delete(id);
        }
      };
      animation.oncancel = animation.onfinish;
    });

    previousRectsRef.current = nextRects;
  }, [dragId, effectiveColumns, hardPlacement, placementsById, state.activeIds, state.sizes]);

  const setWidgetSize = useCallback((entry: ActiveWidget, size: WidgetSize) => {
    setState((prev) => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [entry.key]: fitSizeToColumns(nearestAllowed(entry.widget, size), effectiveColumns),
      },
    }));
  }, [effectiveColumns]);

  const addWidget = useCallback((id: string, visualizationId?: string) => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return;
    const realVisualization = realVisualizationId(widget, visualizationId ?? defaultVisualizationId(widget));
    const variantKey = widgetVariantKey(id, realVisualization);

    setState((prev) => ({
      ...prev,
      activeIds: prev.activeIds.includes(variantKey) ? prev.activeIds : [...prev.activeIds, variantKey],
      sizes: {
        ...prev.sizes,
        [variantKey]: fitSizeToColumns(prev.sizes[variantKey] ?? defaultSize(widget), effectiveColumns),
      },
      visualizations: {
        ...prev.visualizations,
        [variantKey]: realVisualization,
      },
    }));
  }, [effectiveColumns, widgets]);

  const beginDrag = useCallback((event: React.PointerEvent<HTMLElement>, entry: ActiveWidget) => {
    if (!editing) return;
    if ((event.target as HTMLElement).closest(".dojo-widget-action,.dojo-resize-handle")) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const size = state.sizes[entry.key] ?? defaultSize(entry.widget);
    dragRef.current = {
      id: entry.key,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      placement: null,
      latestPlacement: null,
      size,
      width: rect.width,
      height: rect.height,
    };
    const initialPlacement = gridRef.current ? hardPlacementFromRect(gridRef.current, { left: rect.left, top: rect.top }, size) : null;
    setHardPlacement(initialPlacement ? { id: entry.key, ...initialPlacement } : null);
    setDragId(entry.key);
    setDragOverlay({
      id: entry.key,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
    document.body.classList.add("dojo-grid-dragging");

    const clearSettleTimer = () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };

    const onMove = (moveEvent: PointerEvent) => {
      const drag = dragRef.current;
      const grid = gridRef.current;
      if (!drag || !grid) return;

      const totalDx = moveEvent.clientX - drag.startX;
      const totalDy = moveEvent.clientY - drag.startY;
      if (!drag.hasMoved && Math.hypot(totalDx, totalDy) < DRAG_START_THRESHOLD) {
        return;
      }
      drag.hasMoved = true;

      const nextOverlay = {
        id: drag.id,
        x: moveEvent.clientX - drag.offsetX,
        y: moveEvent.clientY - drag.offsetY,
        width: drag.width,
        height: drag.height,
      };
      setDragOverlay(nextOverlay);

      const placement = hardPlacementFromRect(
        grid,
        { left: nextOverlay.x, top: nextOverlay.y },
        drag.size,
      );
      drag.latestPlacement = placement;
      const pending = pendingPlacementRef.current;
      const samePending = pending?.id === drag.id
        && pending.row === placement.row
        && pending.column === placement.column;

      if (!samePending) {
        clearSettleTimer();
        pendingPlacementRef.current = { id: drag.id, ...placement };
        settleTimerRef.current = window.setTimeout(() => {
          const settled = pendingPlacementRef.current;
          const activeDrag = dragRef.current;
          if (!settled || !activeDrag || settled.id !== activeDrag.id) return;
          activeDrag.placement = { row: settled.row, column: settled.column };
          setHardPlacement(settled);
          settleTimerRef.current = null;
        }, DRAG_SETTLE_MS);
      }
    };

    const onUp = () => {
      clearSettleTimer();
      const drag = dragRef.current;
      if (drag?.hasMoved) {
        const targetPlacement = drag.placement ?? drag.latestPlacement;
        const activeIds = targetPlacement
          ? orderIdsWithPinnedDrop(
            state.activeIds,
            state.sizes,
            effectiveColumns,
            { id: drag.id, ...targetPlacement },
          )
          : state.activeIds;
        setState((prev) => ({ ...prev, activeIds }));
        setHardPlacement(targetPlacement ? { id: drag.id, ...targetPlacement } : null);
      }
      dragRef.current = null;
      pendingPlacementRef.current = null;
      setDragId(null);
      setDragOverlay(null);
      document.body.classList.remove("dojo-grid-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }, [editing, effectiveColumns, state.activeIds, state.sizes]);

  const beginResize = useCallback((
    event: React.PointerEvent,
    entry: ActiveWidget,
    handle: ResizeHandle,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const grid = gridRef.current;
    if (!grid) return;

    const metrics = getGridMetrics(grid);
    const startX = event.clientX;
    const startY = event.clientY;
    const start = state.sizes[entry.key] ?? defaultSize(entry.widget);
    let lastSize = start;
    resizingRef.current = true;
    setResizeId(entry.key);

    const affectsLeft = handle.includes("w");
    const affectsRight = handle.includes("e");
    const affectsTop = handle.includes("n");
    const affectsBottom = handle.includes("s");

    const onMove = (moveEvent: PointerEvent) => {
      const rawDx = Math.round((moveEvent.clientX - startX) / (metrics.cellWidth + metrics.columnGap));
      const rawDy = Math.round((moveEvent.clientY - startY) / (metrics.rowHeight + metrics.rowGap));
      const dx = affectsLeft ? -rawDx : affectsRight ? rawDx : 0;
      const dy = affectsTop ? -rawDy : affectsBottom ? rawDy : 0;
      const nextSize = {
        w: clamp(start.w + dx, 1, effectiveColumns),
        h: clamp(start.h + dy, 1, MAX_WIDGET_ROWS),
      };
      if (nextSize.w === lastSize.w && nextSize.h === lastSize.h) return;
      lastSize = nextSize;
      setWidgetSize(entry, nextSize);
    };

    const onUp = () => {
      resizingRef.current = false;
      setResizeId(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [effectiveColumns, setWidgetSize, state.sizes]);

  return (
    <section className="dojo-module-grid" aria-label="Module widgets">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {editing ? (
          <div className="dojo-column-picker" aria-label="Grid columns">
            <span className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">Grid</span>
            {Array.from({ length: maxColumns }, (_, index) => index + 1).map((columns) => (
              <button
                key={columns}
                type="button"
                className={cn("dojo-column-option", columns === effectiveColumns && "is-active")}
                onClick={() => setGridColumns(columns)}
                aria-label={`${columns} columns`}
              >
                {columns}
              </button>
            ))}
          </div>
        ) : <span />}
        <div className="flex items-center gap-2">
          {editing && (
            <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Add widget
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 rounded-2xl p-2 max-h-[80vh] overflow-y-auto">
                <div className="mb-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-border/40">
                  Custom Widgets
                </div>
                <button type="button" className="dojo-add-widget-option" onClick={() => addCustomWidget("image")}>
                  <ImageIcon className="h-4 w-4" />
                  <span>Image</span>
                </button>
                <button type="button" className="dojo-add-widget-option" onClick={() => addCustomWidget("text")}>
                  <Type className="h-4 w-4" />
                  <span>Text</span>
                </button>
                <button type="button" className="dojo-add-widget-option" onClick={() => addCustomWidget("clock")}>
                  <Clock className="h-4 w-4" />
                  <span>Clock</span>
                </button>

                {hiddenWidgets.length > 0 && (
                  <>
                    <div className="mt-4 mb-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-border/40">
                      Available Biometrics
                    </div>
                    {hiddenWidgets.map((widget) => (
                      <button
                        key={widget.id}
                        type="button"
                        className="dojo-add-widget-option"
                        onClick={() => {
                          addWidget(widget.id);
                          setAddPopoverOpen(false);
                        }}
                      >
                        {widget.icon ? <widget.icon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        <span>{widget.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </PopoverContent>
            </Popover>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 rounded-lg px-3 text-xs", editing ? "bg-muted text-foreground" : "text-muted-foreground")}
            onClick={() => setEditing((value) => !value)}
          >
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            {editing ? "Done" : "Customize"}
          </Button>
        </div>
      </div>

      {activeWidgets.length > 0 ? (
        <div
          ref={gridRef}
          className={cn("dojo-native-grid", editing && "is-editing")}
          style={{
            "--dojo-grid-columns": effectiveColumns,
            ...(cellSize ? { "--dojo-cell-size": `${cellSize}px` } : null),
          } as React.CSSProperties}
        >
          {activeWidgets.map((entry) => {
            const size = state.sizes[entry.key] ?? defaultSize(entry.widget);
            const visualizationId = entry.visualizationId;
            const content = entry.widget.render({
              size,
              shape: shapeFor(size),
              isEditing: editing,
              visualizationId,
            });
            const gridProps = {
              key: entry.key,
              onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => beginDrag(event, entry),
              onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
                if (!editing) return;
                if ((event.target as HTMLElement).closest(".dojo-widget-action,.dojo-resize-handle")) return;
                event.preventDefault();
                event.stopPropagation();
              },
              style: {
                gridColumn: `${(placementsById.get(entry.key)?.column ?? 0) + 1} / span ${size.w}`,
                gridRow: `${(placementsById.get(entry.key)?.row ?? 0) + 1} / span ${size.h}`,
              } as React.CSSProperties,
              "data-widget-id": entry.key,
              "data-widget-shape": shapeFor(size),
              "data-widget-w": size.w,
              "data-widget-h": size.h,
              "data-dragging": dragId === entry.key ? "true" : undefined,
              "data-resizing": resizeId === entry.key ? "true" : undefined,
              className: cn(editing && "is-editing select-none"),
            };
            const controls = editing ? (
              <>
                <span className="dojo-resize-handle dojo-resize-n" onPointerDown={(event) => beginResize(event, entry, "n")} />
                <span className="dojo-resize-handle dojo-resize-e" onPointerDown={(event) => beginResize(event, entry, "e")} />
                <span className="dojo-resize-handle dojo-resize-s" onPointerDown={(event) => beginResize(event, entry, "s")} />
                <span className="dojo-resize-handle dojo-resize-w" onPointerDown={(event) => beginResize(event, entry, "w")} />
              </>
            ) : null;

            return renderWidgetShell(content, gridProps, controls);
          })}
        </div>
      ) : (
        <button
          type="button"
          className="flex h-28 w-full items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/15 text-sm font-medium text-muted-foreground/60"
          onClick={() => hiddenWidgets[0] && setAvailablePopoverId(hiddenWidgets[0].id)}
        >
          <Plus className="mr-2 h-4" />
          Add your first widget
        </button>
      )}

      {dragOverlay && draggedWidget && (() => {
        const size = state.sizes[draggedWidget.key] ?? defaultSize(draggedWidget.widget);
        const visualizationId = draggedWidget.visualizationId;
        const content = draggedWidget.widget.render({
          size,
          shape: shapeFor(size),
          isEditing: true,
          visualizationId,
        });
        const overlayProps = {
          className: "dojo-drag-overlay",
          style: {
            left: dragOverlay.x,
            top: dragOverlay.y,
            width: dragOverlay.width,
            height: dragOverlay.height,
          } as React.CSSProperties,
        };

        return renderWidgetShell(content, overlayProps);
      })()}

      {editing && hiddenWidgets.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/45">
            Available widgets
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hiddenWidgets.map((widget) => {
              const Icon = widget.icon;
              const activeVisualizationIds = visualizationOptions(widget)
                .map((visualization) => visualization.id)
                .filter((visualizationId) => state.activeIds.includes(widgetVariantKey(widget.id, visualizationId)));
              const availableCount = visualizationOptions(widget).length - activeVisualizationIds.length;
              return (
                <Popover
                  key={widget.id}
                  open={availablePopoverId === widget.id}
                  onOpenChange={(open) => {
                    setAvailablePopoverId(open ? widget.id : null);
                    setAvailableVisualizationId(undefined);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="dojo-available-widget"
                      aria-label={`Configure ${widget.label}`}
                    >
                      <span className="dojo-available-icon">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{widget.label}</span>
                        <span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                          {availableCount} widget{availableCount === 1 ? "" : "s"} available
                        </span>
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" side="top" className="dojo-available-popover">
                    <AvailableWidgetPanel
                      widget={widget}
                      activeVisualizationIds={activeVisualizationIds}
                      selectedVisualizationId={availableVisualizationId}
                      onSelectVisualization={setAvailableVisualizationId}
                      onAdd={(visualizationId) => {
                        addWidget(widget.id, visualizationId);
                        setAvailablePopoverId(null);
                        setAvailableVisualizationId(undefined);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      )}

      <Dialog
        open={!!customEditorId}
        onOpenChange={(open) => {
          if (!open) setCustomEditorId(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit text widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              className="min-h-32 resize-none rounded-xl"
              placeholder="Write something..."
            />
            <button
              type="button"
              className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-semibold", draftBorderless ? "border-foreground bg-foreground text-background" : "border-border/60 bg-muted/20")}
              onClick={() => setDraftBorderless((value) => !value)}
            >
              Borderless
              <span className="text-xs opacity-70">{draftBorderless ? "On" : "Off"}</span>
            </button>
            <Button
              className="h-11 w-full rounded-xl"
              onClick={() => {
                if (customEditorId) {
                  updateCustomWidget(customEditorId, { text: draftText, borderless: draftBorderless });
                }
                setCustomEditorId(null);
              }}
            >
              Save text
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
