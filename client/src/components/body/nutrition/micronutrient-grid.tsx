import React, { useState } from "react";
import { type IntakeLog } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicronutrientGridProps {
  intakeLogs: IntakeLog[];
}

const MICROS = [
  { key: "zinc", label: "Zinc", goal: 15, unit: "mg", emoji: "🦴" },
  { key: "magnesium", label: "Magnesium", goal: 400, unit: "mg", emoji: "⚡" },
  { key: "vitaminD", label: "Vit D", goal: 2000, unit: "IU", emoji: "☀️" },
  { key: "vitaminC", label: "Vit C", goal: 90, unit: "mg", emoji: "🍋" },
  { key: "iron", label: "Iron", goal: 18, unit: "mg", emoji: "🩸" },
  { key: "calcium", label: "Calcium", goal: 1000, unit: "mg", emoji: "🥛" },
  { key: "potassium", label: "Potassium", goal: 4700, unit: "mg", emoji: "🍌" },
  { key: "vitaminB12", label: "Vit B12", goal: 2.4, unit: "mcg", emoji: "🧠" },
];

export function MicronutrientGrid({ intakeLogs }: MicronutrientGridProps) {
  const [showAll, setShowAll] = useState(false);
  
  const totals = intakeLogs.reduce((acc, log) => {
    MICROS.forEach(m => {
      acc[m.key] = (acc[m.key] || 0) + (Number(log[m.key as keyof IntakeLog]) || 0);
    });
    return acc;
  }, {} as Record<string, number>);

  const visibleMicros = showAll ? MICROS : MICROS.slice(0, 8); // Currently 8 in total, but grid spec says 8+

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline px-1">
        <h2 className="text-xl font-bold tracking-tight">Micronutrients</h2>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">RDA Status</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {visibleMicros.map(m => {
          const val = totals[m.key] || 0;
          const progress = Math.min(100, (val / m.goal) * 100);
          
          return (
            <div key={m.key} className="bg-card border rounded-xl p-3 flex flex-col justify-between h-28 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-center relative z-10">
                <span className="text-lg">{m.emoji}</span>
                <span className="text-[9px] font-black font-mono text-muted-foreground/40">{Math.round(progress)}%</span>
              </div>
              
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">
                   {m.label}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black tracking-tight">{Math.round(val * 10) / 10}</span>
                  <span className="text-[8px] text-muted-foreground/50 font-bold uppercase">{m.unit}</span>
                </div>
              </div>
              
              <div className="h-1 bg-muted rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${progress >= 100 ? "bg-emerald-500" : "bg-purple-500/50"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {MICROS.length > 8 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAll(!showAll)}
          className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-purple-500"
        >
          {showAll ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
          {showAll ? "Show Less" : "Show 12 More"}
        </Button>
      )}
    </div>
  );
}
