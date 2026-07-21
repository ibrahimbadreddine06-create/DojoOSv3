import type { ActivityLog, BodyProfile, DailyState, Workout, WorkoutSet } from "../shared/schema";
import type { IStorage } from "./storage";

type EffortConfidence = "high" | "medium" | "low";
type EffortSource = "activity_log" | "workout" | "residual_movement";
type EffortClass = "structured_event" | "derived_event" | "background_context";

export interface EffortContributor {
  source: EffortSource;
  class: EffortClass;
  label: string;
  points: number;
  confidence: number;
  details: string[];
}

export interface DailyEffortResult {
  date: string;
  effortPoints: number;
  effortScore: number;
  confidence: EffortConfidence;
  contributors: EffortContributor[];
  usedSignals: string[];
  excludedSignals: string[];
  residualMovementUsed: boolean;
  context: {
    recoveryScore: number | null;
    recoveryLabel: string | null;
  };
  explanation: string;
}

export interface WeeklyEffortResult {
  weekStart: string;
  weekEnd: string;
  weeklyEffortPoints: number;
  weeklyTargetPoints: number;
  weeklyPercent: number;
  days: DailyEffortResult[];
  confidence: EffortConfidence;
}

type ActivityFamily = {
  family: string;
  typeFactor: number;
  defaultExertion: number;
  baseConfidence: number;
};

const ACTIVITY_FAMILIES: Record<string, ActivityFamily> = {
  walk: { family: "light_movement", typeFactor: 0.75, defaultExertion: 3, baseConfidence: 0.72 },
  run: { family: "sustained_movement", typeFactor: 1.35, defaultExertion: 7, baseConfidence: 0.78 },
  cycle: { family: "sustained_movement", typeFactor: 1.1, defaultExertion: 6, baseConfidence: 0.76 },
  swim: { family: "sustained_movement", typeFactor: 1.25, defaultExertion: 7, baseConfidence: 0.78 },
  sport: { family: "dynamic_sport", typeFactor: 1.25, defaultExertion: 7, baseConfidence: 0.74 },
  workout: { family: "strength_workout", typeFactor: 1.3, defaultExertion: 7, baseConfidence: 0.72 },
  other: { family: "other_unknown", typeFactor: 0.8, defaultExertion: 4, baseConfidence: 0.48 },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toDateKey(value: Date) {
  return value.toISOString().split("T")[0];
}

function parseDateKey(date: string) {
  return new Date(`${date}T12:00:00.000Z`);
}

function addDays(date: string, days: number) {
  const value = parseDateKey(date);
  value.setUTCDate(value.getUTCDate() + days);
  return toDateKey(value);
}

function startOfWeek(date: string) {
  const value = parseDateKey(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return toDateKey(value);
}

function confidenceLabel(value: number): EffortConfidence {
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  return "low";
}

function durationCurve(durationMinutes: number) {
  if (durationMinutes <= 0) return 0;
  return Math.pow(durationMinutes / 30, 0.85);
}

function exertionFactor(exertion: number) {
  const safe = clamp(exertion, 1, 10);
  return 0.55 + (safe / 10) * 0.9;
}

function scoreFromPoints(points: number) {
  return clamp(Math.round(100 * (1 - Math.exp(-Math.max(0, points) / 55))), 0, 100);
}

function familyForActivity(log: ActivityLog): ActivityFamily {
  const type = String(log.activityType || "other").toLowerCase();
  const name = String(log.activityName || "").toLowerCase();

  if (type === "sport" && /(football|soccer|voetbal|match)/i.test(name)) {
    return { family: "dynamic_sport", typeFactor: 1.35, defaultExertion: 8, baseConfidence: 0.78 };
  }
  if (type === "other" && /(labor|labour|werk|arbeid|moving|verhuis|cleaning|kuis|manual)/i.test(name)) {
    return { family: "labor_physical", typeFactor: 1.0, defaultExertion: 5, baseConfidence: 0.58 };
  }
  return ACTIVITY_FAMILIES[type] ?? ACTIVITY_FAMILIES.other;
}

function activityLogContributor(log: ActivityLog): EffortContributor | null {
  const duration = num(log.durationMinutes);
  if (duration <= 0) return null;

  const family = familyForActivity(log);
  const explicitEffort = num(log.perceivedEffort);
  const exertion = explicitEffort > 0 ? explicitEffort : family.defaultExertion;
  const confidence = clamp(
    family.baseConfidence
      + (explicitEffort > 0 ? 0.16 : 0)
      + (log.activityName ? 0.04 : 0)
      - (family.family === "other_unknown" ? 0.08 : 0),
    0.2,
    0.95,
  );
  const points = 18 * durationCurve(duration) * exertionFactor(exertion) * family.typeFactor * confidence;
  const label = log.activityName || log.activityType || family.family;

  return {
    source: "activity_log",
    class: "structured_event",
    label,
    points: round(points, 1),
    confidence: round(confidence, 2),
    details: [
      `${duration} min`,
      family.family,
      explicitEffort > 0 ? `effort ${explicitEffort}/10` : `estimated effort ${family.defaultExertion}/10`,
    ],
  };
}

function workoutDuration(workout: Workout) {
  if (workout.startTime && workout.endTime) {
    return Math.max(0, Math.round((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 60000));
  }
  return 0;
}

function summarizeSets(sets: WorkoutSet[]) {
  return sets.reduce((summary, set) => {
    if (!set.completed) return summary;
    const reps = num(set.reps);
    const weight = num(set.weight);
    const rpe = num(set.rpe);
    return {
      completedSets: summary.completedSets + 1,
      volume: summary.volume + reps * weight,
      rpeTotal: summary.rpeTotal + (rpe > 0 ? rpe : 0),
      rpeCount: summary.rpeCount + (rpe > 0 ? 1 : 0),
    };
  }, { completedSets: 0, volume: 0, rpeTotal: 0, rpeCount: 0 });
}

function workoutContributor(
  workout: Workout,
  exercises: { sets: WorkoutSet[] }[],
): EffortContributor | null {
  if (!workout.completed) return null;

  const allSets = exercises.flatMap((exercise) => exercise.sets);
  const setSummary = summarizeSets(allSets);
  const duration = workoutDuration(workout);
  const hasSetData = setSummary.completedSets > 0;
  const avgRpe = setSummary.rpeCount > 0 ? setSummary.rpeTotal / setSummary.rpeCount : 0;
  const exertion = avgRpe > 0 ? avgRpe : 6.5;
  const confidence = clamp(
    0.48
      + (duration > 0 ? 0.16 : 0)
      + (hasSetData ? 0.16 : 0)
      + (avgRpe > 0 ? 0.12 : 0),
    0.35,
    0.95,
  );
  const durationPoints = duration > 0
    ? 18 * durationCurve(duration) * exertionFactor(exertion) * 1.25
    : hasSetData
      ? 14
      : 8;
  const volumePoints = hasSetData
    ? Math.min(45, Math.pow(Math.max(0, setSummary.volume) / 2500, 0.65) * 28)
    : 0;
  const points = (durationPoints + volumePoints) * confidence;

  return {
    source: "workout",
    class: hasSetData ? "derived_event" : "structured_event",
    label: workout.title,
    points: round(points, 1),
    confidence: round(confidence, 2),
    details: [
      duration > 0 ? `${duration} min` : "duration unknown",
      hasSetData ? `${setSummary.completedSets} completed sets` : "no completed set data",
      avgRpe > 0 ? `avg RPE ${round(avgRpe, 1)}/10` : "estimated exertion",
      hasSetData ? `${Math.round(setSummary.volume)} volume` : "volume unavailable",
    ],
  };
}

function movementContributor(
  state: DailyState | undefined,
  profile: BodyProfile | undefined,
  structuredMinutes: number,
): EffortContributor | null {
  const steps = num(state?.steps);
  const activeGoal = Math.max(15, num(profile?.activeTimeGoal, 45));
  const activeMinutes = num(state?.activeMinutes);
  const estimatedActiveMinutes = activeMinutes > 0 ? activeMinutes : steps > 0 ? Math.round(steps / 100) : 0;
  if (estimatedActiveMinutes <= 0 && steps <= 0) return null;

  const activeComponent = estimatedActiveMinutes > 0
    ? 22 * Math.pow(estimatedActiveMinutes / activeGoal, 0.72)
    : 0;
  const stepComponent = steps > 0
    ? 10 * Math.pow(steps / 5000, 0.62)
    : 0;
  const movementPotential = activeComponent + stepComponent;
  const coverage = estimatedActiveMinutes > 0 ? clamp(structuredMinutes / estimatedActiveMinutes, 0, 1) : 0;
  const residualFactor = structuredMinutes > 0 ? clamp(1 - coverage * 0.78, 0.2, 0.85) : 1;
  const confidence = clamp((activeMinutes > 0 ? 0.58 : 0.38) + (steps > 0 ? 0.16 : 0), 0.32, 0.78);
  const points = movementPotential * residualFactor * confidence;

  if (points < 2) return null;

  return {
    source: "residual_movement",
    class: "background_context",
    label: "Background movement",
    points: round(points, 1),
    confidence: round(confidence, 2),
    details: [
      activeMinutes > 0 ? `${activeMinutes} active min` : `${estimatedActiveMinutes} estimated active min`,
      steps > 0 ? `${steps} steps` : "steps unavailable",
      structuredMinutes > 0 ? `${Math.round(coverage * 100)}% covered by structured events` : "no structured event coverage",
    ],
  };
}

function buildExplanation(contributors: EffortContributor[], effortScore: number) {
  if (contributors.length === 0) return "No reliable physical effort signals found for this day.";
  const top = contributors[0];
  if (effortScore >= 75) return `Very demanding physical day, mainly from ${top.label}.`;
  if (effortScore >= 50) return `Demanding physical day, mainly from ${top.label}.`;
  if (effortScore >= 25) return `Moderate physical effort, mainly from ${top.label}.`;
  return `Light physical effort, mainly from ${top.label}.`;
}

export async function computeDailyEffort(
  storage: IStorage,
  userId: string,
  date: string,
): Promise<DailyEffortResult> {
  const [state, profile, logs, workouts] = await Promise.all([
    storage.getDailyState(userId, date),
    storage.getBodyProfile(userId),
    storage.getActivityLogs(userId, date),
    storage.getWorkouts(userId, date),
  ]);

  const userLogs = logs.filter((log) => log.userId === userId);
  const contributors: EffortContributor[] = [];
  const usedSignals = new Set<string>();
  const excludedSignals = new Set<string>();

  userLogs.forEach((log) => {
    const contributor = activityLogContributor(log);
    if (contributor) {
      contributors.push(contributor);
      usedSignals.add("activity_logs");
      if (log.perceivedEffort) usedSignals.add("perceived_effort");
    } else {
      excludedSignals.add("activity_logs_without_duration");
    }
  });

  for (const workout of workouts) {
    if (!workout.completed) continue;
    const exercises = await storage.getWorkoutExercises(workout.id);
    const contributor = workoutContributor(workout, exercises);
    if (contributor) {
      contributors.push(contributor);
      usedSignals.add("workouts");
      if (contributor.details.some((detail) => detail.includes("completed sets"))) usedSignals.add("workout_sets");
      if (contributor.details.some((detail) => detail.includes("RPE"))) usedSignals.add("rpe");
    }
  }
  if (workouts.length > 0) excludedSignals.add("workouts_are_not_user_scoped_in_current_schema");

  const structuredMinutes = contributors
    .filter((contributor) => contributor.source !== "residual_movement")
    .reduce((sum, contributor) => {
      const durationDetail = contributor.details.find((detail) => detail.endsWith(" min"));
      return sum + (durationDetail ? num(durationDetail.split(" ")[0]) : 0);
    }, 0);

  const movement = movementContributor(state, profile, structuredMinutes);
  if (movement) {
    contributors.push(movement);
    usedSignals.add("residual_movement");
    if (num(state?.activeMinutes) > 0) usedSignals.add("active_minutes");
    if (num(state?.steps) > 0) usedSignals.add("steps");
  }

  if (num(state?.caloriesBurned) > 0) excludedSignals.add("calories_burned_support_only_v1");
  if (num(state?.avgHeartRate) > 0) excludedSignals.add("avg_heart_rate_support_only_v1");
  if (num(state?.recoveryScore) > 0) excludedSignals.add("recovery_score_context_only");
  if (num(state?.workoutIntensity) > 0) excludedSignals.add("daily_workout_intensity_not_trusted_v1");

  contributors.sort((a, b) => b.points - a.points);
  const effortPoints = round(contributors.reduce((sum, contributor) => sum + contributor.points, 0), 1);
  const effortScore = scoreFromPoints(effortPoints);
  const confidenceValue = contributors.length > 0
    ? contributors.reduce((sum, contributor) => sum + contributor.confidence * contributor.points, 0) / Math.max(1, effortPoints)
    : 0;
  const recoveryScore = state?.recoveryScore == null ? null : num(state.recoveryScore);

  return {
    date,
    effortPoints,
    effortScore,
    confidence: confidenceLabel(confidenceValue),
    contributors,
    usedSignals: Array.from(usedSignals),
    excludedSignals: Array.from(excludedSignals),
    residualMovementUsed: contributors.some((contributor) => contributor.source === "residual_movement"),
    context: {
      recoveryScore,
      recoveryLabel: recoveryScore == null ? null : "Rest-domain context only",
    },
    explanation: buildExplanation(contributors, effortScore),
  };
}

export async function computeWeeklyEffort(
  storage: IStorage,
  userId: string,
  date: string,
): Promise<WeeklyEffortResult> {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  const profile = await storage.getBodyProfile(userId);
  const days: DailyEffortResult[] = [];

  for (let index = 0; index < 7; index += 1) {
    const day = addDays(weekStart, index);
    days.push(await computeDailyEffort(storage, userId, day));
  }

  const weeklyEffortPoints = round(days.reduce((sum, day) => sum + day.effortPoints, 0), 1);
  const weeklyTargetPoints = Math.max(1, num(profile?.weeklyEffortTarget, 500));
  const weeklyPercent = Math.round((weeklyEffortPoints / weeklyTargetPoints) * 100);
  const confidenceScore = days.reduce((sum, day) => {
    const value = day.confidence === "high" ? 1 : day.confidence === "medium" ? 0.6 : 0.25;
    return sum + value;
  }, 0) / Math.max(1, days.length);

  return {
    weekStart,
    weekEnd,
    weeklyEffortPoints,
    weeklyTargetPoints,
    weeklyPercent,
    days,
    confidence: confidenceLabel(confidenceScore),
  };
}
