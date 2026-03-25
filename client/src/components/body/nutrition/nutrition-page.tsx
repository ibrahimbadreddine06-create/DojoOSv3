import React, { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
import { TodaySessions } from "@/components/today-sessions";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Utensils, Droplets, Plus, Scale, Zap, Sparkles, ChevronRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricRing } from "../metric-ring";
import { SectionHeader } from "../section-header";
import { calculateNutritionScore } from "@/lib/nutrition-utils";
import { Link, useLocation } from "wouter";
import { type IntakeLog, type FastingLog, type BodyProfile, type DailyState, type TimeBlock } from "@shared/schema";
import { StatusBanner } from "../status-banner";
import { ModuleBriefing } from "../module-briefing";

export function NutritionPage() {
  const [, navigate] = useLocation();
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
        <StatusBanner
          variant="warning"
          icon={Sparkles}
          description="No intake logged yet today. Tap '+ Log intake' to get started."
        />
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
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700 pb-24">
      <div className="space-y-8">
        {/* ── 1. Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nutrition</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Food, fuel & micronutrients</p>
          </div>
          <Button
            onClick={() => handleOpenLogModal()}
            size="sm"
            className="gap-1.5 shrink-0 shadow-sm rounded-xl bg-orange-500 hover:bg-orange-600 border-none text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Log intake
          </Button>
        </div>

        <NutritionAiBrief intakeLogs={logs} bodyProfile={profile} />

        {/* ── 4. Main Hero Metrics ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/nutrition/metric/calorieStatus")}
          >
            <CardContent className="p-2.5 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={logs.reduce((a, b) => a + Number(b.calories || 0), 0)}
                max={profile?.dailyCalorieGoal || 2500}
                label="Calories"
                unit="kcal"
                color="#f97316"
                size="lg"
                sublabel={`of ${profile?.dailyCalorieGoal || 2500}`}
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/nutrition/metric/proteinProgress")}
          >
            <CardContent className="p-2.5 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={logs.reduce((a, b) => a + Number(b.protein || 0), 0)}
                max={profile?.dailyProteinGoal || 150}
                label="Protein"
                unit="g"
                color="#ef4444"
                size="lg"
                sublabel={`of ${profile?.dailyProteinGoal || 150}g`}
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm"
            onClick={() => navigate("/body/nutrition/metric/waterIntake")}
          >
            <CardContent className="p-2.5 sm:p-5 flex items-center justify-center">
              <MetricRing
                value={waterTotal}
                max={profile?.waterGoal || 2500}
                label="Water"
                unit="ml"
                color="#0ea5e9"
                size="lg"
                sublabel={`of ${profile?.waterGoal || 2500}ml`}
              />
            </CardContent>
          </Card>
        </div>

        {/* 3. Calories & Macros Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <CalorieMacroCard intakeLogs={logs} bodyProfile={profile} />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <EnergyBalanceCard intakeLogs={logs} dailyState={dailyState} />
          </div>
        </div>

        {/* 4. Fasting (Moved up) */}
        <FastingCard
          activeLog={activeFastingLog || undefined}
          bodyProfile={profile}
          onConfigureClick={() => setIsFastingModalOpen(true)}
        />

        {/* 6. Linked Time Blocks */}
        <TodaySessions module="nutrition" />

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

function NutritionAiBrief({ intakeLogs, bodyProfile }: { intakeLogs: any[]; bodyProfile: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/nutrition/ai-brief", intakeLogs.length, bodyProfile?.id],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/nutrition/ai-brief", { intakeLogs, bodyProfile });
      if (!res.ok) return { brief: "Nutrition analysis currently unavailable." };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <ModuleBriefing
      title="Briefing"
      kicker="Sensei AI"
      content={data?.brief}
      isLoading={isLoading}
      accentColor="bg-orange-500/10"
    />
  );
}
