import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalBodyObservationSchema,
  type CanonicalBodyObservation,
} from "../../shared/body-canonical";
import { calculateResolvedDailySteps } from "./daily-steps";

function stepObservation(
  id: string,
  value: number,
  start: string,
  end: string,
): CanonicalBodyObservation {
  return canonicalBodyObservationSchema.parse({
    id,
    userId: "user-1",
    canonicalType: "activity.steps",
    value,
    canonicalUnit: "count",
    interval: {
      start,
      end,
      timezone: "Europe/Brussels",
    },
    localDate: "2026-07-25",
    provenance: {
      sourceClass: "platform_health_store",
      providerId: "apple_healthkit",
      ingestionRoute: "native_ios",
      providerRecordId: id,
      originalType: "HKQuantityTypeIdentifierStepCount",
      originalUnit: "count",
      sourceDeviceId: "watch-1",
      ingestedAt: "2026-07-25T13:00:00+02:00",
      consentReceiptId: "consent-1",
    },
    quality: { uncertainty: [] },
    status: "active",
    createdAt: "2026-07-25T13:00:00+02:00",
  });
}

test("resolved non-overlapping intervals produce a traceable daily sum", () => {
  const observations = [
    stepObservation(
      "steps-1",
      800,
      "2026-07-25T08:00:00+02:00",
      "2026-07-25T09:00:00+02:00",
    ),
    stepObservation(
      "steps-2",
      1_200,
      "2026-07-25T09:00:00+02:00",
      "2026-07-25T10:00:00+02:00",
    ),
  ];

  const result = calculateResolvedDailySteps({
    userId: "user-1",
    localDate: "2026-07-25",
    observations,
    resolution: {
      id: "resolution-1",
      state: "resolved",
      acceptedObservationIds: ["steps-1", "steps-2"],
      excludedObservationIds: [],
      strategyId: "step_source_resolution",
      strategyVersion: "1.0.0",
      coverageRatio: 1,
    },
    generatedAt: "2026-07-25T23:59:00+02:00",
  });

  assert.equal(result.value, 2_000);
  assert.equal(result.state, "valid");
  assert.deepEqual(result.inputObservationIds, ["steps-1", "steps-2"]);
});

test("an explicit covered zero remains valid zero", () => {
  const observation = stepObservation(
    "steps-zero",
    0,
    "2026-07-25T00:00:00+02:00",
    "2026-07-25T23:59:59+02:00",
  );
  const result = calculateResolvedDailySteps({
    userId: "user-1",
    localDate: "2026-07-25",
    observations: [observation],
    resolution: {
      id: "resolution-zero",
      state: "resolved",
      acceptedObservationIds: ["steps-zero"],
      excludedObservationIds: [],
      strategyId: "step_source_resolution",
      strategyVersion: "1.0.0",
      coverageRatio: 1,
    },
  });
  assert.equal(result.value, 0);
  assert.equal(result.state, "valid");
});

test("unresolved source conflict never produces a guessed value", () => {
  const result = calculateResolvedDailySteps({
    userId: "user-1",
    localDate: "2026-07-25",
    observations: [],
    resolution: {
      id: "resolution-conflict",
      state: "conflict",
      acceptedObservationIds: [],
      excludedObservationIds: [],
      strategyId: "step_source_resolution",
      strategyVersion: "1.0.0",
    },
  });
  assert.equal(result.value, undefined);
  assert.equal(result.state, "conflict");
});

test("overlapping accepted intervals fail instead of double counting", () => {
  const observations = [
    stepObservation(
      "steps-overlap-a",
      800,
      "2026-07-25T08:00:00+02:00",
      "2026-07-25T10:00:00+02:00",
    ),
    stepObservation(
      "steps-overlap-b",
      1_200,
      "2026-07-25T09:00:00+02:00",
      "2026-07-25T11:00:00+02:00",
    ),
  ];

  assert.throws(() =>
    calculateResolvedDailySteps({
      userId: "user-1",
      localDate: "2026-07-25",
      observations,
      resolution: {
        id: "resolution-overlap",
        state: "resolved",
        acceptedObservationIds: [
          "steps-overlap-a",
          "steps-overlap-b",
        ],
        excludedObservationIds: [],
        strategyId: "step_source_resolution",
        strategyVersion: "1.0.0",
      },
    }),
  );
});

