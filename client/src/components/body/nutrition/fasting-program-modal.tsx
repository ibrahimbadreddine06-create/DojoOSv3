import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type BodyProfile } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, Loader2 } from "lucide-react";

interface FastingProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgram?: any;
}

const PRESETS = [
  { label: "16:8", value: "16:8", fastingHours: 16, description: "16h Fast / 8h Eating Window" },
  { label: "18:6", value: "18:6", fastingHours: 18, description: "18h Fast / 6h Eating Window" },
  { label: "20:4", value: "20:4", fastingHours: 20, description: "20h Fast / 4h Eating Window" },
  { label: "OMAD", value: "OMAD", fastingHours: 23, description: "One Meal A Day (23h Fast)" },
];

export function FastingProgramModal({ isOpen, onClose, currentProgram }: FastingProgramModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPreset, setSelectedPreset] = useState<string>(
    currentProgram?.preset || "16:8"
  );
  const [eatingWindowStart, setEatingWindowStart] = useState<string>(
    currentProgram?.eatingWindowStart || "12:00"
  );

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/body-profile", {
        fastingProgram: data
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-profile"] });
      toast({ title: "Fasting program updated", description: "Your configuration has been saved." });
      onClose();
    }
  });

  const handleSave = () => {
    const preset = PRESETS.find(p => p.value === selectedPreset);
    mutation.mutate({
      preset: selectedPreset,
      fastingHours: preset?.fastingHours || 16,
      eatingWindowStart,
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    });
  };

  const fastingHours = PRESETS.find(p => p.value === selectedPreset)?.fastingHours || 16;
  const eatingHours = 24 - fastingHours;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-background border-none shadow-2xl rounded-3xl">
        <div className="p-6 bg-orange-500 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white mb-2">Fasting Program</DialogTitle>
            <DialogDescription className="text-orange-100/70 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
              Configure your metabolic window
            </DialogDescription>
          </DialogHeader>
          <Clock className="absolute right-6 top-6 w-12 h-12 text-white/10" />
        </div>

        <div className="p-8 space-y-8">
          {/* 24h Dial SVG */}
          <div className="flex justify-center py-4">
            <FastingDial 
              eatingWindowStart={eatingWindowStart} 
              eatingWindowHours={eatingHours} 
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Choose Preset</h3>
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setSelectedPreset(p.value)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left relative group ${
                    selectedPreset === p.value 
                      ? "border-orange-500 bg-orange-500/5" 
                      : "border-muted-foreground/10 hover:border-orange-500/30 bg-muted/20"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-black tracking-tighter">{p.label}</span>
                    {selectedPreset === p.value && <Check className="w-4 h-4 text-orange-600" />}
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase group-hover:text-orange-600/60 transition-colors">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Eating Window Starts At</h3>
            <input 
              type="time" 
              className="w-full h-12 bg-muted/40 border-none rounded-2xl px-4 font-black tracking-tight focus:ring-2 focus:ring-orange-500/50 transition-all text-lg"
              value={eatingWindowStart}
              onChange={(e) => setEatingWindowStart(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1 font-black uppercase tracking-widest text-[10px]" onClick={onClose}>Cancel</Button>
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] py-6 shadow-lg shadow-orange-500/20" 
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Apply Program"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FastingDial({ eatingWindowStart, eatingWindowHours }: { eatingWindowStart: string, eatingWindowHours: number }) {
  const [startClockH, startClockM] = eatingWindowStart.split(':').map(Number);
  const startRatio = (startClockH + startClockM / 60) / 24;
  const windowRatio = eatingWindowHours / 24;

  const size = 180;
  const radius = 70;
  const center = size / 2;
  const strokeWidth = 14;

  // Calculate arc parameters
  const startAngle = (startRatio * 360) - 90; // -90 to start at 12 o'clock
  const endAngle = startAngle + (windowRatio * 360);
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const start = polarToCartesian(center, center, radius, startAngle);
  const end = polarToCartesian(center, center, radius, endAngle);
  const largeArcFlag = windowRatio > 0.5 ? "1" : "0";

  const d = [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(" ");

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Full Day Track */}
        <circle 
          cx={center} cy={center} r={radius} 
          fill="none" 
          stroke="currentColor" 
          className="text-muted-foreground/10"
          strokeWidth={strokeWidth}
        />
        {/* Eating Window Arc */}
        <path 
          d={d} 
          fill="none" 
          stroke="orange" 
          strokeWidth={strokeWidth} 
          strokeLinecap="round" 
          className="drop-shadow-[0_0_8px_rgba(249,115,22,0.3)] transition-all duration-500"
        />
        
        {/* 24h Markers */}
        {[0, 6, 12, 18].map((m) => {
          const mAngle = (m / 24 * 360) - 90;
          const pos = polarToCartesian(center, center, radius + 15, mAngle);
          return (
            <text 
              key={m} 
              x={pos.x} y={pos.y} 
              className="text-[10px] font-black text-muted-foreground/40" 
              textAnchor="middle" 
              dominantBaseline="middle"
            >
              {m}h
            </text>
          );
        })}
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black tracking-tighter">{24 - eatingWindowHours}h</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Fast</span>
      </div>
    </div>
  );
}
