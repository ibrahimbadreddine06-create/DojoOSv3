import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import type { Layout } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiConfigModal } from "./kpi-config-modal";

const ResponsiveGridLayout = WidthProvider(Responsive);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Visualization {
  id: string;
  label: string;
}

export interface KpiDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Default column span (in a 3-col mobile grid) */
  defaultW: number;
  /** Default row span */
  defaultH: number;
  /** Render the actual widget content */
  render: () => React.ReactNode;
  /** Available visualization types for this KPI */
  visualizations: Visualization[];
}

interface GridLayouts {
  [breakpoint: string]: Layout[];
}

interface KpiGridState {
  layouts: GridLayouts;
  /** IDs of KPIs currently shown in the grid */
  activeIds: string[];
}

// ─── Grid constants ────────────────────────────────────────────────────────────
// All column counts are multiples of 3 so 1-col, 2-col, 3-col mobile widths
// map cleanly across breakpoints.
const COLS = { lg: 9, md: 6, sm: 3 };
const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const ROW_HEIGHT = 120;
const MARGIN: [number, number] = [10, 10];

// ─── Layout helpers ────────────────────────────────────────────────────────────

function buildDefaultLayouts(kpis: KpiDefinition[]): GridLayouts {
  const layouts: GridLayouts = {};

  for (const [bp, cols] of Object.entries(COLS) as [string, number][]) {
    let x = 0;
    let y = 0;

    layouts[bp] = kpis.map((kpi) => {
      const w = Math.min(kpi.defaultW, cols);
      if (x + w > cols) {
        x = 0;
        y++;
      }
      const item: Layout = {
        i: kpi.id,
        x,
        y,
        w,
        h: kpi.defaultH,
        minW: 1,
        minH: 1,
      };
      x += w;
      return item;
    });
  }

  return layouts;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadState(storageKey: string, kpis: KpiDefinition[]): KpiGridState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as KpiGridState;

      // Keep only ids that still exist in the kpi definitions
      const allIds = new Set(kpis.map((k) => k.id));
      const activeIds = parsed.activeIds.filter((id) => allIds.has(id));

      // Ensure layout entries exist for every saved active id
      const layouts = { ...parsed.layouts };
      for (const [bp, cols] of Object.entries(COLS) as [string, number][]) {
        if (!layouts[bp]) layouts[bp] = [];
        const existingIds = new Set(layouts[bp].map((l) => l.i));
        activeIds.forEach((id, idx) => {
          if (!existingIds.has(id)) {
            const kpi = kpis.find((k) => k.id === id)!;
            const maxY = layouts[bp].reduce((m, l) => Math.max(m, l.y + l.h), 0);
            layouts[bp].push({
              i: id,
              x: 0,
              y: maxY + idx,
              w: Math.min(kpi.defaultW, cols),
              h: kpi.defaultH,
              minW: 1,
              minH: 1,
            });
          }
        });
      }

      return { layouts, activeIds };
    }
  } catch {
    // corrupt storage → fall through to default
  }

  return {
    layouts: buildDefaultLayouts(kpis),
    activeIds: kpis.map((k) => k.id),
  };
}

function saveState(storageKey: string, state: KpiGridState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

interface KpiGridProps {
  /** All possible KPIs for this page (active + available). Order = default order. */
  kpis: KpiDefinition[];
  /** Unique localStorage key, e.g. "kpiGrid_activity_v1" */
  storageKey: string;
}

export function KpiGrid({ kpis, storageKey }: KpiGridProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState<KpiGridState>(() => loadState(storageKey, kpis));
  const [modalKpiId, setModalKpiId] = useState<string | null>(null);

  // Persist whenever state changes
  useEffect(() => {
    saveState(storageKey, state);
  }, [state, storageKey]);

  const activeKpis = useMemo(
    () => kpis.filter((k) => state.activeIds.includes(k.id)),
    [kpis, state.activeIds],
  );

  const hiddenKpis = useMemo(
    () => kpis.filter((k) => !state.activeIds.includes(k.id)),
    [kpis, state.activeIds],
  );

  const modalKpi = useMemo(
    () => kpis.find((k) => k.id === modalKpiId) ?? null,
    [kpis, modalKpiId],
  );

  // Only pass layout items for currently active KPIs to the grid
  const activeLayouts = useMemo(() => {
    const activeSet = new Set(state.activeIds);
    return Object.fromEntries(
      Object.entries(state.layouts).map(([bp, items]) => [
        bp,
        items.filter((item) => activeSet.has(item.i)),
      ]),
    );
  }, [state.layouts, state.activeIds]);

  const handleLayoutChange = useCallback(
    (_current: Layout[], allLayouts: GridLayouts) => {
      setState((prev) => ({
        ...prev,
        layouts: { ...prev.layouts, ...allLayouts },
      }));
    },
    [],
  );

  const removeKpi = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      activeIds: prev.activeIds.filter((aid) => aid !== id),
    }));
  }, []);

  const addKpi = useCallback(
    (id: string) => {
      const kpi = kpis.find((k) => k.id === id);
      if (!kpi) return;

      setState((prev) => {
        const layouts = { ...prev.layouts };
        for (const [bp, cols] of Object.entries(COLS) as [string, number][]) {
          const existing = layouts[bp] ?? [];
          const hasEntry = existing.some((l) => l.i === id);
          if (!hasEntry) {
            const maxY = existing.reduce((m, l) => Math.max(m, l.y + l.h), 0);
            layouts[bp] = [
              ...existing,
              {
                i: id,
                x: 0,
                y: maxY,
                w: Math.min(kpi.defaultW, cols),
                h: kpi.defaultH,
                minW: 1,
                minH: 1,
              },
            ];
          }
        }
        return {
          layouts,
          activeIds: [...prev.activeIds, id],
        };
      });

      setModalKpiId(null);
    },
    [kpis],
  );

  return (
    <div className="space-y-4">
      {/* Customize toggle */}
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2.5 gap-1.5 text-xs",
            isEditing
              ? "text-foreground bg-muted/60"
              : "text-muted-foreground",
          )}
          onClick={() => setIsEditing((e) => !e)}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {isEditing ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Active grid */}
      {activeKpis.length > 0 ? (
        <div
          className={cn(
            "rounded-2xl transition-all",
            isEditing && "ring-1 ring-border/50 p-1",
          )}
        >
          <ResponsiveGridLayout
            className="layout"
            layouts={activeLayouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            margin={MARGIN}
            containerPadding={[0, 0]}
            isDraggable={isEditing}
            isResizable={isEditing}
            resizeHandles={["se", "sw", "ne", "nw", "e", "w", "s", "n"]}
            compactType="vertical"
            onLayoutChange={handleLayoutChange}
            useCSSTransforms
          >
            {activeKpis.map((kpi) => (
              <div
                key={kpi.id}
                className={cn(
                  "relative group",
                  isEditing && "cursor-grab active:cursor-grabbing",
                )}
              >
                {/* Remove button — visible only in edit mode */}
                {isEditing && (
                  <button
                    className="absolute top-1.5 right-1.5 z-20 p-1 rounded-md bg-background/90 border border-border/50 text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKpi(kpi.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Widget content — pointer-events blocked in edit mode so
                    tile onClick doesn't fire while dragging */}
                <div
                  className={cn(
                    "h-full w-full overflow-hidden",
                    isEditing && "pointer-events-none select-none",
                  )}
                >
                  {kpi.render()}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 rounded-2xl border-2 border-dashed border-border/30 text-sm text-muted-foreground/40">
          No KPIs active — add some below
        </div>
      )}

      {/* Available KPIs — compact selectable chips */}
      {hiddenKpis.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Available
          </p>
          <div className="flex flex-wrap gap-2">
            {hiddenKpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <button
                  key={kpi.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-muted/20 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  onClick={() => setModalKpiId(kpi.id)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {kpi.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Config modal */}
      <KpiConfigModal
        kpi={modalKpi}
        onAdd={addKpi}
        onClose={() => setModalKpiId(null)}
      />
    </div>
  );
}
