const MODE_KEY = "dojo-body-presentation-mode";

type DemoRecord = Record<string, any>;

const now = new Date();
const localDate = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
].join("-");
const at = (hours: number, minutes = 0) => {
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const demo = {
  intakes: [
    { id: "demo-breakfast", date: at(8, 10), mealName: "Oats, yogurt & berries", mealType: "breakfast", calories: "518", protein: "31", carbs: "67", fats: "14", fiber: "11", water: "350", status: "consumed" },
    { id: "demo-lunch", date: at(12, 35), mealName: "Chicken grain bowl", mealType: "lunch", calories: "684", protein: "49", carbs: "76", fats: "19", fiber: "9", water: "500", status: "consumed" },
    { id: "demo-dinner", date: at(19, 0), mealName: "Salmon, potatoes & greens", mealType: "dinner", calories: "635", protein: "44", carbs: "58", fats: "24", fiber: "8", water: "400", status: "planned" },
  ] as DemoRecord[],
  routines: [
    { id: "demo-routine-1", name: "Morning skincare", completed: true, date: localDate, frequency: "daily", streak: 12, bestStreak: 18 },
    { id: "demo-routine-2", name: "Brush & floss", completed: true, date: localDate, frequency: "daily", streak: 28, bestStreak: 34 },
    { id: "demo-routine-3", name: "Evening skincare", completed: false, date: localDate, frequency: "daily", streak: 9, bestStreak: 16 },
  ] as DemoRecord[],
  observations: {
    "nutrition.caffeine": [{ id: "demo-caffeine", actualStartAt: at(9, 5), evidence: { value: 96, unit: "mg", confidence: "exact" } }],
    "nutrition.alcohol": [],
    "rest.perceived_stress": [{ id: "demo-stress", actualStartAt: at(14, 20), evidence: { value: 4, unit: "/10", scaleVersion: "numeric-rating-scale.0-10.v1", confidence: "exact" } }],
    "rest.naps": [{ id: "demo-nap", actualStartAt: new Date(Date.now() - 86400000).toISOString(), evidence: { value: 24, unit: "min", confidence: "exact" } }],
    "hygiene.cycle": [],
    "hygiene.skin_progress": [{ id: "demo-skin", actualStartAt: at(7, 45), evidence: { value: "Calmer than last week", confidence: "exact" } }],
    "hygiene.appearance_progress": [],
    "hygiene.products": [{ id: "demo-product", actualStartAt: at(7, 48), evidence: { value: "SPF 50", confidence: "exact" } }],
    "hygiene.symptoms": [{ id: "demo-symptom", actualStartAt: at(10, 15), evidence: { value: "Mild headache · 2/10", confidence: "exact" } }],
  } as Record<string, DemoRecord[]>,
};

const metricValues: Record<string, { value: unknown; unit: string | null; coverage?: number }> = {
  "activity.steps": { value: 8432, unit: "steps", coverage: 0.98 },
  "activity.active_minutes": { value: 54, unit: "min", coverage: 0.96 },
  "activity.sedentary_time": { value: 418, unit: "min", coverage: 0.91 },
  "activity.distance": { value: 6.7, unit: "km", coverage: 0.98 },
  "activity.active_energy": { value: 612, unit: "kcal", coverage: 0.94 },
  "activity.floors": { value: 11, unit: "floors", coverage: 0.97 },
  "exercise.heart_rate_zone_duration": { value: 38, unit: "min", coverage: 0.93 },
  "fitness.vo2_max": { value: 47.8, unit: "mL/kg/min", coverage: 0.86 },
  "load.acute_chronic_trends": { value: 482, unit: "sRPE·min", coverage: 0.88 },
  "cardio.heart_rate": { value: 74, unit: "bpm", coverage: 0.99 },
  "body.weight": { value: 79.4, unit: "kg", coverage: 1 },
  "body.composition": { value: 18.6, unit: "% body fat", coverage: 1 },
  "cardio.blood_pressure": { value: "118/76", unit: "mmHg", coverage: 1 },
  "metabolic.blood_glucose": { value: 92, unit: "mg/dL", coverage: 0.72 },
  "sleep.total_sleep": { value: 7.6, unit: "h", coverage: 0.97 },
  "sleep.stage_duration": { value: "1h 42m deep", unit: null, coverage: 0.94 },
  "sleep.efficiency": { value: 91, unit: "%", coverage: 0.96 },
  "provider.recovery.score": { value: 82, unit: "/100", coverage: 0.92 },
  "cardio.hrv.rmssd": { value: 58, unit: "ms", coverage: 0.95 },
  "cardio.heart_rate.resting": { value: 56, unit: "bpm", coverage: 0.98 },
  "respiration.rate": { value: 14.2, unit: "breaths/min", coverage: 0.97 },
  "temperature.skin": { value: 0.1, unit: "°C from baseline", coverage: 0.9 },
  "oxygen.saturation": { value: 97, unit: "%", coverage: 0.95 },
  "provider.stress.score": { value: 32, unit: "/100", coverage: 0.89 },
  "sleep.debt_or_need": { value: 0.7, unit: "h", coverage: 0.84 },
};

const umbrellaMetricIds: Record<string, string> = {
  "activity.steps": "activity.steps",
  "activity.active_minutes": "activity.active_minutes",
  "activity.sedentary_time": "activity.sedentary_time",
  "activity.distance": "activity.distance",
  "activity.active_energy": "activity.active_energy",
  "activity.floors_climbed": "activity.floors",
  "activity.training_load": "load.acute_chronic_trends",
  "activity.heart_rate_zones": "exercise.heart_rate_zone_duration",
  "activity.cardio_fitness": "fitness.vo2_max",
  "hub.heart_rate": "cardio.heart_rate",
  "hub.weight": "body.weight",
  "hub.body_composition": "body.composition",
  "hub.blood_pressure": "cardio.blood_pressure",
  "hub.blood_glucose": "metabolic.blood_glucose",
  "rest.sleep_duration": "sleep.total_sleep",
  "rest.sleep_stages": "sleep.stage_duration",
  "rest.sleep_efficiency": "sleep.efficiency",
  "rest.sleep_debt": "sleep.debt_or_need",
  "rest.recovery": "provider.recovery.score",
  "rest.hrv": "cardio.hrv.rmssd",
  "rest.resting_heart_rate": "cardio.heart_rate.resting",
  "rest.respiratory_rate": "respiration.rate",
  "rest.skin_temperature": "temperature.skin",
  "rest.blood_oxygen": "oxygen.saturation",
  "rest.physiological_stress": "provider.stress.score",
};

const manualUmbrellas = new Set(Object.keys(demo.observations));

function umbrellaName(umbrellaId: string) {
  return umbrellaId
    .split(".").at(-1)!
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function umbrellaSubmodule(umbrellaId: string) {
  const prefix = umbrellaId.split(".")[0];
  if (prefix === "rest") return "rest_recovery";
  if (prefix === "hygiene") return "hygiene_looks";
  return prefix;
}

function metricHistory(umbrellaId: string, metricId: string) {
  const metric = metricValues[metricId];
  if (!metric) return [];
  const numeric = typeof metric.value === "number";
  const offsets = numeric
    ? Array.from({ length: 180 }, (_, index) => {
        if (index === 179) return 0;
        const progress = index / 179;
        return (-0.07 + progress * 0.07) + Math.sin(index * 0.31) * 0.022;
      })
    : [0];
  return offsets.map((offset, index) => {
    const recordedAt = new Date(now);
    recordedAt.setDate(recordedAt.getDate() - (offsets.length - 1 - index));
    const value = numeric
      ? Number(((metric.value as number) * (1 + offset)).toFixed(Math.abs(metric.value as number) < 20 ? 1 : 0))
      : metric.value;
    return {
      id: `demo-detail-${umbrellaId}-${index}`,
      at: recordedAt.toISOString(),
      localDate: recordedAt.toISOString().slice(0, 10),
      value,
      unit: metric.unit,
      state: "valid",
      source: metricId.startsWith("provider.") ? "demo.provider" : "demo.canonical",
      coverageRatio: metric.coverage ?? 1,
      uncertainty: [],
      specificationVersion: "presentation.v1",
    };
  });
}

function operationalRecords(umbrellaId: string) {
  const operations = bodyOperations(new URL("http://presentation.local/api/body/operations"));
  return operations.executions.map((execution) => {
    const subject = operations.subjects.find((item) => item.id === execution.subjectId);
    return {
      id: execution.id,
      subjectId: execution.subjectId,
      label: subject?.titleSnapshot ?? umbrellaName(umbrellaId),
      subjectType: subject?.subjectType ?? umbrellaId.split(".")[0],
      source: "demo.operational",
      status: execution.status,
      at: execution.actualStartAt,
      endAt: execution.actualEndAt ?? null,
      durationSeconds: execution.actualEndAt
        ? Math.round((new Date(execution.actualEndAt).getTime() - new Date(execution.actualStartAt).getTime()) / 1000)
        : null,
      evidence: null,
      privacyClass: null,
    };
  });
}

function umbrellaDetail(umbrellaId: string) {
  const metricId = umbrellaMetricIds[umbrellaId] ?? umbrellaId;
  const history = metricHistory(umbrellaId, metricId);
  const observations = demo.observations[umbrellaId] ?? [];
  const lens = history.length > 0 ? "metric" : manualUmbrellas.has(umbrellaId) ? "observation" : "operational";
  const records = lens === "observation"
    ? observations.map((observation) => ({
        id: observation.id,
        subjectId: umbrellaId,
        label: String(observation.evidence?.value ?? "Recorded"),
        subjectType: "manual_observation",
        source: "demo.manual",
        status: "completed",
        at: observation.actualStartAt,
        endAt: null,
        durationSeconds: null,
        evidence: observation.evidence,
        privacyClass: null,
      }))
    : lens === "operational" ? operationalRecords(umbrellaId) : [];

  return {
    umbrella: {
      id: umbrellaId,
      name: umbrellaName(umbrellaId),
      submodule: umbrellaSubmodule(umbrellaId),
      disposition: umbrellaId.includes("cycle") || umbrellaId.includes("symptom") ? "sensitive" : "standard",
    },
    metricId,
    lens,
    storageAvailable: true,
    current: history.at(-1) ?? null,
    history,
    records,
    plans: [],
    sources: history.length
      ? [metricId.startsWith("provider.") ? "demo.provider" : "demo.canonical"]
      : records.length ? [lens === "observation" ? "demo.manual" : "demo.operational"] : [],
  };
}

const activitySubjects = [
  { id: "demo-subject-walk", subjectType: "activity", titleSnapshot: "Morning walk" },
  { id: "demo-subject-workout", subjectType: "activity", titleSnapshot: "Upper body workout" },
];
const activityExecutions = [
  { id: "demo-execution-walk", subjectId: "demo-subject-walk", status: "completed", actualStartAt: at(7, 20), actualEndAt: at(7, 55) },
];
const activityCommitments = [
  { id: "demo-plan-workout", subjectId: "demo-subject-workout", status: "planned", plannedStartAt: at(18, 0), plannedEndAt: at(19, 0) },
];

function bodyOperations(url: URL) {
  if (url.searchParams.get("subjectType") === "activity") {
    return {
      subjects: activitySubjects,
      commitments: activityCommitments,
      executions: activityExecutions,
    };
  }
  return {
    subjects: [
      ...activitySubjects,
      { id: "demo-subject-dinner", subjectType: "intake", titleSnapshot: "Dinner" },
      { id: "demo-subject-routine", subjectType: "hygiene_routine", titleSnapshot: "Evening skincare" },
    ],
    commitments: [
      ...activityCommitments,
      { id: "demo-plan-dinner", subjectId: "demo-subject-dinner", status: "planned", plannedStartAt: at(19, 0) },
      { id: "demo-plan-routine", subjectId: "demo-subject-routine", status: "planned", plannedStartAt: at(21, 30) },
    ],
    executions: activityExecutions,
  };
}

export function isBodyPresentationMode() {
  return (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(MODE_KEY) === "true"
  );
}

export function setBodyPresentationMode(enabled: boolean) {
  if (enabled) window.sessionStorage.setItem(MODE_KEY, "true");
  else window.sessionStorage.removeItem(MODE_KEY);
}

function isBodyApi(pathname: string) {
  return [
    "/api/body", "/api/health-sync", "/api/workouts", "/api/exercises",
    "/api/exercise-library", "/api/intake", "/api/fasting", "/api/sleep",
    "/api/hygiene", "/api/muscle", "/api/activity",
  ].some((prefix) => pathname.startsWith(prefix));
}

export async function bodyPresentationResponse(
  method: string,
  input: string,
  data?: any,
): Promise<Response | null> {
  if (!isBodyPresentationMode()) return null;
  const url = new URL(input, window.location.origin);
  const path = url.pathname;
  const verb = method.toUpperCase();

  if (verb === "GET" && path === "/api/body-profile") return json({ id: "demo-profile", bodyGoal: "maintain", dailyCalorieGoal: 2200 });
  if (verb === "GET" && path === "/api/body/operations") return json(bodyOperations(url));
  if (verb === "GET" && /^\/api\/body\/umbrellas\/[^/]+\/detail$/.test(path)) {
    const umbrellaId = decodeURIComponent(path.split("/").at(-2)!);
    return json(umbrellaDetail(umbrellaId));
  }
  if (verb === "GET" && path === "/api/body/activity-definitions") return json([
    { id: "walking", slug: "walking", name: "Walking", category: "cardio", source: "curated" },
    { id: "strength", slug: "strength-training", name: "Strength Training", category: "strength", source: "curated" },
    { id: "running", slug: "running", name: "Running", category: "cardio", source: "curated" },
  ]);
  if (verb === "GET" && path.startsWith("/api/body/metrics/")) {
    const metricId = decodeURIComponent(path.slice("/api/body/metrics/".length, -"/latest".length));
    const metric = metricValues[metricId];
    return json(metric ? {
      metricId,
      state: "valid",
      value: metric.value,
      unit: metric.unit,
      localDate,
      coverageRatio: metric.coverage ?? 1,
      generatedAt: now.toISOString(),
      sourceNamespace: metricId.startsWith("provider.") ? "demo.provider" : "demo.canonical",
      uncertainty: [],
      contributions: [],
    } : {
      metricId, state: "awaiting_data", value: null, unit: null, localDate,
      coverageRatio: null, generatedAt: null, sourceNamespace: null,
      uncertainty: [], contributions: [],
    });
  }
  if (verb === "GET" && path === "/api/health-sync/status") return json({
    storageReady: true,
    updatedAt: now.toISOString(),
    connectors: [
      { id: "apple_healthkit", label: "Apple Health", connection: { status: "connected", lastSuccessfulSyncAt: now.toISOString() } },
      { id: "oura", label: "Oura", connection: { status: "connected", lastSuccessfulSyncAt: now.toISOString() } },
    ],
  });
  if (verb === "GET" && path.startsWith("/api/intake-logs/")) return json(demo.intakes);
  if (verb === "GET" && path === "/api/intake-routines") return json([]);
  if (verb === "GET" && path.startsWith("/api/intake-routine-checkins/")) return json([]);
  if (verb === "GET" && path === "/api/fasting-logs/active") return json({ id: "demo-fast", startTime: at(20, 0), targetHours: 16, status: "active" });
  if (verb === "GET" && path === "/api/sleep-logs/all") return json([
    { id: "demo-sleep", date: localDate, actualHours: "7.6", quality: 4, startTime: at(23, 8), endTime: at(6, 44) },
    { id: "demo-sleep-plan", date: localDate, plannedHours: "8.0", actualHours: null },
  ]);
  if (verb === "GET" && path.startsWith("/api/sleep-logs/")) return json([{ id: "demo-sleep-plan", date: localDate, plannedHours: "8.0", actualHours: null }]);
  if (verb === "GET" && path === "/api/hygiene-routines") return json(demo.routines);
  if (verb === "GET" && path.startsWith("/api/body/manual-observations/")) {
    const umbrellaId = decodeURIComponent(path.slice("/api/body/manual-observations/".length));
    return json({ umbrellaId, observations: demo.observations[umbrellaId] ?? [] });
  }
  if (verb === "GET" && (path === "/api/workouts" || path.startsWith("/api/workouts/"))) return json([
    { id: "demo-workout", title: "Upper body strength", date: localDate, completed: false, exercises: [] },
  ]);
  if (verb === "GET" && (path === "/api/exercise-library" || path === "/api/exercises")) return json([
    { id: "bench-press", name: "Bench Press" },
    { id: "squat", name: "Back Squat" },
    { id: "deadlift", name: "Deadlift" },
  ]);
  if (verb === "GET" && /^\/api\/exercises\/[^/]+\/progress$/.test(path)) return json([
    { date: "2026-06-22", maxWeight: 72.5, totalVolume: 2320 },
    { date: "2026-07-02", maxWeight: 75, totalVolume: 2480 },
    { date: "2026-07-12", maxWeight: 77.5, totalVolume: 2590 },
    { date: localDate, maxWeight: 80, totalVolume: 2740 },
  ]);

  if (verb === "POST" && path === "/api/body/manual-observations") {
    const observation = {
      id: `demo-${crypto.randomUUID()}`,
      actualStartAt: data.observedAt,
      evidence: {
        value: data.value, unit: data.unit, scaleVersion: data.scaleVersion,
        confidence: data.confidence,
      },
    };
    (demo.observations[data.umbrellaId] ??= []).unshift(observation);
    return json({ execution: observation }, 201);
  }
  if (verb === "POST" && path === "/api/intake-logs") {
    const record = { ...data, id: `demo-${crypto.randomUUID()}`, date: now.toISOString() };
    demo.intakes.unshift(record);
    return json(record, 201);
  }
  if (verb === "POST" && /\/api\/hygiene-routines\/[^/]+\/complete$/.test(path)) {
    const id = path.split("/").at(-2);
    const routine = demo.routines.find((item) => item.id === id);
    if (routine) routine.completed = true;
    return json(routine ?? {});
  }
  if (verb === "POST" && path === "/api/hygiene-routines") {
    const routine = { ...data, id: `demo-${crypto.randomUUID()}`, streak: 0, bestStreak: 0 };
    demo.routines.push(routine);
    return json(routine, 201);
  }

  if (isBodyApi(path) && verb !== "GET") {
    return json({ message: "This action is not simulated in Presentation Mode." }, 409);
  }
  if (isBodyApi(path) && verb === "GET") {
    console.warn(`[Body Presentation] Missing sample handler for ${path}`);
    return json({ message: `No preview sample is defined for ${path}.` }, 404);
  }
  return null;
}
