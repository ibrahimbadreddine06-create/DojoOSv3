import React from "react";
import { type IntakeLog, type DailyState } from "@shared/schema";

interface EnergyBalanceCardProps {
  intakeLogs: IntakeLog[];
  dailyState?: DailyState;
}

export function EnergyBalanceCard({ intakeLogs, dailyState }: EnergyBalanceCardProps) {
  const consumed = intakeLogs.reduce((acc, log) => acc + Number(log.calories || 0), 0);
  const burned = dailyState?.caloriesBurned || 2000; // Fallback to 2000 if not available
  const balance = consumed - burned;
  
  // Calculate spectrum position (-1000 to +1000 range)
  const range = 1000;
  const percentage = Math.min(100, Math.max(0, ((balance + range) / (range * 2)) * 100));

  return (
    <div className="bg-card border rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-baseline">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Net Energy Balance</h3>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-black tracking-tighter ${balance > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {balance > 0 ? "+" : ""}{balance}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">kcal</span>
        </div>
      </div>

      {/* Spectrum Bar */}
      <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-200 to-red-500 overflow-visible">
        {/* Indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-md transition-all duration-700 ease-out z-10"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
        {/* Markers */}
        <div className="absolute top-full mt-2 w-full flex justify-between text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">
          <span>Deficit</span>
          <span>Surplus</span>
        </div>
      </div>
      
      <div className="pt-4 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
         <span>In: {Math.round(consumed)} kcal</span>
         <span>Out: {burned} kcal</span>
      </div>
    </div>
  );
}
