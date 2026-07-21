import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogIntakeModal } from "./log-intake-modal";
import { FastingProgramModal } from "./fasting-program-modal";
import { ModuleGrid } from "@/components/body/module-grid";

export function NutritionPage() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isFastingModalOpen, setIsFastingModalOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Nutrition</h1>
        </div>
        <Button onClick={() => setIsLogModalOpen(true)} size="sm" className="gap-1.5 shadow-sm rounded-xl bg-orange-500 hover:bg-orange-600 border-none text-white">
          <Plus className="w-4 h-4" /> Log intake
        </Button>
      </div>
      <ModuleGrid
        widgets={[]}
        storageKey="moduleGrid_nutrition_v100_fresh_start"
        initialActiveWidgetIds={[]}
      />
      <LogIntakeModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} preselectedBlockId={null} />
      <FastingProgramModal isOpen={isFastingModalOpen} onClose={() => setIsFastingModalOpen(false)} currentProgram={null} />
    </div>
  );
}
