import { randomUUID } from "node:crypto";
import type {
  BodyMetricResult,
  CanonicalBodyObservation,
} from "../../shared/body-canonical";

export type StepResolution = {
  id: string;
  state: "resolved" | "partial" | "conflict";
  acceptedObservationIds: string[];
  excludedObservationIds: string[];
  strategyId: string;
  strategyVersion: string;
  coverageRatio?: number;
  uncertainty?: string[];
};

type DailyStepsInput = {
  userId: string;
  localDate: string;
  observations: CanonicalBodyObservation[];
  resolution: StepResolution;
  generatedAt?: string;
};

function isNumericStepObservation(
  observation: CanonicalBodyObservation,
): observation is CanonicalBodyObservation & { value: number } {
  return (
    observation.canonicalType === "activity.steps" &&
    typeof observation.value === "number" &&
    Number.isFinite(observation.value) &&
    observation.value >= 0 &&
    observation.status === "active"
  );
}

function intervalsOverlap(
  left: CanonicalBodyObservation,
  right: CanonicalBodyObservation,
) {
  if (!left.interval || !right.interval) return false;
  return (
    Date.parse(left.interval.start) < Date.parse(right.interval.end) &&
    Date.parse(right.interval.start) < Date.parse(left.interval.end)
  );
}

/**
 * Aggregates only observations accepted by an explicit resolution decision.
 *
 * It deliberately does not decide whether a phone, watch or provider summary
 * wins. That belongs to the versioned source-resolution layer. This prevents a
 * convenient sum from silently becoming a false step total.
 */
export function calculateResolvedDailySteps({
  userId,
  localDate,
  observations,
  resolution,
  generatedAt = new Date().toISOString(),
}: DailyStepsInput): BodyMetricResult {
  if (resolution.state === "conflict") {
    return {
      id: randomUUID(),
      userId,
      metricId: "activity.steps",
      specificationVersion: "1.0.0",
      disposition: "observation",
      localDate,
      state: "conflict",
      inputObservationIds: [],
      uncertainty: [
        ...(resolution.uncertainty ?? []),
        "Competing step sources could not be resolved safely.",
      ],
      generatedAt,
    };
  }

  const acceptedIds = new Set(resolution.acceptedObservationIds);
  if (acceptedIds.size !== resolution.acceptedObservationIds.length) {
    throw new Error("Step resolution contains duplicate accepted IDs");
  }

  const accepted = observations
    .filter(
      (observation) =>
        acceptedIds.has(observation.id) &&
        observation.userId === userId &&
        observation.localDate === localDate,
    )
    .filter(isNumericStepObservation);

  if (accepted.length !== acceptedIds.size) {
    throw new Error(
      "Step resolution references missing, ineligible, or wrong-day observations",
    );
  }

  for (let leftIndex = 0; leftIndex < accepted.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < accepted.length;
      rightIndex += 1
    ) {
      if (intervalsOverlap(accepted[leftIndex], accepted[rightIndex])) {
        throw new Error(
          "Resolved step observations still overlap; summation would double count",
        );
      }
    }
  }

  if (accepted.length === 0) {
    return {
      id: randomUUID(),
      userId,
      metricId: "activity.steps",
      specificationVersion: "1.0.0",
      disposition: "observation",
      localDate,
      state: "awaiting_data",
      inputObservationIds: [],
      uncertainty: resolution.uncertainty ?? [],
      generatedAt,
    };
  }

  const value = accepted.reduce(
    (total, observation) => total + observation.value,
    0,
  );

  return {
    id: randomUUID(),
    userId,
    metricId: "activity.steps",
    specificationVersion: "1.0.0",
    disposition: "observation",
    value,
    canonicalUnit: "count",
    localDate,
    state:
      resolution.state === "partial" ||
      (resolution.coverageRatio !== undefined &&
        resolution.coverageRatio < 1)
        ? "partial"
        : "valid",
    inputObservationIds: accepted.map((observation) => observation.id),
    transformationId: `${resolution.strategyId}@${resolution.strategyVersion}`,
    coverageRatio: resolution.coverageRatio,
    uncertainty: resolution.uncertainty ?? [],
    generatedAt,
  };
}
