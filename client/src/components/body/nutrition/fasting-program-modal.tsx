import React from "react";
import { 
  X, Clock, Calendar, Check, Info, AlertTriangle, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FastingProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgram?: any;
}

const PRESETS = [
  { id: "16:8", label: "LeanGains (16:8)", desc: "16h fast, 8h eating window" },
  { id: "18:6", label: "Strong (18:6)", desc: "18h fast, 6h eating window" },
  { id: "20:4", label: "Warrior (20:4)", desc: "20h fast, 4h eating window" },
  { id: "OMAD", label: "OMAD (23:1)", desc: "One Meal A Day" },
  { id: "custom", label: "Custom", desc: "Define your own schedule" },
];

export function FastingProgramModal({ isOpen, onClose, currentProgram }: FastingProgramModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPreset, setSelectedPreset] = React.useState(currentProgram?.preset || "16:8");

  const saveMutation = useMutation({
    mutationFn: async (program: any) => {
      await apiRequest("PATCH", "/api/body-profile", {
        fastingProgram: program
      });
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["/api/body-profile"] });
       toast({ title: "Program Saved", description: "Your fasting schedule has been updated." });
       onClose();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-background border-none shadow-2xl rounded-2xl">
        <div className="p-6 bg-orange-500 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Fasting Program</DialogTitle>
            <DialogDescription className="text-orange-100/70 font-bold uppercase text-[10px] tracking-widest">
              Metabolic flexibility
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-8">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Choose Preset</label>
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map(p => (
                  <Button 
                    key={p.id}
                    variant="outline"
                    className={`h-auto p-4 flex items-center justify-between text-left transition-all hover:border-orange-500 group ${selectedPreset === p.id ? "border-orange-500 bg-orange-50/50" : "border-muted"}`}
                    onClick={() => setSelectedPreset(p.id)}
                  >
                    <div className="space-y-1">
                       <p className={`font-black tracking-tight ${selectedPreset === p.id ? "text-orange-600" : ""}`}>{p.label}</p>
                       <p className="text-[10px] text-muted-foreground font-bold">{p.desc}</p>
                    </div>
                    {selectedPreset === p.id && <Check className="w-5 h-5 text-orange-500" />}
                  </Button>
                ))}
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Eating Window Start</label>
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-muted/50 rounded-xl text-muted-foreground">
                    <Clock className="w-5 h-5" />
                 </div>
                 <Select defaultValue="12:00">
                    <SelectTrigger className="h-12 border-none bg-muted/50 font-black">
                       <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="10:00">10:00 AM</SelectItem>
                       <SelectItem value="12:00">12:00 PM</SelectItem>
                       <SelectItem value="14:00">02:00 PM</SelectItem>
                       <SelectItem value="16:00">04:00 PM</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>

           <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-orange-800 leading-relaxed font-bold uppercase tracking-wide">
                DojoOS will automatically sync your fasting window to your daily planner and notify you when it's time to start or break your fast.
              </p>
           </div>

           <Button 
            className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-orange-500/20 gap-2"
            onClick={() => saveMutation.mutate({ 
              preset: selectedPreset, 
              fastingHours: selectedPreset === '16:8' ? 16 : selectedPreset === 'OMAD' ? 23 : 18,
              eatingWindowStart: "12:00",
              activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            })}
            disabled={saveMutation.isPending}
           >
             {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Save Program
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Loader2({ className }: { className: string }) {
  return <Loader2 className={className} />;
}
