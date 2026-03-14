import { Dumbbell, Moon, Sparkles, Utensils, ChevronRight, Activity, Flame, Droplets, HeartPulse } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Workout, IntakeLog, SleepLog, HygieneRoutine } from "@shared/schema";
import { isAfter, subDays } from "date-fns";

export function BodyHub() {
    const [, setLocation] = useLocation();

    // Fetch real metrics to replace static placeholders
    const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
    const { data: sleepLogs } = useQuery<SleepLog[]>({ queryKey: ["/api/sleep-logs"] });
    const { data: intakeLogs } = useQuery<IntakeLog[]>({ queryKey: ["/api/intake-logs"] });

    // Calculate dynamic KPIs for the last 7 days
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
    const recentIntake = intakeLogs?.filter(i => i.date && isAfter(new Date(i.date), sevenDaysAgo)) || [];
    const avgCalories = recentIntake.length > 0
        ? Math.round(recentIntake.reduce((acc, i) => acc + Number(i.calories || 0), 0) / recentIntake.length)
        : 0;
    const nutritionLevel = avgCalories > 0 ? "Tracked" : "Unmonitored";
    const nutritionDesc = avgCalories > 0 ? `${avgCalories} kcal avg` : "Awaiting data";

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Body</h1>
                    <p className="text-muted-foreground">Manage your physical and mental well-being</p>
                </div>
            </div>

            {/* Overarching Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activity Level</CardTitle>
                        <Activity className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activityLevel}</div>
                        <p className="text-xs text-muted-foreground">{activityDesc}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rest Quality</CardTitle>
                        <HeartPulse className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restQuality}</div>
                        <p className="text-xs text-muted-foreground">{restDesc}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nutrition</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{nutritionLevel}</div>
                        <p className="text-xs text-muted-foreground">{nutritionDesc}</p>
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
