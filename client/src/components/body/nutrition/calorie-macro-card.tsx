import React from "react";
import { type IntakeLog, type BodyProfile } from "@shared/schema";
import { useTheme } from "@/contexts/theme-context";
import { Link } from "wouter";
import { SectionHeader } from "../section-header";

interface CalorieMacroCardProps {
  intakeLogs: IntakeLog[];
  bodyProfile?: BodyProfile;
}

export function CalorieMacroCard({ intakeLogs, bodyProfile }: CalorieMacroCardProps) {
  const { getModuleTheme } = useTheme();
  const theme = getModuleTheme("nutrition");

  const goals = {
    calories: bodyProfile?.dailyCalorieGoal || 2500,
    protein: bodyProfile?.dailyProteinGoal || 150,
    carbs: bodyProfile?.dailyCarbsGoal || 250,
    fats: bodyProfile?.dailyFatsGoal || 70,
    fiber: bodyProfile?.fiberGoal || 30,
  };

  const totals = intakeLogs.reduce((acc, log) => ({
    calories: acc.calories + Number(log.calories || 0),
    protein: acc.protein + Number(log.protein || 0),
    carbs: acc.carbs + Number(log.carbs || 0),
    fats: acc.fats + Number(log.fats || 0),
    fiber: acc.fiber + Number(log.fiber || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

  const calProgress = Math.min(100, (totals.calories / goals.calories) * 100);

  return (
    <div className="bg-card border-border/60 rounded-2xl p-5 shadow-sm space-y-8">
      {/* Calorie Bar */}
      <Link href="/body/nutrition/metric/calories">
        <div className="space-y-3 cursor-pointer group">
          <div className="flex justify-between items-baseline">
            <SectionHeader title="Calories" kicker="Status" className="mb-0 overflow-hidden" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight tabular-nums">{Math.round(totals.calories)}</span>
              <span className="text-xs text-muted-foreground font-semibold">/ {goals.calories} kcal</span>
            </div>
          </div>
          <div className="h-4 bg-muted/50 rounded-full overflow-hidden border border-muted/50 relative">
            <div
              className="h-full transition-all duration-700 ease-out shadow-sm"
              style={{
                width: `${calProgress}%`,
                backgroundColor: `hsl(${theme.cssVar})`
              }}
            />
          </div>
          <p className="text-[10px] text-center font-medium text-muted-foreground/50">
            {Math.max(0, goals.calories - Math.round(totals.calories))} kcal remaining
          </p>
        </div>
      </Link>

      {/* 4-column Macros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <MacroItem
          label="Protein"
          metricKey="protein"
          value={totals.protein}
          goal={goals.protein}
          color="#3b82f6"
        />
        <MacroItem
          label="Carbs"
          metricKey="carbs"
          value={totals.carbs}
          goal={goals.carbs}
          color="#f59e0b"
        />
        <MacroItem
          label="Fats"
          metricKey="fats"
          value={totals.fats}
          goal={goals.fats}
          color="#ec4899"
        />
        <MacroItem
          label="Fiber"
          metricKey="fiber"
          value={totals.fiber}
          goal={goals.fiber}
          color="#14b8a6"
        />
      </div>
    </div>
  );
}

function MacroItem({ label, metricKey, value, goal, color }: { label: string, metricKey: string, value: number, goal: number, color: string }) {
  const percentage = Math.min(100, (value / goal) * 100);
  const remaining = Math.max(0, goal - Math.round(value));
  return (
    <Link href={`/body/nutrition/metric/${metricKey}`}>
      <div className="space-y-2 cursor-pointer group">
        <SectionHeader title={label} className="mb-0" />
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black tabular-nums">{Math.round(value)}</span>
          <span className="text-[10px] text-muted-foreground/50 font-semibold tracking-tighter">g</span>
        </div>
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tight">{remaining}g remaining</p>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </Link>
  );
}
