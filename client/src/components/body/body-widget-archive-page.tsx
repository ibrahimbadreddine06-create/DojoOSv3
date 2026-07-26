import { ChartDataProvider } from "./hub-style-widgets";
import { ModuleGrid, type WidgetDefinition } from "./module-grid";
import {
  bodyDesignLanguageArchive,
  currentBodyWidgetArchive,
} from "./body-widget-archive";

function ArchiveSection({
  eyebrow,
  title,
  description,
  widgets,
  storageKey,
  toolbarTargetId,
}: {
  eyebrow: string;
  title: string;
  description: string;
  widgets: WidgetDefinition[];
  storageKey: string;
  toolbarTargetId: string;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <div id={toolbarTargetId} className="flex shrink-0 justify-end" />
      </div>
      <ModuleGrid
        widgets={widgets}
        storageKey={storageKey}
        toolbarTargetId={toolbarTargetId}
      />
    </section>
  );
}

export function BodyWidgetArchivePage() {
  return (
    <ChartDataProvider showControls={false}>
      <div className="mx-auto max-w-7xl space-y-14 p-4 pb-24 sm:p-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
            Body
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Widget archive
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A permanent working archive of the real components used to establish
            the Body design language.
          </p>
        </header>

        <ArchiveSection
          eyebrow="Current collection"
          title="Product umbrellas"
          description="Every current umbrella, variant, supported size, interaction, and responsive composition."
          widgets={currentBodyWidgetArchive}
          storageKey="moduleGrid_body_archive_current_v1"
          toolbarTargetId="body-archive-current-actions"
        />

        <ArchiveSection
          eyebrow="Earlier collection"
          title="E design-language explorations"
          description="The complete earlier composition set, preserved unchanged—including Hydration."
          widgets={bodyDesignLanguageArchive}
          storageKey="moduleGrid_body_archive_e_language_v1"
          toolbarTargetId="body-archive-language-actions"
        />
      </div>
    </ChartDataProvider>
  );
}
