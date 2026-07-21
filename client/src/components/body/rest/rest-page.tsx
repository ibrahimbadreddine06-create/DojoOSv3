import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogRestDialog } from "./log-rest-dialog";
import { ModuleGrid } from "@/components/body/module-grid";

export function RestPage() {
  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Rest</h1>
        </div>
        <LogRestDialog>
          <Button size="sm" className="gap-1.5 shadow-sm rounded-xl bg-indigo-500 hover:bg-indigo-600 border-none text-white">
            <Plus className="w-4 h-4" /> Log rest
          </Button>
        </LogRestDialog>
      </div>
      <ModuleGrid
        widgets={[]}
        storageKey="moduleGrid_rest_v100_fresh_start"
        initialActiveWidgetIds={[]}
      />
    </div>
  );
}
