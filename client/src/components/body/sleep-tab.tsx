import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, Zap, TrendingDown } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { AddSleepLogDialog } from "@/components/dialogs/add-sleep-log-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { TodaySessions } from "../today-sessions";

const SLEEP_GOAL_HOURS = 8;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calcReadiness(log: any): number {
  const quality = log.quality || 3;
  const actual = parseFloat(log.actualHours || 0);
  const planned = parseFloat(log.plannedHours || SLEEP_GOAL_HOURS);
  const goalRatio = Math.min(1, actual / planned);
  return Math.round(quality * 10 + goalRatio * 50);
}

export function SleepTab() {
  const [selectedDate] = useState(new Date());

  const { data: allLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sleep-logs/all"],
  });

  const { data: bodyProfile } = useQuery<any>({
    queryKey: ["/api/body-profile"],
  });

  const sleepGoal = parseFloat(bodyProfile?.sleepGoalHours || SLEEP_GOAL_HOURS);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(selectedDate, 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = allLogs?.find(l => l.date === dateStr);
    return {
      day: DAY_LABELS[d.getDay()],
      date: dateStr,
      actual: log ? parseFloat(log.actualHours || 0) : 0,
      planned: log ? parseFloat(log.plannedHours || sleepGoal) : sleepGoal,
      quality: log?.quality,
      readiness: log ? calcReadiness(log) : null,
      hasData: !!log,
    };
  });

  const todayStr = format(selectedDate, "yyyy-MM-dd");
  const todayLog = allLogs?.find(l => l.date === todayStr);
  const todayReadiness = todayLog ? calcReadiness(todayLog) : null;

  const weekDebt = last7.reduce((acc, d) => {
    if (!d.hasData) return acc;
    const deficit = sleepGoal - d.actual;
    return acc + (deficit > 0 ? deficit : 0);
  }, 0);

  const avgActual = last7.filter(d => d.hasData).reduce((s, d) => s + d.actual, 0) /
    (last7.filter(d => d.hasData).length || 1);

  const getReadinessColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getBarColor = (entry: any) => {
    if (!entry.hasData) return "hsl(var(--muted))";
    if (entry.actual >= entry.planned) return "hsl(var(--primary))";
    return "hsl(var(--destructive) / 0.7)";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sleep & Rest</h2>
          <p className="text-sm text-muted-foreground">Track and analyse your sleep patterns</p>
        </div>
        <AddSleepLogDialog />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold font-mono ${getReadinessColor(todayReadiness)}`} data-testid="text-readiness-score">
              {todayReadiness !== null ? `${todayReadiness}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Readiness</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-mono" data-testid="text-avg-sleep">
              {avgActual.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">7-Day Avg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold font-mono ${weekDebt > 0 ? "text-destructive" : "text-green-500"}`} data-testid="text-sleep-debt">
              {weekDebt > 0 ? `-${weekDebt.toFixed(1)}h` : "0h"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sleep Debt</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold">Last 7 Days</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-primary" /> Actual
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-muted" /> Goal
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7} barGap={4}>
                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}h`} domain={[0, Math.max(sleepGoal + 2, 10)]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(val: any, name: string) => [`${parseFloat(val).toFixed(1)}h`, name]}
                    />
                    <ReferenceLine y={sleepGoal} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: `Goal ${sleepGoal}h`, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Bar dataKey="planned" name="Planned" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" radius={[3, 3, 0, 0]}>
                      {last7.map((entry, i) => (
                        <Cell key={i} fill={getBarColor(entry)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <TodaySessions module="body" itemId="body_sleep" />
        </div>
      </div>

      {/* Log entries */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : allLogs && allLogs.length > 0 ? (
        <div className="space-y-3">
          {allLogs.slice(0, 10).map(log => {
            const readiness = calcReadiness(log);
            const actual = parseFloat(log.actualHours || 0);
            const planned = parseFloat(log.plannedHours || sleepGoal);
            const deficit = planned - actual;
            return (
              <Card key={log.id} data-testid={`card-sleep-${log.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{format(parseISO(log.date), "EEEE, MMM d")}</p>
                      {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Planned</p>
                        <p className="font-mono font-semibold">{parseFloat(log.plannedHours || 0).toFixed(1)}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="font-mono font-semibold">{actual.toFixed(1)}h</p>
                      </div>
                      {log.quality && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Quality</p>
                          <p className="font-mono font-semibold">{log.quality}/5</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Readiness</p>
                        <p className={`font-mono font-semibold ${getReadinessColor(readiness)}`}>{readiness}</p>
                      </div>
                      {deficit > 0 && (
                        <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          -{deficit.toFixed(1)}h
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Moon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No sleep logs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start tracking your sleep patterns</p>
          <AddSleepLogDialog />
        </div>
      )}
    </div>
  );
}
