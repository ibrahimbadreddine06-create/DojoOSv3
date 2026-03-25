import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfWeek, isAfter, isToday } from "date-fns";
import { motion } from "framer-motion";
import {
  Dumbbell, Moon, Sparkles, Utensils, Zap, Filter, Flame, Watch, Settings,
  AlertCircle, ChevronRight, Activity, Battery, Scale, TrendingUp, TrendingDown,
  Droplets, Heart, CheckCircle2, Circle
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MetricRing } from "./metric-ring";
import { SectionHeader } from "./section-header";
import { TodaySessions } from "@/components/today-sessions";
import { ModuleBriefing } from "./module-briefing";
import type { Workout, IntakeLog, SleepLog, BodyProfile, TimeBlock } from "@shared/schema";

const TODAY = format(new Date(), "yyyy-MM-dd");

// ─────────────────────────────────────────────
// 1. COMPONENTS
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────
// 2. MAIN LOGIC
// ─────────────────────────────────────────────
export function BodyHub() {
  const [, navigate] = useLocation();

  // Queries (Data fetching)
  const { data: workouts } = useQuery<Workout[]>({ queryKey: [`/api/workouts/${TODAY}`] });
  const { data: sleepLogs } = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs/all"] });
  const { data: intakeLogs } = useQuery<IntakeLog[]>({ queryKey: [`/api/intake-logs/${TODAY}`] });
  const { data: hygieneRoutines } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
  const { data: bodyProfile } = useQuery<BodyProfile>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState } = useQuery<any>({ queryKey: [`/api/daily-state/${TODAY}`] });
  const { data: timeBlocks } = useQuery<TimeBlock[]>({ queryKey: [`/api/time-blocks/${TODAY}`] });
  const { data: signals } = useQuery<{ balance: number; stress: number; momentum: number }>({ queryKey: ["/api/body/signals"] });
  const { data: history7d } = useQuery<any[]>({ queryKey: ["/api/activity/trends?metric=steps&days=7"] });
  const { data: calorieTrends } = useQuery<any[]>({ queryKey: ["/api/nutrition/trends/batch?metrics=calories&days=7"] });
  const { data: sleepTrends } = useQuery<any[]>({ queryKey: ["/api/rest/trends?metric=sleepHours&days=7"] });

  // ── Derived State ──
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const sevenDaysAgo = subDays(new Date(), 7);

  // Today's values from dailyState
  const readiness = dailyState?.recoveryScore ?? 0;
  const todayCalories = dailyState?.caloriesConsumed ?? 0;
  const calorieGoal = bodyProfile?.dailyCalorieGoal || 2500;
  
  const workoutsThisWeek = useMemo(() => {
    return history7d?.filter(h => h.workoutCompleted).length || 0;
  }, [history7d]);
  
  // Hygiene
  const totalRoutines = hygieneRoutines?.length || 0;
  const completedToday = (hygieneRoutines || []).filter(r => r.lastCompletedDate === TODAY).length;

  // Body Blocks
  const bodyModules = ["activity", "nutrition", "sleep", "hygiene", "body"];
  const bodyBlocks = (timeBlocks || []).filter(
    (b) => bodyModules.includes(b.linkedModule || "") || bodyModules.some(m => b.title.toLowerCase().includes(m))
  );

  // 7-Day Consistency (Using real trends data)
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dStr = format(d, "yyyy-MM-dd");
      
      const dayActivity = history7d?.find(h => h.date === dStr);
      const dayIntake = (calorieTrends as any)?.calories?.find((h: any) => h.date === dStr);
      const daySleep = sleepTrends?.find(h => h.date === dStr);
      
      return { 
        date: d, 
        hasWorkout: (dayActivity?.value || 0) > 0, 
        hasIntake: (dayIntake?.value || 0) > 0, 
        hasSleep: (daySleep?.value || 0) > 0 
      };
    });
  }, [history7d, calorieTrends, sleepTrends]);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700 pb-24">
      <div className="space-y-8">
      
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Body</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Daily overview & planning</p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => navigate("/body/setup")}
          className="shrink-0 shadow-sm rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* 2. MAIN BRIEFING */}
      <ModuleBriefing 
        title="Briefing"
        kicker="Sensei AI"
        content="Recovery is strong today. You have a heavy lifting session planned this afternoon—make sure to hydrate and front-load your carbs."
      />

      {/* 3. HERO BODY STATE ROW */}
      <div className="space-y-4">
        <SectionHeader title="Today's State" kicker="Biometrics" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recovery */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/sleep")} className="bg-card rounded-2xl p-5 border border-border/60 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all">
            <MetricRing value={readiness} max={100} label="Recovery" color="#14b8a6" size="sm" />
          </motion.div>
          
          {/* Nutrition */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/nutrition")} className="bg-card rounded-2xl p-5 border border-border/60 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all">
            <MetricRing value={todayCalories} max={calorieGoal} label="Nutrition" unit="kcal" color="#f97316" size="sm" />
          </motion.div>
          
          {/* Activity */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/activity")} className="bg-card rounded-2xl p-5 border border-border/60 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all">
            <MetricRing value={workoutsThisWeek} max={5} label="Activity" unit="this wk" color="#f59e0b" size="sm" />
          </motion.div>
          
          {/* Looks */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/looks")} className="bg-card rounded-2xl p-5 border border-border/60 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all">
            <MetricRing value={completedToday} max={Math.max(totalRoutines, 1)} label="Care" color="#8b5cf6" size="sm" />
          </motion.div>
        </div>
      </div>

      {/* 4. PLANNED TODAY (Linked Blocks) */}
      <TodaySessions module="body" />

      {/* 5. FOCUS (Warnings/Attention) */}
      <div className="space-y-4">
        <SectionHeader title="Focus Areas" kicker="Action Required" />
        <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-2 px-2 hide-scrollbar">
          
          <div className="snap-start shrink-0 w-48 bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-500">Hydration low</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-500/70 mt-0.5">1L behind schedule</p>
            </div>
          </div>
          
          <div className="snap-start shrink-0 w-48 bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-500">Sleep deficit</p>
              <p className="text-xs text-blue-700/70 dark:text-blue-500/70 mt-0.5">-1.2h avg this week</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* 6. CONSISTENCY / COMPLETION */}
      <div className="space-y-4">
        <SectionHeader title="Consistency" kicker="Execution" />
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Move</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400" /> Eat</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400" /> Sleep</span>
            </div>
          </div>
          <div className="flex justify-between w-full">
            {last7Days.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="flex flex-col gap-1">
                  <div className={cn("w-6 h-6 rounded-md transition-all border", day.hasWorkout ? "bg-amber-500 border-amber-600" : "bg-muted/30 border-transparent")} />
                  <div className={cn("w-6 h-6 rounded-md transition-all border", day.hasIntake ? "bg-orange-400 border-orange-500" : "bg-muted/30 border-transparent")} />
                  <div className={cn("w-6 h-6 rounded-md transition-all border", day.hasSleep ? "bg-indigo-400 border-indigo-500" : "bg-muted/30 border-transparent")} />
                </div>
                <span className={cn("text-[9px] font-bold uppercase tracking-tight mt-1 tabular-nums", isToday(day.date) ? "text-foreground" : "text-muted-foreground/40")}>
                  {format(day.date, "EEEEE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* 8. MERGED BODY SIGNALS */}
      <div className="space-y-4">
        <SectionHeader title="Signals" kicker="Biometrics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Balance */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col shadow-sm">
            <Scale className="w-5 h-5 text-emerald-500 mb-2" />
            <span className="text-2xl font-bold tabular-nums">{signals?.balance ?? "..."}%</span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Energy Balance</span>
          </div>
          
          {/* Stress */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col shadow-sm">
            <Activity className="w-5 h-5 text-amber-500 mb-2" />
            <span className="text-2xl font-bold tabular-nums">{signals?.stress ?? "..."}%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Nervous Stress</span>
          </div>
          
          {/* Momentum */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col shadow-sm">
            <Flame className="w-5 h-5 text-orange-500 mb-2" />
            <span className="text-2xl font-bold tabular-nums">{signals?.momentum ?? "..."}%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Habit Momentum</span>
          </div>
          
          {/* Readiness */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col shadow-sm">
            <Battery className="w-5 h-5 text-blue-500 mb-2" />
            <span className="text-2xl font-bold tabular-nums">{dailyState?.readinessScore ?? "..."}%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Overall readiness</span>
          </div>
        </div>
      </div>

      {/* 9. TRENDS */}
      <div className="space-y-4">
        <SectionHeader title="Biometric Trends" kicker="Analysis" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/body/activity/avgHR")}>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500"/> Resting Heart Rate</h4>
              <p className="text-3xl font-bold mt-1">{dailyState?.avgHeartRate || "--"} <span className="text-lg text-muted-foreground font-semibold">bpm</span></p>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Optimal
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-wide">Last 30d</span>
            </div>
          </div>
          
          <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/body/activity/strengthVolume")}>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2"><Dumbbell className="w-4 h-4 text-amber-500"/> Effort Volume</h4>
              <p className="text-3xl font-bold mt-1">{(dailyState?.totalVolume / 1000).toFixed(1) || "0"} <span className="text-lg text-muted-foreground font-semibold">tons</span></p>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Growing
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-wide">Last 30d</span>
            </div>
          </div>
          
        </div>
      </div>

      </div>
    </div>
  );
}
