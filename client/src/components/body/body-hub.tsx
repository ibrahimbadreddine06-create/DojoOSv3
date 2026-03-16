import { Dumbbell, Moon, Sparkles, Utensils, ChevronRight, Activity, Flame, HeartPulse, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Workout, IntakeLog, SleepLog } from "@shared/schema";
import { format, isAfter, subDays } from "date-fns";

const TODAY = format(new Date(), "yyyy-MM-dd");

export function BodyHub() {
    const [, setLocation] = useLocation();

    const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
    const { data: sleepLogs } = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs/all"] });
    const { data: intakeLogs } = useQuery<IntakeLog[]>({ queryKey: ["/api/intake-logs", TODAY] });
    const { data: hygieneRoutines } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });

    const sevenDaysAgo = subDays(new Date(), 7);

    // Workouts KPI
    const recentWorkouts = workouts?.filter(w => w.date && isAfter(new Date(w.date), sevenDaysAgo) && w.completed) || [];
    const activityLevel = recentWorkouts.length >= 3 ? "Optimal" : recentWorkouts.length > 0 ? "Active" : "Low";
    const activityDesc = `${recentWorkouts.length} sessions past 7 days`;

    // Sleep KPI
    const recentSleep = sleepLogs?.filter(s => s.date && isAfter(new Date(s.date), sevenDaysAgo)) || [];
    const avgSleep = recentSleep.length > 0
        ? (recentSleep.reduce((acc, s) => acc + Number(s.actualHours || 0), 0) / recentSleep.length).toFixed(1)
        : "0.0";
    const restQuality = Number(avgSleep) >= 7 ? "Target Met" : Number(avgSleep) > 0 ? "Under Target" : "No Data";
    const restDesc = `${avgSleep}h avg past 7 days`;

    // Intake KPI
    const todayIntake = intakeLogs?.filter(l => l.status === "consumed" || !l.status) || [];
    const todayCalories = todayIntake.reduce((acc, i) => acc + Number(i.calories || 0), 0);
    const nutritionLevel = todayCalories > 0 ? "Tracked" : "Unmonitored";
    const nutritionDesc = todayCalories > 0 ? `${Math.round(todayCalories)} kcal today` : "Awaiting data";

    // Hygiene KPI
    const totalRoutines = hygieneRoutines?.length || 0;
    const completedToday = hygieneRoutines?.filter(r => r.lastCompletedDate === TODAY).length || 0;
    const hygienePct = totalRoutines > 0 ? Math.round((completedToday / totalRoutines) * 100) : 0;
    const hygieneLabel = totalRoutines === 0 ? "No routines" : hygienePct === 100 ? "Complete" : `${hygienePct}%`;
    const hygieneDesc = totalRoutines > 0 ? `${completedToday}/${totalRoutines} done today` : "Set up routines";

    // Body Readiness Score (composite)
    const activityScore = Math.min(100, recentWorkouts.length * 15);
    const sleepScore = Math.min(100, (Number(avgSleep) / 8) * 100);
    const hygieneScore = hygienePct;
    const nutritionScore = todayCalories > 0 ? Math.min(100, (todayCalories / 2000) * 100) : 0;
    const readinessScore = Math.round((activityScore + sleepScore + hygieneScore + nutritionScore) / 4);

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Body</h1>
                    <p className="text-muted-foreground">Manage your physical and mental well-being</p>
                </div>
                <div className="text-center">
                    <div
                        className={`text-4xl font-black font-mono ${readinessScore >= 70 ? "text-green-500" : readinessScore >= 40 ? "text-yellow-500" : "text-muted-foreground"}`}
                        data-testid="text-body-readiness"
                    >
                        {readinessScore}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Body Score</p>
                </div>
            </div>

            {/* Overarching Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
                        <CardTitle className="text-sm font-medium">Activity</CardTitle>
                        <Activity className="h-4 w-4 text-red-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-testid="text-activity-level">{activityLevel}</div>
                        <p className="text-xs text-muted-foreground">{activityDesc}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
                        <CardTitle className="text-sm font-medium">Rest</CardTitle>
                        <HeartPulse className="h-4 w-4 text-indigo-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-testid="text-rest-quality">{restQuality}</div>
                        <p className="text-xs text-muted-foreground">{restDesc}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
                        <CardTitle className="text-sm font-medium">Nutrition</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-testid="text-nutrition-level">{nutritionLevel}</div>
                        <p className="text-xs text-muted-foreground">{nutritionDesc}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
                        <CardTitle className="text-sm font-medium">Hygiene</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-testid="text-hygiene-level">{hygieneLabel}</div>
                        <p className="text-xs text-muted-foreground">{hygieneDesc}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Navigation Grid - 4 Sub-modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HubCard
                    title="Workout"
                    description="Execution & Planning"
                    icon={<Dumbbell className="w-6 h-6" />}
                    onClick={() => setLocation("/body/workout")}
                    colorClass="text-red-500 bg-red-500/10"
                />
                <HubCard
                    title="Intake"
                    description="Nutrition & Hydration"
                    icon={<Utensils className="w-6 h-6" />}
                    onClick={() => setLocation("/body/intake")}
                    colorClass="text-blue-500 bg-blue-500/10"
                />
                <HubCard
                    title="Sleep"
                    description="Rest & Recovery"
                    icon={<Moon className="w-6 h-6" />}
                    onClick={() => setLocation("/body/sleep")}
                    colorClass="text-indigo-500 bg-indigo-500/10"
                />
                <HubCard
                    title="Hygiene"
                    description="Routine & Care"
                    icon={<Sparkles className="w-6 h-6" />}
                    onClick={() => setLocation("/body/hygiene")}
                    colorClass="text-emerald-500 bg-emerald-500/10"
                />
            </div>
        </div>
    );
}

function HubCard({ title, description, icon, onClick, colorClass }: any) {
    return (
        <Card
            className="hover-elevate cursor-pointer transition-all hover:bg-accent/50 group"
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-xl">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </CardHeader>
        </Card>
    );
}
