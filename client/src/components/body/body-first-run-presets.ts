import type { ModuleGridPreset } from "@/components/body/module-grid";

export const hubFirstRunPreset: ModuleGridPreset = {
  gridColumns: 4,
  includeAllWidgets: true,
  items: [
    { widgetId: "hub.today", visualizationId: "day-map", size: { w: 2, h: 1 }, accentColor: "#2563eb", placement: { row: 0, column: 0 } },
    { widgetId: "hub.data_coverage", visualizationId: "connection-field", size: { w: 1, h: 1 }, accentColor: "#0891b2", placement: { row: 0, column: 2 } },
    { widgetId: "hub.heart_rate", visualizationId: "visual", size: { w: 1, h: 1 }, accentColor: "#e5484d", placement: { row: 0, column: 3 } },
    { widgetId: "hub.body_timeline", visualizationId: "day-rail", size: { w: 2, h: 1 }, accentColor: "#20a65a", placement: { row: 1, column: 0 } },
    { widgetId: "hub.body_composition", visualizationId: "visual", size: { w: 2, h: 1 }, accentColor: "#7c3aed", placement: { row: 1, column: 2 } },
    { widgetId: "hub.weight", visualizationId: "visual", size: { w: 1, h: 1 }, accentColor: "#2563eb", placement: { row: 2, column: 0 } },
  ],
};

export const activityFirstRunPreset: ModuleGridPreset = {
  gridColumns: 4,
  includeAllWidgets: true,
  items: [
    { widgetId: "activity.activities", visualizationId: "day-flow", size: { w: 2, h: 1 }, accentColor: "#20a65a", placement: { row: 0, column: 0 } },
    { widgetId: "activity.steps", visualizationId: "recorded-pattern", size: { w: 1, h: 1 }, accentColor: "#2563eb", placement: { row: 0, column: 2 } },
    { widgetId: "activity.training_load", visualizationId: "visual", size: { w: 1, h: 1 }, accentColor: "#db2777", placement: { row: 0, column: 3 } },
    { widgetId: "activity.workout", visualizationId: "session-map", size: { w: 2, h: 1 }, accentColor: "#7c3aed", placement: { row: 1, column: 0 } },
    { widgetId: "activity.strength_progress", visualizationId: "volume-history", size: { w: 2, h: 1 }, accentColor: "#ea7c16", placement: { row: 1, column: 2 } },
    { widgetId: "activity.heart_rate_zones", visualizationId: "visual", size: { w: 1, h: 1 }, accentColor: "#e5484d", placement: { row: 2, column: 0 } },
  ],
};

export const nutritionFirstRunPreset: ModuleGridPreset = {
  gridColumns: 4,
  includeAllWidgets: true,
  items: [
    { widgetId: "nutrition.log_intake", visualizationId: "day-rhythm", size: { w: 1, h: 1 }, accentColor: "#ea7c16", placement: { row: 0, column: 0 } },
    { widgetId: "nutrition.meal_plan", visualizationId: "plan-rail", size: { w: 2, h: 1 }, accentColor: "#2563eb", placement: { row: 0, column: 1 } },
    { widgetId: "nutrition.calories", visualizationId: "meal-distribution", size: { w: 1, h: 1 }, accentColor: "#e5484d", placement: { row: 0, column: 3 } },
    { widgetId: "nutrition.macronutrients", visualizationId: "macro-composition", size: { w: 2, h: 1 }, accentColor: "#0891b2", placement: { row: 1, column: 0 } },
    { widgetId: "nutrition.water_intake", visualizationId: "entry-pattern", size: { w: 1, h: 1 }, accentColor: "#2563eb", placement: { row: 1, column: 2 } },
    { widgetId: "nutrition.caffeine", visualizationId: "caffeine-timing", size: { w: 1, h: 1 }, accentColor: "#8b5e3c", placement: { row: 1, column: 3 } },
    { widgetId: "nutrition.fasting", visualizationId: "progress-dial", size: { w: 1, h: 1 }, accentColor: "#7c3aed", placement: { row: 2, column: 0 } },
  ],
};

export const restFirstRunPreset: ModuleGridPreset = {
  gridColumns: 4,
  includeAllWidgets: true,
  items: [
    { widgetId: "rest.last_sleep", visualizationId: "duration-orb", size: { w: 2, h: 1 }, accentColor: "#7c3aed", placement: { row: 0, column: 0 } },
    { widgetId: "rest.rest_plan", visualizationId: "night-window", size: { w: 1, h: 1 }, accentColor: "#2563eb", placement: { row: 0, column: 2 } },
    { widgetId: "rest.recovery", visualizationId: "visual", size: { w: 1, h: 1 }, accentColor: "#20a65a", placement: { row: 0, column: 3 } },
    { widgetId: "rest.sleep_stages", visualizationId: "visual", size: { w: 2, h: 1 }, accentColor: "#4f46e5", placement: { row: 1, column: 0 } },
    { widgetId: "rest.hrv", visualizationId: "visual", size: { w: 1, h: 1 }, accentColor: "#2563eb", placement: { row: 1, column: 2 } },
    { widgetId: "rest.physiological_stress", visualizationId: "visual", size: { w: 1, h: 1 }, accentColor: "#e5484d", placement: { row: 1, column: 3 } },
    { widgetId: "rest.perceived_stress", visualizationId: "stress-history", size: { w: 1, h: 1 }, accentColor: "#ea7c16", placement: { row: 2, column: 0 } },
  ],
};

export const hygieneFirstRunPreset: ModuleGridPreset = {
  gridColumns: 4,
  includeAllWidgets: true,
  items: [
    { widgetId: "hygiene.routines", visualizationId: "progress-field", size: { w: 2, h: 1 }, accentColor: "#db2777", placement: { row: 0, column: 0 } },
    { widgetId: "hygiene.routine_consistency", visualizationId: "streak-landscape", size: { w: 1, h: 1 }, accentColor: "#7c3aed", placement: { row: 0, column: 2 } },
    { widgetId: "hygiene.products", visualizationId: "product-rotation", size: { w: 1, h: 1 }, accentColor: "#ea7c16", placement: { row: 0, column: 3 } },
    { widgetId: "hygiene.skin_progress", visualizationId: "skin-comparison", size: { w: 1, h: 1 }, accentColor: "#0ea5a4", placement: { row: 1, column: 1 } },
    { widgetId: "hygiene.symptoms", visualizationId: "symptom-timeline", size: { w: 1, h: 1 }, accentColor: "#e5484d", placement: { row: 1, column: 2 } },
  ],
};
