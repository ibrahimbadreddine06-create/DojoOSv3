import assert from "node:assert/strict";
import test from "node:test";
import { MemoryBodyOperationalStore } from "./body-operational-store";

test("planned activity and execution share one subject and reconcile", async () => {
  const store = new MemoryBodyOperationalStore();
  const subject = await store.createSubject({
    userId: "u1",
    subjectType: "activity",
    entityId: "walking",
    titleSnapshot: "Walking",
  });
  const duplicateSubject = await store.createSubject({
    userId: "u1",
    subjectType: "activity",
    entityId: "walking",
    titleSnapshot: "Walking",
  });
  assert.equal(duplicateSubject.id, subject.id);

  const commitment = await store.createCommitment({
    userId: "u1",
    subjectId: subject.id,
    scheduleKind: "day_bound",
    localDate: "2026-07-25",
  });
  const execution = await store.createExecution({
    userId: "u1",
    subjectId: subject.id,
    commitmentId: commitment.id,
    status: "completed",
    actualStartAt: new Date("2026-07-25T08:00:00Z"),
    actualEndAt: new Date("2026-07-25T08:30:00Z"),
  });
  const reconciliation = await store.createReconciliation({
    userId: "u1",
    commitmentId: commitment.id,
    executionId: execution.id,
    resolution: "fulfilled",
    confirmedByUser: true,
  });

  assert.equal(reconciliation.commitmentId, commitment.id);
  assert.equal(reconciliation.executionId, execution.id);
  const completedCommitment = await store.updateCommitment(
    "u1",
    commitment.id,
    { status: "completed" },
  );
  assert.equal(completedCommitment?.status, "completed");

  const snapshot = await store.getSnapshot("u1", "2026-07-25", "activity");
  assert.deepEqual(snapshot.subjects.map((item) => item.id), [subject.id]);
  assert.deepEqual(snapshot.commitments.map((item) => item.id), [commitment.id]);
  assert.deepEqual(snapshot.executions.map((item) => item.id), [execution.id]);
});

test("activity catalogue combines curated and private definitions without duplicates", async () => {
  const store = new MemoryBodyOperationalStore();
  const curated = await store.createActivityDefinition({
    userId: null,
    slug: "walking",
    name: "Walking",
    source: "curated",
  });
  const privateDefinition = await store.createActivityDefinition({
    userId: "u1",
    slug: "pogo",
    name: "Pogo",
    source: "user",
  });
  const duplicate = await store.createActivityDefinition({
    userId: "u1",
    slug: "pogo",
    name: "Pogo renamed in request",
    source: "user",
  });

  assert.equal(duplicate.id, privateDefinition.id);
  assert.deepEqual(
    (await store.listActivityDefinitions("u1")).map((item) => item.id),
    [curated.id, privateDefinition.id],
  );
  assert.deepEqual(
    (await store.listActivityDefinitions("u2")).map((item) => item.id),
    [curated.id],
  );
});

test("spontaneous activity is valid without a commitment", async () => {
  const store = new MemoryBodyOperationalStore();
  const subject = await store.createSubject({
    userId: "u1",
    subjectType: "activity",
    entityId: "custom-pogo",
    titleSnapshot: "Pogo",
    source: "user",
  });
  const execution = await store.createExecution({
    userId: "u1",
    subjectId: subject.id,
    status: "in_progress",
    actualStartAt: new Date("2026-07-25T10:00:00Z"),
  });
  assert.equal(execution.commitmentId, null);
});

test("workout execution keeps one identity while moving from ready to completed", async () => {
  const store = new MemoryBodyOperationalStore();
  const subject = await store.createSubject({
    userId: "u1",
    subjectType: "workout",
    entityId: "workout-1",
  });
  const execution = await store.createExecution({
    userId: "u1",
    subjectId: subject.id,
    status: "ready",
    domainRecordType: "workout",
    domainRecordId: "workout-1",
  });
  const start = new Date("2026-07-25T10:00:00Z");
  const end = new Date("2026-07-25T11:00:00Z");
  await store.updateExecution("u1", execution.id, {
    status: "in_progress",
    actualStartAt: start,
  });
  const completed = await store.updateExecution("u1", execution.id, {
    status: "completed",
    actualStartAt: start,
    actualEndAt: end,
  });

  assert.equal(completed?.id, execution.id);
  assert.equal(completed?.status, "completed");
  assert.equal(
    (
      await store.getExecutionByDomainRecord("u1", "workout", "workout-1")
    )?.id,
    execution.id,
  );
});

test("manual observation evidence is preserved and client identity is idempotent", async () => {
  const store = new MemoryBodyOperationalStore();
  const subject = await store.createSubject({
    userId: "u1",
    subjectType: "manual_observation",
    entityId: "rest.perceived_stress:default",
    titleSnapshot: "Perceived Stress",
    privacyClass: "sensitive_health",
  });
  const input = {
    userId: "u1",
    subjectId: subject.id,
    status: "completed",
    actualStartAt: new Date("2026-07-25T10:00:00Z"),
    timezone: "Europe/Brussels",
    domainRecordType: "manual_observation",
    domainRecordId: "client-observation-1",
    evidence: {
      value: 7,
      unit: "/10",
      scaleVersion: "numeric-rating-scale.0-10.v1",
      confidence: "exact" as const,
    },
  };
  const first = await store.createExecution(input);
  const repeated = await store.createExecution(input);

  assert.equal(repeated.id, first.id);
  assert.deepEqual(first.evidence, input.evidence);
});

test("a user cannot execute another user's subject", async () => {
  const store = new MemoryBodyOperationalStore();
  const subject = await store.createSubject({
    userId: "owner",
    subjectType: "activity",
    entityId: "walking",
  });

  await assert.rejects(
    store.createExecution({
      userId: "intruder",
      subjectId: subject.id,
      status: "ready",
    }),
    /Body subject not found/,
  );
});

test("reconciliation requires the same subject", async () => {
  const store = new MemoryBodyOperationalStore();
  const first = await store.createSubject({
    userId: "u1",
    subjectType: "activity",
    entityId: "walking",
  });
  const second = await store.createSubject({
    userId: "u1",
    subjectType: "activity",
    entityId: "running",
  });
  const commitment = await store.createCommitment({
    userId: "u1",
    subjectId: first.id,
    scheduleKind: "day_bound",
    localDate: "2026-07-25",
  });
  const execution = await store.createExecution({
    userId: "u1",
    subjectId: second.id,
    status: "completed",
    actualStartAt: new Date("2026-07-25T08:00:00Z"),
  });

  await assert.rejects(
    store.createReconciliation({
      userId: "u1",
      commitmentId: commitment.id,
      executionId: execution.id,
      resolution: "fulfilled",
    }),
    /cannot be reconciled/,
  );
});

test("goal progress is calculated only from unreversed evidence", async () => {
  const store = new MemoryBodyOperationalStore();
  const subject = await store.createSubject({
    userId: "u1",
    subjectType: "activity",
    entityId: "walking",
  });
  const execution = await store.createExecution({
    userId: "u1",
    subjectId: subject.id,
    status: "completed",
    actualStartAt: new Date("2026-07-25T08:00:00Z"),
  });
  const link = await store.createGoalLink({
    userId: "u1",
    goalId: "goal-1",
    subjectId: subject.id,
    criterionVersion: "duration-minutes.v1",
    criterion: { field: "durationMinutes" },
    targetValue: "60",
    targetUnit: "min",
  });
  await store.createGoalEvent({
    userId: "u1",
    goalLinkId: link.id,
    executionId: execution.id,
    contribution: "30",
    occurredAt: new Date("2026-07-25T08:30:00Z"),
  });
  await store.createGoalEvent({
    userId: "u1",
    goalLinkId: link.id,
    executionId: execution.id,
    contribution: "10",
    occurredAt: new Date("2026-07-25T08:40:00Z"),
    reversedAt: new Date("2026-07-25T08:41:00Z"),
    reversalReason: "Corrected duplicate",
  });

  assert.deepEqual(await store.getGoalProgress("u1", link.id), {
    goalLinkId: link.id,
    contribution: 30,
    target: 60,
    unit: "min",
    progressRatio: 0.5,
    evidenceCount: 1,
  });
});

test("subject history keeps plans, executions, and reconciliation together", async () => {
  const store = new MemoryBodyOperationalStore();
  const subject = await store.createSubject({
    userId: "u1",
    subjectType: "rest",
    entityId: "sleep-1",
    titleSnapshot: "Sleep",
  });
  const commitment = await store.createCommitment({
    userId: "u1",
    subjectId: subject.id,
    scheduleKind: "day_bound",
    localDate: "2026-07-25",
  });
  const execution = await store.createExecution({
    userId: "u1",
    subjectId: subject.id,
    commitmentId: commitment.id,
    status: "completed",
    actualStartAt: new Date("2026-07-25T22:00:00Z"),
    actualEndAt: new Date("2026-07-26T06:00:00Z"),
  });
  await store.createReconciliation({
    userId: "u1",
    commitmentId: commitment.id,
    executionId: execution.id,
    resolution: "fulfilled",
  });
  const history = await store.getSubjectHistory("u1", subject.id);
  assert.equal(history?.commitments.length, 1);
  assert.equal(history?.executions.length, 1);
  assert.equal(history?.reconciliations.length, 1);
  assert.equal(await store.getSubjectHistory("u2", subject.id), null);
});
