import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const HOUR_HEIGHT = 48;

interface PresetBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  tasks: { text: string; importance: number }[];
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function getBlockStyle(block: PresetBlock): { top: number; height: number } {
  const startMinutes = timeToMinutes(block.startTime);
  const endMinutes = timeToMinutes(block.endTime);
  const startOffset = Math.max(0, startMinutes - 6 * 60);
  const duration = endMinutes - startMinutes;
  return {
    top: (startOffset / 60) * HOUR_HEIGHT,
    height: Math.max((duration / 60) * HOUR_HEIGHT, 30),
  };
}

interface CreatePresetDialogProps {
  trigger?: React.ReactNode;
}

export function CreatePresetDialog({ trigger }: CreatePresetDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [blocks, setBlocks] = useState<PresetBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPresetMutation = useMutation({
    mutationFn: async (data: { name: string; blocks: any[] }) => {
      return await apiRequest("POST", "/api/day-presets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-presets"] });
      toast({ title: "Preset created successfully" });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create preset", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setBlocks([]);
    setSelectedBlockId(null);
  };

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromStart = Math.floor((y / HOUR_HEIGHT) * 60);
    const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
    const totalMinutes = 6 * 60 + snappedMinutes;
    const startTime = minutesToTime(totalMinutes);
    const endTime = minutesToTime(totalMinutes + 60);
    
    const newBlock: PresetBlock = {
      id: crypto.randomUUID(),
      startTime,
      endTime,
      title: "New Block",
      tasks: [],
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleBlockClick = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    setSelectedBlockId(blockId);
  };

  const updateBlock = (id: string, updates: Partial<PresetBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Please enter a preset name", variant: "destructive" });
      return;
    }
    if (blocks.length === 0) {
      toast({ title: "Please add at least one block", variant: "destructive" });
      return;
    }

    const presetBlocks = blocks.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      title: b.title,
      tasks: b.tasks,
    }));

    createPresetMutation.mutate({ name, blocks: presetBlocks });
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" data-testid="button-create-preset">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Day Preset</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-3">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Productive Weekday"
                data-testid="input-preset-name"
              />
            </div>
            
            <div className="text-xs text-muted-foreground mb-2">
              Click on the grid to add blocks
            </div>
            
            <div className="flex-1 overflow-y-auto border rounded-md bg-muted/30">
              <div 
                className="relative cursor-pointer"
                style={{ height: HOURS.length * HOUR_HEIGHT }}
                onClick={handleGridClick}
              >
                {HOURS.map((hour) => (
                  <div 
                    key={hour} 
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: (hour - 6) * HOUR_HEIGHT }}
                  >
                    <span className="absolute -top-3 left-2 text-xs text-muted-foreground font-mono bg-muted/30 px-1">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}

                {blocks.map((block) => {
                  const { top, height } = getBlockStyle(block);
                  const isSelected = selectedBlockId === block.id;
                  
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-10 right-4 rounded-md border transition-all cursor-pointer ${
                        isSelected 
                          ? "ring-2 ring-primary bg-primary/10 border-primary" 
                          : "bg-card border-border hover-elevate"
                      }`}
                      style={{ top, height }}
                      onClick={(e) => handleBlockClick(e, block.id)}
                      data-testid={`preset-block-${block.id}`}
                    >
                      <div className="p-2 h-full flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {block.title}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-64 flex flex-col border-l pl-4">
            <h3 className="text-sm font-medium mb-3">Block Details</h3>
            
            {selectedBlock ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="block-title">Title</Label>
                  <Input
                    id="block-title"
                    value={selectedBlock.title}
                    onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                    data-testid="input-block-title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="block-start">Start</Label>
                    <Input
                      id="block-start"
                      type="time"
                      value={selectedBlock.startTime}
                      onChange={(e) => updateBlock(selectedBlock.id, { startTime: e.target.value })}
                      data-testid="input-block-start"
                    />
                  </div>
                  <div>
                    <Label htmlFor="block-end">End</Label>
                    <Input
                      id="block-end"
                      type="time"
                      value={selectedBlock.endTime}
                      onChange={(e) => updateBlock(selectedBlock.id, { endTime: e.target.value })}
                      data-testid="input-block-end"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Tasks can be added after applying the preset
                  </Label>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a block to edit its details, or click on the grid to add a new block.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-preset">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createPresetMutation.isPending}
            data-testid="button-save-preset"
          >
            {createPresetMutation.isPending ? "Saving..." : "Save Preset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
