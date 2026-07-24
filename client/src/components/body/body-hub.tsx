import { ModuleGrid } from "./module-grid";
import { bodyMetricUmbrellas } from "./body-metric-umbrellas";
import { ChartDataProvider, stepsUmbrellaWidget } from "./hub-style-widgets";

const bodyLanguageWidgets = [stepsUmbrellaWidget, ...bodyMetricUmbrellas];

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
      <ChartDataProvider showControls={false}>
        <ModuleGrid widgets={bodyLanguageWidgets} storageKey="moduleGrid_body_language_final_1" toolbarTargetId="body-hub-actions" />
      </ChartDataProvider>
    </div>
  );
}
