import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Play, Calendar as CalendarIcon, Users, FolderOpen, Activity, User, Dumbbell, History, TrendingUp, Info, Flame, Zap } from "lucide-react";
import { format, isToday, isSameDay, subDays, isAfter, startOfWeek } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AddWorkoutPresetDialog } from "@/components/dialogs/add-workout-preset-dialog";
import { WorkoutPreset, ExerciseLibraryItem, Workout } from "@shared/schema";
import { BodyMap } from "@/components/body/body-map";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ANTERIOR_MUSCLES, POSTERIOR_MUSCLES } from "./body-map-data";
import { TodaySessions } from "../today-sessions";
import { MetricRing } from "./metric-ring";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function WorkoutTab() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
  const { data: presets } = useQuery<WorkoutPreset[]>({ queryKey: ["/api/workout-presets"] });
  const { data: exercises } = useQuery<ExerciseLibraryItem[]>({ queryKey: ["/api/exercises"] });
  const { data: muscleStats } = useQuery<any[]>({ queryKey: ["/api/muscle-stats"] });
  const { data: exerciseProgress } = useQuery<{ date: string; maxWeight: number; totalVolume: number }[]>({
    queryKey: ["/api/exercises", selectedExerciseId, "progress"],
    enabled: !!selectedExerciseId,
  });

  const todaysWorkout = workouts?.find(w => w.date && isToday(new Date(w.date)) && !w.completed);

  const getMuscleName = (id: string | null) => {
    if (!id) return "";
    const muscle = ANTERIOR_MUSCLES.find(m => m.id === id) || POSTERIOR_MUSCLES.find(m => m.id === id);
    return muscle?.name || id;
  };

  // Metrics
  const sevenDaysAgo = subDays(new Date(), 7);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const recentWorkouts = workouts?.filter(w => w.date && isAfter(new Date(w.date), sevenDaysAgo) && w.completed) || [];
  const weekWorkouts = workouts?.filter(w => w.date && isAfter(new Date(w.date), weekStart) && w.completed) || [];

  // Streak
  const streak = (() => {
    if (!workouts?.length) return 0;
    const sorted = [...workouts].filter(w => w.completed && w.date)
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

  const startSessionMutation = useMutation({
    mutationFn: async (preset: WorkoutPreset) => {
      const res = await apiRequest("POST", "/api/workouts", {
        title: preset.name,
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        completed: false,
      });
      const workout = await res.json();
      const exs = Array.isArray(preset.exercises) ? preset.exercises : [];
      for (let i = 0; i < exs.length; i++) {
        const ex = exs[i];
        await apiRequest("POST", "/api/workout-exercises", {
          workoutId: workout.id, exerciseId: ex.exerciseId, order: i, notes: (ex as any).notes,
        });
      }
      return workout.id;
    },
    onSuccess: (workoutId) => {
      toast({ title: "Session started", description: "Good luck!" });
      setLocation(`/body/workout/active/${workoutId}`);
    },
  });

  // Calendar: days with workouts
  const workoutDays = new Set(
    workouts?.filter(w => w.completed && w.date)
      .map(w => format(new Date(w.date!), "yyyy-MM-dd")) || []
  );

  return (
    <div className="p-4 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Activity</h2>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <AddWorkoutPresetDialog />
      </div>

      {/* Top metric rings */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center py-4">
          <MetricRing value={weekWorkouts.length} max={5} label="Sessions" unit="/ wk" color="#ef4444" size="md" sublabel="this week" />
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center py-4">
          <MetricRing value={streak} max={30} label="Streak" unit="days" color="#f97316" size="md" sublabel="current" />
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center py-4">
          <MetricRing value={recentWorkouts.length} max={7} label="Last 7d" unit="done" color="#22c55e" size="md" sublabel="workouts" />
        </div>
      </div>

      {/* Today's session */}
      {todaysWorkout ? (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="mb-1.5 text-[10px] uppercase tracking-wider border-primary/30 text-primary">Planned Today</Badge>
              <h3 className="text-xl font-black tracking-tight">{todaysWorkout.title}</h3>
            </div>
            <button
              onClick={() => setLocation(`/body/workout/active/${todaysWorkout.id}`)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2.5 rounded-2xl transition-colors"
            >
              <Zap className="w-4 h-4" />
              Start
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-muted-foreground">No workout planned today</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Load a preset or rest up</p>
          </div>
          <button
            onClick={() => document.getElementById("presets-section")?.scrollIntoView({ behavior: "smooth" })}
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Presets
          </button>
        </div>
      )}

      {/* Main tabs */}
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="w-full h-auto p-1 bg-muted/60 rounded-2xl grid grid-cols-4">
          <TabsTrigger value="presets" className="rounded-xl py-2 text-xs font-semibold">Presets</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl py-2 text-xs font-semibold">
            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="exercises" className="rounded-xl py-2 text-xs font-semibold">
            <Dumbbell className="w-3.5 h-3.5 mr-1" />
            Exercises
          </TabsTrigger>
          <TabsTrigger value="muscles" className="rounded-xl py-2 text-xs font-semibold">
            <User className="w-3.5 h-3.5 mr-1" />
            Muscles
          </TabsTrigger>
        </TabsList>

        {/* Presets */}
        <TabsContent value="presets" className="mt-4 space-y-3" id="presets-section">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presets?.map(preset => (
              <PresetCard key={preset.id} preset={preset} onStart={() => startSessionMutation.mutate(preset)} />
            ))}
            {(!presets || presets.length === 0) && (
              <div className="col-span-2 flex flex-col items-center gap-2 py-10 border border-dashed border-border rounded-2xl text-center">
                <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No presets yet</p>
                <AddWorkoutPresetDialog />
              </div>
            )}
          </div>

          <div className="mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">From the Community</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SocialPresetCard user="David G." initials="DG" name="Arnold Split A"
                desc="Chest & Back focus, high volume." tags={["Hypertrophy", "90 min"]} />
              <SocialPresetCard user="Sarah Connor" initials="SC" name="Terminator Legs"
                desc="Quad focus, not for beginners." tags={["Strength", "60 min"]} />
            </div>
          </div>
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border/60 rounded-2xl p-4">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md w-full"
                modifiers={{ hasWorkout: (day) => workoutDays.has(format(day, "yyyy-MM-dd")) }}
                modifiersClassNames={{ hasWorkout: "font-bold text-red-500 underline decoration-red-500" }}
              />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </p>
              {workouts?.filter(w => selectedDate && w.date && isSameDay(new Date(w.date), selectedDate)).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 border border-dashed border-border rounded-2xl text-muted-foreground">
                  <History className="w-7 h-7 mb-2 opacity-40" />
                  <p className="text-sm">No workouts on this day</p>
                </div>
              ) : (
                workouts?.filter(w => selectedDate && w.date && isSameDay(new Date(w.date), selectedDate)).map(w => (
                  <div key={w.id} className="bg-card border border-border/60 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{w.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {w.completed ? "✓ Completed" : "In Progress"} · {format(new Date(w.startTime || w.date!), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Exercises */}
        <TabsContent value="exercises" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[400px]">
            <div className="md:col-span-2 bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Exercise Library</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {exercises?.map(ex => (
                  <button key={ex.id} onClick={() => setSelectedExerciseId(ex.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      selectedExerciseId === ex.id ? "bg-red-500 text-white" : "hover:bg-muted text-foreground"
                    )}>
                    {ex.name}
                  </button>
                ))}
                {!exercises?.length && (
                  <p className="text-xs text-muted-foreground p-4 text-center">No exercises in library</p>
                )}
              </div>
            </div>

            <div className="md:col-span-3 bg-card border border-border/60 rounded-2xl p-5">
              {selectedExerciseId ? (
                <div className="h-full flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-black">{exercises?.find(e => e.id === selectedExerciseId)?.name}</h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">Max weight over time · kg</p>
                  </div>
                  <div className="flex-1 min-h-[200px]">
                    {exerciseProgress && exerciseProgress.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={exerciseProgress.map(p => ({ date: p.date.slice(5), weight: p.maxWeight }))}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                          <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 5", "dataMax + 5"]} unit="kg" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                            formatter={(v: number) => [`${v} kg`, "Max Weight"]}
                          />
                          <Line type="monotone" dataKey="weight" stroke="#ef4444" strokeWidth={2.5}
                            dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <TrendingUp className="w-9 h-9 opacity-20" />
                        <p className="text-sm">No sessions logged yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[200px]">
                  <Dumbbell className="w-10 h-10 opacity-15 mb-3" />
                  <p className="text-sm">Select an exercise to view progress</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Muscles */}
        <TabsContent value="muscles" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[400px]">
            <div className="md:col-span-2 flex flex-col items-center pt-4">
              <div className="w-full max-w-[240px]">
                <BodyMap showControls={true} onMuscleSelect={setSelectedMuscleId} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center uppercase tracking-widest">Tap a muscle to view stats</p>
            </div>

            <div className="md:col-span-3 bg-card border border-border/60 rounded-2xl p-5">
              {selectedMuscleId ? (
                <MuscleDetail
                  muscleId={selectedMuscleId}
                  muscleName={getMuscleName(selectedMuscleId)}
                  muscleStats={muscleStats}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[200px]">
                  <User className="w-10 h-10 opacity-15 mb-3" />
                  <p className="text-sm">Select a muscle group</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="h-2" />
    </div>
  );
}

function MuscleDetail({ muscleId, muscleName, muscleStats }: { muscleId: string; muscleName: string; muscleStats: any[] | undefined }) {
  const stat = muscleStats?.find(s => s.muscleId === muscleId);
  const recovery = stat ? Math.round(Number(stat.recoveryScore)) : null;
  const volume = stat?.volumeAccumulated ? parseFloat(stat.volumeAccumulated).toFixed(0) : null;
  const recoveryColor = recovery === null ? "#6b7280" : recovery >= 80 ? "#22c55e" : recovery >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-2xl font-black tracking-tight">{muscleName}</h3>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Muscle Group</p>
      </div>

      <div className="flex gap-4">
        <MetricRing
          value={recovery ?? 0}
          max={100}
          label="Recovery"
          unit="%"
          color={recoveryColor}
          size="md"
          animate={false}
        />
        <div className="flex-1 space-y-3">
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Volume Accumulated</p>
            <p className="font-mono font-bold text-lg mt-0.5">
              {volume ? `${volume} kg` : <span className="text-muted-foreground text-sm">—</span>}
            </p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Last Trained</p>
            <p className="font-bold text-lg mt-0.5">
              {stat?.lastTrained ? format(new Date(stat.lastTrained), "MMM d") : <span className="text-muted-foreground text-sm">—</span>}
            </p>
          </div>
        </div>
      </div>

      {!stat && (
        <div className="flex flex-col items-center gap-2 py-6 border border-dashed border-border rounded-2xl text-center">
          <Activity className="w-7 h-7 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No data for {muscleName} yet</p>
        </div>
      )}
    </div>
  );
}

function PresetCard({ preset, onStart }: any) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onStart}
      className="bg-card border border-border/60 rounded-2xl p-4 cursor-pointer hover:border-red-500/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm truncate">{preset.name}</h3>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">{preset.exercises.length}x</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {preset.exercises.map((e: any) => e.name).join(" · ")}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
          <Play className="w-4 h-4 text-red-500 group-hover:text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function SocialPresetCard({ user, initials, name, desc, tags }: any) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 hover:border-border transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{name}</p>
          <p className="text-[11px] text-muted-foreground">by {user}</p>
        </div>
        <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Import</Badge>
      </div>
      <div className="flex gap-1 mt-2">
        {tags.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1.5">{t}</Badge>)}
      </div>
    </div>
  );
}
