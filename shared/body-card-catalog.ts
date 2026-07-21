export type BodyPage = "hub" | "activity" | "nutrition" | "rest" | "hygiene";

export type BodyCalculationClass = "evidence-backed" | "industry-inspired" | "proxy" | "ai-derived";

export type BodyVisualType =
  | "ring"
  | "segmented-ring"
  | "line"
  | "bar"
  | "stacked-bar"
  | "semi-gauge"
  | "progress"
  | "matrix"
  | "list"
  | "timeline"
  | "calendar"
  | "table";

export type BodyInputSource =
  | "profile"
  | "daily_state"
  | "planner_blocks"
  | "activity_logs"
  | "workouts"
  | "workout_sets"
  | "exercise_library"
  | "muscle_stats"
  | "intake_logs"
  | "intake_routines"
  | "supplement_logs"
  | "fasting_logs"
  | "sleep_logs"
  | "hygiene_routines"
  | "wearable";

export interface BodyWidgetVariantContract {
  id: string;
  label: string;
  visualType: BodyVisualType;
  defaultSize: { w: number; h: number };
}

export interface BodyCardContract {
  key: string;
  page: BodyPage;
  label: string;
  calculationClass: BodyCalculationClass;
  accent: string;
  inputs: BodyInputSource[];
  emptyState: string;
  calculation: string;
  confidenceRule: string;
  decoration: {
    source: "library-svg";
    library: "lucide" | "heroicons" | "phosphor" | "remix";
    shape: string;
  };
  variants: BodyWidgetVariantContract[];
}

const square = { w: 1, h: 1 };
const wide = { w: 2, h: 1 };
const tall = { w: 1, h: 2 };

export const approvedBodyCardsV1: BodyCardContract[] = [
  {
    key: "body_readiness",
    page: "hub",
    label: "Body Readiness",
    calculationClass: "industry-inspired",
    accent: "#14b8a6",
    inputs: ["sleep_logs", "activity_logs", "workouts", "intake_logs", "hygiene_routines", "wearable"],
    emptyState: "Needs at least one real Body signal: sleep, activity, nutrition, hygiene, or wearable recovery.",
    calculation: "Weighted composite of sleep recovery, activity load balance, nutrition coverage, routine consistency, and wearable recovery when present.",
    confidenceRule: "High when 3+ domains are present, medium with 2, low with 1, unavailable with none.",
    decoration: { source: "library-svg", library: "lucide", shape: "sparkles-filled" },
    variants: [
      { id: "score-ring", label: "Score ring", visualType: "segmented-ring", defaultSize: square },
      { id: "component-bars", label: "Component bars", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "energy_reserve",
    page: "hub",
    label: "Energy Reserve",
    calculationClass: "industry-inspired",
    accent: "#fb5a16",
    inputs: ["sleep_logs", "activity_logs", "workouts", "daily_state", "wearable"],
    emptyState: "Needs sleep, activity load, active minutes, or wearable recovery to estimate reserve.",
    calculation: "Recovery gain minus activity/stress drain, normalized to 0-100. It is an energy proxy, not a medical battery.",
    confidenceRule: "High with wearable recovery plus activity, medium with sleep/activity, low with one signal.",
    decoration: { source: "library-svg", library: "lucide", shape: "zap-filled" },
    variants: [
      { id: "stack-gauge", label: "Stack gauge", visualType: "stacked-bar", defaultSize: square },
      { id: "day-curve", label: "Day curve", visualType: "line", defaultSize: wide },
    ],
  },
  {
    key: "body_tasks_today",
    page: "hub",
    label: "Body Tasks Today",
    calculationClass: "evidence-backed",
    accent: "#6366f1",
    inputs: ["planner_blocks"],
    emptyState: "No Body-linked time blocks planned today.",
    calculation: "Counts Body and Body-submodule planner blocks, completed blocks, active blocks, and missed blocks.",
    confidenceRule: "High when planner blocks exist because this is direct planner data.",
    decoration: { source: "library-svg", library: "lucide", shape: "calendar-days-filled" },
    variants: [
      { id: "linked-list", label: "Linked list", visualType: "list", defaultSize: wide },
      { id: "session-progress", label: "Session progress", visualType: "progress", defaultSize: square },
    ],
  },
  {
    key: "input_coverage",
    page: "hub",
    label: "Input Coverage",
    calculationClass: "evidence-backed",
    accent: "#0f766e",
    inputs: ["profile", "daily_state", "planner_blocks", "activity_logs", "intake_logs", "sleep_logs", "hygiene_routines", "wearable"],
    emptyState: "No Body input sources are available yet.",
    calculation: "Percentage of required Body input groups currently available for today's metrics.",
    confidenceRule: "Always high because this is a data availability audit, not a health claim.",
    decoration: { source: "library-svg", library: "lucide", shape: "database-filled" },
    variants: [
      { id: "source-matrix", label: "Source matrix", visualType: "matrix", defaultSize: square },
      { id: "missing-list", label: "Missing list", visualType: "list", defaultSize: wide },
    ],
  },
  {
    key: "activity_effort",
    page: "activity",
    label: "Activity Effort",
    calculationClass: "industry-inspired",
    accent: "#f59e0b",
    inputs: ["activity_logs", "workouts", "workout_sets", "daily_state"],
    emptyState: "Log an activity, complete a workout, or sync active minutes.",
    calculation: "Effort points from duration, perceived effort, workout sets, and residual movement; converted to a 0-100 score.",
    confidenceRule: "High with structured logs and RPE/set data, medium with duration logs, low with only residual movement.",
    decoration: { source: "library-svg", library: "lucide", shape: "activity-filled" },
    variants: [
      { id: "score-line", label: "Score line", visualType: "line", defaultSize: square },
      { id: "effort-bars", label: "Effort bars", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "active_energy",
    page: "activity",
    label: "Active Energy",
    calculationClass: "industry-inspired",
    accent: "#ff3f6c",
    inputs: ["daily_state", "activity_logs", "workouts", "profile", "wearable"],
    emptyState: "Needs wearable active energy or activity logs for a fallback estimate.",
    calculation: "Wearable active calories when present, otherwise effort-based calorie estimate using logged activities.",
    confidenceRule: "High with wearable calories, medium with structured logs, low with effort-only estimate.",
    decoration: { source: "library-svg", library: "lucide", shape: "flame-filled" },
    variants: [
      { id: "bar-chart", label: "Bar chart", visualType: "bar", defaultSize: wide },
      { id: "goal-rail", label: "Goal rail", visualType: "progress", defaultSize: square },
    ],
  },
  {
    key: "workout_calendar",
    page: "activity",
    label: "Workout Calendar",
    calculationClass: "evidence-backed",
    accent: "#8b5cf6",
    inputs: ["workouts", "planner_blocks"],
    emptyState: "No workouts or activity planner blocks found.",
    calculation: "Counts planned, completed, and recent workout days from workouts and linked Activity planner blocks.",
    confidenceRule: "High for completed/planned counts; no medical inference.",
    decoration: { source: "library-svg", library: "lucide", shape: "calendar-check-filled" },
    variants: [
      { id: "month-dots", label: "Month dots", visualType: "calendar", defaultSize: wide },
      { id: "upcoming-list", label: "Upcoming list", visualType: "list", defaultSize: square },
    ],
  },
  {
    key: "planned_workout",
    page: "activity",
    label: "Planned Workout",
    calculationClass: "evidence-backed",
    accent: "#f97316",
    inputs: ["planner_blocks", "workouts"],
    emptyState: "No planned activity block is actionable right now.",
    calculation: "Finds the next Activity-linked block or incomplete workout for today and exposes the start action context.",
    confidenceRule: "High when a planner block or workout exists.",
    decoration: { source: "library-svg", library: "lucide", shape: "play-filled" },
    variants: [
      { id: "start-card", label: "Start card", visualType: "list", defaultSize: wide },
      { id: "timeline", label: "Timeline", visualType: "timeline", defaultSize: wide },
    ],
  },
  {
    key: "muscle_recovery",
    page: "activity",
    label: "Muscle Recovery",
    calculationClass: "industry-inspired",
    accent: "#22c55e",
    inputs: ["muscle_stats", "workouts", "workout_sets"],
    emptyState: "No muscle recovery data yet. Complete workouts or update muscle stats.",
    calculation: "Uses stored muscle recovery when available; otherwise derives a cautious freshness proxy from recent trained muscles.",
    confidenceRule: "Medium/high with muscle stats, low with workout-derived proxy.",
    decoration: { source: "library-svg", library: "lucide", shape: "dumbbell-filled" },
    variants: [
      { id: "muscle-bars", label: "Muscle bars", visualType: "bar", defaultSize: wide },
      { id: "group-matrix", label: "Group matrix", visualType: "matrix", defaultSize: square },
    ],
  },
  {
    key: "training_volume",
    page: "activity",
    label: "Training Volume",
    calculationClass: "evidence-backed",
    accent: "#06b6d4",
    inputs: ["workouts", "workout_sets"],
    emptyState: "No completed weighted sets found for today.",
    calculation: "Total completed set volume from reps x weight across today's workouts.",
    confidenceRule: "High when set reps and weight are logged, medium with partial sets, unavailable without sets.",
    decoration: { source: "library-svg", library: "lucide", shape: "bar-chart-filled" },
    variants: [
      { id: "volume-line", label: "Volume line", visualType: "line", defaultSize: wide },
      { id: "split-bars", label: "Split bars", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "exercise_history",
    page: "activity",
    label: "Exercise History",
    calculationClass: "evidence-backed",
    accent: "#64748b",
    inputs: ["exercise_library", "workouts", "workout_sets"],
    emptyState: "No exercise library or workout history is available.",
    calculation: "Counts exercise library coverage and logged exercise history; detail pages show per-exercise progression.",
    confidenceRule: "High for existing rows; unavailable when library/history is empty.",
    decoration: { source: "library-svg", library: "lucide", shape: "list-checks-filled" },
    variants: [
      { id: "table-widget", label: "Table widget", visualType: "table", defaultSize: wide },
      { id: "mini-chart", label: "Mini chart", visualType: "line", defaultSize: square },
    ],
  },
  {
    key: "nutrition_intake",
    page: "nutrition",
    label: "Nutrition Intake",
    calculationClass: "evidence-backed",
    accent: "#f97316",
    inputs: ["intake_logs", "profile"],
    emptyState: "Log food or drinks to unlock intake coverage.",
    calculation: "Coverage score from calories, protein, macros, fiber, and hydration goals with caps to avoid over-rewarding overeating.",
    confidenceRule: "High with logged intake and profile goals, medium with default goals, unavailable with no logs.",
    decoration: { source: "library-svg", library: "lucide", shape: "apple-filled" },
    variants: [
      { id: "score-ring", label: "Score ring", visualType: "segmented-ring", defaultSize: square },
      { id: "macro-bars", label: "Macro bars", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "calories",
    page: "nutrition",
    label: "Calories",
    calculationClass: "evidence-backed",
    accent: "#ef4444",
    inputs: ["intake_logs", "profile"],
    emptyState: "No calorie intake logged today.",
    calculation: "Consumed calories divided by daily calorie target.",
    confidenceRule: "High with logged calories, medium when foods are estimated, unavailable with no logs.",
    decoration: { source: "library-svg", library: "lucide", shape: "flame-filled" },
    variants: [
      { id: "goal-rail", label: "Goal rail", visualType: "progress", defaultSize: square },
      { id: "day-bars", label: "Day bars", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "protein",
    page: "nutrition",
    label: "Protein",
    calculationClass: "evidence-backed",
    accent: "#a855f7",
    inputs: ["intake_logs", "profile"],
    emptyState: "No protein intake logged today.",
    calculation: "Protein grams divided by profile protein target.",
    confidenceRule: "High with logged grams and profile target, medium with default target.",
    decoration: { source: "library-svg", library: "lucide", shape: "egg-filled" },
    variants: [
      { id: "protein-ring", label: "Protein ring", visualType: "ring", defaultSize: square },
      { id: "meal-distribution", label: "Meal distribution", visualType: "stacked-bar", defaultSize: wide },
    ],
  },
  {
    key: "hydration",
    page: "nutrition",
    label: "Hydration",
    calculationClass: "evidence-backed",
    accent: "#0b6fff",
    inputs: ["intake_logs", "profile"],
    emptyState: "No water intake logged today.",
    calculation: "Logged water divided by profile water target.",
    confidenceRule: "High when water logs exist, medium with partial intake logs, unavailable without water.",
    decoration: { source: "library-svg", library: "lucide", shape: "droplet-filled" },
    variants: [
      { id: "droplet-row", label: "Droplet row", visualType: "progress", defaultSize: square },
      { id: "day-rail", label: "Day rail", visualType: "timeline", defaultSize: wide },
    ],
  },
  {
    key: "micronutrient_coverage",
    page: "nutrition",
    label: "Micronutrient Coverage",
    calculationClass: "evidence-backed",
    accent: "#10b981",
    inputs: ["intake_logs"],
    emptyState: "No micronutrient data logged today.",
    calculation: "Counts available micronutrient fields with non-zero data; shows coverage confidence instead of pretending complete lab accuracy.",
    confidenceRule: "Medium/high when many micronutrient fields are present, low when only macros are present.",
    decoration: { source: "library-svg", library: "lucide", shape: "grid-2x2-filled" },
    variants: [
      { id: "grid", label: "Grid", visualType: "matrix", defaultSize: square },
      { id: "deficiency-list", label: "Deficiency list", visualType: "list", defaultSize: wide },
    ],
  },
  {
    key: "sleep_score",
    page: "rest",
    label: "Sleep Score",
    calculationClass: "industry-inspired",
    accent: "#6366f1",
    inputs: ["sleep_logs", "profile", "wearable"],
    emptyState: "No sleep log or wearable sleep data found for this date.",
    calculation: "Duration vs goal plus available quality/readiness signals; wearable stages can raise confidence but are not required.",
    confidenceRule: "High with wearable/readiness data, medium with duration and quality, low with duration only.",
    decoration: { source: "library-svg", library: "lucide", shape: "moon-filled" },
    variants: [
      { id: "segmented-ring", label: "Segmented ring", visualType: "segmented-ring", defaultSize: square },
      { id: "sleep-bars", label: "Sleep bars", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "sleep_duration",
    page: "rest",
    label: "Sleep Duration",
    calculationClass: "evidence-backed",
    accent: "#8b5cf6",
    inputs: ["sleep_logs", "profile", "daily_state"],
    emptyState: "No sleep duration logged today.",
    calculation: "Actual sleep hours divided by configured sleep goal.",
    confidenceRule: "High with wearable/logged sleep duration, medium with daily state duration.",
    decoration: { source: "library-svg", library: "lucide", shape: "bed-filled" },
    variants: [
      { id: "duration-bar", label: "Duration bar", visualType: "progress", defaultSize: square },
      { id: "week-chart", label: "Week chart", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "sleep_regularity",
    page: "rest",
    label: "Sleep Regularity",
    calculationClass: "proxy",
    accent: "#7c3aed",
    inputs: ["sleep_logs"],
    emptyState: "Needs at least two sleep logs with bed/wake times to calculate timing regularity.",
    calculation: "Penalty from bed and wake time variance across recent sleep logs.",
    confidenceRule: "High with 7+ timed logs, medium with 3-6, low with 2.",
    decoration: { source: "library-svg", library: "lucide", shape: "clock-filled" },
    variants: [
      { id: "anchor-score", label: "Anchor score", visualType: "ring", defaultSize: square },
      { id: "bed-wake-strip", label: "Bed/wake strip", visualType: "timeline", defaultSize: wide },
    ],
  },
  {
    key: "routine_consistency",
    page: "hygiene",
    label: "Routine Consistency",
    calculationClass: "evidence-backed",
    accent: "#e11d48",
    inputs: ["hygiene_routines"],
    emptyState: "Add hygiene, skincare, grooming, posture, or looks routines to track consistency.",
    calculation: "Completed routines divided by planned routines for the user.",
    confidenceRule: "High when routines exist because this is direct completion data.",
    decoration: { source: "library-svg", library: "lucide", shape: "sparkle-filled" },
    variants: [
      { id: "dot-grid", label: "Dot grid", visualType: "matrix", defaultSize: square },
      { id: "week-strip", label: "Week strip", visualType: "timeline", defaultSize: wide },
    ],
  },
  {
    key: "hrv_balance",
    page: "rest",
    label: "HRV Balance",
    calculationClass: "industry-inspired",
    accent: "#10b981",
    inputs: ["wearable"],
    emptyState: "Wearable HRV data required for recovery balance tracking.",
    calculation: "Recent Heart Rate Variability trend against your personal baseline.",
    confidenceRule: "High with wearable sync, unavailable otherwise.",
    decoration: { source: "library-svg", library: "lucide", shape: "heart-filled" },
    variants: [
      { id: "trend-line", label: "Trend line", visualType: "line", defaultSize: wide },
      { id: "status-pill", label: "Status pill", visualType: "progress", defaultSize: square },
    ],
  },
  {
    key: "stress_load",
    page: "rest",
    label: "Stress Load",
    calculationClass: "industry-inspired",
    accent: "#f43f5e",
    inputs: ["wearable", "daily_state"],
    emptyState: "Wearable stress metrics or manual stress logs required.",
    calculation: "Composite of wearable-derived physiological stress and manual stress check-ins.",
    confidenceRule: "High with wearable data, medium with manual logs.",
    decoration: { source: "library-svg", library: "lucide", shape: "activity-filled" },
    variants: [
      { id: "day-curve", label: "Day curve", visualType: "line", defaultSize: wide },
      { id: "semi-gauge", label: "Semi gauge", visualType: "semi-gauge", defaultSize: square },
    ],
  },
  {
    key: "resting_hr",
    page: "rest",
    label: "Resting HR",
    calculationClass: "industry-inspired",
    accent: "#ef4444",
    inputs: ["wearable"],
    emptyState: "Wearable resting heart rate data required.",
    calculation: "Lowest heart rate reached during extended rest or sleep.",
    confidenceRule: "High with wearable sync.",
    decoration: { source: "library-svg", library: "lucide", shape: "heart-filled" },
    variants: [
      { id: "baseline-card", label: "Baseline card", visualType: "bar", defaultSize: square },
      { id: "trend", label: "Trend", visualType: "line", defaultSize: wide },
    ],
  },
  {
    key: "respiratory_rate",
    page: "rest",
    label: "Respiratory Rate",
    calculationClass: "industry-inspired",
    accent: "#3b82f6",
    inputs: ["wearable"],
    emptyState: "Wearable respiratory rate data required.",
    calculation: "Average breaths per minute during deep sleep.",
    confidenceRule: "High with wearable sync.",
    decoration: { source: "library-svg", library: "lucide", shape: "wind-filled" },
    variants: [
      { id: "range-card", label: "Range card", visualType: "bar", defaultSize: square },
      { id: "history", label: "History", visualType: "line", defaultSize: wide },
    ],
  },
  {
    key: "steps",
    page: "activity",
    label: "Steps",
    calculationClass: "evidence-backed",
    accent: "#f59e0b",
    inputs: ["wearable", "daily_state"],
    emptyState: "Step count data from wearable or phone sync required.",
    calculation: "Total daily step count against the standard 10,000 step baseline or custom goal.",
    confidenceRule: "High with phone/wearable sync, medium with manual entry.",
    decoration: { source: "library-svg", library: "lucide", shape: "footprints-filled" },
    variants: [
      { id: "path-progress", label: "Path progress", visualType: "progress", defaultSize: square },
      { id: "hourly-bars", label: "Hourly bars", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "active_minutes",
    page: "activity",
    label: "Active Minutes",
    calculationClass: "evidence-backed",
    accent: "#22c55e",
    inputs: ["wearable", "activity_logs"],
    emptyState: "Active minutes from wearable or logged activities required.",
    calculation: "Minutes spent in moderate to vigorous physical activity.",
    confidenceRule: "High with wearable sync, medium with activity logs.",
    decoration: { source: "library-svg", library: "lucide", shape: "timer-filled" },
    variants: [
      { id: "ring", label: "Ring", visualType: "ring", defaultSize: square },
      { id: "day-strip", label: "Day strip", visualType: "timeline", defaultSize: wide },
    ],
  },
  {
    key: "body_momentum",
    page: "hub",
    label: "Body Momentum",
    calculationClass: "ai-derived",
    accent: "#0ea5e9",
    inputs: ["activity_logs", "intake_logs", "sleep_logs"],
    emptyState: "Build momentum by logging consistently across all domains.",
    calculation: "Rolling 7-day consistency score weighing workout volume, nutrition targets, and sleep regularity.",
    confidenceRule: "High with 7+ days of multi-domain logs.",
    decoration: { source: "library-svg", library: "lucide", shape: "zap-filled" },
    variants: [
      { id: "trend-line", label: "Trend line", visualType: "line", defaultSize: wide },
      { id: "seven-day-bars", label: "7-day bars", visualType: "bar", defaultSize: square },
    ],
  },
  {
    key: "recovery_debt",
    page: "hub",
    label: "Recovery Debt",
    calculationClass: "industry-inspired",
    accent: "#f97316",
    inputs: ["wearable", "activity_logs", "sleep_logs"],
    emptyState: "Tracked against your capacity to recover from physical strain.",
    calculation: "Negative balance when activity effort exceeds recovery quality over a rolling period.",
    confidenceRule: "High with wearable data, medium with manual logs.",
    decoration: { source: "library-svg", library: "lucide", shape: "trending-down-filled" },
    variants: [
      { id: "debt-number", label: "Debt number", visualType: "progress", defaultSize: square },
      { id: "debt-sparkline", label: "Debt sparkline", visualType: "line", defaultSize: wide },
    ],
  },
  {
    key: "sleep_debt",
    page: "rest",
    label: "Sleep Debt",
    calculationClass: "industry-inspired",
    accent: "#6366f1",
    inputs: ["sleep_logs"],
    emptyState: "Compare actual sleep against goal over the last 7 days.",
    calculation: "Cumulative difference between your sleep goal and actual sleep hours.",
    confidenceRule: "High with 7 days of logs.",
    decoration: { source: "library-svg", library: "lucide", shape: "moon-filled" },
    variants: [
      { id: "debt-gauge", label: "Debt gauge", visualType: "semi-gauge", defaultSize: square },
      { id: "debt-trend", label: "Debt trend", visualType: "bar", defaultSize: wide },
    ],
  },
  {
    key: "weight_trend",
    page: "nutrition",
    label: "Weight Trend",
    calculationClass: "proxy",
    accent: "#64748b",
    inputs: ["daily_state"],
    emptyState: "Log your weight consistently to see trend analysis.",
    calculation: "Exponentially weighted moving average of weight logs to filter out daily fluctuations.",
    confidenceRule: "High with daily logs, medium with weekly.",
    decoration: { source: "library-svg", library: "lucide", shape: "scale-filled" },
    variants: [
      { id: "trend-line", label: "Trend line", visualType: "line", defaultSize: wide },
      { id: "goal-eta", label: "Goal ETA", visualType: "progress", defaultSize: square },
    ],
  },
  {
    key: "fasting_window",
    page: "nutrition",
    label: "Fasting Window",
    calculationClass: "evidence-backed",
    accent: "#8b5cf6",
    inputs: ["fasting_logs"],
    emptyState: "Start a fast to track your progress and window consistency.",
    calculation: "Time elapsed since last meal against target fasting duration.",
    confidenceRule: "High with active fast log.",
    decoration: { source: "library-svg", library: "lucide", shape: "timer-filled" },
    variants: [
      { id: "ring", label: "Ring", visualType: "ring", defaultSize: square },
      { id: "window-timeline", label: "Window timeline", visualType: "timeline", defaultSize: wide },
    ],
  },
];

export const approvedBodyCardKeysV1 = approvedBodyCardsV1.map((card) => card.key);

const catalogRows = {
  hub: [
    ["body_readiness", "Body Readiness", "score-ring", "component-bars"],
    ["energy_reserve", "Energy Reserve", "stack-gauge", "day-curve"],
    ["load_vs_recovery", "Load vs Recovery", "balance-disk", "two-line-trend"],
    ["body_tasks_today", "Body Tasks Today", "linked-list", "session-progress"],
    ["input_coverage", "Input Coverage", "source-matrix", "missing-list"],
    ["body_momentum", "Body Momentum", "trend-line", "seven-day-bars"],
    ["recovery_debt", "Recovery Debt", "debt-number", "debt-sparkline"],
    ["rhythm_alignment", "Rhythm Alignment", "clock-ring", "timeline"],
    ["body_brief", "Body Brief", "recommendation-panel", "priority-chips"],
    ["weekly_body_score", "Weekly Body Score", "week-ring", "week-heat-strip"],
  ],
  activity: [
    ["activity_effort", "Activity Effort", "score-line", "effort-bars"],
    ["active_energy", "Active Energy", "bar-chart", "goal-rail"],
    ["workout_calendar", "Workout Calendar", "month-dots", "upcoming-list"],
    ["planned_workout", "Planned Workout", "start-card", "timeline"],
    ["muscle_recovery", "Muscle Recovery", "body-heatmap", "muscle-bars"],
    ["training_volume", "Training Volume", "volume-line", "muscle-split-bars"],
    ["progressive_overload", "Progressive Overload", "pr-ladder", "exercise-trend"],
    ["exercise_history", "Exercise History", "table-widget", "mini-chart"],
    ["muscle_group_history", "Muscle Group History", "group-chart", "balance-bars"],
    ["cardio_load", "Cardio Load", "load-score", "zone-bars"],
    ["steps", "Steps", "path-progress", "hourly-bars"],
    ["active_minutes", "Active Minutes", "ring", "day-strip"],
    ["workout_consistency", "Workout Consistency", "streak-card", "planned-vs-done"],
    ["recovery_aware_target", "Recovery-Aware Target", "target-gauge", "target-chips"],
  ],
  nutrition: [
    ["nutrition_intake", "Nutrition Intake", "score-ring", "macro-bars"],
    ["calories", "Calories", "goal-rail", "day-bars"],
    ["protein", "Protein", "protein-ring", "meal-distribution"],
    ["hydration", "Hydration", "droplet-row", "day-rail"],
    ["macro_balance", "Macro Balance", "grouped-bars", "plate-split"],
    ["micronutrient_coverage", "Micronutrient Coverage", "grid", "deficiency-list"],
    ["fiber", "Fiber", "fiber-rail", "week-bars"],
    ["sodium_potassium", "Sodium/Potassium", "balance-bars", "alert-list"],
    ["supplement_schedule", "Supplement Schedule", "checklist", "time-rail"],
    ["medication_schedule", "Medication Schedule", "checklist", "missed-list"],
    ["fasting_window", "Fasting Window", "ring", "window-timeline"],
    ["energy_balance", "Energy Balance", "balance-number", "trend"],
    ["weight_trend", "Weight Trend", "trend-line", "goal-eta"],
  ],
  rest: [
    ["sleep_score", "Sleep Score", "segmented-ring", "sleep-bars"],
    ["sleep_duration", "Sleep Duration", "duration-bar", "week-chart"],
    ["sleep_regularity", "Sleep Regularity", "anchor-score", "bed-wake-strip"],
    ["sleep_debt", "Sleep Debt", "debt-gauge", "debt-trend"],
    ["restorative_time", "Restorative Time", "rest-blocks", "day-rail"],
    ["meditation_consistency", "Meditation Consistency", "streak", "duration-bars"],
    ["stress_load", "Stress Load", "semi-gauge", "day-line"],
    ["hrv_balance", "HRV Balance", "line", "status-pill"],
    ["resting_hr", "Resting HR", "line", "baseline-card"],
    ["respiratory_rate", "Respiratory Rate", "dotted-rhythm", "range-card"],
    ["circadian_alignment", "Circadian Alignment", "rhythm-ring", "timeline"],
  ],
  hygiene: [
    ["routine_consistency", "Routine Consistency", "dot-grid", "week-strip"],
    ["skincare_rhythm", "Skincare Rhythm", "am-pm-bars", "active-spacing"],
    ["oral_care", "Oral Care", "checklist", "streak-rail"],
    ["grooming_freshness", "Grooming Freshness", "freshness-meter", "upcoming-list"],
    ["skin_notes", "Skin Notes", "photo-log-list", "progress-timeline"],
    ["posture_mobility_looks", "Posture/Mobility Looks", "routine-progress", "streak-bars"],
    ["glow_up_momentum", "Glow-Up Momentum", "momentum-score", "contribution-bars"],
  ],
} satisfies Record<BodyPage, [string, string, string, string][]>;

export const bodyWidgetVariantInventoryV1 = Object.entries(catalogRows).flatMap(([page, rows]) =>
  rows.flatMap(([cardKey, cardLabel, firstVariant, secondVariant]) => ([
    { page: page as BodyPage, cardKey, cardLabel, variantId: firstVariant },
    { page: page as BodyPage, cardKey, cardLabel, variantId: secondVariant },
  ])),
);
