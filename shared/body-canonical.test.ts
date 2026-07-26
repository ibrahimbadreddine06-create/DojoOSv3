import assert from "node:assert/strict";
import test from "node:test";
import {
  bodyMetricResultSchema,
  canonicalBodyObservationSchema,
} from "./body-canonical";

const instantObservation = {
  id: "obs-1",
  userId: "user-1",
  canonicalType: "activity.steps",
  value: 120,
  canonicalUnit: "count",
  observedAt: "2026-07-25T10:00:00+02:00",
  provenance: {
    sourceClass: "manual" as const,
    providerId: "manual",
    ingestionRoute: "manual_entry",
    originalType: "step_count",
    originalUnit: "count",
    ingestedAt: "2026-07-25T10:01:00+02:00",
  },
  quality: {
    uncertainty: [],
  },
  status: "active" as const,
  createdAt: "2026-07-25T10:01:00+02:00",
};

test("canonical observation accepts an honest instant observation", () => {
  const result = canonicalBodyObservationSchema.parse(instantObservation);
  assert.equal(result.value, 120);
  assert.equal(result.provenance.sourceClass, "manual");
});

test("canonical observation rejects a record without time semantics", () => {
  const { observedAt: _observedAt, ...withoutTime } = instantObservation;
  assert.equal(
    canonicalBodyObservationSchema.safeParse(withoutTime).success,
    false,
  );
});

test("canonical observation rejects a reversed interval", () => {
  const { observedAt: _observedAt, ...base } = instantObservation;
  const result = canonicalBodyObservationSchema.safeParse({
    ...base,
    interval: {
      start: "2026-07-25T11:00:00+02:00",
      end: "2026-07-25T10:00:00+02:00",
    },
  });
  assert.equal(result.success, false);
});

test("provider metric result requires a provider namespace", () => {
  const result = bodyMetricResultSchema.safeParse({
    id: "result-1",
    userId: "user-1",
    metricId: "recovery.readiness_score",
    specificationVersion: "1.0.0",
    disposition: "provider_result",
    value: 74,
    state: "valid",
    inputObservationIds: ["obs-1"],
    generatedAt: "2026-07-25T10:05:00+02:00",
  });
  assert.equal(result.success, false);
});

test("valid zero is retained as a real metric value", () => {
  const result = bodyMetricResultSchema.parse({
    id: "result-2",
    userId: "user-1",
    metricId: "activity.steps",
    specificationVersion: "1.0.0",
    disposition: "observation",
    value: 0,
    canonicalUnit: "count",
    state: "valid",
    inputObservationIds: ["obs-1"],
    coverageRatio: 1,
    generatedAt: "2026-07-25T23:59:00+02:00",
  });
  assert.equal(result.value, 0);
});

test("research-only and rejected metrics cannot produce results", () => {
  for (const disposition of ["research_only", "rejected"] as const) {
    const result = bodyMetricResultSchema.safeParse({
      id: `result-${disposition}`,
      userId: "user-1",
      metricId: "load.acwr_injury_prediction",
      specificationVersion: "1.0.0",
      disposition,
      value: 1,
      state: "valid",
      generatedAt: "2026-07-25T10:05:00+02:00",
    });
    assert.equal(result.success, false);
  }
});
