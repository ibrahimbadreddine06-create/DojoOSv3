import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { AddExerciseDrawer } from "@/components/dialogs/add-exercise-drawer";
import {
    ArrowLeft, Play, Square, SkipForward, Coffee,
    Dumbbell, Plus, Timer as TimerIcon, Check, X, BookOpen, Trophy
} from "lucide-react";
import { ExerciseLibraryItem, Workout, WorkoutExercise, WorkoutSet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type EnhancedWorkout = Workout & {
    exercises: (WorkoutExercise & {
        exercise: ExerciseLibraryItem;
        sets: WorkoutSet[];
    })[];
};

function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// ─── Rest overlay ──────────────────────────────────────────────────────────────

function RestOverlay({ onDismiss }: { onDismiss: () => void }) {
    const [seconds, setSeconds] = useState(90);
    const [running, setRunning] = useState(true);
    const initRef = React.useRef(90);

    useEffect(() => {
        if (!running || seconds <= 0) return;
        const id = setInterval(() => setSeconds(s => {
            if (s <= 1) { setRunning(false); return 0; }
            return s - 1;
        }), 1000);
        return () => clearInterval(id);
    }, [running, seconds]);

    const pct = (seconds / initRef.current) * 100;
    const r = 68;
    const circ = 2 * Math.PI * r;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
        >
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30">Rest</p>

            <div className="relative" style={{ width: 180, height: 180 }}>
                <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={90} cy={90} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                    <circle cx={90} cy={90} r={r} fill="none"
                        stroke={seconds <= 10 ? "#ef4444" : "#6366f1"} strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={circ * (1 - pct / 100)}
                        style={{ transition: 'stroke 0.3s' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono font-black text-5xl text-white tabular-nums">{fmtTime(seconds)}</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">rest</span>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => { initRef.current = Math.max(10, initRef.current - 30); setSeconds(s => Math.max(0, s - 30)); }}
                    className="w-20 py-3 rounded-2xl font-mono font-bold text-sm text-white/70 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                >−30s</button>
                <button
                    onClick={() => { initRef.current += 30; setSeconds(s => s + 30); }}
                    className="w-20 py-3 rounded-2xl font-mono font-bold text-sm text-white/70 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                >+30s</button>
            </div>

            <button
                onClick={onDismiss}
                className="w-56 py-4 rounded-2xl bg-white text-black font-black text-base tracking-tight transition-all active:scale-95"
            >
                Start Next Set
            </button>
        </motion.div>
    );
}

// ─── Set log modal ─────────────────────────────────────────────────────────────

interface SetLogData { weight: string; reps: string; rpe: string; }

function SetLogModal({ setNumber, elapsed, onSave, onDiscard }: {
    setNumber: number; elapsed: number;
    onSave: (d: SetLogData) => void; onDiscard: () => void;
}) {
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [rpe, setRpe] = useState<"easy" | "normal" | "hard" | "">("");

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] p-6 shadow-2xl"
            style={{ background: '#111111', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-6" />

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="font-black text-xl text-white">Set {setNumber}</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        Duration: <span className="text-zinc-300 font-bold">{fmtTime(elapsed)}</span>
                    </p>
                </div>
                <button onClick={onDiscard} className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 block mb-2">Weight (kg)</label>
                    <input
                        type="number" inputMode="decimal" placeholder="0"
                        value={weight} onChange={e => setWeight(e.target.value)}
                        autoFocus
                        className="w-full h-14 rounded-2xl text-center font-mono text-2xl font-black text-white bg-zinc-800 border-0 outline-none focus:ring-2 focus:ring-white/20 placeholder:text-zinc-700"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 block mb-2">Reps</label>
                    <input
                        type="number" inputMode="numeric" placeholder="0"
                        value={reps} onChange={e => setReps(e.target.value)}
                        className="w-full h-14 rounded-2xl text-center font-mono text-2xl font-black text-white bg-zinc-800 border-0 outline-none focus:ring-2 focus:ring-white/20 placeholder:text-zinc-700"
                    />
                </div>
            </div>

            <div className="mb-5">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 block mb-2">Effort</label>
                <div className="grid grid-cols-3 gap-2">
                    {([
                        { key: "easy", label: "Easy", color: "bg-emerald-500" },
                        { key: "normal", label: "Normal", color: "bg-amber-500" },
                        { key: "hard", label: "Hard", color: "bg-red-500" },
                    ] as const).map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => setRpe(key)}
                            className={cn(
                                "py-3 rounded-2xl text-sm font-bold transition-all",
                                rpe === key ? `${color} text-white` : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onSave({ weight, reps, rpe: rpe === "easy" ? "3" : rpe === "hard" ? "8" : "5" })}
                disabled={!weight && !reps}
                className="w-full h-14 rounded-2xl bg-white text-black font-black text-base disabled:opacity-30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <Check className="w-5 h-5" /> Save Set
            </button>
        </motion.div>
    );
}

// ─── Finish screen ─────────────────────────────────────────────────────────────

function FinishScreen({ workout, totalSeconds, onClose }: {
    workout: EnhancedWorkout; totalSeconds: number; onClose: () => void;
}) {
    const totalSets = workout.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
    const totalVolume = workout.exercises.reduce((a, e) =>
        a + e.sets.filter(s => s.completed).reduce((b, s) => b + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#0a0a0a' }}
        >
            {/* Trophy area */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                    className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-8"
                >
                    <Trophy className="w-12 h-12 text-amber-400" />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-2">Workout Complete</p>
                    <h2 className="text-4xl font-black text-white tracking-tight">{workout.title}</h2>
                </motion.div>
            </div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="shrink-0 px-6 pb-6"
            >
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                        { label: "Time", value: fmtTime(totalSeconds) },
                        { label: "Sets", value: String(totalSets) },
                        { label: "Volume", value: totalVolume > 0 ? `${Math.round(totalVolume / 1000)}k` : String(workout.exercises.length) },
                    ].map(s => (
                        <div key={s.label}
                            className="rounded-2xl p-4 flex flex-col items-center gap-1 text-center"
                            style={{ background: '#1a1a1a' }}>
                            <span className="font-mono font-black text-2xl text-white tabular-nums">{s.value}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{s.label}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="w-full h-14 rounded-2xl bg-white text-black font-black text-base transition-all active:scale-[0.98]"
                    style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
                >
                    Done
                </button>
            </motion.div>
        </motion.div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ActiveWorkoutSession() {
    const [match, params] = useRoute("/body/activity/active/:id");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [totalSeconds, setTotalSeconds] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTotalSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const [setStopwatch, setSetStopwatch] = useState(0);
    const [setRunning, setSetRunning] = useState(false);
    const setIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const startSet = () => {
        setSetStopwatch(0);
        setSetRunning(true);
        setIntervalRef.current = setInterval(() => setSetStopwatch(s => s + 1), 1000);
    };

    const stopSet = () => {
        setSetRunning(false);
        if (setIntervalRef.current) clearInterval(setIntervalRef.current);
        setShowLogModal(true);
    };

    const [activeExIdx, setActiveExIdx] = useState(0);
    const [showRest, setShowRest] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showFinish, setShowFinish] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    if (!match || !params?.id) return null;
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
        mutationFn: async ({ workoutExerciseId, weight, reps, rpe }: {
            workoutExerciseId: string; weight: string; reps: string; rpe: string;
        }) => {
            const ex = workout?.exercises.find(e => e.id === workoutExerciseId);
            const nextSetNum = (ex?.sets.length || 0) + 1;
            await apiRequest("POST", "/api/workout-sets", {
                workoutExerciseId, setNumber: nextSetNum,
                reps: reps ? parseInt(reps) : 0,
                weight: weight ? parseFloat(weight) : 0,
                rpe: rpe ? parseFloat(rpe) : undefined,
                completed: true,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] });
            setShowRest(true);
        },
    });

    const finishWorkoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("PATCH", `/api/workouts/${workoutId}`, {
                completed: true, endTime: new Date().toISOString(),
            });
        },
        onSuccess: () => setShowFinish(true),
    });

    if (isLoading) return (
        <div className="flex items-center justify-center h-[100dvh] w-full" style={{ background: '#0a0a0a' }}>
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white animate-spin" />
        </div>
    );
    if (!workout) return null;

    const exercises = workout.exercises;
    const currentEx = exercises[activeExIdx];
    const completedSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
    const currentSetNum = (currentEx?.sets?.filter(s => s.completed).length || 0) + 1;

    const handleLogSave = (data: SetLogData) => {
        if (!currentEx) return;
        setShowLogModal(false);
        addSetMutation.mutate({ workoutExerciseId: currentEx.id, ...data });
    };

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden"
            style={{ background: '#0a0a0a', height: '100dvh' }}>

            {/* ── Floating header (over image) ─── */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)', paddingBottom: '10px' }}>
                <button
                    onClick={() => setLocation("/body")}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
                >
                    <ArrowLeft className="w-4 h-4 text-white" />
                </button>

                <div className="flex items-center gap-1.5 rounded-full px-4 py-2"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                    <TimerIcon className="w-3 h-3 text-white/50" />
                    <span className="font-mono font-black text-sm text-white tabular-nums">{fmtTime(totalSeconds)}</span>
                </div>

                <button
                    onClick={() => finishWorkoutMutation.mutate()}
                    disabled={finishWorkoutMutation.isPending}
                    className="px-5 py-2 rounded-full bg-emerald-500 text-white font-black text-sm transition-all active:scale-95"
                >
                    Finish
                </button>
            </div>

            {/* ── Hero exercise image (top ~46%) ─── */}
            <div className="relative shrink-0" style={{ height: '46%' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={currentEx?.id} className="absolute inset-0"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}>

                        {currentEx?.exercise?.imageUrl && !imgError ? (
                            <img
                                src={currentEx.exercise.imageUrl}
                                alt={currentEx.exercise.name}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                                style={{ background: '#141414' }}>
                                <Dumbbell className="w-16 h-16" style={{ color: '#2a2a2a' }} />
                                <p className="text-sm font-semibold capitalize" style={{ color: '#3a3a3a' }}>
                                    {currentEx?.exercise?.targetMuscleGroup?.replace(/-/g, ' ')}
                                </p>
                            </div>
                        )}

                        {/* Bottom gradient → flows into bottom panel */}
                        <div className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
                            style={{ background: 'linear-gradient(to top, #0a0a0a 30%, transparent)' }} />

                        {/* Exercise name in gradient */}
                        {currentEx && (
                            <div className="absolute bottom-5 left-4 right-14">
                                <h1 className="text-2xl font-black text-white leading-tight line-clamp-2">
                                    {currentEx.exercise?.name}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-semibold capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                        {currentEx.exercise?.targetMuscleGroup?.replace(/-/g, ' ')}
                                    </span>
                                    {currentEx.exercise?.category && (
                                        <>
                                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                                            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                                {currentEx.exercise.category}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* How-to button */}
                        {currentEx?.exercise?.instructions && (
                            <button
                                onClick={() => setShowInstructions(v => !v)}
                                className="absolute bottom-5 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
                            >
                                <BookOpen className="w-4 h-4 text-white" />
                            </button>
                        )}

                        {/* Set timer overlay */}
                        {setRunning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center"
                                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    Set in progress
                                </p>
                                <span className="font-mono font-black text-7xl text-white tabular-nums">
                                    {fmtTime(setStopwatch)}
                                </span>
                            </div>
                        )}

                        {/* Instructions overlay */}
                        <AnimatePresence>
                            {showInstructions && currentEx?.exercise?.instructions && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 overflow-y-auto px-5 py-4"
                                    style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
                                >
                                    <div className="flex items-center justify-between mb-4 pt-14">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                            How to perform
                                        </p>
                                        <button onClick={() => setShowInstructions(false)}>
                                            <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                                        </button>
                                    </div>
                                    <ol className="space-y-3 pb-6">
                                        {currentEx.exercise.instructions.split("\n").filter(Boolean).map((step, i) => (
                                            <li key={i} className="flex gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                <span className="text-red-400 font-black text-xs mt-0.5 shrink-0 w-4">{i + 1}.</span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Bottom panel ─── */}
            <div className="flex-1 flex flex-col min-h-0 px-4 pt-2">

                {/* Exercise tabs */}
                {exercises.length > 1 && (
                    <div className="shrink-0 flex gap-2 overflow-x-auto scrollbar-none mb-3">
                        {exercises.map((e, i) => {
                            const done = e.sets.length > 0 && e.sets.every(s => s.completed);
                            return (
                                <button key={e.id}
                                    onClick={() => { setActiveExIdx(i); setImgError(false); setShowInstructions(false); }}
                                    className={cn(
                                        "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                        i === activeExIdx
                                            ? "bg-red-500 text-white"
                                            : done
                                                ? "text-emerald-400"
                                                : "text-zinc-500"
                                    )}
                                    style={i !== activeExIdx ? { background: '#1a1a1a' } : undefined}
                                >
                                    {done ? "✓ " : ""}{e.exercise?.name}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Logged sets chips */}
                {currentEx?.sets && currentEx.sets.filter(s => s.completed).length > 0 && (
                    <div className="shrink-0 flex gap-2 flex-wrap mb-3">
                        {currentEx.sets.filter(s => s.completed).map((s, i) => (
                            <div key={s.id}
                                className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl"
                                style={{ background: '#1a1a1a', color: '#888' }}>
                                <span style={{ color: '#555' }}>#{i + 1}</span>{' '}
                                {s.weight ? `${s.weight}kg` : ''}
                                {s.weight && s.reps ? <span style={{ color: '#333' }}> × </span> : ''}
                                {s.reps ? `${s.reps}r` : ''}
                            </div>
                        ))}
                    </div>
                )}

                {/* Set label */}
                <div className="shrink-0 flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: '#444' }}>
                        Set {currentSetNum}
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#333' }}>
                        {completedSets} logged
                    </span>
                </div>
            </div>

            {/* ── Action bar ─── */}
            <div className="shrink-0 px-4"
                style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

                {/* Big START / STOP button */}
                <button
                    onClick={() => setRunning ? stopSet() : startSet()}
                    className={cn(
                        "w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] mb-3",
                    )}
                    style={{
                        background: setRunning ? '#ef4444' : '#ffffff',
                        color: setRunning ? '#fff' : '#000',
                    }}
                >
                    {setRunning ? (
                        <>
                            <Square className="w-5 h-5 fill-current" />
                            Stop Set — {fmtTime(setStopwatch)}
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 fill-current" />
                            Start Set {currentSetNum}
                        </>
                    )}
                </button>

                {/* Secondary buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => { if (setRunning) stopSet(); setShowRest(true); }}
                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95"
                        style={{ background: '#1a1a1a', color: '#666' }}
                    >
                        <Coffee className="w-4 h-4" /> Break
                    </button>

                    <AddExerciseDrawer
                        onSelect={(id) => addExerciseMutation.mutate(id)}
                        trigger={
                            <button
                                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95"
                                style={{ background: '#1a1a1a', color: '#666' }}
                            >
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        }
                    />

                    <button
                        onClick={() => { setActiveExIdx(i => Math.min(i + 1, exercises.length - 1)); setImgError(false); setShowInstructions(false); }}
                        disabled={activeExIdx >= exercises.length - 1}
                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-20"
                        style={{ background: '#1a1a1a', color: '#666' }}
                    >
                        Skip <SkipForward className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Overlays ─── */}
            <AnimatePresence>
                {showRest && <RestOverlay onDismiss={() => setShowRest(false)} />}
            </AnimatePresence>

            <AnimatePresence>
                {showLogModal && currentEx && (
                    <SetLogModal
                        setNumber={currentSetNum}
                        elapsed={setStopwatch}
                        onSave={handleLogSave}
                        onDiscard={() => setShowLogModal(false)}
                    />
                )}
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
