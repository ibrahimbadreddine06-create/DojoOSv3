import { ModuleGrid } from "./module-grid";
import { productionBodyTimelineWidget, productionDataCoverageWidget, productionTodayWidget } from "./hub-production-widgets";
import { hubCanonicalMetricWidgets } from "./canonical-metric-widget";
import { hubFirstRunPreset } from "./body-first-run-presets";

export function BodyHub() {
  return (
    <div className="mx-auto max-w-7xl animate-in fade-in p-4 pb-24 duration-700 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Hub Overview</h1>
        </div>
        <div id="body-hub-actions" className="flex shrink-0 justify-end" />
      </div>
      <ModuleGrid
        widgets={[productionTodayWidget, productionBodyTimelineWidget, productionDataCoverageWidget, ...hubCanonicalMetricWidgets]}
        initialPreset={hubFirstRunPreset}
        storageKey="moduleGrid_body_v107_all_umbrellas"
        toolbarTargetId="body-hub-actions"
      />
    </div>
  );
}
