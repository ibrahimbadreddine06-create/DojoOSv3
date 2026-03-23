import React from "react";
import { Lock } from "lucide-react";
import { MetricRing } from "../metric-ring";
import { useTheme } from "@/contexts/theme-context";
import { type IntakeLog, type BodyProfile } from "@shared/schema";
import { calculateNutritionScore } from "@/lib/nutrition-utils";

interface NutritionScoreCardProps {
  intakeLogs: IntakeLog[];
  bodyProfile?: BodyProfile;
}

export function NutritionScoreCard({ intakeLogs, bodyProfile }: NutritionScoreCardProps) {
  const { getModuleTheme } = useTheme();
  const theme = getModuleTheme("nutrition");
  const result = calculateNutritionScore(intakeLogs, bodyProfile);

  if (result.locked) {
    return (
      <div className="bg-card border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden h-[180px]">
        <div className="p-3 rounded-full bg-muted/50 text-muted-foreground/50 mb-1">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Nutrition Score</h3>
          <p className="text-[10px] text-muted-foreground/60">{result.reason}</p>
        </div>
        {/* Progress hint */}
        <div className="w-full max-w-[120px] mt-2">
           <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-muted-foreground/30 transition-all duration-500" 
                style={{ width: `${Math.min(100, (intakeLogs.reduce((a,b)=>a+Number(b.calories||0),0)/750)*100)}%` }}
              />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 h-[180px] hover:shadow-md transition-shadow">
      <div className="shrink-0 scale-90">
        <MetricRing 
          value={result.score || 0} 
          max={100} 
          label="SCORE" 
          color={`hsl(${theme.cssVar})`} 
          size="md" 
        />
      </div>

      <div className="flex-1 w-full grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Food Quality</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{result.subScores?.foodQuality}</span>
            <span className="text-[10px] text-muted-foreground/50 font-bold uppercase">/ 10</span>
          </div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Macro Balance</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{result.subScores?.macroBalance}</span>
            <span className="text-[10px] text-muted-foreground/50 font-bold uppercase">/ 10</span>
          </div>
        </div>
      </div>
    </div>
  );
}
