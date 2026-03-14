import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { insertIntakeLogSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const formSchema = insertIntakeLogSchema;
type FormData = z.infer<typeof formSchema>;

interface AddIntakeLogDialogProps {
    mode?: "log" | "plan";
}

export function AddIntakeLogDialog({ mode = "log" }: AddIntakeLogDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(),
            mealName: "",
            calories: "0",
            protein: "0",
            carbs: "0",
            fats: "0",
            notes: "",
            status: mode === "plan" ? "planned" : "consumed",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            return await apiRequest("POST", "/api/intake-logs", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/intake-logs"] });
            toast({ title: "Meal logged successfully" });
            setOpen(false);
            form.reset();
        },
        onError: () => {
            toast({ title: "Failed to log meal", variant: "destructive" });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-meal" variant={mode === "plan" ? "outline" : "default"}>
                    <Plus className="w-4 h-4 mr-2" />
                    {mode === "plan" ? "Plan Meal" : "Log Meal"}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{mode === "plan" ? "Plan Future Meal" : "Log Meal"}</DialogTitle>
                    <DialogDescription>
                        {mode === "plan" ? "Schedule a meal for later." : "Record your nutritional intake."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                        <FormField
                            control={form.control as any}
                            name="mealName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meal Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Breakfast / Lunch / Dinner" data-testid="input-meal-name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" data-testid="input-date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="calories"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Calories</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" data-testid="input-calories" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control as any}
                                name="protein"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Protein (g)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" data-testid="input-protein" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="carbs"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Carbs (g)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" data-testid="input-carbs" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="fats"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fats (g)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" data-testid="input-fats" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control as any}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value ?? ""} placeholder="Any additional details..." data-testid="textarea-notes" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                                {createMutation.isPending ? "Saving..." : (mode === "plan" ? "Save Plan" : "Log Meal")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

