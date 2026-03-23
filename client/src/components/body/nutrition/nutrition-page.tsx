import React, { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { NutritionHeader } from "./nutrition-header";
import { NutritionAiBrief } from "./nutrition-ai-brief";
import { NutritionScoreCard } from "./nutrition-score";
import { CalorieMacroCard } from "./calorie-macro-card";
import { EnergyBalanceCard } from "./energy-balance-card";
import { HydrationCard } from "./hydration-card";
import { FastingCard } from "./fasting-card";
import { FuelFingerprint } from "./fuel-fingerprint";
import { MicronutrientGrid } from "./micronutrient-grid";
import { IntakeRoutines } from "./intake-routines";
import { NutritionTrends } from "./nutrition-trends";
import { LogIntakeModal } from "./log-intake-modal";
import { FastingProgramModal } from "./fasting-program-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Utensils, Droplets, Plus } from "lucide-react";
import { SectionLabel } from "../activity/section-label";
import { type IntakeLog, type FastingLog, type BodyProfile, type DailyState, type TimeBlock } from "@shared/schema";

export function NutritionPage() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isFastingModalOpen, setIsFastingModalOpen] = useState(false);
  const [preselectedBlockId, setPreselectedBlockId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: intakeLogs, isLoading: logsLoading } = useQuery<IntakeLog[]>({
    queryKey: [`/api/intake-logs/${today}`],
  });

  const { data: profile, isLoading: profileLoading } = useQuery<BodyProfile>({
    queryKey: ["/api/body-profile"],
  });

  const { data: activeFastingLog } = useQuery<FastingLog>({
    queryKey: ["/api/fasting-logs/active"],
  });

  const { data: dailyState } = useQuery<DailyState>({
    queryKey: [`/api/daily-state/${today}`],
  });

  const { data: timeBlocks } = useQuery<TimeBlock[]>({
    queryKey: [`/api/time-blocks/${today}`],
  });

  if (logsLoading || profileLoading) {
    return (
      <div className="space-y-6 pb-20 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const logs = intakeLogs || [];
  const waterTotal = logs.reduce((acc, l) => acc + Number(l.water || 0), 0);
  const nutritionBlocks = timeBlocks?.filter(b => b.linkedModule === "nutrition") || [];

  const handleOpenLogModal = (blockId?: string) => {
    setPreselectedBlockId(blockId || null);
    setIsLogModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700">
      <NutritionHeader onLogClick={() => handleOpenLogModal()} />

      <div className="space-y-6 mt-6">
        {/* 1. AI Brief */}
        <NutritionAiBrief intakeLogs={logs} bodyProfile={profile} />

        {/* 2. Nutrition Score */}
        <NutritionScoreCard intakeLogs={logs} bodyProfile={profile} />

        {/* 3. Calories & Macros */}
        <CalorieMacroCard intakeLogs={logs} bodyProfile={profile} />

        {/* 4. Net Energy Balance */}
        <EnergyBalanceCard intakeLogs={logs} dailyState={dailyState} />

        {/* 5. Hydration + Fasting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HydrationCard waterAmount={waterTotal} waterGoal={profile?.waterGoal || 2500} />
          <FastingCard
            activeLog={activeFastingLog}
            bodyProfile={profile}
            onConfigureClick={() => setIsFastingModalOpen(true)}
          />
        </div>

        {/* 6. Linked Time Blocks */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {/* Card header */}
          <div className="px-6 pt-5 pb-3 flex justify-between items-baseline border-b border-border/50">
            <div className="space-y-0.5">
              <SectionLabel className="mb-0">Linked Time Blocks</SectionLabel>
              <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider">Planned today</p>
            </div>
          </div>

          {/* Presets row */}
          <div className="px-6 py-3 flex items-center gap-2 flex-wrap border-b border-border/30">
            <span className="text-[10px] text-muted-foreground/50 font-medium shrink-0">Presets:</span>
            <button className="h-6 px-3 rounded-full border border-dashed border-border/60 text-[10px] font-medium text-muted-foreground/40 hover:border-purple-500/40 hover:text-purple-500 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

          {/* Blocks */}
          <div className="p-4 space-y-3">
            {nutritionBlocks.length === 0 ? (
              <div className="py-8 border border-dashed border-border/50 rounded-xl text-center space-y-1">
                <p className="text-sm text-muted-foreground/50 font-medium">No intake blocks planned today</p>
                <p className="text-[10px] text-muted-foreground/30 font-medium">
                  Add a nutrition time block in your daily planner
                </p>
              </div>
            ) : (
              <>
                {/* Linked blocks */}
                {nutritionBlocks.map(block => {
                  const linkedLogs = logs.filter(l => l.linkedBlockId === block.id);
                  const isConsumed = linkedLogs.length > 0;

                  return (
                    <div key={block.id} className={`group relative bg-card border rounded-xl p-4 transition-all hover:shadow-md ${isConsumed ? "border-purple-500/30" : "border-dashed opacity-60 hover:opacity-100"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isConsumed ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground"}`}>
                            <Utensils className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold tracking-tight">{block.title}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{block.startTime} – {block.endTime}</p>
                          </div>
                        </div>
                        {isConsumed ? (
                          <CheckCircle2 className="w-5 h-5 text-purple-500" />
                        ) : (
                          <button
                            onClick={() => handleOpenLogModal(block.id)}
                            className="text-[10px] font-medium text-purple-500 hover:text-purple-600 px-3 py-1 rounded-full border border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                          >
                            Log Intake
                          </button>
                        )}
                      </div>

                      {isConsumed && (
                        <div className="ml-11 space-y-2 pt-2 border-t border-purple-500/10">
                          {linkedLogs.map(l => (
                            <div key={l.id} className="flex justify-between items-center text-sm">
                              <span className="font-semibold tracking-tight">{l.mealName}</span>
                              <div className="text-right">
                                <p className="font-black font-mono text-xs">{Math.round(Number(l.calories))} kcal</p>
                                <p className="text-[9px] text-muted-foreground/50 font-medium">
                                  P: {Math.round(Number(l.protein))}g · C: {Math.round(Number(l.carbs))}g · F: {Math.round(Number(l.fats))}g
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unlinked logs */}
                {logs.filter(l => !l.linkedBlockId).map(log => (
                  <div key={log.id} className="p-4 bg-muted/20 border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-center">
                        {log.mealType === 'water'
                          ? <Droplets className="w-4 h-4 text-blue-500" />
                          : <Utensils className="w-4 h-4 text-purple-500" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold tracking-tight">{log.mealName}</p>
                        <p className="text-[10px] font-medium text-muted-foreground/50">
                          {format(new Date(log.createdAt || Date.now()), "HH:mm")} · {log.mealType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black font-mono text-sm">
                        {log.mealType === 'water' ? `${log.water}ml` : `${Math.round(Number(log.calories))}kcal`}
                      </p>
                      {log.mealType !== 'water' && (
                        <p className="text-[9px] font-medium text-muted-foreground/40">
                          P: {Math.round(Number(log.protein))}g · C: {Math.round(Number(log.carbs))}g · F: {Math.round(Number(log.fats))}g
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer: Log intake button */}
          <div className="px-4 pb-4">
            <button
              onClick={() => handleOpenLogModal()}
              className="w-full h-10 rounded-xl border border-dashed border-purple-500/30 text-[11px] font-medium text-purple-500/70 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log intake
            </button>
          </div>
        </div>

        {/* 7. Fuel Fingerprint + Micronutrients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FuelFingerprint intakeLogs={logs} />
          <MicronutrientGrid intakeLogs={logs} bodyProfile={profile} />
        </div>

        {/* 8. Daily Intake Routines + Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IntakeRoutines date={today} />
          <NutritionTrends intakeLogs={logs} />
        </div>
      </div>

      <LogIntakeModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setPreselectedBlockId(null);
        }}
        preselectedBlockId={preselectedBlockId}
      />
      <FastingProgramModal
        isOpen={isFastingModalOpen}
        onClose={() => setIsFastingModalOpen(false)}
        currentProgram={profile?.fastingProgram}
      />
    </div>
  );
}
