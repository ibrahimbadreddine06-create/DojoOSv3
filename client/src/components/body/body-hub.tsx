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
import { MetricRing } from "./metric-ring";
import type { Workout, IntakeLog, SleepLog, BodyProfile, TimeBlock } from "@shared/schema";

const TODAY = format(new Date(), "yyyy-MM-dd");

// ─────────────────────────────────────────────
// 1. COMPONENTS
// ─────────────────────────────────────────────

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 px-1">
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// 2. MAIN LOGIC
// ─────────────────────────────────────────────
export function BodyHub() {
  const [, navigate] = useLocation();

  // Queries (Data fetching)
  const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
  const { data: sleepLogs } = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs/all"] });
  const { data: intakeLogs } = useQuery<IntakeLog[]>({ queryKey: [`/api/intake-logs/${TODAY}`] });
  const { data: hygieneRoutines } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
  const { data: bodyProfile } = useQuery<BodyProfile>({ queryKey: ["/api/body-profile"] });
  const { data: dailyState } = useQuery<any>({ queryKey: [`/api/daily-state/${TODAY}`] });
  const { data: timeBlocks } = useQuery<TimeBlock[]>({ queryKey: [`/api/time-blocks/${TODAY}`] });

  // ── Derived State ──
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const sevenDaysAgo = subDays(new Date(), 7);

  // Activity
  const completedWorkoutsThisWeek = workouts?.filter(w => w.date && isAfter(new Date(w.date), weekStart) && w.completed) || [];
  
  // Nutrition
  const todayCalories = (intakeLogs || []).reduce((acc, i) => acc + Number(i.calories || 0), 0);
  const calorieGoal = bodyProfile?.dailyCalorieGoal || 2500;
  
  // Sleep
  const recentSleepLogs = (sleepLogs || []).filter(s => s.date && isAfter(new Date(s.date), sevenDaysAgo));
  const lastSleep = sleepLogs?.[0];
  const lastSleepHours = lastSleep ? parseFloat(lastSleep.actualHours as string || "0") : 0;
  const sleepGoal = parseFloat((bodyProfile as any)?.sleepGoalHours || "8");

  // Hygiene
  const totalRoutines = hygieneRoutines?.length || 0;
  const completedToday = (hygieneRoutines || []).filter(r => r.lastCompletedDate === TODAY).length;

  // Recovery (Hero 1)
  const readiness = dailyState?.recoveryScore ?? 78; // Fallback to realistic value for presentation 

  // Body Blocks
  const bodyModules = ["activity", "nutrition", "sleep", "hygiene", "body"];
  const bodyBlocks = (timeBlocks || []).filter(
    (b) => bodyModules.includes(b.linkedModule || "") || bodyModules.some(m => b.title.toLowerCase().includes(m))
  );

  // 7-Day Consistency
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dStr = format(d, "yyyy-MM-dd");
    const hasWorkout = workouts?.some(w => w.date && format(new Date(w.date), "yyyy-MM-dd") === dStr && w.completed);
    const hasIntake = (intakeLogs || []).some(l => l.date && format(new Date(l.date), "yyyy-MM-dd") === dStr);
    const hasSleep = (sleepLogs || []).some(s => s.date === dStr);
    return { date: d, hasWorkout: !!hasWorkout, hasIntake: !!hasIntake, hasSleep: !!hasSleep };
  });

  return (
    <div className="pb-10 space-y-8">
      
      {/* 1. HEADER */}
      <div className="px-5 pt-5 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-none text-foreground">Body</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Daily overview & planning</p>
        </div>
        <button
          onClick={() => navigate("/planner")}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 2. MAIN BRIEFING */}
      <div className="px-4">
        <div className="bg-card rounded-2xl p-5 border shadow-sm border-border/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-foreground">Morning Brief</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80 relative z-10">
            Recovery is strong today. You have a heavy lifting session planned this afternoon—make sure to hydrate and front-load your carbs.
          </p>
        </div>
      </div>

      {/* 3. HERO BODY STATE ROW */}
      <div className="px-4">
        <SectionTitle title="Today's State" />
        <div className="grid grid-cols-2 gap-3">
          {/* Recovery */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/sleep")} className="bg-card rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center cursor-pointer shadow-sm">
            <MetricRing value={readiness} max={100} label="Recovery" color="#14b8a6" size="sm" />
          </motion.div>
          
          {/* Nutrition */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/nutrition")} className="bg-card rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center cursor-pointer shadow-sm">
            <MetricRing value={todayCalories} max={calorieGoal} label="Nutrition" unit="kcal" color="#f97316" size="sm" />
          </motion.div>
          
          {/* Activity */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/activity")} className="bg-card rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center cursor-pointer shadow-sm">
            <MetricRing value={completedWorkoutsThisWeek.length} max={5} label="Activity" unit="this wk" color="#ef4444" size="sm" />
          </motion.div>
          
          {/* Looks */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/body/looks")} className="bg-card rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center cursor-pointer shadow-sm">
            <MetricRing value={completedToday} max={Math.max(totalRoutines, 1)} label="Care" color="#8b5cf6" size="sm" />
          </motion.div>
        </div>
      </div>

      {/* 4. PLANNED TODAY (Linked Blocks) */}
      <div className="px-4">
        <SectionTitle title="Planned Today" />
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          {bodyBlocks.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-sm text-muted-foreground/60 font-medium">No body blocks planned today.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {bodyBlocks.map((block) => (
                <div key={block.id} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/planner")}>
                  {block.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0 stroke-[1.5]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-base font-semibold truncate", block.completed ? "text-muted-foreground line-through" : "text-foreground")}>
                      {block.title}
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-medium mt-0.5">
                      {block.startTime && block.endTime ? `${block.startTime} — ${block.endTime}` : "Anytime"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. FOCUS (Warnings/Attention) */}
      <div className="px-4">
        <SectionTitle title="Focus Areas" subtitle="Needs attention today" />
        <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 hide-scrollbar">
          
          <div className="snap-start shrink-0 w-44 bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-500">Hydration low</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-500/70 mt-0.5">1L behind schedule</p>
            </div>
          </div>
          
          <div className="snap-start shrink-0 w-44 bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20 flex flex-col gap-2">
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
      <div className="px-4">
        <SectionTitle title="Consistency" subtitle="Submodule tracking (last 7 days)" />
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Move</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-orange-400" /> Eat</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-400" /> Sleep</span>
            </div>
          </div>
          <div className="flex justify-between w-full">
            {last7Days.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="flex flex-col gap-1">
                  <div className={cn("w-6 h-6 rounded-md transition-all border", day.hasWorkout ? "bg-red-500 border-red-600" : "bg-muted/30 border-transparent")} />
                  <div className={cn("w-6 h-6 rounded-md transition-all border", day.hasIntake ? "bg-orange-400 border-orange-500" : "bg-muted/30 border-transparent")} />
                  <div className={cn("w-6 h-6 rounded-md transition-all border", day.hasSleep ? "bg-indigo-400 border-indigo-500" : "bg-muted/30 border-transparent")} />
                </div>
                <span className={cn("text-xs font-semibold uppercase mt-1", isToday(day.date) ? "text-foreground" : "text-muted-foreground/40")}>
                  {format(day.date, "EEEEE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. MODULE ENTRY CARDS */}
      <div className="px-4">
        <SectionTitle title="Modules" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "activity", title: "Activity", icon: Dumbbell, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", path: "/body/activity" },
            { id: "nutrition", title: "Nutrition", icon: Utensils, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", path: "/body/nutrition" },
            { id: "rest", title: "Rest", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", path: "/body/sleep" },
            { id: "looks", title: "Looks", icon: Sparkles, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", path: "/body/looks" },
          ].map((m) => (
            <motion.div key={m.id} whileTap={{ scale: 0.96 }} onClick={() => navigate(m.path)} className={cn("rounded-2xl p-4 flex flex-col gap-3 cursor-pointer shadow-sm border", m.border, m.bg)}>
              <m.icon className={cn("w-6 h-6", m.color)} />
              <span className="font-bold text-foreground">{m.title}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 8. MERGED BODY SIGNALS */}
      <div className="px-4">
        <SectionTitle title="Signals" subtitle="Overall physical state" />
        <div className="grid grid-cols-2 gap-3">
          {/* Balance */}
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col shadow-sm">
            <Scale className="w-5 h-5 text-emerald-500 mb-2" />
            <span className="text-2xl font-black tabular-nums">Optimal</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Caloric balance</span>
          </div>
          
          {/* Stress */}
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col shadow-sm">
            <Activity className="w-5 h-5 text-amber-500 mb-2" />
            <span className="text-2xl font-black tabular-nums">Elevated</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Nervous system</span>
          </div>
          
          {/* Momentum */}
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col shadow-sm">
            <Flame className="w-5 h-5 text-orange-500 mb-2" />
            <span className="text-2xl font-black tabular-nums">High</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Habit momentum</span>
          </div>
          
          {/* Readiness */}
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col shadow-sm">
            <Battery className="w-5 h-5 text-blue-500 mb-2" />
            <span className="text-2xl font-black tabular-nums">92%</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Overall readiness</span>
          </div>
        </div>
      </div>

      {/* 9. TRENDS */}
      <div className="px-4">
        <SectionTitle title="Trends" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-border transition-colors">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500"/> Resting Heart Rate</h4>
              <p className="text-3xl font-black mt-1">54 <span className="text-lg text-muted-foreground font-semibold">bpm</span></p>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -2 bpm
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-wide">Last 30d</span>
            </div>
          </div>
          
          <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-border transition-colors">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2"><Dumbbell className="w-4 h-4 text-red-500"/> Effort Volume</h4>
              <p className="text-3xl font-black mt-1">12.4 <span className="text-lg text-muted-foreground font-semibold">tons</span></p>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +14%
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-wide">Last 30d</span>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}
