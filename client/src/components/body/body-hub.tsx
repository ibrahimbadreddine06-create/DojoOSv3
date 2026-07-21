import { ModuleGrid } from "./module-grid";
import { hubWidgetsList } from "./body-hub-widgets";

export function BodyHub() {
  return (
    <div className="mx-auto max-w-7xl animate-in fade-in p-4 pb-24 duration-700 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Home</h1>
      </div>
      <ModuleGrid
        widgets={hubWidgetsList}
        storageKey="moduleGrid_hub_v100_fresh_start"
        initialActiveWidgetIds={["body_readiness", "energy_reserve", "body_tasks_today"]}
      />
    </div>
  );
}
