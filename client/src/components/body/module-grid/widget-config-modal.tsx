import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { WidgetDefinition } from "./index";

interface Props {
  widget: WidgetDefinition | null;
  onAdd: (id: string) => void;
  onClose: () => void;
}

export function WidgetConfigModal({ widget, onAdd, onClose }: Props) {
  return (
    <Dialog open={!!widget} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        {widget && (() => {
          const Icon = widget.icon;
          return (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <DialogTitle className="text-base font-semibold">{widget.label}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-3 py-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Visualization</p>
                <div className="space-y-1.5">
                  {widget.visualizations.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                      <span className="text-sm font-medium">{v.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/40">Current</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2 rounded-xl mt-1" onClick={() => onAdd(widget.id)}>
                <Plus className="w-4 h-4" /> Add to dashboard
              </Button>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
