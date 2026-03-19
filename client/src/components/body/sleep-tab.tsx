import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, Zap, TrendingDown } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { AddSleepLogDialog } from "@/components/dialogs/add-sleep-log-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { TodaySessions } from "../today-sessions";
import { MetricRing } from "./metric-ring";

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

  const readinessColor = todayReadiness === null ? "#6b7280"
    : todayReadiness >= 70 ? "#22c55e" : todayReadiness >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Sleep</h2>
          <p className="text-xs text-muted-foreground">Rest & recovery tracking</p>
        </div>
        <AddSleepLogDialog />
      </div>

      {/* Ring metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center py-5">
          <MetricRing
            value={todayReadiness ?? 0}
            max={100}
            label="Readiness"
            unit="%"
            color={readinessColor}
            size="lg"
            sublabel="tonight"
            animate={false}
          />
          <span className="sr-only" data-testid="text-readiness-score">{todayReadiness ?? "—"}</span>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center py-5">
          <MetricRing
            value={parseFloat(avgActual.toFixed(1))}
            max={sleepGoal}
            label="7-Day Avg"
            unit="h"
            color="#6366f1"
            size="lg"
            sublabel={`/ ${sleepGoal}h goal`}
          />
          <span className="sr-only" data-testid="text-avg-sleep">{avgActual.toFixed(1)}</span>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center py-5">
          <MetricRing
            value={parseFloat(weekDebt.toFixed(1))}
            max={sleepGoal * 7}
            label="Sleep Debt"
            unit="h"
            color={weekDebt > 0 ? "#ef4444" : "#22c55e"}
            size="lg"
            sublabel="this week"
            animate={false}
          />
          <span className="sr-only" data-testid="text-sleep-debt">{weekDebt > 0 ? `-${weekDebt.toFixed(1)}h` : "0h"}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border/60 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Last 7 Days</p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" /> Actual</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted" /> Goal</span>
          </div>
        </div>
        <div className="h-[200px] w-full">
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
      </div>

      {/* Log entries */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sleep History</p>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />)}</div>
        ) : allLogs && allLogs.length > 0 ? (
          <div className="space-y-2">
            {allLogs.slice(0, 10).map(log => {
              const readiness = calcReadiness(log);
              const actual = parseFloat(log.actualHours || 0);
              const planned = parseFloat(log.plannedHours || sleepGoal);
              const deficit = planned - actual;
              const rColor = readiness >= 70 ? "text-green-500" : readiness >= 40 ? "text-yellow-500" : "text-red-500";
              return (
                <div key={log.id} data-testid={`card-sleep-${log.id}`}
                  className="bg-card border border-border/60 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{format(parseISO(log.date), "EEEE, MMM d")}</p>
                    {log.notes && <p className="text-[11px] text-muted-foreground">{log.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Actual</p>
                      <p className="font-mono font-bold text-sm">{actual.toFixed(1)}h</p>
                    </div>
                    {log.quality && (
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Quality</p>
                        <p className="font-mono font-bold text-sm">{log.quality}/5</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Score</p>
                      <p className={`font-mono font-bold text-sm ${rColor}`}>{readiness}</p>
                    </div>
                    {deficit > 0 && (
                      <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">
                        <TrendingDown className="w-3 h-3 mr-1" />-{deficit.toFixed(1)}h
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 border border-dashed border-border rounded-2xl">
            <Moon className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No sleep logs yet</p>
            <AddSleepLogDialog />
          </div>
        )}
      </div>

      <div className="h-2" />
    </div>
  );
}
