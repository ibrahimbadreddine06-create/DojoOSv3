import React from "react";
import { type IntakeLog, type DailyState } from "@shared/schema";
import { Link } from "wouter";
import { SectionHeader } from "../section-header";

interface EnergyBalanceCardProps {
  intakeLogs: IntakeLog[];
  dailyState?: DailyState;
}

export function EnergyBalanceCard({ intakeLogs, dailyState, ...rootProps }: EnergyBalanceCardProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const consumed = intakeLogs.reduce((acc, log) => acc + Number(log.calories || 0), 0);
  const burned = dailyState?.caloriesBurned || 2000;
  const balance = consumed - burned;

  // Calculate spectrum position (-500 to +500 range)
  const range = 500;
  const percentage = Math.min(100, Math.max(0, ((balance + range) / (range * 2)) * 100));

  return (
    <Link {...rootProps} href="/body/nutrition/metric/balance" className={`flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${rootProps.className ?? ""}`}>
        {rootProps.children}
        <div className="flex justify-between items-baseline">
          <div className="space-y-0.5">
            <SectionHeader title="Net Energy Balance" kicker="Metabolic" className="mb-0" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight tabular-nums">
                {balance > 0 ? "+" : ""}{Math.round(balance)}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">kcal</span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            In: {Math.round(consumed)} · Out: {Math.round(burned)}
          </span>
        </div>

        {/* Spectrum Bar */}
        <div className="space-y-4">
          <div className="relative h-2.5 w-full rounded-full bg-[linear-gradient(to_right,#f97316_0%,#cbd5e1_50%,#3b82f6_100%)]">
            {/* Indicator - Vertical Pill */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-foreground shadow-sm transition-all duration-700 ease-out z-10"
              style={{ left: `calc(${percentage}% - 3px)` }}
            />
          </div>

          {/* Markers */}
          <div className="flex justify-between items-center px-0.5">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[9px] font-medium text-orange-500">Deficit</span>
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
    </Link>
  );
}
