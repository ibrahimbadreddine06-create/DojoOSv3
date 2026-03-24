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
import { LinkedNutritionBlocks } from "./linked-nutrition-blocks";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Utensils, Droplets, Plus } from "lucide-react";
import { SectionLabel } from "../activity/section-label";
import { type IntakeLog, type FastingLog, type BodyProfile, type DailyState, type TimeBlock } from "@shared/schema";

export function NutritionPage() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isFastingModalOpen, setIsFastingModalOpen] = useState(false);
  const [preselectedBlockId, setPreselectedBlockId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    intakeLogs: IntakeLog[];
    bodyProfile: BodyProfile;
    activeFastingLog: FastingLog | null;
    dailyState: DailyState;
    nutritionBlocks: TimeBlock[];
  }>({
    queryKey: [`/api/nutrition/overview/${today}`],
  });

  if (overviewLoading) {
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

  const logs = overview?.intakeLogs || [];
  const profile = overview?.bodyProfile;
  const activeFastingLog = overview?.activeFastingLog;
  const dailyState = overview?.dailyState;
  const nutritionBlocks = overview?.nutritionBlocks || [];
  const waterTotal = logs.reduce((acc, l) => acc + Number(l.water || 0), 0);

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
            activeLog={activeFastingLog || undefined}
            bodyProfile={profile}
            onConfigureClick={() => setIsFastingModalOpen(true)}
          />
        </div>

        {/* 6. Linked Time Blocks */}
        <LinkedNutritionBlocks />

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
