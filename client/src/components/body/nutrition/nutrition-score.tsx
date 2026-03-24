import React from "react";
import { Lock } from "lucide-react";
import { MetricRing } from "../metric-ring";
import { useTheme } from "@/contexts/theme-context";
import { type IntakeLog, type BodyProfile } from "@shared/schema";
import { calculateNutritionScore } from "@/lib/nutrition-utils";
import { Link } from "wouter";

interface NutritionScoreCardProps {
  intakeLogs: IntakeLog[];
  bodyProfile?: BodyProfile;
}

function SubScoreTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-[10px] font-medium tracking-wider text-muted-foreground mb-0.5 leading-none">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black">{value}</span>
          <span className="text-[10px] text-muted-foreground/50 font-medium uppercase">/ 10</span>
        </div>
      </div>
    </div>
  );
}

export function NutritionScoreCard({ intakeLogs, bodyProfile }: NutritionScoreCardProps) {
  const { getModuleTheme } = useTheme();
  const theme = getModuleTheme("nutrition");
  const result = calculateNutritionScore(intakeLogs, bodyProfile);

  const kcalLogged = intakeLogs.reduce((a, b) => a + Number(b.calories || 0), 0);

  if (result.locked) {
    return (
      <div className="bg-card border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 min-h-[180px]">
        {/* Locked ring */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="relative" style={{ width: 140, height: 140 }}>
            <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
              <circle cx={70} cy={70} r={63.5} fill="none" stroke="#e5e7eb" strokeWidth={13} />
              <circle
                cx={70} cy={70} r={63.5} fill="none"
                stroke={`hsl(${theme.cssVar})`} strokeWidth={13}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 63.5}
                strokeDashoffset={2 * Math.PI * 63.5 * (1 - Math.min(1, kcalLogged / 750))}
                style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground/40" />
            </div>
          </div>
          <div className="text-center mt-1">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">Nutrition score</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{result.reason}</p>
          </div>
        </div>

        {/* Sub-score tiles */}
        <div className="flex-1 w-full flex flex-col gap-2">
          <SubScoreTile label="Food quality" value="–" />
          <SubScoreTile label="Macro balance" value="–" />
        </div>
      </div>
    );
  }

  return (
    <Link href="/body/nutrition/metric/score">
      <div className="bg-card border rounded-xl p-6 flex flex-col md:flex-row items-center gap-8 min-h-[180px] hover:shadow-md transition-shadow cursor-pointer group">
        <div className="shrink-0 transition-transform duration-500">
          <MetricRing
            value={result.score || 0}
            max={100}
            label="Score"
            color={`hsl(${theme.cssVar})`}
            size="lg"
            sublabel="tap → history"
          />
        </div>

        <div className="flex-1 w-full flex flex-col gap-2">
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between group-hover:bg-muted/50 transition-colors">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground mb-0.5 leading-none">Food quality</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black">{result.subScores?.foodQuality}</span>
                <span className="text-[10px] text-muted-foreground/50 font-medium uppercase">/ 10</span>
              </div>
            </div>
            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${(result.subScores?.foodQuality || 0) * 10}%`, backgroundColor: `hsl(${theme.cssVar})` }}
              />
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between group-hover:bg-muted/50 transition-colors">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground mb-0.5 leading-none">Macro balance</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black">{result.subScores?.macroBalance}</span>
                <span className="text-[10px] text-muted-foreground/50 font-medium uppercase">/ 10</span>
              </div>
            </div>
            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${(result.subScores?.macroBalance || 0) * 10}%`, backgroundColor: `hsl(${theme.cssVar})` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
