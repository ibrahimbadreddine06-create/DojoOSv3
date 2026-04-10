import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import type { Layout } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetConfigModal } from "./widget-config-modal";

const ResponsiveGridLayout = WidthProvider(Responsive);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Visualization {
  id: string;
  label: string;
}

export interface WidgetDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Width in grid columns (mobile 3-col basis) */
  defaultW: number;
  /** Height in row units (1 unit = ROW_HEIGHT px) */
  defaultH: number;
  render: () => React.ReactNode;
  visualizations: Visualization[];
}

// ─── Grid constants ────────────────────────────────────────────────────────────
// sm=3 col (mobile), md=6 col (tablet), lg=9 col (desktop)
// All multiples of 3 so 1/2/3-column widths map cleanly across breakpoints.
const COLS    = { lg: 9, md: 6, sm: 3 } as const;
const BREAKS  = { lg: 1200, md: 768, sm: 0 } as const;
const ROW_H   = 110;
const MARGIN: [number, number] = [10, 10];

// ─── Layout helpers ────────────────────────────────────────────────────────────

type GridLayouts = { [bp: string]: Layout[] };

function buildDefaultLayouts(widgets: WidgetDefinition[]): GridLayouts {
  const result: GridLayouts = {};
  for (const [bp, cols] of Object.entries(COLS) as [string, number][]) {
    let x = 0, y = 0;
    result[bp] = widgets.map((w) => {
      const ww = Math.min(w.defaultW, cols);
      if (x + ww > cols) { x = 0; y += w.defaultH; }
      const item: Layout = { i: w.id, x, y, w: ww, h: w.defaultH, minW: 1, minH: 1 };
      x += ww;
      return item;
    });
  }
  return result;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

interface ModuleGridState {
  layouts: GridLayouts;
  activeIds: string[];
}

function loadState(key: string, widgets: WidgetDefinition[]): ModuleGridState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as ModuleGridState;
      const allIds = new Set(widgets.map((w) => w.id));
      const activeIds = parsed.activeIds.filter((id) => allIds.has(id));
      const layouts = { ...parsed.layouts };
      // Ensure all breakpoints have layout entries for active ids
      for (const [bp, cols] of Object.entries(COLS) as [string, number][]) {
        if (!layouts[bp]) layouts[bp] = [];
        const existing = new Set(layouts[bp].map((l) => l.i));
        activeIds.forEach((id, i) => {
          if (!existing.has(id)) {
            const def = widgets.find((w) => w.id === id)!;
            const maxY = layouts[bp].reduce((m, l) => Math.max(m, l.y + l.h), 0);
            layouts[bp].push({ i: id, x: 0, y: maxY + i, w: Math.min(def.defaultW, cols), h: def.defaultH, minW: 1, minH: 1 });
          }
        });
      }
      return { layouts, activeIds };
    }
  } catch {}
  return { layouts: buildDefaultLayouts(widgets), activeIds: widgets.map((w) => w.id) };
}

function saveState(key: string, s: ModuleGridState) {
  try { localStorage.setItem(key, JSON.stringify(s)); } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface ModuleGridProps {
  widgets: WidgetDefinition[];
  storageKey: string;
}

export function ModuleGrid({ widgets, storageKey }: ModuleGridProps) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<ModuleGridState>(() => loadState(storageKey, widgets));
  const [modalId, setModalId] = useState<string | null>(null);

  useEffect(() => { saveState(storageKey, state); }, [state, storageKey]);

  const active = useMemo(() => widgets.filter((w) => state.activeIds.includes(w.id)), [widgets, state.activeIds]);
  const hidden = useMemo(() => widgets.filter((w) => !state.activeIds.includes(w.id)), [widgets, state.activeIds]);
  const modalWidget = useMemo(() => widgets.find((w) => w.id === modalId) ?? null, [widgets, modalId]);

  const activeLayouts = useMemo(() => {
    const set = new Set(state.activeIds);
    return Object.fromEntries(
      Object.entries(state.layouts).map(([bp, items]) => [bp, items.filter((l) => set.has(l.i))])
    );
  }, [state.layouts, state.activeIds]);

  const onLayoutChange = useCallback((_: Layout[], all: GridLayouts) => {
    setState((p) => ({ ...p, layouts: { ...p.layouts, ...all } }));
  }, []);

  const remove = useCallback((id: string) => {
    setState((p) => ({ ...p, activeIds: p.activeIds.filter((a) => a !== id) }));
  }, []);

  const add = useCallback((id: string) => {
    const def = widgets.find((w) => w.id === id);
    if (!def) return;
    setState((p) => {
      const layouts = { ...p.layouts };
      for (const [bp, cols] of Object.entries(COLS) as [string, number][]) {
        const existing = layouts[bp] ?? [];
        if (!existing.some((l) => l.i === id)) {
          const maxY = existing.reduce((m, l) => Math.max(m, l.y + l.h), 0);
          layouts[bp] = [...existing, { i: id, x: 0, y: maxY, w: Math.min(def.defaultW, cols), h: def.defaultH, minW: 1, minH: 1 }];
        }
      }
      return { layouts, activeIds: [...p.activeIds, id] };
    });
    setModalId(null);
  }, [widgets]);

  return (
    <div className="space-y-4">
      {/* Customize toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost" size="sm"
          className={cn("h-7 px-2.5 gap-1.5 text-xs", editing ? "text-foreground bg-muted/60" : "text-muted-foreground")}
          onClick={() => setEditing((e) => !e)}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {editing ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Active grid */}
      {active.length > 0 ? (
        <div className={cn("rounded-2xl transition-all", editing && "ring-1 ring-border/40 p-1")}>
          <ResponsiveGridLayout
            className="layout"
            layouts={activeLayouts}
            breakpoints={BREAKS}
            cols={COLS}
            rowHeight={ROW_H}
            margin={MARGIN}
            containerPadding={[0, 0]}
            isDraggable={editing}
            isResizable={editing}
            resizeHandles={["se", "sw", "ne", "nw", "e", "w", "s", "n"]}
            compactType="vertical"
            onLayoutChange={onLayoutChange}
            useCSSTransforms
          >
            {active.map((w) => (
              <div key={w.id} className={cn("relative group", editing && "cursor-grab active:cursor-grabbing")}>
                {editing && (
                  <button
                    className="absolute top-1.5 right-1.5 z-20 p-1 rounded-md bg-background/90 border border-border/50 text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); remove(w.id); }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className={cn("h-full w-full overflow-y-auto overflow-x-hidden", editing && "pointer-events-none select-none")}>
                  {w.render()}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 rounded-2xl border-2 border-dashed border-border/30 text-sm text-muted-foreground/40">
          No widgets active — add some below
        </div>
      )}

      {/* Available widgets — compact chips */}
      {hidden.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Available</p>
          <div className="flex flex-wrap gap-2">
            {hidden.map((w) => {
              const Icon = w.icon;
              return (
                <button key={w.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-muted/20 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  onClick={() => setModalId(w.id)}
                >
                  <Icon className="w-3.5 h-3.5" />{w.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <WidgetConfigModal widget={modalWidget} onAdd={add} onClose={() => setModalId(null)} />
    </div>
  );
}
