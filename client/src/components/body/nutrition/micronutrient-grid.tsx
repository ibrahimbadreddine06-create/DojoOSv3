import React, { useState } from "react";
import { type IntakeLog, type BodyProfile } from "@shared/schema";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface MicronutrientGridProps {
  intakeLogs: IntakeLog[];
  bodyProfile?: BodyProfile;
}

const MICROS = [
  { key: "vitaminD", label: "Vit D", unit: "mcg", emoji: "☀️", mGoal: 20, fGoal: 20 },
  { key: "vitaminB12", label: "Vit B12", unit: "mcg", emoji: "🧠", mGoal: 2.4, fGoal: 2.4 },
  { key: "magnesium", label: "Magnesium", unit: "mg", emoji: "⚡", mGoal: 420, fGoal: 320 },
  { key: "zinc", label: "Zinc", unit: "mg", emoji: "🦴", mGoal: 11, fGoal: 8 },
  { key: "iron", label: "Iron", unit: "mg", emoji: "🩸", mGoal: 8, fGoal: 18 },
  { key: "omega3", label: "Omega-3", unit: "g", emoji: "🐟", mGoal: 1.6, fGoal: 1.1 },
  { key: "calcium", label: "Calcium", unit: "mg", emoji: "🥛", mGoal: 1000, fGoal: 1000 },
  { key: "vitaminC", label: "Vit C", unit: "mg", emoji: "🍋", mGoal: 90, fGoal: 75 },
];

export function MicronutrientGrid({ intakeLogs, bodyProfile }: MicronutrientGridProps) {
  const [showAll, setShowAll] = useState(false);
  const sex = bodyProfile?.sex || "male";
  
  const totals = intakeLogs.reduce((acc, log) => {
    MICROS.forEach(m => {
      acc[m.key] = (acc[m.key] || 0) + (Number(log[m.key as keyof IntakeLog]) || 0);
    });
    return acc;
  }, {} as Record<string, number>);

  const visibleMicros = showAll ? MICROS : MICROS.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline px-1">
        <h2 className="text-xl font-bold tracking-tight">Micronutrients</h2>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">RDA Status</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleMicros.map(m => {
          const val = totals[m.key] || 0;
          const goal = sex === "female" ? m.fGoal : m.mGoal;
          const progress = Math.min(100, (val / goal) * 100);
          const isLow = progress < 20;
          
          return (
            <Link key={m.key} href={`/body/nutrition/metric/${m.key}`}>
              <div className={`bg-card border rounded-xl p-3 flex flex-col justify-between h-[100px] hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer ${isLow ? "border-red-500/30" : ""}`}>
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-lg group-hover:scale-110 transition-transform">{m.emoji}</span>
                  {isLow ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                  ) : (
                    <span className="text-[9px] font-black font-mono text-muted-foreground/40">{Math.round(progress)}%</span>
                  )}
                </div>
                
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1 group-hover:text-purple-500 transition-colors">
                     {m.label}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black tracking-tight ${isLow ? "text-red-500" : ""}`}>{Math.round(val * 10) / 10}</span>
                    <span className="text-[8px] text-muted-foreground/50 font-bold uppercase">{m.unit}</span>
                  </div>
                </div>
                
                <div className="h-1 bg-muted rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${isLow ? "bg-red-500" : progress >= 100 ? "bg-emerald-500" : "bg-purple-500/50"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </Link>
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
          <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showAll ? "rotate-180" : ""}`} />
          {showAll ? "Show Less" : "Show All"}
        </Button>
      )}
    </div>
  );
}
