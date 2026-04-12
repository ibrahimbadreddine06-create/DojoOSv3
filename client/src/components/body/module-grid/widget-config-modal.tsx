import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetDefinition } from "./index";

interface Props {
  widget: WidgetDefinition | null;
  currentVisualizationId?: string;
  onAdd: (id: string, visualizationId?: string) => void;
  onClose: () => void;
}

export function WidgetConfigModal({ widget, currentVisualizationId, onAdd, onClose }: Props) {
  const [selectedVisualizationId, setSelectedVisualizationId] = useState<string | undefined>();

  const selected = selectedVisualizationId ?? currentVisualizationId ?? widget?.visualizations[0]?.id;

  return (
    <Dialog
      open={!!widget}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedVisualizationId(undefined);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        {widget && (() => {
          const Icon = widget.icon;
          return (
            <>
              <div className="border-b border-border/50 px-5 py-4">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-left">
                      <DialogTitle className="truncate text-base font-semibold">{widget.label}</DialogTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">Choose how this widget appears.</p>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="space-y-3 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Visualization
                </p>
                <div className="grid gap-2">
                  {widget.visualizations.map((visualization) => {
                    const isSelected = selected === visualization.id;
                    return (
                      <button
                        key={visualization.id}
                        type="button"
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors",
                          isSelected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/60 bg-muted/20 hover:bg-muted/45",
                        )}
                        onClick={() => setSelectedVisualizationId(visualization.id)}
                      >
                        <span className="text-sm font-semibold">{visualization.label}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/50 p-4">
                <Button
                  className="h-11 w-full gap-2 rounded-xl"
                  onClick={() => {
                    onAdd(widget.id, selected);
                    setSelectedVisualizationId(undefined);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add widget
                </Button>
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
