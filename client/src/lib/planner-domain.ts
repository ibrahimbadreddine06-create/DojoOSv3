import type { TimeBlock } from "@shared/schema";

export const DEFAULT_PLANNER_IMPORTANCE = 3;

export type PlannerScope = {
  date: string;
  module?: string;
  itemId?: string;
  subItemId?: string;
};

export type PlannerTask = NonNullable<TimeBlock["tasks"]>[number];

export type PlannerBlock = TimeBlock & {
  importance?: number | null;
};

export type PlannerBlockNode = PlannerBlock & {
  children: PlannerBlockNode[];
};

export type PlannerCompletion = {
  completed: number;
  total: number;
  percent: number;
};

export function normalizePlannerModule(module?: string | null): string | undefined {
  const normalized = module?.trim().replace(/-/g, "_");
  return normalized || undefined;
}

export function plannerDateQueryKey(date: string) {
  return ["/api/time-blocks", date] as const;
}

export function plannerLinkedQueryKey(scope: PlannerScope) {
  return [
    "/api/time-blocks/linked",
    normalizePlannerModule(scope.module),
    scope.date,
    scope.itemId,
    scope.subItemId,
  ] as const;
}

export function plannerQueryKey(scope: PlannerScope) {
  return scope.module ? plannerLinkedQueryKey(scope) : plannerDateQueryKey(scope.date);
}

export function plannerBlocksUrl(scope: PlannerScope): string {
  if (!scope.module) return `/api/time-blocks/${encodeURIComponent(scope.date)}`;

  const params = new URLSearchParams({
    date: scope.date,
    module: normalizePlannerModule(scope.module) as string,
  });
  if (scope.itemId) params.set("itemId", scope.itemId);
  if (scope.subItemId) params.set("subItemId", scope.subItemId);
  return `/api/time-blocks/linked?${params.toString()}`;
}

export function timeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return 0;
  return Math.min(24 * 60, Math.max(0, Number(match[1]) * 60 + Number(match[2])));
}

export function blockDurationMinutes(block: Pick<TimeBlock, "startTime" | "endTime">): number {
  return Math.max(0, timeToMinutes(block.endTime) - timeToMinutes(block.startTime));
}

export function formatBlockDuration(block: Pick<TimeBlock, "startTime" | "endTime">): string {
  const minutes = blockDurationMinutes(block);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function sortPlannerBlocks<T extends Pick<TimeBlock, "startTime" | "order" | "createdAt">>(
  blocks: readonly T[],
): T[] {
  return [...blocks].sort((a, b) => {
    const timeDifference = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (timeDifference) return timeDifference;
    const orderDifference = (a.order ?? 0) - (b.order ?? 0);
    if (orderDifference) return orderDifference;
    return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
  });
}

/**
 * Builds the hierarchy the current persistence model can represent.
 * Orphans intentionally remain visible as roots instead of disappearing.
 */
export function buildPlannerForest(blocks: readonly PlannerBlock[]): PlannerBlockNode[] {
  const nodes = new Map<string, PlannerBlockNode>();
  for (const block of blocks) nodes.set(block.id, { ...block, children: [] });

  const roots: PlannerBlockNode[] = [];
  for (const node of Array.from(nodes.values())) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }

  const sortTree = (items: PlannerBlockNode[]) => {
    const sorted = sortPlannerBlocks(items);
    for (const item of sorted) item.children = sortTree(item.children);
    return sorted;
  };
  return sortTree(roots);
}

function taskWeight(task: Pick<PlannerTask, "importance">): number {
  return task.importance || DEFAULT_PLANNER_IMPORTANCE;
}

function nodeWeight(node: PlannerBlockNode): PlannerCompletion {
  let total = 0;
  let completed = 0;

  for (const task of node.tasks ?? []) {
    const weight = taskWeight(task);
    total += weight;
    if (task.completed) completed += weight;
  }

  for (const child of node.children) {
    const childResult = nodeWeight(child);
    const multiplier = (child.importance || DEFAULT_PLANNER_IMPORTANCE) / DEFAULT_PLANNER_IMPORTANCE;
    const weight = (childResult.total || DEFAULT_PLANNER_IMPORTANCE) * multiplier;
    total += weight;
    completed += child.completed
      ? weight
      : weight * (childResult.total ? childResult.completed / childResult.total : 0);
  }

  if (!total) {
    total = node.importance || DEFAULT_PLANNER_IMPORTANCE;
    completed = node.completed ? total : 0;
  } else if (node.completed) {
    completed = total;
  }

  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function calculatePlannerNodeCompletion(
  tasks: PlannerTask[] = [],
  children: PlannerBlockNode[] = [],
): PlannerCompletion {
  return nodeWeight({
    id: "__planner-preview__",
    parentId: null,
    date: "",
    startTime: "00:00",
    endTime: "00:00",
    title: "",
    completed: false,
    order: 0,
    linkedModule: null,
    linkedItemId: null,
    linkedSubItemId: null,
    tasks,
    createdAt: null,
    importance: DEFAULT_PLANNER_IMPORTANCE,
    children,
  });
}

export function calculatePlannerCompletion(blocks: readonly PlannerBlock[]): PlannerCompletion {
  const roots = buildPlannerForest(blocks);
  let total = 0;
  let completed = 0;

  for (const root of roots) {
    const internal = nodeWeight(root);
    const multiplier = (root.importance || DEFAULT_PLANNER_IMPORTANCE) / DEFAULT_PLANNER_IMPORTANCE;
    const weight = internal.total * multiplier;
    total += weight;
    completed += root.completed ? weight : weight * (internal.completed / internal.total);
  }

  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function nextPlannerBlock(
  blocks: readonly PlannerBlock[],
  now: Date = new Date(),
): PlannerBlock | undefined {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const roots = sortPlannerBlocks(blocks.filter((block) => !block.parentId && !block.completed));
  return roots.find((block) => timeToMinutes(block.endTime) >= currentMinutes) ?? roots[0];
}

export function timeRangeOverlaps(
  first: Pick<TimeBlock, "startTime" | "endTime">,
  second: Pick<TimeBlock, "startTime" | "endTime">,
): boolean {
  return (
    timeToMinutes(first.startTime) < timeToMinutes(second.endTime) &&
    timeToMinutes(second.startTime) < timeToMinutes(first.endTime)
  );
}

export function isPlannerSlotAvailable(
  blocks: readonly PlannerBlock[],
  range: Pick<TimeBlock, "startTime" | "endTime">,
  ignoreId?: string,
): boolean {
  return !blocks.some(
    (block) => !block.parentId && block.id !== ignoreId && timeRangeOverlaps(block, range),
  );
}
