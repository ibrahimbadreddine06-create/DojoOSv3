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
import { CheckCircle2, Circle, Utensils, Droplets } from "lucide-react";
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
    <div className="space-y-8 pb-20 animate-in fade-in duration-700 p-1 md:p-0">
      <NutritionHeader onLogClick={() => handleOpenLogModal()} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NutritionAiBrief intakeLogs={logs} bodyProfile={profile} />
        <NutritionScoreCard intakeLogs={logs} bodyProfile={profile} />
      </div>

      <CalorieMacroCard intakeLogs={logs} bodyProfile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <EnergyBalanceCard intakeLogs={logs} dailyState={dailyState} />
        </div>
        <div className="lg:col-span-1">
          <HydrationCard waterAmount={waterTotal} waterGoal={profile?.waterGoal || 2500} />
        </div>
        <div className="lg:col-span-1">
          <FastingCard 
            activeLog={activeFastingLog} 
            bodyProfile={profile} 
            onConfigureClick={() => setIsFastingModalOpen(true)} 
          />
        </div>
      </div>

      <FuelFingerprint intakeLogs={logs} />
      <MicronutrientGrid intakeLogs={logs} />
      <IntakeRoutines date={today} />
      <NutritionTrends intakeLogs={logs} />

      {/* Unified Daily Log (Planned vs Consumed) */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline px-1">
          <h2 className="text-xl font-bold tracking-tight">Daily Intake Log</h2>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Planned vs Consumed</span>
        </div>

        <div className="space-y-3">
           {/* Blocks from Planner */}
           {nutritionBlocks.map(block => {
             const linkedLogs = logs.filter(l => l.linkedBlockId === block.id);
             const isConsumed = linkedLogs.length > 0;

             return (
               <div key={block.id} className={`group relative bg-card border rounded-2xl p-4 transition-all hover:shadow-md ${isConsumed ? "border-purple-500/30" : "border-dashed opacity-60 hover:opacity-100"}`}>
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isConsumed ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground"}`}>
                           <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase tracking-widest">{block.title}</p>
                           <p className="text-[10px] font-bold text-muted-foreground">{block.startTime} - {block.endTime}</p>
                        </div>
                     </div>
                     {isConsumed ? (
                       <CheckCircle2 className="w-5 h-5 text-purple-500" />
                     ) : (
                       <button 
                        onClick={() => handleOpenLogModal(block.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-600 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 transition-colors"
                       >
                         Log Intake
                       </button>
                     )}
                  </div>

                  {isConsumed && (
                    <div className="ml-11 space-y-2 pt-1 border-t border-purple-500/10">
                       {linkedLogs.map(l => (
                         <div key={l.id} className="flex justify-between items-center text-sm">
                            <span className="font-bold tracking-tight">{l.mealName}</span>
                            <div className="text-right">
                               <p className="font-black font-mono text-xs">{Math.round(Number(l.calories))} kcal</p>
                               <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                                 P: {Math.round(Number(l.protein))}g • C: {Math.round(Number(l.carbs))}g • F: {Math.round(Number(l.fats))}g
                               </p>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
             );
           })}

           {/* Unlinked Logs (Snacks, Water, etc.) */}
           {logs.filter(l => !l.linkedBlockId).map(log => (
             <div key={log.id} className="p-4 bg-muted/20 border rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/5 flex items-center justify-center text-lg">
                    {log.mealType === 'water' ? "💧" : "🍲"}
                  </div>
                  <div>
                    <p className="font-black tracking-tight">{log.mealName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                      {format(new Date(log.createdAt || Date.now()), "HH:mm")} • {log.mealType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black font-mono">
                    {log.mealType === 'water' ? `${log.water}ml` : `${Math.round(Number(log.calories))}kcal`}
                  </p>
                  {log.mealType !== 'water' && (
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                      P: {Math.round(Number(log.protein))}g • C: {Math.round(Number(log.carbs))}g • F: {Math.round(Number(log.fats))}g
                    </p>
                  )}
                </div>
             </div>
           ))}
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
