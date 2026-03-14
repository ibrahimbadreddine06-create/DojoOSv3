import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Dumbbell, Check, ChevronsUpDown } from "lucide-react";
import { z } from "zod";
import { ExerciseLibraryItem } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";

// Frontend-specific schema for the form
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    exercises: z.array(z.object({
        exerciseId: z.string().min(1, "Exercise is required"),
        exerciseName: z.string().optional(), // Helper for display, stripped before submit
        sets: z.coerce.number().min(1),
        reps: z.string(), // Changed to string to allow ranges "8-12"
        weight: z.coerce.number().optional(),
        notes: z.string().optional(),
    })).min(1, "Add at least one exercise"),
});

export function AddWorkoutPresetDialog() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    // Fetch exercises
    const { data: exercises } = useQuery<ExerciseLibraryItem[]>({
        queryKey: ["/api/exercises"], // Uses our new alias
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            exercises: [{ exerciseId: "", sets: 3, reps: "10" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "exercises",
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            // Transform for backend
            const payload = {
                name: values.name,
                exercises: values.exercises.map(e => ({
                    exerciseId: e.exerciseId,
                    sets: e.sets,
                    targetReps: e.reps, // Mapping 'reps' to 'targetReps'
                    notes: e.notes
                }))
            };
            const res = await apiRequest("POST", "/api/workout-presets", payload);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/workout-presets"] });
            toast({ title: "Preset created" });
            form.reset();
            setOpen(false);
        },
        onError: (error) => {
            toast({ title: "Failed to create preset", description: error.message, variant: "destructive" });
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Dumbbell className="h-4 w-4" />
                    New Routine
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Workout Routine</DialogTitle>
                    <DialogDescription>
                        Design a repeatable workout preset from your exercise library.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Routine Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Chest & Triceps Hypertrophy" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Exercises</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => append({ exerciseId: "", sets: 3, reps: "8-12" })}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Exercise
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-3 items-start border p-3 rounded-lg bg-accent/20">
                                    <div className="col-span-5">
                                        <FormField
                                            control={form.control}
                                            name={`exercises.${index}.exerciseId`}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-xs">Exercise</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value
                                                                        ? exercises?.find(
                                                                            (e) => e.id === field.value
                                                                        )?.name
                                                                        : "Select exercise"}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Search exercises..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No exercise found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {exercises?.map((exercise) => (
                                                                            <CommandItem
                                                                                value={exercise.name}
                                                                                key={exercise.id}
                                                                                onSelect={() => {
                                                                                    form.setValue(`exercises.${index}.exerciseId`, exercise.id);
                                                                                    // Close popover handled by Dialog focus, but standard Radix approach implies internal state
                                                                                    // We rely on selecting to close.
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        exercise.id === field.value
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {exercise.name}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`exercises.${index}.sets`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Sets</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`exercises.${index}.reps`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Reps</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`exercises.${index}.weight`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Kg (opt)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-1 pt-6">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving..." : "Create Routine"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

