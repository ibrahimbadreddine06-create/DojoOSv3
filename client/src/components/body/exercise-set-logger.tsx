import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Trash2, Plus, Dumbbell, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkoutSet, ExerciseLibraryItem } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface ExerciseSetLoggerProps {
    exercise: ExerciseLibraryItem;
    sets: WorkoutSet[];
    onAddSet: () => void;
    onUpdateSet: (id: string, field: keyof WorkoutSet, value: any) => void;
    onRemoveSet: (id: string) => void;
    onCompleteSet: (id: string, completed: boolean) => void;
}

export function ExerciseSetLogger({
    exercise,
    sets,
    onAddSet,
    onUpdateSet,
    onRemoveSet,
    onCompleteSet
}: ExerciseSetLoggerProps) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">{exercise.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{exercise.targetMuscleGroup} • {exercise.category}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8">
                    <History className="w-4 h-4 mr-1" />
                    History
                </Button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] md:grid-cols-[40px_1fr_1fr_1fr_1fr_40px] gap-2 px-4 py-2 text-xs font-mono text-muted-foreground uppercase text-center bg-muted/5">
                <div className="hidden md:block">Set</div>
                <div>Previous</div>
                <div>kg</div>
                <div>Reps</div>
                <div>RPE</div>
                <div></div>
            </div>

            {/* Sets */}
            <div className="p-2 space-y-1">
                <AnimatePresence initial={false}>
                    {sets.map((set, index) => (
                        <motion.div
                            key={set.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                "grid grid-cols-[1fr_2fr_2fr_1fr_1fr] md:grid-cols-[40px_1fr_1fr_1fr_1fr_40px] gap-2 items-center p-2 rounded-lg transition-colors",
                                set.completed ? "bg-green-500/10 border border-green-500/20" : "bg-background"
                            )}
                        >
                            <div className="hidden md:flex items-center justify-center font-mono text-sm font-bold text-muted-foreground bg-muted/30 rounded-md h-8 w-8">
                                {index + 1}
                            </div>

                            <div className="text-center text-xs text-muted-foreground font-mono">
                                -
                                {/* Placeholder for history lookup */}
                            </div>

                            <Input
                                type="number"
                                inputMode="decimal"
                                className={cn(
                                    "h-8 text-center font-mono focus:ring-1 transition-all",
                                    set.completed && "text-green-600 font-bold border-green-200"
                                )}
                                placeholder="kg"
                                value={set.weight || ""}
                                onChange={(e) => onUpdateSet(set.id, "weight", e.target.value)}
                            />

                            <Input
                                type="number"
                                inputMode="numeric"
                                className={cn(
                                    "h-8 text-center font-mono focus:ring-1 transition-all",
                                    set.completed && "text-green-600 font-bold border-green-200"
                                )}
                                placeholder="reps"
                                value={set.reps || ""}
                                onChange={(e) => onUpdateSet(set.id, "reps", e.target.value)}
                            />

                            <Input
                                type="number"
                                inputMode="decimal"
                                className={cn(
                                    "h-8 text-center font-mono focus:ring-1 transition-all",
                                    set.completed && "text-green-600 font-bold border-green-200"
                                )}
                                placeholder="-"
                                max={10}
                                value={set.rpe || ""}
                                onChange={(e) => onUpdateSet(set.id, "rpe", e.target.value)}
                            />

                            <Button
                                size="sm"
                                variant={set.completed ? "default" : "secondary"}
                                className={cn(
                                    "h-8 w-8 p-0 rounded-md transition-all",
                                    set.completed ? "bg-green-500 hover:bg-green-600" : "bg-muted hover:bg-muted/80"
                                )}
                                onClick={() => onCompleteSet(set.id, !set.completed)}
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-border/50">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-primary hover:text-primary hover:bg-primary/5 h-8 font-medium uppercase tracking-tight text-xs"
                    onClick={onAddSet}
                >
                    <Plus className="w-3 h-3 mr-2" />
                    Add Set
                </Button>
            </div>
        </div>
    );
}
