import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPlannerForest,
  calculatePlannerCompletion,
  plannerBlocksUrl,
} from "./planner-domain";
import type { PlannerBlock } from "./planner-domain";

function block(
  id: string,
  overrides: Partial<PlannerBlock> = {},
): PlannerBlock {
  return {
    id,
    parentId: null,
    date: "2026-07-26",
    startTime: "09:00",
    endTime: "10:00",
    title: id,
    completed: false,
    order: 0,
    linkedModule: null,
    linkedItemId: null,
    linkedSubItemId: null,
    tasks: [],
    createdAt: new Date("2026-07-26T08:00:00Z"),
    ...overrides,
  };
}

test("planner forest retains nested blocks and promotes orphans", () => {
  const forest = buildPlannerForest([
    block("child", { parentId: "parent", order: 2 }),
    block("orphan", { parentId: "missing", startTime: "08:00" }),
    block("parent", { startTime: "09:00" }),
  ]);

  assert.deepEqual(forest.map((node) => node.id), ["orphan", "parent"]);
  assert.equal(forest[1].children[0].id, "child");
});

test("planner completion uses the same weighted hierarchy for full and compact views", () => {
  const result = calculatePlannerCompletion([
    block("parent", {
      tasks: [
        { id: "done", text: "Done", completed: true, importance: 3 },
        { id: "open", text: "Open", completed: false, importance: 3 },
      ],
    }),
    block("child", {
      parentId: "parent",
      completed: true,
      tasks: [{ id: "nested", text: "Nested", completed: false, importance: 3 }],
    }),
  ]);

  assert.equal(result.percent, 67);
});

test("linked planner URLs preserve the full scope", () => {
  assert.equal(
    plannerBlocksUrl({
      date: "2026-07-26",
      module: "second-brain",
      itemId: "theme 1",
      subItemId: "chapter/2",
    }),
    "/api/time-blocks/linked?date=2026-07-26&module=second_brain&itemId=theme+1&subItemId=chapter%2F2",
  );
});
