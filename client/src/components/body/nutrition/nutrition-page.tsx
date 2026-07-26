import { ModuleGrid } from "@/components/body/module-grid";
import { productionCaloriesWidget, productionFastingWidget, productionFiberWidget, productionLogIntakeWidget, productionMacrosWidget, productionMealPlanWidget, productionMicronutrientsWidget, productionRecentMealsWidget, productionSupplementsWidget, productionWaterWidget } from "./nutrition-production-widgets";
import { nutritionObservationWidgets } from "../manual-observation-widget";
import { nutritionFirstRunPreset } from "../body-first-run-presets";

export function NutritionPage() {
  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Nutrition</h1>
        </div>
        <div id="body-nutrition-actions" className="flex shrink-0 justify-end" />
      </div>
      <ModuleGrid
        widgets={[productionLogIntakeWidget, productionMealPlanWidget, productionCaloriesWidget, productionMacrosWidget, productionFiberWidget, productionMicronutrientsWidget, productionWaterWidget, productionRecentMealsWidget, productionSupplementsWidget, productionFastingWidget, ...nutritionObservationWidgets]}
        initialPreset={nutritionFirstRunPreset}
        storageKey="moduleGrid_nutrition_v107_all_umbrellas"
        toolbarTargetId="body-nutrition-actions"
      />
    </div>
  );
}
