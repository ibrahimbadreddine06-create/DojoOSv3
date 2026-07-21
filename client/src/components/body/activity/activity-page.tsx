import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogActivityModal } from "./log-activity-modal";
import { ModuleGrid } from "@/components/body/module-grid";

export function ActivityPage() {
  const [logModalOpen, setLogModalOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Activity</h1>
        </div>
        <Button onClick={() => setLogModalOpen(true)} size="sm" className="gap-1.5 shadow-sm rounded-xl bg-amber-500 hover:bg-amber-600 border-none text-white">
          <Plus className="w-4 h-4" /> Log activity
        </Button>
      </div>
      <ModuleGrid
        widgets={[]}
        storageKey="moduleGrid_activity_v100_fresh_start"
        initialActiveWidgetIds={[]}
      />
      <LogActivityModal open={logModalOpen} onOpenChange={setLogModalOpen} />
    </div>
  );
}
