import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { AddExerciseDrawer } from "@/components/dialogs/add-exercise-drawer";
import { ArrowLeft, Check, Plus, SkipForward, Coffee, ExternalLink, Dumbbell, Zap, X, Timer as TimerIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { ExerciseLibraryItem, Workout, WorkoutExercise, WorkoutSet } from "@shared/schema";
import { format, differenceInSeconds } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MetricRing } from "./metric-ring";

type EnhancedWorkout = Workout & {
    exercises: (WorkoutExercise & {
        exercise: ExerciseLibraryItem;
        sets: WorkoutSet[];
    })[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Rest overlay ─────────────────────────────────────────────────────────────

function RestOverlay({ onDismiss }: { onDismiss: () => void }) {
    const [seconds, setSeconds] = useState(90);
    const [running, setRunning] = useState(true);
    const initialRef = React.useRef(90);

    useEffect(() => {
        if (!running || seconds <= 0) return;
        const id = setInterval(() => setSeconds(s => {
            if (s <= 1) { setRunning(false); return 0; }
            return s - 1;
        }), 1000);
        return () => clearInterval(id);
    }, [running, seconds]);

    const progress = Math.max(0, seconds / initialRef.current) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center gap-6"
        >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rest Period</p>

            <MetricRing
                value={seconds}
                max={initialRef.current}
                label="Remaining"
                unit="sec"
                color="#6366f1"
                size="lg"
                animate={false}
            />

            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-mono font-bold"
                    onClick={() => setSeconds(s => Math.max(0, s - 30))}
                >
                    −30s
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-mono font-bold"
                    onClick={() => {
                        initialRef.current += 30;
                        setSeconds(s => s + 30);
                    }}
                >
                    +30s
                </Button>
            </div>

            <Button
                onClick={onDismiss}
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-2xl text-sm"
            >
                <Zap className="w-4 h-4 mr-2" />
                Start Next Set
            </Button>
        </motion.div>
    );
}

// ─── Finish Screen ────────────────────────────────────────────────────────────

function FinishScreen({
    workout,
    totalSeconds,
    onClose,
}: {
    workout: EnhancedWorkout;
    totalSeconds: number;
    onClose: () => void;
}) {
    const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.filter(s => s.completed).length, 0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6 p-8 text-center"
        >
            <div className="text-6xl">🏆</div>
            <div>
                <h2 className="text-3xl font-black tracking-tight">Workout Complete!</h2>
                <p className="text-muted-foreground mt-1 text-sm">{workout.title}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                <StatPill label="Time" value={fmtTime(totalSeconds)} />
                <StatPill label="Exercises" value={String(workout.exercises.length)} />
                <StatPill label="Sets Done" value={String(totalSets)} />
            </div>

            <Button
                onClick={onClose}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-10 py-3 rounded-2xl mt-2"
            >
                Back to Body
            </Button>
        </motion.div>
    );
}

function StatPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
            <span className="font-mono font-black text-xl tabular-nums">{value}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
    );
}

// ─── Exercise image / placeholder ─────────────────────────────────────────────

function ExerciseMedia({ exercise }: { exercise: ExerciseLibraryItem }) {
    const [imgError, setImgError] = useState(false);

    if (exercise.imageUrl && !imgError) {
        return (
            <div className="relative w-full aspect-video max-h-48 rounded-2xl overflow-hidden bg-muted">
                <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
                {exercise.videoUrl && (
                    <a
                        href={exercise.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm border border-border rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold hover:bg-background transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Tutorial
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className="w-full aspect-video max-h-44 rounded-2xl bg-muted/60 border border-border/50 flex flex-col items-center justify-center gap-2">
            <Dumbbell className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground capitalize">{exercise.targetMuscleGroup}</p>
            {exercise.videoUrl && (
                <a
                    href={exercise.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                    <ExternalLink className="w-3 h-3" />
                    Watch Tutorial
                </a>
            )}
        </div>
    );
}

// ─── Compact set row ──────────────────────────────────────────────────────────

function SetRow({
    set,
    index,
    onUpdate,
    onComplete,
}: {
    set: WorkoutSet;
    index: number;
    onUpdate: (field: keyof WorkoutSet, value: any) => void;
    onComplete: (completed: boolean) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "grid grid-cols-[28px_1fr_1fr_1fr_36px] gap-2 items-center p-2 rounded-xl transition-colors",
                set.completed ? "bg-green-500/10 border border-green-500/20" : "bg-muted/30"
            )}
        >
            {/* Set number */}
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-muted font-mono text-xs font-bold text-muted-foreground">
                {index + 1}
            </div>

            {/* Weight */}
            <Input
                type="number"
                inputMode="decimal"
                placeholder="kg"
                value={set.weight || ""}
                onChange={e => onUpdate("weight", e.target.value)}
                className={cn(
                    "h-8 text-center font-mono text-sm border-0 bg-background/60 rounded-lg",
                    set.completed && "text-green-600 font-bold"
                )}
            />

            {/* Reps */}
            <Input
                type="number"
                inputMode="numeric"
                placeholder="reps"
                value={set.reps || ""}
                onChange={e => onUpdate("reps", e.target.value)}
                className={cn(
                    "h-8 text-center font-mono text-sm border-0 bg-background/60 rounded-lg",
                    set.completed && "text-green-600 font-bold"
                )}
            />

            {/* RPE */}
            <Input
                type="number"
                inputMode="decimal"
                placeholder="RPE"
                max={10}
                value={set.rpe || ""}
                onChange={e => onUpdate("rpe", e.target.value)}
                className={cn(
                    "h-8 text-center font-mono text-sm border-0 bg-background/60 rounded-lg",
                    set.completed && "text-green-600 font-bold"
                )}
            />

            {/* Complete toggle */}
            <button
                onClick={() => onComplete(!set.completed)}
                className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                    set.completed
                        ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                        : "bg-muted text-muted-foreground hover:bg-green-500/20 hover:text-green-600"
                )}
            >
                <Check className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActiveWorkoutSession() {
    const [match, params] = useRoute("/body/workout/active/:id");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [totalSeconds, setTotalSeconds] = useState(0);
    const [showRest, setShowRest] = useState(false);
    const [showFinish, setShowFinish] = useState(false);
    const [activeExIdx, setActiveExIdx] = useState(0);

    // Session stopwatch
    useEffect(() => {
        const id = setInterval(() => setTotalSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, []);

    if (!match || !params?.id) return <div>Invalid Workout ID</div>;

    const workoutId = params.id;

    const { data: workout, isLoading } = useQuery<EnhancedWorkout>({
        queryKey: [`/api/workouts/detail/${workoutId}`],
    });

    const addExerciseMutation = useMutation({
        mutationFn: async (exerciseId: string) => {
            const nextOrder = workout?.exercises.length || 0;
            await apiRequest("POST", "/api/workout-exercises", { workoutId, exerciseId, order: nextOrder });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] }),
    });

    const addSetMutation = useMutation({
        mutationFn: async (workoutExerciseId: string) => {
            const ex = workout?.exercises.find(e => e.id === workoutExerciseId);
            const nextSetNum = (ex?.sets.length || 0) + 1;
            await apiRequest("POST", "/api/workout-sets", {
                workoutExerciseId,
                setNumber: nextSetNum,
                reps: 0,
                weight: 0,
                completed: false,
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] }),
    });

    const updateSetMutation = useMutation({
        mutationFn: async ({ id, field, value }: { id: string; field: keyof WorkoutSet; value: any }) => {
            await apiRequest("PATCH", `/api/workout-sets/${id}`, { [field]: value });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] }),
    });

    const completeSetMutation = useMutation({
        mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
            await apiRequest("PATCH", `/api/workout-sets/${id}`, { completed });
        },
        onSuccess: (_, { completed }) => {
            queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] });
            if (completed) setShowRest(true);
        },
    });

    const finishWorkoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("PATCH", `/api/workouts/${workoutId}`, {
                completed: true,
                endTime: new Date().toISOString(),
            });
        },
        onSuccess: () => setShowFinish(true),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-muted-foreground text-sm animate-pulse">Loading session…</div>
            </div>
        );
    }
    if (!workout) return <div>Workout not found</div>;

    const exercises = workout.exercises;
    const currentExercise = exercises[activeExIdx];
    const completedSets = exercises.reduce((acc, e) => acc + e.sets.filter(s => s.completed).length, 0);

    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* ── Status bar ─────────────────────────────────────────────── */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setLocation("/body")}
                            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">Active Session</p>
                            <p className="font-bold text-sm leading-tight truncate max-w-32">{workout.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1">
                        <TimerIcon className="w-3 h-3 text-primary" />
                        <span className="font-mono font-bold text-sm tabular-nums">{fmtTime(totalSeconds)}</span>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => finishWorkoutMutation.mutate()}
                        disabled={finishWorkoutMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl px-3"
                    >
                        Finish
                    </Button>
                </div>

                {/* Stats strip */}
                <div className="flex items-center justify-around px-4 pb-2 gap-4 border-t border-border/40">
                    <div className="text-center">
                        <p className="font-mono font-bold text-sm">{exercises.length}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Exercises</p>
                    </div>
                    <div className="text-center">
                        <p className="font-mono font-bold text-sm">{completedSets}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Sets Done</p>
                    </div>
                    <div className="text-center">
                        <p className="font-mono font-bold text-sm">{activeExIdx + 1}/{exercises.length}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Current</p>
                    </div>
                </div>
            </div>

            {/* ── Exercise navigator tabs ────────────────────────────────── */}
            {exercises.length > 1 && (
                <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-none">
                    {exercises.map((e, i) => {
                        const allDone = e.sets.length > 0 && e.sets.every(s => s.completed);
                        return (
                            <button
                                key={e.id}
                                onClick={() => setActiveExIdx(i)}
                                className={cn(
                                    "shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                                    i === activeExIdx
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : allDone
                                            ? "bg-green-500/10 text-green-600 border-green-500/30"
                                            : "bg-muted text-muted-foreground border-transparent"
                                )}
                            >
                                {allDone ? "✓ " : ""}{e.exercise.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Main exercise area ─────────────────────────────────────── */}
            <div className="flex-1 px-4 pt-4 pb-6 space-y-4 max-w-2xl mx-auto w-full">
                {currentExercise ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentExercise.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Exercise name + muscles */}
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">{currentExercise.exercise.name}</h2>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {currentExercise.exercise.targetMuscleGroup && (
                                        <Badge variant="secondary" className="capitalize text-xs">
                                            {currentExercise.exercise.targetMuscleGroup}
                                        </Badge>
                                    )}
                                    {currentExercise.exercise.category && (
                                        <Badge variant="outline" className="capitalize text-xs">
                                            {currentExercise.exercise.category}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Exercise media */}
                            <ExerciseMedia exercise={currentExercise.exercise} />

                            {/* Sets */}
                            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                                {/* Column headers */}
                                <div className="grid grid-cols-[28px_1fr_1fr_1fr_36px] gap-2 px-3 py-2 border-b border-border/40">
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">#</div>
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">kg</div>
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">Reps</div>
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">RPE</div>
                                    <div />
                                </div>

                                <div className="p-2 space-y-1.5">
                                    <AnimatePresence>
                                        {currentExercise.sets.map((set, i) => (
                                            <SetRow
                                                key={set.id}
                                                set={set}
                                                index={i}
                                                onUpdate={(field, value) =>
                                                    updateSetMutation.mutate({ id: set.id, field, value })
                                                }
                                                onComplete={(completed) =>
                                                    completeSetMutation.mutate({ id: set.id, completed })
                                                }
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div className="px-3 pb-3">
                                    <button
                                        onClick={() => addSetMutation.mutate(currentExercise.id)}
                                        className="w-full h-9 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Set
                                    </button>
                                </div>
                            </div>

                            {/* Instructions (if any) */}
                            {currentExercise.exercise.instructions && (
                                <p className="text-xs text-muted-foreground leading-relaxed px-1">
                                    {currentExercise.exercise.instructions}
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                ) : null}

                {/* Add Exercise */}
                <AddExerciseDrawer
                    onSelect={(id) => addExerciseMutation.mutate(id)}
                    trigger={
                        <button className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/50 text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                            <Plus className="w-4 h-4" />
                            Add Exercise
                        </button>
                    }
                />
            </div>

            {/* ── Bottom action bar ─────────────────────────────────────── */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3">
                <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
                    {/* Break button */}
                    <button
                        onClick={() => setShowRest(true)}
                        className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl border border-border/60 hover:bg-accent transition-colors"
                    >
                        <Coffee className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Break</span>
                    </button>

                    {/* Complete set (center) */}
                    <button
                        onClick={() => {
                            if (!currentExercise) return;
                            const incompleteSets = currentExercise.sets.filter(s => !s.completed);
                            if (incompleteSets.length > 0) {
                                completeSetMutation.mutate({ id: incompleteSets[0].id, completed: true });
                            }
                        }}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check className="w-5 h-5" />
                        Complete Set
                    </button>

                    {/* Next exercise button */}
                    <button
                        onClick={() => setActiveExIdx(i => Math.min(i + 1, exercises.length - 1))}
                        disabled={activeExIdx >= exercises.length - 1}
                        className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl border border-border/60 hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <SkipForward className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Skip</span>
                    </button>
                </div>
            </div>

            {/* ── Overlays ──────────────────────────────────────────────── */}
            <AnimatePresence>
                {showRest && <RestOverlay onDismiss={() => setShowRest(false)} />}
            </AnimatePresence>

            <AnimatePresence>
                {showFinish && (
                    <FinishScreen
                        workout={workout}
                        totalSeconds={totalSeconds}
                        onClose={() => setLocation("/body")}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
