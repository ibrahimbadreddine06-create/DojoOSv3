import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { insertSleepLogSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const formSchema = insertSleepLogSchema;
type FormData = z.infer<typeof formSchema>;

export function AddSleepLogDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            plannedHours: "8",
            actualHours: "7",
            quality: 3,
            notes: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            return await apiRequest("POST", "/api/sleep-logs", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/sleep-logs"] });
            toast({ title: "Sleep logged successfully" });
            setOpen(false);
            form.reset();
        },
        onError: () => {
            toast({ title: "Failed to log sleep", variant: "destructive" });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-sleep">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Sleep
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Log Sleep</DialogTitle>
                    <DialogDescription>
                        Record your sleep duration and quality
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="plannedHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Planned Hours</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" step="0.5" data-testid="input-planned-hours" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="actualHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Actual Hours</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} type="number" step="0.5" data-testid="input-actual-hours" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control as any}
                            name="quality"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sleep Quality (1-5)</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() ?? "3"}>
                                        <FormControl>
                                            <SelectTrigger data-testid="select-quality">
                                                <SelectValue placeholder="Rate your sleep" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5].map((q) => (
                                                <SelectItem key={q} value={q.toString()}>
                                                    {q} - {q === 1 ? "Very Poor" : q === 3 ? "Average" : q === 5 ? "Excellent" : q === 2 ? "Poor" : "Good"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value ?? ""} placeholder="Any factors affecting your sleep..." data-testid="textarea-notes" />
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
                                {createMutation.isPending ? "Logging..." : "Log Sleep"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

