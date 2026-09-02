import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowUpRight, CalendarDays, Check, Clock3, Plus, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import type { DayPreset } from "@shared/schema";
import { AddTimeBlockDialog } from "@/components/dialogs/add-time-block-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  buildPlannerForest,
  calculatePlannerCompletion,
  formatBlockDuration,
  nextPlannerBlock,
  normalizePlannerModule,
  plannerBlocksUrl,
  plannerDateQueryKey,
  plannerLinkedQueryKey,
  plannerQueryKey,
  type PlannerBlock,
  type PlannerScope,
} from "@/lib/planner-domain";

type PlannerBridgeWidgetProps = {
  module?: string;
  itemId?: string;
  subItemId?: string;
  date?: string;
  title?: string;
  accentColor?: string;
  className?: string;
  maxVisibleBlocks?: number;
};

async function fetchPlannerBlocks(scope: PlannerScope): Promise<PlannerBlock[]> {
  const response = await fetch(plannerBlocksUrl(scope), { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load this schedule");
  return response.json();
}

export function PlannerBridgeWidget({
  module,
  itemId,
  subItemId,
  date = format(new Date(), "yyyy-MM-dd"),
  title = "Today",
  accentColor = "#2563eb",
  className,
  maxVisibleBlocks = 3,
}: PlannerBridgeWidgetProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const scope = useMemo<PlannerScope>(
    () => ({ date, module: normalizePlannerModule(module), itemId, subItemId }),
    [date, module, itemId, subItemId],
  );
  const queryKey = plannerQueryKey(scope);
  const { data = [], isLoading, isError } = useQuery<PlannerBlock[]>({
    queryKey,
    queryFn: () => fetchPlannerBlocks(scope),
  });
  const { data: presets = [] } = useQuery<DayPreset[]>({
    queryKey: ["/api/day-presets"],
  });

  const forest = useMemo(() => buildPlannerForest(data), [data]);
  const completion = useMemo(() => calculatePlannerCompletion(data), [data]);
  const upcoming = useMemo(() => nextPlannerBlock(data), [data]);
  const visible = forest.slice(0, Math.max(1, maxVisibleBlocks));
  const scopedPresets = useMemo(() => {
    if (!scope.module) return presets;
    return presets.flatMap((preset) => {
      const blocks = (preset.blocks ?? []).filter((block) => (
        normalizePlannerModule(block.linkedModule) === scope.module &&
        (!scope.itemId || block.linkedItemId === scope.itemId)
      ));
      return blocks.length ? [{ ...preset, blocks }] : [];
    });
  }, [presets, scope.itemId, scope.module]);

  const invalidatePlanner = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: plannerDateQueryKey(date) }),
      scope.module
        ? queryClient.invalidateQueries({ queryKey: plannerLinkedQueryKey(scope) })
        : Promise.resolve(),
    ]);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      apiRequest("PATCH", `/api/time-blocks/${id}`, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PlannerBlock[]>(queryKey);
      queryClient.setQueryData<PlannerBlock[]>(queryKey, (current = []) =>
        current.map((block) => (block.id === id ? { ...block, completed } : block)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: invalidatePlanner,
  });

  const applyPresetMutation = useMutation({
    mutationFn: async (preset: DayPreset) => {
      for (const block of preset.blocks ?? []) {
        const response = await apiRequest("POST", "/api/time-blocks", {
          date,
          startTime: block.startTime,
          endTime: block.endTime,
          title: block.title,
          completed: false,
          linkedModule: scope.module ?? block.linkedModule,
          linkedItemId: scope.itemId ?? block.linkedItemId,
          linkedSubItemId: scope.subItemId,
          tasks: (block.tasks ?? []).map((task) => ({
            id: crypto.randomUUID(),
            text: task.text,
            importance: task.importance,
            completed: false,
          })),
        });
        const parent = await response.json();
        for (const child of block.subBlocks ?? []) {
          await apiRequest("POST", "/api/time-blocks", {
            date,
            startTime: child.startTime,
            endTime: child.endTime,
            title: child.title,
            completed: false,
            parentId: parent.id,
            linkedModule: scope.module ?? block.linkedModule,
            linkedItemId: scope.itemId ?? block.linkedItemId,
            linkedSubItemId: scope.subItemId ?? child.linkedSubItemId,
            tasks: (child.tasks ?? []).map((task) => ({
              id: crypto.randomUUID(),
              text: task.text,
              importance: task.importance,
              completed: false,
            })),
          });
        }
      }
    },
    onSuccess: invalidatePlanner,
  });

  return (
    <section
      className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-white text-foreground", className)}
      style={{ "--planner-accent": accentColor } as React.CSSProperties}
      aria-label={`${title} planner`}
    >
      <header className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.025em]">{title}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {data.length ? `${data.length} scheduled` : "Open space"}
          </p>
        </div>
        <CalendarDays className="h-[18px] w-[18px] shrink-0" style={{ color: accentColor }} />
      </header>

      <div className="mt-3 min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full flex-col justify-end gap-2" aria-label="Loading schedule">
            {[64, 82, 54].map((width) => (
              <div key={width} className="h-8 animate-pulse rounded-[10px] bg-muted" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex h-full items-end">
            <p className="text-xs text-muted-foreground">Schedule unavailable</p>
          </div>
        ) : visible.length ? (
          <div className="flex h-full min-h-0 flex-col justify-end gap-1.5">
            {visible.map((block) => {
              const childCount = block.children.length;
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: block.id, completed: !block.completed })}
                  className="group flex min-h-9 w-full items-center gap-2 rounded-[11px] px-2.5 py-1.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
                  style={{
                    backgroundColor: block.completed ? "hsl(var(--muted) / 0.52)" : `${accentColor}10`,
                  }}
                >
                  <span
                    className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border"
                    style={{
                      borderColor: block.completed ? accentColor : `${accentColor}66`,
                      backgroundColor: block.completed ? accentColor : "transparent",
                    }}
                  >
                    {block.completed && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[12px] font-medium", block.completed && "text-muted-foreground line-through")}>
                      {block.title}
                    </span>
                    {childCount > 0 && (
                      <span className="block text-[9px] text-muted-foreground">
                        {childCount} nested {childCount === 1 ? "block" : "blocks"}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {block.startTime}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex h-full w-full flex-col items-start justify-end rounded-[12px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full" style={{ backgroundColor: `${accentColor}12`, color: accentColor }}>
              <Plus className="h-4 w-4" />
            </span>
            <span className="mt-2 text-xs font-medium">Plan this space</span>
            <span className="text-[10px] text-muted-foreground">Add a linked time block</span>
          </button>
        )}
      </div>

      <footer className="mt-3 flex shrink-0 items-end justify-between gap-3">
        <div className="min-w-0">
          {upcoming ? (
            <>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                <span className="tabular-nums">{upcoming.startTime}–{upcoming.endTime}</span>
                <span>·</span>
                <span>{formatBlockDuration(upcoming)}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-medium">{upcoming.title}</p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">Nothing scheduled yet</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {scopedPresets.length ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  aria-label="Apply a linked preset"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 rounded-[16px] p-2">
                <p className="px-2 pb-2 pt-1 text-[11px] font-semibold text-muted-foreground">
                  Linked presets
                </p>
                <div className="space-y-1">
                  {scopedPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={applyPresetMutation.isPending}
                      onClick={() => applyPresetMutation.mutate(preset)}
                      className="w-full rounded-[10px] px-2 py-2 text-left text-xs font-medium hover:bg-muted disabled:opacity-50"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setAddOpen(true)}
            aria-label="Add linked time block"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => navigate("/planner")}
            className="flex items-center gap-1 text-[11px] font-semibold tabular-nums"
            style={{ color: accentColor }}
          >
            {completion.percent}%
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </footer>

      <AddTimeBlockDialog
        date={date}
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultLinkedModule={scope.module}
        defaultLinkedItemId={itemId}
        defaultLinkedSubItemId={subItemId}
      />
    </section>
  );
}
