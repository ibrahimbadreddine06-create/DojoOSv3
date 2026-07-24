import { ModuleGrid } from "@/components/body/module-grid";

export function HygienePage() {
  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Hygiene & Looks</h1>
        </div>
        <div id="body-hygiene-actions" className="flex shrink-0 justify-end" />
      </div>
      <ModuleGrid widgets={[]} storageKey="moduleGrid_hygiene_v100_fresh_start" toolbarTargetId="body-hygiene-actions" />
    </div>
  );
}
