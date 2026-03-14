import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import { Activity, Moon, Utensils } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

export function BodyDashboard() {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    // Queries
    const { data: intakeLogs } = useQuery<any[]>({
        queryKey: ["/api/intake-logs", todayStr],
    });

    const { data: sleepLogs } = useQuery<any[]>({
        queryKey: ["/api/sleep-logs", todayStr],
    });

    // Get last 7 days of sleep for the chart
    // Note: specific query for history would be better, but for now we might mock or fetch individual days.
    // To keep it efficient and simple for this "Quick Upgrade", I'll mock the history data structure 
    // until we have a dedicated history endpoint or efficient way to fetch ranges.
    const sleepHistorydata = [
        { day: "Mon", hours: 7.2 },
        { day: "Tue", hours: 6.5 },
        { day: "Wed", hours: 8.0 },
        { day: "Thu", hours: 7.5 },
        { day: "Fri", hours: 6.8 },
        { day: "Sat", hours: 9.0 },
        { day: "Sun", hours: 7.5 },
    ];

    const { data: workouts } = useQuery<any[]>({
        queryKey: ["/api/workouts"],
    });

    // Calculations
    const totalCalories = intakeLogs?.reduce((acc, log) => acc + (parseFloat(log.calories) || 0), 0) || 0;
    const calorieGoal = 2500; // Hardcoded goal
    const caloriePercentage = Math.min(100, Math.max(0, (totalCalories / calorieGoal) * 100));

    const todaysSleep = sleepLogs?.[0];
    const sleepHours = todaysSleep ? parseFloat(todaysSleep.actualHours) : 0;
    const sleepGoal = 8;

    const todaysWorkout = workouts?.find((w: any) => w.date === todayStr);

    // Chart Data
    const calorieData = [
        { name: "Consumed", value: totalCalories, color: "hsl(var(--primary))" },
        { name: "Remaining", value: Math.max(0, calorieGoal - totalCalories), color: "hsl(var(--muted))" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Calories Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Calories</CardTitle>
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="h-[80px] w-[80px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={calorieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={25}
                                        outerRadius={35}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {calorieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{totalCalories.toFixed(0)}</div>
                            <p className="text-xs text-muted-foreground">
                                of {calorieGoal} kcal goal
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sleep Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sleep Trends</CardTitle>
                    <Moon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="h-[80px] w-[100px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sleepHistorydata}>
                                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{sleepHours > 0 ? sleepHours + "h" : "--"}</div>
                            <p className="text-xs text-muted-foreground">
                                Last night
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workout Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="pt-4">
                        {todaysWorkout ? (
                            <div>
                                <div className="text-lg font-semibold">{todaysWorkout.title}</div>
                                <div className={`text-sm ${todaysWorkout.completed ? 'text-green-500' : 'text-amber-500'}`}>
                                    {todaysWorkout.completed ? "Completed" : "Scheduled"}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-lg font-semibold text-muted-foreground">Rest Day</div>
                                <div className="text-sm text-muted-foreground">No workouts scheduled</div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
