import React from "react";
import { type IntakeLog, type BodyProfile } from "@shared/schema";
import { AlertTriangle, Sun, Brain, Zap, Shield, Droplet, Fish, Bone, Apple } from "lucide-react";
import { Link } from "wouter";
import { SectionLabel } from "../activity/section-label";

interface MicronutrientGridProps {
  intakeLogs: IntakeLog[];
  bodyProfile?: BodyProfile;
}

const MICROS = [
  { key: "vitaminD",  label: "Vit D",     unit: "mcg", icon: Sun,    iconBg: "bg-amber-100 dark:bg-amber-900/40",   iconColor: "text-amber-500",  mGoal: 20,   fGoal: 20 },
  { key: "vitaminB12",label: "Vit B12",   unit: "mcg", icon: Brain,  iconBg: "bg-purple-100 dark:bg-purple-900/40", iconColor: "text-purple-500", mGoal: 2.4,  fGoal: 2.4 },
  { key: "magnesium", label: "Magnesium", unit: "mg",  icon: Zap,    iconBg: "bg-blue-100 dark:bg-blue-900/40",    iconColor: "text-blue-500",   mGoal: 420,  fGoal: 320 },
  { key: "zinc",      label: "Zinc",      unit: "mg",  icon: Shield, iconBg: "bg-teal-100 dark:bg-teal-900/40",    iconColor: "text-teal-500",   mGoal: 11,   fGoal: 8 },
  { key: "iron",      label: "Iron",      unit: "mg",  icon: Droplet,iconBg: "bg-red-100 dark:bg-red-900/40",      iconColor: "text-red-500",    mGoal: 8,    fGoal: 18 },
  { key: "omega3",    label: "Omega-3",   unit: "g",   icon: Fish,   iconBg: "bg-cyan-100 dark:bg-cyan-900/40",    iconColor: "text-cyan-500",   mGoal: 1.6,  fGoal: 1.1 },
  { key: "calcium",   label: "Calcium",   unit: "mg",  icon: Bone,   iconBg: "bg-slate-100 dark:bg-slate-800/40",  iconColor: "text-slate-500",  mGoal: 1000, fGoal: 1000 },
  { key: "vitaminC",  label: "Vit C",     unit: "mg",  icon: Apple,  iconBg: "bg-green-100 dark:bg-green-900/40",  iconColor: "text-green-500",  mGoal: 90,   fGoal: 75 },
];

export function MicronutrientGrid({ intakeLogs, bodyProfile }: MicronutrientGridProps) {
  const sex = bodyProfile?.sex || "male";

  const totals = intakeLogs.reduce((acc, log) => {
    MICROS.forEach(m => {
      acc[m.key] = (acc[m.key] || 0) + (Number(log[m.key as keyof IntakeLog]) || 0);
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline px-1">
        <SectionLabel className="mb-0">Micronutrients</SectionLabel>
        <span className="text-[10px] text-muted-foreground/50 font-medium">RDA Status</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MICROS.map(m => {
          const val = totals[m.key] || 0;
          const goal = sex === "female" ? m.fGoal : m.mGoal;
          const progress = Math.min(100, (val / goal) * 100);
          const isLow = progress < 20;
          const IconComponent = m.icon;

          return (
            <Link key={m.key} href={`/body/nutrition/metric/${m.key}`}>
              <div className={`bg-card border rounded-xl p-3 flex flex-col gap-1.5 hover:shadow-md transition-shadow cursor-pointer group ${isLow ? "border-red-500/30" : ""}`}>
                {/* Top row: icon + name */}
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isLow ? "bg-red-100 dark:bg-red-900/40" : m.iconBg}`}>
                    <IconComponent className={`w-3 h-3 ${isLow ? "text-red-500" : m.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className={`text-[10px] font-medium tracking-wide truncate ${isLow ? "text-red-500" : "text-muted-foreground"} group-hover:text-purple-500 transition-colors`}>
                      {m.label}
                    </span>
                    {isLow && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                  </div>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-black tracking-tight ${isLow ? "text-red-500" : ""}`}>
                    {Math.round(val * 10) / 10}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50 font-medium">{m.unit}</span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${isLow ? "bg-red-500" : progress >= 100 ? "bg-emerald-500" : "bg-purple-500/50"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* RDA text */}
                <p className="text-[9px] text-muted-foreground/40">
                  {Math.round(val * 10) / 10} / {goal} {m.unit} RDA
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <button className="text-[10px] text-muted-foreground/50 hover:text-purple-500 transition-colors w-full text-right px-1">
        Show all nutrients →
      </button>
    </div>
  );
}
