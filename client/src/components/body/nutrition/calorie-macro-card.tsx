import React from "react";
import { type IntakeLog, type BodyProfile } from "@shared/schema";
import { useTheme } from "@/contexts/theme-context";
import { Beef, Wheat, Cookie, Zap } from "lucide-react";

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
    <div className="bg-card border rounded-xl p-6 space-y-8">
      {/* Calorie Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Calories</h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black tracking-tighter">{Math.round(totals.calories)}</span>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">/ {goals.calories} kcal</span>
          </div>
        </div>
        <div className="h-4 bg-muted/50 rounded-full overflow-hidden border border-muted/50 relative">
          <div 
            className="h-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(0,0,0,0.1)]"
            style={{ 
              width: `${calProgress}%`, 
              backgroundColor: `hsl(${theme.cssVar})` 
            }}
          >
             <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
          </div>
        </div>
        <p className="text-[10px] text-center font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">
          Remaining: {Math.max(0, goals.calories - Math.round(totals.calories))} kcal
        </p>
      </div>

      {/* 4-column Macros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <MacroItem 
          label="Protein" 
          value={totals.protein} 
          goal={goals.protein} 
          color="#3b82f6" 
          icon={<Beef className="w-3.5 h-3.5" />} 
        />
        <MacroItem 
          label="Carbs" 
          value={totals.carbs} 
          goal={goals.carbs} 
          color="#f59e0b" 
          icon={<Wheat className="w-3.5 h-3.5" />} 
        />
        <MacroItem 
          label="Fats" 
          value={totals.fats} 
          goal={goals.fats} 
          color="#10b981" 
          icon={<Cookie className="w-3.5 h-3.5" />} 
        />
        <MacroItem 
          label="Fiber" 
          value={totals.fiber} 
          goal={goals.fiber} 
          color="#8b5cf6" 
          icon={<Zap className="w-3.5 h-3.5" />} 
        />
      </div>
    </div>
  );
}

function MacroItem({ label, value, goal, color, icon }: { label: string, value: number, goal: number, color: string, icon: React.ReactNode }) {
  const percentage = Math.min(100, (value / goal) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
        <div className="shrink-0" style={{ color }}>{icon}</div>
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black">{Math.round(value)}</span>
        <span className="text-[10px] text-muted-foreground/50 font-bold">g</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
