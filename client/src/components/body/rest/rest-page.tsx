import { ModuleGrid } from "@/components/body/module-grid";

export function RestPage() {
  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Rest & Recovery</h1>
        </div>
      </div>
      <ModuleGrid widgets={[]} storageKey="moduleGrid_rest_v100_fresh_start" />
    </div>
  );
}
