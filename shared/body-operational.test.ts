import assert from "node:assert/strict";
import test from "node:test";
import {
  insertBodyCommitmentSchema,
  insertBodyExecutionSchema,
  insertBodyGoalEventSchema,
  insertActivityDefinitionSchema,
} from "./schema";

test("timed commitments require a real interval and timezone", () => {
  assert.equal(
    insertBodyCommitmentSchema.safeParse({
      userId: "u1",
      subjectId: "s1",
      scheduleKind: "timed",
      plannedStartAt: new Date("2026-07-25T08:00:00Z"),
      plannedEndAt: new Date("2026-07-25T09:00:00Z"),
      timezone: "Europe/Brussels",
    }).success,
    true,
  );

  assert.equal(
    insertBodyCommitmentSchema.safeParse({
      userId: "u1",
      subjectId: "s1",
      scheduleKind: "timed",
    }).success,
    false,
  );
});

test("day-bound commitments require a civil date", () => {
  assert.equal(
    insertBodyCommitmentSchema.safeParse({
      userId: "u1",
      subjectId: "s1",
      scheduleKind: "day_bound",
    }).success,
    false,
  );
});

test("execution cannot end before it starts", () => {
  assert.equal(
    insertBodyExecutionSchema.safeParse({
      userId: "u1",
      subjectId: "s1",
      status: "completed",
      actualStartAt: new Date("2026-07-25T09:00:00Z"),
      actualEndAt: new Date("2026-07-25T08:00:00Z"),
    }).success,
    false,
  );
});

test("started execution states require actual start", () => {
  assert.equal(
    insertBodyExecutionSchema.safeParse({
      userId: "u1",
      subjectId: "s1",
      status: "in_progress",
    }).success,
    false,
  );
});

test("goal progress cannot exist without exact evidence", () => {
  assert.equal(
    insertBodyGoalEventSchema.safeParse({
      userId: "u1",
      goalLinkId: "gl1",
      contribution: "1",
      occurredAt: new Date("2026-07-25T08:00:00Z"),
    }).success,
    false,
  );
});

test("activity definitions require an identity and honest provenance", () => {
  assert.equal(
    insertActivityDefinitionSchema.safeParse({
      userId: "u1",
      slug: "",
      name: "Pogo",
      source: "user",
    }).success,
    false,
  );
  assert.equal(
    insertActivityDefinitionSchema.safeParse({
      userId: "u1",
      slug: "pogo",
      name: "Pogo",
      source: "curated",
    }).success,
    false,
  );
  assert.equal(
    insertActivityDefinitionSchema.safeParse({
      userId: "u1",
      slug: "pogo",
      name: "Pogo",
      source: "user",
    }).success,
    true,
  );
});
