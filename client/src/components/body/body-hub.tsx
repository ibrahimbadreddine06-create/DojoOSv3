import { ModuleGrid } from "./module-grid";
import { bodyMetricUmbrellas } from "./body-metric-umbrellas";
import { ChartDataProvider, stepsUmbrellaWidget } from "./hub-style-widgets";

const bodyLanguageWidgets = [stepsUmbrellaWidget, ...bodyMetricUmbrellas];

export function BodyHub() {
  return (
    <div className="mx-auto max-w-7xl animate-in fade-in p-4 pb-24 duration-700 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Hub Overview</h1>
        </div>
      </div>
      <ChartDataProvider showControls={false}>
        <ModuleGrid widgets={bodyLanguageWidgets} storageKey="moduleGrid_body_language_final_1" />
      </ChartDataProvider>
    </div>
  );
}
