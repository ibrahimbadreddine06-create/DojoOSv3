import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Play, Calendar, Users, FolderOpen, Activity, User, Dumbbell, History, TrendingUp, Info } from "lucide-react";
import { format, isToday, isSameDay } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AddWorkoutPresetDialog } from "@/components/dialogs/add-workout-preset-dialog";
import { WorkoutPreset, ExerciseLibraryItem, Workout } from "@shared/schema";
import { BodyMap } from "@/components/body/body-map";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { ANTERIOR_MUSCLES, POSTERIOR_MUSCLES } from "./body-map-data";
import { TodaySessions } from "../today-sessions";

export function WorkoutTab() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch Workouts
  const { data: workouts } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  // Fetch Presets
  const { data: presets } = useQuery<WorkoutPreset[]>({
    queryKey: ["/api/workout-presets"],
  });

  // Fetch Exercises for "By Exercise" view
  const { data: exercises } = useQuery<ExerciseLibraryItem[]>({
    queryKey: ["/api/exercises"],
  });

  const todaysWorkout = workouts?.find(w => w.date && isToday(new Date(w.date)) && !w.completed);

  // --- Helpers for Views ---

  const getMuscleName = (id: string | null) => {
    if (!id) return "";
    const muscle = ANTERIOR_MUSCLES.find(m => m.id === id) || POSTERIOR_MUSCLES.find(m => m.id === id);
    return muscle?.name || id;
  };

  const { data: muscleStats } = useQuery<any[]>({
    queryKey: ["/api/muscle-stats"],
  });

  const { data: exerciseProgress } = useQuery<{ date: string; maxWeight: number; totalVolume: number }[]>({
    queryKey: ["/api/exercises", selectedExerciseId, "progress"],
    enabled: !!selectedExerciseId,
  });

  // --- Mutations ---

  const startSessionMutation = useMutation({
    mutationFn: async (preset: WorkoutPreset) => {
      const res = await apiRequest("POST", "/api/workouts", {
        title: preset.name,
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        completed: false
      });
      const workout = await res.json();

      const exercises = Array.isArray(preset.exercises) ? preset.exercises : [];
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await apiRequest("POST", "/api/workout-exercises", {
          workoutId: workout.id,
          exerciseId: ex.exerciseId,
          order: i,
          notes: (ex as any).notes
        });
      }
      return workout.id;
    },
    onSuccess: (workoutId) => {
      toast({ title: "Session Started", description: "Good luck!" });
      setLocation(`/body/workout/active/${workoutId}`);
    }
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">

      {/* 🔹 SECTION 1: TODAY'S PLAN */}
      <section>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Today's Session</h2>
            {todaysWorkout ? (
              <Card className="border-primary/50 bg-primary/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity className="w-32 h-32" />
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <Badge variant="outline" className="mb-2 bg-background border-primary text-primary font-mono text-[10px] uppercase">Planned</Badge>
                      <CardTitle className="text-3xl font-black italic uppercase italic tracking-tighter">{todaysWorkout.title}</CardTitle>
                      <CardDescription className="font-mono text-xs opacity-70">TARGET: FULL BODY • EST. 60 MIN</CardDescription>
                    </div>
                    <Button
                      size="lg"
                      className="rounded-full h-16 w-16 p-0 shadow-xl shadow-primary/20 hover:scale-105 transition-all hover:bg-primary active:scale-95 group"
                      onClick={() => setLocation(`/body/workout/active/${todaysWorkout.id}`)}
                    >
                      <Play className="w-8 h-8 ml-1 group-hover:fill-current transition-all" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <div className="flex gap-4">
                    <Button variant="default" className="flex-1 font-bold h-11" onClick={() => setLocation(`/body/workout/active/${todaysWorkout.id}`)}>
                      START INTENSIVE SESSION
                    </Button>
                    <Button variant="outline" className="h-11">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed bg-muted/20 hover:bg-muted/30 transition-colors h-full flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/50 mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl uppercase tracking-tight">No session planned today</h3>
                  <p className="text-sm text-muted-foreground">Rest is part of the growth process. Recuperate well.</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-wider" onClick={() => document.getElementById('presets-trigger')?.scrollIntoView({ behavior: 'smooth' })}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Load Preset
                  </Button>
                </div>
              </Card>
            )}
          </div>
          <div className="w-full lg:w-[320px] shrink-0">
            <TodaySessions module="body" itemId="body_workouts" />
          </div>
        </div>
      </section>

      {/* 🔹 SECTION 2: PRESETS */}
      <section id="presets-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest" id="presets-trigger">Presets Library</h2>
          <AddWorkoutPresetDialog />
        </div>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="mb-6 w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="mine" className="rounded-lg py-2 px-6">My Presets</TabsTrigger>
            <TabsTrigger value="following" className="rounded-lg py-2 px-6">
              <Users className="w-4 h-4 mr-2" />
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets?.map(preset => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onStart={() => startSessionMutation.mutate(preset)}
                />
              ))}
              {(!presets || presets.length === 0) && (
                <div className="col-span-full text-center py-12 border rounded-xl border-dashed">
                  <p className="text-muted-foreground">No presets yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="following">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SocialPresetCard
                user="David G."
                initials="DG"
                name="Arnold Split A"
                desc="Chest & Back focus, high volume."
                tags={["Hypertrophy", "90 min"]}
              />
              <SocialPresetCard
                user="Sarah Connor"
                initials="SC"
                name="Terminator Legs"
                desc="Quad focus, not for beginners."
                tags={["Strength", "60 min"]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </section>


      {/* 🔹 SECTION 3: HISTORY & ANALYTICS */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Analysis & History</h2>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="mb-6 w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="calendar" className="rounded-lg py-2 px-4">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="exercises" className="rounded-lg py-2 px-4">
              <Dumbbell className="w-4 h-4 mr-2" />
              Exercises
            </TabsTrigger>
            <TabsTrigger value="muscles" className="rounded-lg py-2 px-4">
              <User className="w-4 h-4 mr-2" />
              Muscles
            </TabsTrigger>
          </TabsList>

          {/* VIEW 1: CALENDAR */}
          <TabsContent value="calendar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5">
                <div className="p-4 border rounded-2xl bg-card h-full">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md flex justify-center w-full"
                  />
                </div>
              </div>
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </h3>
                  <Badge variant="outline">{workouts?.filter(w => selectedDate && w.date && isSameDay(new Date(w.date), selectedDate)).length} Workouts</Badge>
                </div>

                <div className="space-y-3">
                  {workouts?.filter(w => selectedDate && w.date && isSameDay(new Date(w.date), selectedDate)).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] border border-dashed rounded-xl text-muted-foreground">
                      <History className="w-8 h-8 mb-2 opacity-50" />
                      <p>No history found for this date.</p>
                    </div>
                  ) : (
                    workouts?.filter(w => selectedDate && w.date && isSameDay(new Date(w.date), selectedDate)).map(w => (
                      <Card key={w.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{w.title}</CardTitle>
                              <CardDescription className="text-xs">{w.completed ? "Completed" : "In Progress"} • {format(new Date(w.startTime || w.date), "HH:mm")}</CardDescription>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Info className="w-4 h-4" />
                          </Button>
                        </CardHeader>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* VIEW 2: BY EXERCISE */}
          <TabsContent value="exercises">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
              {/* Left List */}
              <div className="md:col-span-4 border rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 bg-muted/30 border-b">
                  <h3 className="font-bold text-sm uppercase tracking-wide">Exercise Library</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                  {exercises && exercises.length > 0 ? exercises.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExerciseId(ex.id)}
                      className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${selectedExerciseId === ex.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      {ex.name}
                    </button>
                  )) : (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                      No exercises found.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Detail */}
              <div className="md:col-span-8 border rounded-xl p-6 relative">
                {selectedExerciseId ? (
                  <div className="h-full flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold">{exercises?.find(e => e.id === selectedExerciseId)?.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Max weight over time (kg)</p>
                    </div>

                    <div className="flex-1 min-h-0">
                      {exerciseProgress && exerciseProgress.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={exerciseProgress.map(p => ({
                            date: p.date.slice(5),
                            weight: p.maxWeight,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} unit="kg" />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                              formatter={(v: number) => [`${v} kg`, "Max Weight"]}
                            />
                            <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                          <TrendingUp className="w-10 h-10 opacity-20" />
                          <p className="text-sm font-medium">No sessions logged yet</p>
                          <p className="text-xs opacity-70">Complete a workout with this exercise to track progress</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select an exercise to view history</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* VIEW 3: BY MUSCLE */}
          <TabsContent value="muscles">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 min-h-[500px]">
              {/* Left: Interactive Body Map (Smaller) */}
              <div className="md:col-span-4 flex flex-col items-center justify-start pt-8">
                <div className="w-full max-w-[280px]">
                  <BodyMap showControls={true} onMuscleSelect={setSelectedMuscleId} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 text-center">
                  TAP A MUSCLE TO VIEW DETAILS
                </p>
              </div>

              {/* Right: Data & History */}
              <div className="md:col-span-8 border rounded-2xl p-6 bg-card/50 backdrop-blur-sm">
                {selectedMuscleId ? (
                  <MuscleDetail
                    muscleId={selectedMuscleId}
                    muscleName={getMuscleName(selectedMuscleId)}
                    muscleStats={muscleStats}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 min-h-[300px]">
                    <User className="w-16 h-16 opacity-10" />
                    <div className="text-center">
                      <h3 className="font-medium text-lg text-foreground">No Muscle Selected</h3>
                      <p className="text-sm">Select a muscle group on the map to view detailed analytics</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

    </div>
  );
}

function MuscleDetail({ muscleId, muscleName, muscleStats }: { muscleId: string; muscleName: string; muscleStats: any[] | undefined }) {
  const stat = muscleStats?.find(s => s.muscleId === muscleId);
  const recovery = stat ? Math.round(Number(stat.recoveryScore)) : null;
  const volume = stat?.volumeAccumulated ? parseFloat(stat.volumeAccumulated).toFixed(0) : null;
  const recoveryColor = recovery === null ? "text-muted-foreground"
    : recovery >= 80 ? "text-green-500" : recovery >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">{muscleName}</h3>
          <p className="text-muted-foreground text-sm font-mono">MUSCLE GROUP</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${recoveryColor}`} data-testid="text-muscle-recovery">
            {recovery !== null ? `${recovery}%` : "—"}
          </p>
          <p className="text-[10px] uppercase text-muted-foreground">Recovery Score</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase mb-1">Volume Accumulated</div>
            <div className="text-2xl font-bold">
              {volume
                ? <>{volume} <span className="text-sm font-normal text-muted-foreground">kg</span></>
                : <span className="text-muted-foreground text-lg">—</span>
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase mb-1">Last Trained</div>
            <div className="text-lg font-bold">
              {stat?.lastTrained
                ? format(new Date(stat.lastTrained), "MMM d")
                : <span className="text-muted-foreground">—</span>
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {!stat && (
        <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No data yet for {muscleName}</p>
          <p className="text-xs mt-1">Complete workouts targeting this muscle to see stats</p>
        </div>
      )}
    </div>
  );
}

function PresetCard({ preset, onStart }: any) {
  return (
    <Card className="group hover:border-primary/50 transition-all cursor-pointer" onClick={onStart}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base">{preset.name}</h3>
            <Badge variant="secondary" className="text-[10px] h-5">{preset.exercises.length} Exercises</Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {preset.exercises.map((e: any) => e.name).join(", ")}
          </p>
        </div>
        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-4 h-4 text-primary" />
        </Button>
      </CardContent>
    </Card>
  )
}

function SocialPresetCard({ user, initials, name, desc, tags }: any) {
  return (
    <Card className="group hover:border-primary/50 transition-all cursor-pointer">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-base">{name}</h3>
            <p className="text-xs text-muted-foreground">by {user} • {desc}</p>
            <div className="flex gap-1 mt-1">
              {tags.map((t: string) => <Badge key={t} variant="outline" className="text-[10px] h-4 px-1">{t}</Badge>)}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          Import
        </Button>
      </CardContent>
    </Card>
  )
}

