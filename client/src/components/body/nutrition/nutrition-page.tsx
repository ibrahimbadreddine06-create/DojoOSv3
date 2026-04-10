import React, { useState, useMemo } from "react";
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
import {
  Plus, Utensils, Droplets, Scale, Zap, Sparkles, BarChart2,
  Layers, Flame, ListChecks, Clock, Microscope,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricRing } from "../metric-ring";
import { ModuleBriefing } from "../module-briefing";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition } from "@/components/body/module-grid";
import { calculateNutritionScore } from "@/lib/nutrition-utils";
import { useLocation } from "wouter";
import { type IntakeLog, type FastingLog, type BodyProfile, type DailyState, type TimeBlock } from "@shared/schema";

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
  }>({ queryKey: [`/api/nutrition/overview/${today}`] });

  const logs           = overview?.intakeLogs      || [];
  const profile        = overview?.bodyProfile;
  const activeFastingLog = overview?.activeFastingLog;
  const dailyState     = overview?.dailyState;
  const nutritionBlocks = overview?.nutritionBlocks || [];
  const waterTotal = logs.reduce((acc, l) => acc + Number(l.water || 0), 0);

  const handleOpenLogModal = (blockId?: string) => {
    setPreselectedBlockId(blockId || null);
    setIsLogModalOpen(true);
  };

  const widgets: WidgetDefinition[] = useMemo(() => [
    // ── AI Briefing ──────────────────────────────────────────────────────────
    {
      id: "briefing", label: "AI Briefing", icon: Sparkles,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => <NutritionAiBrief intakeLogs={logs} bodyProfile={profile} />,
    },
    // ── Hero rings ───────────────────────────────────────────────────────────
    {
      id: "calories_ring", label: "Calories Ring", icon: Flame,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/nutrition/metric/calorieStatus")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={logs.reduce((a, b) => a + Number(b.calories || 0), 0)}
              max={profile?.dailyCalorieGoal || 2500} label="Calories" unit="kcal" color="#f97316" size="lg"
              sublabel={`of ${profile?.dailyCalorieGoal || 2500}`} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "protein_ring", label: "Protein Ring", icon: Zap,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/nutrition/metric/proteinProgress")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={logs.reduce((a, b) => a + Number(b.protein || 0), 0)}
              max={profile?.dailyProteinGoal || 150} label="Protein" unit="g" color="#ef4444" size="lg"
              sublabel={`of ${profile?.dailyProteinGoal || 150}g`} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "water_ring", label: "Water Ring", icon: Droplets,
      defaultW: 1, defaultH: 2,
      visualizations: [{ id: "ring", label: "Ring" }],
      render: () => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/nutrition/metric/waterIntake")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={waterTotal} max={profile?.waterGoal || 2500} label="Water" unit="ml" color="#0ea5e9" size="lg"
              sublabel={`of ${profile?.waterGoal || 2500}ml`} />
          </CardContent>
        </Card>
      ),
    },
    // ── Detail cards ─────────────────────────────────────────────────────────
    {
      id: "calorie_macro", label: "Calories & Macros", icon: Layers,
      defaultW: 2, defaultH: 3,
      visualizations: [{ id: "default", label: "Macro Card" }],
      render: () => <CalorieMacroCard intakeLogs={logs} bodyProfile={profile} />,
    },
    {
      id: "energy_balance", label: "Energy Balance", icon: Scale,
      defaultW: 1, defaultH: 3,
      visualizations: [{ id: "default", label: "Balance Card" }],
      render: () => <EnergyBalanceCard intakeLogs={logs} dailyState={dailyState} />,
    },
    {
      id: "fasting", label: "Fasting", icon: Clock,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Fasting Card" }],
      render: () => (
        <FastingCard activeLog={activeFastingLog || undefined} bodyProfile={profile}
          onConfigureClick={() => setIsFastingModalOpen(true)} />
      ),
    },
    {
      id: "today_sessions", label: "Today's Sessions", icon: ListChecks,
      defaultW: 3, defaultH: 2,
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="nutrition" />,
    },
    {
      id: "fuel_fingerprint", label: "Fuel Fingerprint", icon: Zap,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Fingerprint" }],
      render: () => <FuelFingerprint intakeLogs={logs} />,
    },
    {
      id: "micronutrients", label: "Micronutrients", icon: Microscope,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Nutrient Grid" }],
      render: () => <MicronutrientGrid intakeLogs={logs} bodyProfile={profile} />,
    },
    {
      id: "intake_routines", label: "Intake Routines", icon: ListChecks,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Routine List" }],
      render: () => <IntakeRoutines date={today} />,
    },
    {
      id: "nutrition_trends", label: "Nutrition Trends", icon: BarChart2,
      defaultW: 3, defaultH: 3,
      visualizations: [{ id: "default", label: "Trend Chart" }],
      render: () => <NutritionTrends intakeLogs={logs} />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [logs, profile, activeFastingLog, dailyState, waterTotal, today]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-end mb-3">
        <Button onClick={() => handleOpenLogModal()} size="sm"
          className="gap-1.5 shadow-sm rounded-xl bg-orange-500 hover:bg-orange-600 border-none text-white">
          <Plus className="w-4 h-4" /> Log intake
        </Button>
      </div>

      <ModuleGrid widgets={widgets} storageKey="moduleGrid_nutrition_v1" />

      <LogIntakeModal isOpen={isLogModalOpen}
        onClose={() => { setIsLogModalOpen(false); setPreselectedBlockId(null); }}
        preselectedBlockId={preselectedBlockId} />
      <FastingProgramModal isOpen={isFastingModalOpen} onClose={() => setIsFastingModalOpen(false)}
        currentProgram={profile?.fastingProgram} />
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
    <ModuleBriefing title="Briefing" kicker="Sensei AI" content={data?.brief}
      isLoading={isLoading} accentColor="bg-orange-500/10" />
  );
}
