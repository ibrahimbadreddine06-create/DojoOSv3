import React from "react";
import { type IntakeLog, type DailyState } from "@shared/schema";
import { Link } from "wouter";

interface EnergyBalanceCardProps {
  intakeLogs: IntakeLog[];
  dailyState?: DailyState;
}

export function EnergyBalanceCard({ intakeLogs, dailyState }: EnergyBalanceCardProps) {
  const consumed = intakeLogs.reduce((acc, log) => acc + Number(log.calories || 0), 0);
  const burned = dailyState?.caloriesBurned || 2000; // Fallback to 2000 if not available
  const balance = consumed - burned;
  
  // Calculate spectrum position (-500 to +500 range)
  const range = 500;
  const percentage = Math.min(100, Math.max(0, ((balance + range) / (range * 2)) * 100));

  return (
    <Link href="/body/nutrition/metric/balance">
      <div className="bg-card border rounded-xl p-6 space-y-6 hover:shadow-md transition-shadow cursor-pointer group h-full">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-purple-500 transition-colors">Net Energy Balance</h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tighter">
              {balance > 0 ? "+" : ""}{Math.round(balance)}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">kcal</span>
          </div>
        </div>

        {/* Spectrum Bar */}
        <div className="space-y-4">
          <div className="relative h-2.5 w-full rounded-full bg-[linear-gradient(to_right,#ef4444_0%,#cbd5e1_50%,#3b82f6_100%)]">
            {/* Indicator - Vertical Pill */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-foreground shadow-sm transition-all duration-700 ease-out z-10"
              style={{ left: `calc(${percentage}% - 3px)` }}
            />
          </div>
          
          {/* Markers */}
          <div className="flex justify-between items-center px-0.5">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Deficit</span>
              <span className="text-[8px] font-bold text-muted-foreground/40">-500</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Balance</span>
              <span className="text-[8px] font-bold text-muted-foreground/40">0</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Surplus</span>
              <span className="text-[8px] font-bold text-muted-foreground/40">+500</span>
            </div>
          </div>
        </div>
        
        <div className="pt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 border-t border-border/50 pt-4">
           <div className="flex flex-col">
              <span className="opacity-50">Consumed</span>
              <span className="text-sm text-foreground font-black">{Math.round(consumed)}</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="opacity-50">Burned</span>
              <span className="text-sm text-foreground font-black">{Math.round(burned)}</span>
           </div>
        </div>
      </div>
    </Link>
  );
}
