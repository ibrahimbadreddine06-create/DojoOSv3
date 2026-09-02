import { format } from "date-fns";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ModuleGrid } from "@/components/body/module-grid";
import {
  dashboardFirstRunPreset,
  dashboardModuleWidgets,
} from "@/components/dashboard-module-widgets";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <OnboardingTour />
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-8">
        <header className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
          <div id="dashboard-grid-actions" className="min-h-9" />
        </header>

        <ModuleGrid
          widgets={dashboardModuleWidgets}
          initialPreset={dashboardFirstRunPreset}
          storageKey="moduleGrid_dashboard_v1_e_language"
          toolbarTargetId="dashboard-grid-actions"
          singleVariantPerWidget
          desktopMinColumns={4}
        />
      </div>
    </div>
  );
}
