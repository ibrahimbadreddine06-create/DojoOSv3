import { ModuleGrid } from "@/components/body/module-grid";
import { productionActivitiesWidget, productionRecentActivitiesWidget } from "./activities-production-widget";
import { productionStepsWidget } from "./steps-production-widget";
import { productionWorkoutWidget } from "./workout-production-widget";
import { activityCanonicalMetricWidgets } from "../canonical-metric-widget";
import { productionStrengthProgressWidget } from "./strength-progress-widget";
import { activityFirstRunPreset } from "../body-first-run-presets";

export function ActivityPage() {
  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Activity</h1>
        </div>
        <div id="body-activity-actions" className="flex shrink-0 justify-end" />
      </div>
      <ModuleGrid
        widgets={[
          productionStepsWidget,
          productionActivitiesWidget,
          productionWorkoutWidget,
          productionRecentActivitiesWidget,
          productionStrengthProgressWidget,
          ...activityCanonicalMetricWidgets,
        ]}
        initialPreset={activityFirstRunPreset}
        storageKey="moduleGrid_activity_v107_all_umbrellas"
        toolbarTargetId="body-activity-actions"
      />
    </div>
  );
}
