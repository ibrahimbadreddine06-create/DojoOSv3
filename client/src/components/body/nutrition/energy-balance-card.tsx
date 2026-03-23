import React from "react";
import { type IntakeLog, type DailyState } from "@shared/schema";
import { Link } from "wouter";
import { SectionLabel } from "../activity/section-label";

interface EnergyBalanceCardProps {
  intakeLogs: IntakeLog[];
  dailyState?: DailyState;
}

export function EnergyBalanceCard({ intakeLogs, dailyState }: EnergyBalanceCardProps) {
  const consumed = intakeLogs.reduce((acc, log) => acc + Number(log.calories || 0), 0);
  const burned = dailyState?.caloriesBurned || 2000;
  const balance = consumed - burned;

  // Calculate spectrum position (-500 to +500 range)
  const range = 500;
  const percentage = Math.min(100, Math.max(0, ((balance + range) / (range * 2)) * 100));

  return (
    <Link href="/body/nutrition/metric/balance">
      <div className="bg-card border rounded-xl p-6 space-y-6 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex justify-between items-baseline">
          <div className="space-y-0.5">
            <SectionLabel className="mb-0 group-hover:text-purple-500 transition-colors">Net Energy Balance</SectionLabel>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tighter">
                {balance > 0 ? "+" : ""}{Math.round(balance)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">kcal</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground/50 font-medium">
            In: {Math.round(consumed)} · Burned: {Math.round(burned)}
          </span>
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
              <span className="text-[9px] font-medium text-red-500">Deficit</span>
              <span className="text-[8px] text-muted-foreground/40">−500</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium text-muted-foreground/60">Balance</span>
              <span className="text-[8px] text-muted-foreground/40">0</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[9px] font-medium text-blue-500">Surplus</span>
              <span className="text-[8px] text-muted-foreground/40">+500</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
