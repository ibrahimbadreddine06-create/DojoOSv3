import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronRight, Plus, Search } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import type { ExerciseLibraryItem, MuscleStat } from "@shared/schema";

const MUSCLE_GROUPS = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "shoulders", name: "Shoulders" },
  { id: "arms", name: "Arms" },
  { id: "legs", name: "Legs" },
  { id: "core", name: "Core" },
];

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

const CHART_MODES = ["Strength", "Recovery", "Volume"] as const;

function getRecoveryColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function getRecoveryDot(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function ExercisesMusclesSection(rootProps: React.HTMLAttributes<HTMLDivElement>) {
  const [view, setView] = useState<"muscles" | "exercises">("muscles");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<typeof CHART_MODES[number]>("Strength");
  const [timeRange, setTimeRange] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: exercises } = useQuery<ExerciseLibraryItem[]>({ queryKey: ["/api/exercises"] });
  const { data: muscleStats } = useQuery<MuscleStat[]>({ queryKey: ["/api/muscle-stats"] });
  const { data: exerciseProgress } = useQuery<any[]>({
    queryKey: [`/api/exercises/${selectedItem}/progress`],
    enabled: view === "exercises" && !!selectedItem,
  });

  const muscleStatsMap = useMemo(() => {
    const map = new Map<string, MuscleStat>();
    muscleStats?.forEach((s) => map.set(s.muscleId, s));
    return map;
  }, [muscleStats]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    if (!searchQuery) return exercises;
    const q = searchQuery.toLowerCase();
    return exercises.filter((e) =>
      e.name.toLowerCase().includes(q) || e.targetMuscleGroup?.toLowerCase().includes(q)
    );
  }, [exercises, searchQuery]);

  const selectedMuscle = view === "muscles" ? MUSCLE_GROUPS.find((m) => m.id === selectedItem) : null;
  const selectedExercise = view === "exercises" ? exercises?.find((e) => e.id === selectedItem) : null;

  const chartData = useMemo(() => {
    if (view === "exercises" && exerciseProgress && exerciseProgress.length > 0) {
      return exerciseProgress.map((p: any) => ({
        date: p.date,
        value: chartMode === "Strength" ? p.maxWeight : p.totalVolume,
      }));
    }
    return [];
  }, [view, selectedItem, chartMode, exerciseProgress]);

  const chartConfig = {
    value: { label: chartMode, color: "hsl(0 84.2% 60.2%)" },
  };

  return (
      <Card
        {...rootProps}
        className={`h-full w-full overflow-hidden border-border/60 shadow-sm ${rootProps.className ?? ""}`}
      >
        {rootProps.children}
        <CardContent className="flex h-full flex-col p-0">
          <div className="border-b border-border p-3">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => { if (v) { setView(v as any); setSelectedItem(null); } }}
              className="justify-start"
            >
              <ToggleGroupItem value="muscles" className="h-7 px-3 text-xs">Muscles</ToggleGroupItem>
              <ToggleGroupItem value="exercises" className="h-7 px-3 text-xs">Exercises</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
            {/* Left: List */}
            <div className="min-h-0 overflow-y-auto p-4">
              {view === "exercises" && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              )}

              <div className="space-y-0.5">
                {view === "muscles" ? (
                  <>
                    {MUSCLE_GROUPS.map((muscle) => {
                      const stat = muscleStatsMap.get(muscle.id);
                      const recovery = stat?.recoveryScore ?? 100;
                      return (
                        <button
                          key={muscle.id}
                          onClick={() => setSelectedItem(muscle.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors
                            ${selectedItem === muscle.id ? "bg-muted" : "hover:bg-muted/50"}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getRecoveryDot(recovery)}`} />
                            <span className="font-medium">{muscle.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${getRecoveryColor(recovery)}`}>{recovery}%</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </button>
                      );
                    })}
                    <button className="w-full flex items-center gap-2 p-2.5 text-xs text-muted-foreground hover:bg-muted/50 rounded-lg">
                      <Plus className="w-3.5 h-3.5" /> Add custom
                    </button>
                  </>
                ) : (
                  <>
                    {filteredExercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => setSelectedItem(ex.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors
                          ${selectedItem === ex.id ? "bg-muted" : "hover:bg-muted/50"}`}
                      >
                        <span className="font-medium truncate">{ex.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {ex.targetMuscleGroup && (
                            <Badge variant="outline" className="text-[9px] h-4">{ex.targetMuscleGroup}</Badge>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                    <button className="w-full flex items-center gap-2 p-2.5 text-xs text-muted-foreground hover:bg-muted/50 rounded-lg">
                      <Plus className="w-3.5 h-3.5" /> Add custom exercise
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right: Detail */}
            <div className="min-h-0 overflow-y-auto p-4">
              {!selectedItem ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-12">
                  Select a {view === "muscles" ? "muscle group" : "exercise"} to see details
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-base font-semibold">
                    {selectedMuscle?.name || selectedExercise?.name}
                  </h4>

                  {/* Stat tiles */}
                  <div className="grid grid-cols-2 gap-2">
                    {view === "muscles" ? (
                      <>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="text-xs text-muted-foreground">Recovery</div>
                          <div className="text-lg font-bold mt-0.5">
                            {muscleStatsMap.get(selectedItem)?.recoveryScore ?? "–"}%
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="text-xs text-muted-foreground">Volume this week</div>
                          <div className="text-lg font-bold mt-0.5">
                            {muscleStatsMap.get(selectedItem)?.volumeAccumulated ?? 0}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="text-xs text-muted-foreground">Best set</div>
                          <div className="text-lg font-bold mt-0.5">
                            {exerciseProgress?.[0]?.maxWeight ? `${exerciseProgress[0].maxWeight}kg` : "–"}
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="text-xs text-muted-foreground">Times performed</div>
                          <div className="text-lg font-bold mt-0.5">
                            {exerciseProgress?.length ?? 0}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chart switcher */}
                  <div className="flex gap-1">
                    {CHART_MODES.map((mode) => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={chartMode === mode ? "default" : "outline"}
                        className="text-[10px] h-6 px-2.5"
                        onClick={() => setChartMode(mode)}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="h-48">
                    {chartData.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-full w-full">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => {
                              const d = new Date(v);
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                          />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(0 84.2% 60.2%)"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        No data yet — log an activity to see progress
                      </div>
                    )}
                  </div>

                  {/* Time range */}
                  <div className="flex gap-1">
                    {TIME_RANGES.map((tr) => (
                      <Button
                        key={tr.label}
                        size="sm"
                        variant={timeRange === tr.days ? "default" : "ghost"}
                        className="text-[10px] h-5 px-2"
                        onClick={() => setTimeRange(tr.days)}
                      >
                        {tr.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
