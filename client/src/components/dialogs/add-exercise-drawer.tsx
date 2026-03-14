import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ExerciseLibraryItem } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddExerciseDrawerProps {
    onSelect: (exerciseId: string) => void;
    trigger?: React.ReactNode;
}

export function AddExerciseDrawer({ onSelect, trigger }: AddExerciseDrawerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const { data: exercises } = useQuery<ExerciseLibraryItem[]>({
        queryKey: ["/api/exercise-library"],
    });

    const filtered = exercises?.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.targetMuscleGroup?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (id: string) => {
        onSelect(id);
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button className="w-full h-12 text-lg font-bold uppercase tracking-tight" variant="secondary">
                        <Plus className="w-5 h-5 mr-2" /> Add Exercise
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader>
                    <SheetTitle>Select Exercise</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4 h-full flex flex-col">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search exercises..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="flex-1 -mx-4 px-4 pb-8">
                        <div className="space-y-2">
                            {filtered?.map((exercise) => (
                                <div
                                    key={exercise.id}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 cursor-pointer border border-transparent hover:border-primary/10 transition-all"
                                    onClick={() => handleSelect(exercise.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold uppercase">
                                            {exercise.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm">{exercise.name}</h4>
                                            <p className="text-xs text-muted-foreground capitalize">{exercise.targetMuscleGroup}</p>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}

