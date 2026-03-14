import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { ExerciseSetLogger } from "./exercise-set-logger";
import { AddExerciseDrawer } from "@/components/dialogs/add-exercise-drawer";
import { RestTimer } from "./rest-timer";
import { ArrowLeft, Clock, MoreVertical, Timer } from "lucide-react";
import { ExerciseLibraryItem, Workout, WorkoutExercise, WorkoutSet } from "@shared/schema";
import { format, differenceInMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type EnhancedWorkout = Workout & {
    exercises: (WorkoutExercise & {
        exercise: ExerciseLibraryItem;
        sets: WorkoutSet[];
    })[];
};

export function ActiveWorkoutSession() {
    const [match, params] = useRoute("/body/workout/active/:id");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    // Timer for duration
    useEffect(() => {
        const interval = setInterval(() => {
            setTimerSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!match || !params?.id) {
        return <div>Invalid Workout ID</div>;
    }

    const workoutId = params.id;

    const { data: workout, isLoading } = useQuery<EnhancedWorkout>({
        queryKey: [`/api/workouts/detail/${workoutId}`],
    });

    const addExerciseMutation = useMutation({
        mutationFn: async (exerciseId: string) => {
            const nextOrder = workout?.exercises.length || 0;
            await apiRequest("POST", "/api/workout-exercises", {
                workoutId,
                exerciseId,
                order: nextOrder,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] });
        },
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
                completed: false
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] });
        }
    });

    const updateSetMutation = useMutation({
        mutationFn: async ({ id, field, value }: { id: string; field: keyof WorkoutSet; value: any }) => {
            await apiRequest("PATCH", `/api/workout-sets/${id}`, {
                [field]: value
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] });
        }
    });

    const completeSetMutation = useMutation({
        mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
            await apiRequest("PATCH", `/api/workout-sets/${id}`, { completed });
        },
        onSuccess: (_, { completed }) => {
            queryClient.invalidateQueries({ queryKey: [`/api/workouts/detail/${workoutId}`] });
            if (completed) {
                setShowRestTimer(true);
            }
        }
    });

    const finishWorkoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("PATCH", `/api/workouts/${workoutId}`, {
                completed: true,
                endTime: new Date().toISOString()
            });
        },
        onSuccess: () => {
            toast({ title: "Workout Completed", description: "Good job!" });
            setLocation("/body");
        }
    });

    if (isLoading) return <div className="flex items-center justify-center h-screen">Loading workout...</div>;
    if (!workout) return <div>Workout not found</div>;

    const durationStr = `${Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:${(timerSeconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-background flex flex-col pb-24">
            {/* 🔹 HEADER - Minimal & Functional */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-sm px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setLocation("/body")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex flex-col items-center">
                    <h1 className="font-bold text-sm uppercase tracking-wide">{workout.title}</h1>
                    <Badge variant="outline" className="text-[10px] h-5 font-mono gap-1 border-primary/20 text-primary">
                        <Timer className="w-3 h-3" />
                        {durationStr}
                    </Badge>
                </div>
                <Button size="sm" onClick={() => finishWorkoutMutation.mutate()} className="font-bold bg-green-500 hover:bg-green-600 text-white">
                    FINISH
                </Button>
            </div>

            {/* 🔹 CONTENT - Exercise Cards */}
            <div className="p-4 space-y-6 flex-1 max-w-2xl mx-auto w-full">
                {workout.exercises.map((we) => (
                    <ExerciseSetLogger
                        key={we.id}
                        exercise={we.exercise}
                        sets={we.sets}
                        onAddSet={() => addSetMutation.mutate(we.id)}
                        onUpdateSet={(id, field, value) => updateSetMutation.mutate({ id, field, value })}
                        onRemoveSet={(id) => { }} // TODO
                        onCompleteSet={(id, completed) => completeSetMutation.mutate({ id, completed })}
                    />
                ))}

                <div className="pt-4">
                    <AddExerciseDrawer
                        onSelect={(id) => addExerciseMutation.mutate(id)}
                        trigger={
                            <Button variant="outline" className="w-full h-14 border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary">
                                + Add Exercise
                            </Button>
                        }
                    />
                </div>

                <div className="h-10" />
            </div>

            {/* 🔹 REST TIMER OVERLAY */}
            {showRestTimer && (
                <RestTimer
                    autoStart={true}
                    onComplete={() => setShowRestTimer(false)} // Or keep it minified
                />
            )}
        </div>
    );
}

