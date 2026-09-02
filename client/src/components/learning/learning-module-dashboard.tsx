import type { ReactNode } from "react";
import { ModuleGrid } from "@/components/body/module-grid";
import {
  createLearningModulePreset,
  createLearningModuleWidgets,
  type LearningModuleWidgetConfig,
} from "./learning-module-widgets";

export function LearningModuleDashboard({
  title,
  description,
  config,
  actions,
  controls,
  empty,
  isLoading = false,
  storageVersion = 1,
  storageSuffix,
  visibleEntityIds,
}: {
  title: string;
  description: string;
  config: LearningModuleWidgetConfig;
  actions?: ReactNode;
  controls?: ReactNode;
  empty?: ReactNode;
  isLoading?: boolean;
  storageVersion?: number;
  storageSuffix?: string;
  visibleEntityIds?: string[];
}) {
  const toolbarId = `learning-${config.kind}-grid-actions`;
  const widgets = createLearningModuleWidgets(config);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6 md:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Learning
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#18202a]">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
            <div id={toolbarId} className="min-h-9" />
          </div>
        </header>

        {controls ? <section aria-label={`${title} filters`}>{controls}</section> : null}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-[15px] md:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-[22px] border border-border/70 bg-muted/50"
              />
            ))}
          </div>
        ) : config.entities.length || config.history.length ? (
          <ModuleGrid
            widgets={widgets}
            initialPreset={createLearningModulePreset(config)}
            storageKey={`moduleGrid_learning_${config.kind}_v${storageVersion}${storageSuffix ? `_${storageSuffix}` : ""}`}
            toolbarTargetId={toolbarId}
            mode="managed"
            visibleWidgetIds={[
              `learning.${config.kind}.history`,
              `learning.${config.kind}.planner`,
              ...(visibleEntityIds ?? config.entities.map((entity) => entity.id)).map(
                (id) => `learning.${config.kind}.entity.${id}`,
              ),
            ]}
          />
        ) : (
          empty
        )}
      </div>
    </main>
  );
}
