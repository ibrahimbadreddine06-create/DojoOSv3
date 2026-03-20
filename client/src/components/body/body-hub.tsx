import { Dumbbell, Moon, Sparkles, Utensils, Flame, Zap, ChevronRight, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Workout, IntakeLog, SleepLog } from "@shared/schema";
import { format, isAfter, subDays, isToday } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TODAY = format(new Date(), "yyyy-MM-dd");

export function BodyHub() {
    const [, setLocation] = useLocation();

    const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
    const { data: sleepLogs } = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs/all"] });
    const { data: intakeLogs } = useQuery<IntakeLog[]>({ queryKey: ["/api/intake-logs", TODAY] });
    const { data: hygieneRoutines } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
    const { data: bodyProfile } = useQuery<any>({ queryKey: ["/api/body-profile"] });

    const sevenDaysAgo = subDays(new Date(), 7);

    const recentWorkouts = workouts?.filter(w =>
        w.date && isAfter(new Date(w.date), sevenDaysAgo) && w.completed
    ) || [];

    // Streak
    const streak = (() => {
        if (!workouts?.length) return 0;
        const sorted = [...workouts]
            .filter(w => w.completed && w.date)
            .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
        let count = 0;
        let checkDate = new Date();
        for (const w of sorted) {
            const wDate = format(new Date(w.date!), "yyyy-MM-dd");
            const checkStr = format(checkDate, "yyyy-MM-dd");
            const prevStr = format(subDays(checkDate, 1), "yyyy-MM-dd");
            if (wDate === checkStr || wDate === prevStr) {
                count++;
                checkDate = subDays(checkDate, 1);
            } else break;
        }
        return count;
    })();

    const recentSleep = sleepLogs?.filter(s => s.date && isAfter(new Date(s.date), sevenDaysAgo)) || [];
    const avgSleep = recentSleep.length > 0
        ? recentSleep.reduce((acc, s) => acc + Number(s.actualHours || 0), 0) / recentSleep.length
        : 0;

    const todayIntake = intakeLogs?.filter(l => l.status === "consumed" || !l.status) || [];
    const todayCalories = todayIntake.reduce((acc, i) => acc + Number(i.calories || 0), 0);
    const calorieGoal = bodyProfile?.dailyCalorieGoal || 2000;

    const totalRoutines = hygieneRoutines?.length || 0;
    const completedToday = hygieneRoutines?.filter(r => r.lastCompletedDate === TODAY).length || 0;

    const todayWorkout = workouts?.find(w => w.date && isToday(new Date(w.date)) && !w.completed);
    const todayCompletedWorkout = workouts?.find(w => w.date && isToday(new Date(w.date)) && w.completed);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dStr = format(d, "yyyy-MM-dd");
        const hasWorkout = workouts?.some(w =>
            w.date && format(new Date(w.date), "yyyy-MM-dd") === dStr && w.completed
        );
        return { date: d, hasWorkout: !!hasWorkout };
    });

    const recentWorkoutsList = workouts
        ?.filter(w => w.completed && w.date)
        .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
        .slice(0, 3) || [];

    return (
        <div className="pb-8">
            {/* ── Header ─── */}
            <div className="px-5 pt-5 pb-4 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        {format(new Date(), "EEEE, MMM d")}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight mt-0.5">Body</h1>
                </div>
                <button
                    onClick={() => setLocation("/body/setup")}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-1"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* ── Today's workout hero ─── */}
            <div className="px-4 mb-4">
                {todayWorkout ? (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLocation(`/body/workout/active/${todayWorkout.id}`)}
                        className="w-full rounded-3xl p-5 text-left overflow-hidden relative"
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', minHeight: 120 }}
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200/70 mb-1">Today's Workout</p>
                        <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{todayWorkout.title}</h2>
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-red-200/70 text-sm font-semibold">Ready to go</p>
                            <div className="flex items-center gap-2 bg-white text-red-600 rounded-full px-4 py-2 font-black text-sm">
                                <Zap className="w-4 h-4" /> Start
                            </div>
                        </div>
                        {/* Decorative circle */}
                        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.06)' }} />
                    </motion.button>
                ) : todayCompletedWorkout ? (
                    <div className="w-full rounded-3xl p-5 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)', minHeight: 100 }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-200/70 mb-1">Completed Today</p>
                        <h2 className="text-xl font-black text-white">{todayCompletedWorkout.title}</h2>
                        <p className="text-green-200/60 text-sm font-semibold mt-2">Great work! 💪</p>
                        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                ) : (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLocation("/body/workout")}
                        className="w-full rounded-3xl p-5 text-left border-2 border-dashed border-border/60 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Today</p>
                            <p className="font-bold text-foreground/70">No workout planned</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Tap to browse presets</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
                    </motion.button>
                )}
            </div>

            {/* ── Stats row ─── */}
            <div className="px-4 mb-4">
                <div className="grid grid-cols-4 gap-2">
                    {[
                        {
                            icon: <Flame className="w-4 h-4 text-orange-500" />,
                            value: String(streak),
                            label: "Streak",
                            sub: "days",
                        },
                        {
                            icon: <Moon className="w-4 h-4 text-indigo-400" />,
                            value: avgSleep > 0 ? avgSleep.toFixed(1) : "—",
                            label: "Sleep",
                            sub: "avg h",
                        },
                        {
                            icon: <Utensils className="w-4 h-4 text-orange-400" />,
                            value: todayCalories > 0 ? Math.round(todayCalories) > 999
                                ? `${(Math.round(todayCalories) / 1000).toFixed(1)}k` : String(Math.round(todayCalories)) : "—",
                            label: "Kcal",
                            sub: "today",
                        },
                        {
                            icon: <Dumbbell className="w-4 h-4 text-red-500" />,
                            value: String(recentWorkouts.length),
                            label: "Sessions",
                            sub: "7 days",
                        },
                    ].map((s, i) => (
                        <div key={i} className="bg-card border border-border/50 rounded-2xl p-3 flex flex-col items-center gap-1">
                            {s.icon}
                            <span className="font-mono font-black text-lg leading-none tabular-nums">{s.value}</span>
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">{s.sub}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Last 7 days ─── */}
            <div className="px-4 mb-4">
                <div className="bg-card border border-border/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">Last 7 days</p>
                    <div className="flex gap-2 justify-between">
                        {last7Days.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <div className={cn(
                                    "w-8 h-8 rounded-full transition-all",
                                    day.hasWorkout
                                        ? "bg-red-500 shadow-lg shadow-red-500/30"
                                        : isToday(day.date)
                                            ? "border-2 border-dashed border-border"
                                            : "bg-muted"
                                )} />
                                <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase">
                                    {format(day.date, "EEEEE")}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Modules ─── */}
            <div className="px-4 mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-3 px-1">Modules</p>
                <div className="space-y-2">
                    {[
                        {
                            icon: <Dumbbell className="w-5 h-5" />,
                            color: "text-red-500",
                            bg: "bg-red-500/8",
                            title: "Activity",
                            value: `${recentWorkouts.length} sessions this week`,
                            path: "/body/workout",
                        },
                        {
                            icon: <Utensils className="w-5 h-5" />,
                            color: "text-orange-500",
                            bg: "bg-orange-500/8",
                            title: "Nutrition",
                            value: todayCalories > 0 ? `${Math.round(todayCalories)} / ${calorieGoal} kcal today` : "No intake logged today",
                            path: "/body/intake",
                        },
                        {
                            icon: <Moon className="w-5 h-5" />,
                            color: "text-indigo-400",
                            bg: "bg-indigo-500/8",
                            title: "Sleep",
                            value: avgSleep > 0 ? `${avgSleep.toFixed(1)}h avg this week` : "No sleep logged",
                            path: "/body/sleep",
                        },
                        {
                            icon: <Sparkles className="w-5 h-5" />,
                            color: "text-violet-500",
                            bg: "bg-violet-500/8",
                            title: "Looks",
                            value: totalRoutines > 0 ? `${completedToday}/${totalRoutines} routines today` : "Set up your routines",
                            path: "/body/hygiene",
                        },
                    ].map((m) => (
                        <motion.button
                            key={m.title}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocation(m.path)}
                            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-border transition-colors text-left"
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", m.bg, m.color)}>
                                {m.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm">{m.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{m.value}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* ── Recent workouts ─── */}
            {recentWorkoutsList.length > 0 && (
                <div className="px-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-3 px-1">Recent</p>
                    <div className="space-y-2">
                        {recentWorkoutsList.map((w) => (
                            <div key={w.id}
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50">
                                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <Dumbbell className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{w.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {w.date ? format(new Date(w.date), "EEE, MMM d") : ""}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
