import { ModuleGrid } from "@/components/body/module-grid";
import { productionLastSleepWidget, productionRestPlanWidget, productionSleepScheduleWidget } from "./rest-production-widgets";
import { restCanonicalMetricWidgets } from "../canonical-metric-widget";
import { restObservationWidgets } from "../manual-observation-widget";
import { restFirstRunPreset } from "../body-first-run-presets";

export function RestPage() {
  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Rest & Recovery</h1>
        </div>
        <div id="body-rest-actions" className="flex shrink-0 justify-end" />
      </div>
      <ModuleGrid widgets={[productionLastSleepWidget, productionRestPlanWidget, productionSleepScheduleWidget, ...restCanonicalMetricWidgets, ...restObservationWidgets]} initialPreset={restFirstRunPreset} storageKey="moduleGrid_rest_v108_curated_default" toolbarTargetId="body-rest-actions" />
    </div>
  );
}
