import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routesSource = await readFile(new URL("./routes.ts", import.meta.url), "utf8");
const aiSource = await readFile(new URL("./ai.ts", import.meta.url), "utf8");

test("production routes do not fabricate planner, goal, or intake records", () => {
  for (const forbiddenId of ["mock-b1", "mock-b2", "mock-t1", "mock-g1", "mock-ir1"]) {
    assert.equal(
      routesSource.includes(forbiddenId),
      false,
      `server/routes.ts still contains fabricated record ${forbiddenId}`,
    );
  }
});

test("AI unavailability is not presented as a plausible user observation", () => {
  const forbiddenFallbacks = [
    "No activity logged yet today. Tap '+ Log activity' to get started.",
    "No intake logged yet today. Tap '+ Log intake' to get started.",
    "All care routines are on track.",
  ];

  for (const fallback of forbiddenFallbacks) {
    assert.equal(
      routesSource.includes(fallback) || aiSource.includes(fallback),
      false,
      `AI fallback still fabricates product copy: ${fallback}`,
    );
  }
});

test("AI brief routes expose typed unavailable states", () => {
  assert.match(routesSource, /status:\s*"unavailable"/);
  assert.match(routesSource, /status:\s*"unsupported"/);
  assert.match(routesSource, /brief:\s*null/);
});

test("repeatable Body actions have explicit idempotency guards", () => {
  assert.match(
    routesSource,
    /getExecutionByDomainRecord\(\s*userId,\s*"hygiene_routine"/,
  );
  assert.match(
    routesSource,
    /getExecutionByDomainRecord\(\s*userId,\s*"intake_plan_consumption"/,
  );
  assert.match(routesSource, /if \(execution\.status === "completed"\)/);
});
