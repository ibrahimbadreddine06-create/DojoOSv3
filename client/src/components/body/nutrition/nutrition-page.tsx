import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { EnergyBalanceCard } from "./energy-balance-card";
import { FastingCard } from "./fasting-card";
import { IntakeRoutines } from "./intake-routines";
import { LogIntakeModal } from "./log-intake-modal";
import { FastingProgramModal } from "./fasting-program-modal";
import { TodaySessions } from "@/components/today-sessions";
import {
  Plus, Utensils, Droplets, Scale, Zap, Sparkles,
  Layers, Flame, ListChecks, Clock, Microscope, Wheat, Apple, Fish, Bone, Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricRing } from "../metric-ring";
import { ModuleBriefing } from "../module-briefing";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition, WidgetRenderContext } from "@/components/body/module-grid";
import { calculateNutritionScore } from "@/lib/nutrition-utils";
import { useLocation } from "wouter";
import { type IntakeLog, type FastingLog, type BodyProfile, type DailyState, type TimeBlock } from "@shared/schema";

const FUEL_WIDGETS = [
  { id: "plants", label: "Plants", icon: Apple, color: "#10b981", detail: "Vegetables, fruit, legumes" },
  { id: "quality_protein", label: "Quality Protein", icon: Zap, color: "#14b8a6", detail: "Lean meat, eggs, legumes" },
  { id: "complex_carbs", label: "Complex Carbs", icon: Wheat, color: "#3b82f6", detail: "Oats, rice, sweet potato" },
  { id: "healthy_fats", label: "Healthy Fats", icon: Droplets, color: "#f59e0b", detail: "Avocado, nuts, olive oil" },
  { id: "ultra_processed", label: "Ultra-Processed", icon: Flame, color: "#f97316", detail: "Packaged snacks, fast food" },
  { id: "high_sodium", label: "High Sodium", icon: Scale, color: "#ef4444", detail: "Processed and cured foods" },
  { id: "added_sugars", label: "Added Sugars", icon: Flame, color: "#ec4899", detail: "Sodas, sweets, syrups" },
  { id: "red_meat", label: "Red Meat", icon: Flame, color: "#dc2626", detail: "Beef, pork, deli meats" },
];

const MICRO_WIDGETS = [
  { key: "vitaminD", label: "Vit D", unit: "mcg", icon: Microscope, color: "#f59e0b", mGoal: 20, fGoal: 20 },
  { key: "vitaminB12", label: "Vit B12", unit: "mcg", icon: Zap, color: "#8b5cf6", mGoal: 2.4, fGoal: 2.4 },
  { key: "magnesium", label: "Magnesium", unit: "mg", icon: Zap, color: "#3b82f6", mGoal: 420, fGoal: 320 },
  { key: "zinc", label: "Zinc", unit: "mg", icon: Shield, color: "#14b8a6", mGoal: 11, fGoal: 8 },
  { key: "iron", label: "Iron", unit: "mg", icon: Scale, color: "#ef4444", mGoal: 8, fGoal: 18 },
  { key: "omega3", label: "Omega-3", unit: "g", icon: Fish, color: "#06b6d4", mGoal: 1.6, fGoal: 1.1 },
  { key: "calcium", label: "Calcium", unit: "mg", icon: Bone, color: "#64748b", mGoal: 1000, fGoal: 1000 },
  { key: "vitaminC", label: "Vit C", unit: "mg", icon: Apple, color: "#22c55e", mGoal: 90, fGoal: 75 },
];

function ringSizeFor(ctx: WidgetRenderContext): "sm" | "md" | "lg" {
  if (ctx.size.h <= 1 || ctx.size.w <= 1 && ctx.shape === "square") return "sm";
  if (ctx.shape === "horizontal" || ctx.size.h === 2) return "md";
  return "lg";
}

function NutritionMetricCard({ label, value, unit, goal, color, onClick, ...rootProps }: {
  label: string;
  value: number;
  unit?: string;
  goal?: number;
  color: string;
  onClick?: () => void;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <button {...rootProps} type="button" onClick={onClick} className={`h-full w-full rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md ${rootProps.className ?? ""}`}>
      {rootProps.children}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-black tabular-nums tracking-tight">{Math.round(value * 10) / 10}</span>
        {unit && <span className="text-xs font-bold text-muted-foreground">{unit}</span>}
      </div>
      {goal && (
        <>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground/40">
            {Math.max(0, Math.round(goal - value))} {unit ?? ""} remaining
          </p>
        </>
      )}
    </button>
  );
}

function FuelCard({ label, detail, icon: Icon, color, onClick, ...rootProps }: {
  label: string;
  detail: string;
  icon: any;
  color: string;
  onClick: () => void;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rootProps} type="button" onClick={onClick} className={`flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md ${rootProps.className ?? ""}`}>
      {rootProps.children}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{detail}</p>
      </div>
    </button>
  );
}

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
  const totals = logs.reduce((acc, log) => ({
    calories: acc.calories + Number(log.calories || 0),
    protein: acc.protein + Number(log.protein || 0),
    carbs: acc.carbs + Number(log.carbs || 0),
    fats: acc.fats + Number(log.fats || 0),
    fiber: acc.fiber + Number(log.fiber || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });
  const goals = {
    calories: profile?.dailyCalorieGoal || 2500,
    protein: profile?.dailyProteinGoal || 150,
    carbs: profile?.dailyCarbsGoal || 250,
    fats: profile?.dailyFatsGoal || 70,
    fiber: profile?.fiberGoal || 30,
  };
  const microTotals = logs.reduce((acc, log) => {
    MICRO_WIDGETS.forEach((m) => {
      acc[m.key] = (acc[m.key] || 0) + (Number(log[m.key as keyof IntakeLog]) || 0);
    });
    return acc;
  }, {} as Record<string, number>);
  const sex = profile?.sex || "male";

  const handleOpenLogModal = (blockId?: string) => {
    setPreselectedBlockId(blockId || null);
    setIsLogModalOpen(true);
  };

  const widgets: WidgetDefinition[] = useMemo(() => [
    // ── AI Briefing ──────────────────────────────────────────────────────────
    {
      id: "briefing", label: "AI Briefing", icon: Sparkles,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => <NutritionAiBrief intakeLogs={logs} bodyProfile={profile} />,
    },
    // ── Hero rings ───────────────────────────────────────────────────────────
    {
      id: "calories_ring", label: "Calories Ring", icon: Flame,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/nutrition/metric/calorieStatus")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={logs.reduce((a, b) => a + Number(b.calories || 0), 0)}
              max={profile?.dailyCalorieGoal || 2500} label="Calories" unit="kcal" color="#f97316" size={ringSizeFor(ctx)}
              sublabel={`of ${profile?.dailyCalorieGoal || 2500}`} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "protein_ring", label: "Protein Ring", icon: Zap,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/nutrition/metric/proteinProgress")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={logs.reduce((a, b) => a + Number(b.protein || 0), 0)}
              max={profile?.dailyProteinGoal || 150} label="Protein" unit="g" color="#ef4444" size={ringSizeFor(ctx)}
              sublabel={`of ${profile?.dailyProteinGoal || 150}g`} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "water_ring", label: "Water Ring", icon: Droplets,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/nutrition/metric/waterIntake")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={waterTotal} max={profile?.waterGoal || 2500} label="Water" unit="ml" color="#0ea5e9" size={ringSizeFor(ctx)}
              sublabel={`of ${profile?.waterGoal || 2500}ml`} />
          </CardContent>
        </Card>
      ),
    },
    // ── Detail cards ─────────────────────────────────────────────────────────
    {
      id: "calories", label: "Calories", icon: Flame,
      defaultW: 2, defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "number", label: "Number" },
      ],
      render: () => <NutritionMetricCard label="Calories" value={totals.calories} unit="kcal" goal={goals.calories} color="#f97316" onClick={() => navigate("/body/nutrition/metric/calories")} />,
    },
    ...([
      { id: "macro_protein", label: "Protein", value: totals.protein, goal: goals.protein, color: "#3b82f6", metric: "protein" },
      { id: "macro_carbs", label: "Carbs", value: totals.carbs, goal: goals.carbs, color: "#f59e0b", metric: "carbs" },
      { id: "macro_fats", label: "Fats", value: totals.fats, goal: goals.fats, color: "#ec4899", metric: "fats" },
      { id: "macro_fiber", label: "Fiber", value: totals.fiber, goal: goals.fiber, color: "#14b8a6", metric: "fiber" },
    ].map((macro) => ({
      id: macro.id, label: macro.label, icon: Layers,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "stacked", label: "Stacked Bar" },
      ],
      render: () => <NutritionMetricCard label={macro.label} value={macro.value} unit="g" goal={macro.goal} color={macro.color} onClick={() => navigate(`/body/nutrition/metric/${macro.metric}`)} />,
    }))),
    {
      id: "energy_balance", label: "Energy Balance", icon: Scale,
      defaultW: 1, defaultH: 3,
      allowedSizes: [{ w: 1, h: 2 }, { w: 1, h: 3 }, { w: 2, h: 2 }, { w: 3, h: 1 }, { w: 3, h: 2 }],
      visualizations: [
        { id: "diverging", label: "Diverging Bar" },
        { id: "number", label: "Number" },
      ],
      render: () => <EnergyBalanceCard intakeLogs={logs} dailyState={dailyState} />,
    },
    {
      id: "fasting", label: "Fasting", icon: Clock,
      defaultW: 3, defaultH: 2,
      visualizations: [
        { id: "timeline", label: "Timeline" },
        { id: "bar", label: "Bar" },
      ],
      render: () => (
        <FastingCard activeLog={activeFastingLog || undefined} bodyProfile={profile}
          onConfigureClick={() => setIsFastingModalOpen(true)} />
      ),
    },
    {
      id: "today_sessions", label: "Today's Sessions", icon: ListChecks,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="nutrition" />,
    },
    ...FUEL_WIDGETS.map((fuel) => ({
      id: `fuel_${fuel.id}`, label: fuel.label, icon: fuel.icon,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "bar", label: "Bar" },
        { id: "number", label: "Number" },
      ],
      render: () => <FuelCard label={fuel.label} detail={fuel.detail} icon={fuel.icon} color={fuel.color} onClick={() => navigate("/body/nutrition/metric/fuel")} />,
    })),
    ...MICRO_WIDGETS.map((micro) => {
      const goal = sex === "female" ? micro.fGoal : micro.mGoal;
      const value = microTotals[micro.key] || 0;
      return {
        id: `micro_${micro.key}`, label: micro.label, icon: micro.icon,
        defaultW: 1, defaultH: 1,
        visualizations: [
          { id: "bar", label: "Bar" },
          { id: "number", label: "Number" },
        ],
        render: () => <NutritionMetricCard label={micro.label} value={value} unit={micro.unit} goal={goal} color={micro.color} onClick={() => navigate(`/body/nutrition/metric/${micro.key}`)} />,
      };
    }),
    {
      id: "intake_routines", label: "Intake Routines", icon: ListChecks,
      defaultW: 3, defaultH: 3,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }, { w: 3, h: 4 }],
      visualizations: [
        { id: "list", label: "List" },
        { id: "streak", label: "Streak Strip" },
      ],
      render: () => <IntakeRoutines date={today} />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [logs, profile, activeFastingLog, dailyState, waterTotal, today, totals, goals, microTotals, sex, navigate]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Nutrition</h1>
        </div>
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

function NutritionAiBrief({
  intakeLogs,
  bodyProfile,
  ...rootProps
}: { intakeLogs: any[]; bodyProfile: any } & React.HTMLAttributes<HTMLDivElement>) {
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
      isLoading={isLoading} accentColor="bg-orange-500/10" {...rootProps} />
  );
}
