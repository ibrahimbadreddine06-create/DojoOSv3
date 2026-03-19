import { Dumbbell, Moon, Sparkles, Utensils, ChevronRight, Flame, ArrowRight, CalendarDays, Zap, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Workout, IntakeLog, SleepLog } from "@shared/schema";
import { format, isAfter, subDays, isToday, startOfWeek, eachDayOfInterval, endOfWeek } from "date-fns";
import { MetricRing } from "./metric-ring";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

const TODAY = format(new Date(), "yyyy-MM-dd");

function BentoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-card border border-border/60 rounded-2xl p-4 ${className}`}>
            {children}
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            {children}
        </p>
    );
}

export function BodyHub() {
    const [, setLocation] = useLocation();

    const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
    const { data: sleepLogs } = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs/all"] });
    const { data: intakeLogs } = useQuery<IntakeLog[]>({ queryKey: ["/api/intake-logs", TODAY] });
    const { data: hygieneRoutines } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
    const { data: bodyProfile } = useQuery<any>({ queryKey: ["/api/body-profile"] });

    const sevenDaysAgo = subDays(new Date(), 7);
    const thirtyDaysAgo = subDays(new Date(), 30);

    // --- Metrics ---
    const recentWorkouts = workouts?.filter(w =>
        w.date && isAfter(new Date(w.date), sevenDaysAgo) && w.completed
    ) || [];

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekWorkoutDays = new Set(
        workouts?.filter(w => w.completed && w.date && isAfter(new Date(w.date), weekStart))
            .map(w => format(new Date(w.date!), "yyyy-MM-dd")) || []
    );

    // Streak calculation
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
                checkDate = subDays(checkDate, count === 1 && wDate === checkStr ? 1 : 1);
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
    const hygienePct = totalRoutines > 0 ? Math.round((completedToday / totalRoutines) * 100) : 0;

    // Readiness score
    const activityScore = Math.min(100, recentWorkouts.length * 15);
    const sleepScore = Math.min(100, (avgSleep / 8) * 100);
    const nutritionScore = todayCalories > 0 ? Math.min(100, (todayCalories / calorieGoal) * 100) : 0;
    const readinessScore = Math.round((activityScore + sleepScore + hygienePct + nutritionScore) / 4);

    const readinessColor = readinessScore >= 70 ? "#22c55e" : readinessScore >= 40 ? "#eab308" : "#ef4444";

    // Calorie trend (last 30 days)
    const calorieTrend = (() => {
        if (!workouts) return [];
        const thirtyDayIntakes = intakeLogs ? [] : [];
        // Group intakeLogs by date and sum calories
        const grouped: Record<string, number> = {};
        // We only have today's logs here, so show last 7 days of dummy-friendly data
        // In production, fetch all intake logs; for now, show what we have
        return [];
    })();

    // Today's scheduled workout
    const todayWorkout = workouts?.find(w => w.date && isToday(new Date(w.date)) && !w.completed);
    const todayCompletedWorkout = workouts?.find(w => w.date && isToday(new Date(w.date)) && w.completed);

    // Last 7 days workout dots
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dStr = format(d, "yyyy-MM-dd");
        const hasWorkout = workouts?.some(w => w.date && format(new Date(w.date), "yyyy-MM-dd") === dStr && w.completed);
        return { date: d, hasWorkout: !!hasWorkout };
    });

    return (
        <div className="p-4 space-y-4 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Body</h1>
                    <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
                </div>
                <button
                    onClick={() => setLocation("/body/setup")}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* Section A: Three ring metrics */}
            <div>
                <SectionLabel>Today's Overview</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                    {/* Readiness */}
                    <BentoCard className="flex flex-col items-center justify-center py-5">
                        <MetricRing
                            value={readinessScore}
                            max={100}
                            label="Readiness"
                            unit="%"
                            color={readinessColor}
                            size="lg"
                            sublabel="Overall"
                        />
                    </BentoCard>

                    {/* Calories */}
                    <BentoCard className="flex flex-col items-center justify-center py-5">
                        <MetricRing
                            value={Math.round(todayCalories)}
                            max={calorieGoal}
                            label="Calories"
                            unit="kcal"
                            color="#f97316"
                            size="lg"
                            sublabel={`/ ${calorieGoal}`}
                        />
                    </BentoCard>

                    {/* Activity */}
                    <BentoCard className="flex flex-col items-center justify-center py-5">
                        <MetricRing
                            value={recentWorkouts.length}
                            max={5}
                            label="Activity"
                            unit="/ wk"
                            color="#ef4444"
                            size="lg"
                            sublabel="sessions"
                        />
                    </BentoCard>
                </div>
            </div>

            {/* Section B: Streak + Sleep */}
            <div className="grid grid-cols-3 gap-3">
                {/* Streak (2/3) */}
                <BentoCard className="col-span-2">
                    <SectionLabel>Workout Streak</SectionLabel>
                    <div className="flex items-end gap-4">
                        <div className="flex items-baseline gap-1">
                            <span className="font-mono font-black text-5xl tabular-nums leading-none">{streak}</span>
                            <span className="text-muted-foreground text-sm font-medium">days</span>
                        </div>
                        <Flame className="w-8 h-8 text-orange-500 mb-0.5 shrink-0" />
                    </div>
                    {/* 7-day dots */}
                    <div className="flex gap-1.5 mt-3">
                        {last7Days.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div
                                    className={`w-6 h-6 rounded-full transition-all ${day.hasWorkout
                                        ? "bg-red-500 shadow-sm shadow-red-500/40"
                                        : "bg-muted"
                                        }`}
                                />
                                <span className="text-[9px] text-muted-foreground/60 font-medium">
                                    {format(day.date, "EEEEE")}
                                </span>
                            </div>
                        ))}
                    </div>
                </BentoCard>

                {/* Sleep (1/3) */}
                <BentoCard className="flex flex-col items-center justify-center py-4">
                    <MetricRing
                        value={parseFloat(avgSleep.toFixed(1))}
                        max={bodyProfile?.sleepGoalHours || 8}
                        label="Sleep"
                        unit="h"
                        color="#6366f1"
                        size="md"
                        sublabel="avg 7d"
                    />
                </BentoCard>
            </div>

            {/* Section C: Today's Session */}
            <div>
                <SectionLabel>Today's Session</SectionLabel>
                {todayWorkout ? (
                    <BentoCard className="cursor-pointer hover:border-primary/40 transition-colors group"
                        onClick={() => setLocation(`/body/workout/active/${todayWorkout.id}`)}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-base">{todayWorkout.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Scheduled for today</p>
                            </div>
                            <button className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                                <Zap className="w-3.5 h-3.5" />
                                Start
                            </button>
                        </div>
                    </BentoCard>
                ) : todayCompletedWorkout ? (
                    <BentoCard>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Zap className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Workout done today!</p>
                                <p className="text-xs text-muted-foreground">{todayCompletedWorkout.title}</p>
                            </div>
                        </div>
                    </BentoCard>
                ) : (
                    <BentoCard>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-sm text-muted-foreground">No session planned</p>
                                <p className="text-xs text-muted-foreground/60 mt-0.5">Rest day or add a workout</p>
                            </div>
                            <button
                                onClick={() => setLocation("/body/workout")}
                                className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                            >
                                Presets <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </BentoCard>
                )}
            </div>

            {/* Section D: Module quick access */}
            <div>
                <SectionLabel>Modules</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                    <ModuleCard
                        title="Activity"
                        icon={<Dumbbell className="w-4 h-4" />}
                        metric={`${recentWorkouts.length} sessions`}
                        sublabel="this week"
                        color="text-red-500"
                        borderColor="border-red-500/40"
                        onClick={() => setLocation("/body/workout")}
                    />
                    <ModuleCard
                        title="Nutrition"
                        icon={<Utensils className="w-4 h-4" />}
                        metric={`${Math.round(todayCalories)} kcal`}
                        sublabel={`/ ${calorieGoal} today`}
                        color="text-orange-500"
                        borderColor="border-orange-500/40"
                        onClick={() => setLocation("/body/intake")}
                    />
                    <ModuleCard
                        title="Sleep"
                        icon={<Moon className="w-4 h-4" />}
                        metric={`${avgSleep.toFixed(1)}h`}
                        sublabel="avg this week"
                        color="text-indigo-500"
                        borderColor="border-indigo-500/40"
                        onClick={() => setLocation("/body/sleep")}
                    />
                    <ModuleCard
                        title="Looks"
                        icon={<Sparkles className="w-4 h-4" />}
                        metric={totalRoutines > 0 ? `${completedToday}/${totalRoutines}` : "—"}
                        sublabel={totalRoutines > 0 ? "routines today" : "Set up routines"}
                        color="text-violet-500"
                        borderColor="border-violet-500/40"
                        onClick={() => setLocation("/body/hygiene")}
                    />
                </div>
            </div>

            <div className="h-2" />
        </div>
    );
}

function ModuleCard({
    title,
    icon,
    metric,
    sublabel,
    color,
    borderColor,
    onClick,
}: {
    title: string;
    icon: React.ReactNode;
    metric: string;
    sublabel: string;
    color: string;
    borderColor: string;
    onClick: () => void;
}) {
    return (
        <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`bg-card border ${borderColor} rounded-2xl p-4 cursor-pointer hover:border-opacity-70 transition-colors group`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={`${color}`}>{icon}</div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="font-mono font-black text-xl tabular-nums leading-none">{metric}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
            <p className={`text-xs font-semibold mt-1 ${color}`}>{title}</p>
        </motion.div>
    );
}
