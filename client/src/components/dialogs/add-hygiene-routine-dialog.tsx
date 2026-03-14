import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { insertHygieneRoutineSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const formSchema = insertHygieneRoutineSchema;
type FormData = z.infer<typeof formSchema>;

export function AddHygieneRoutineDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            name: "",
            completed: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            return await apiRequest("POST", "/api/hygiene-routines", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hygiene-routines"] });
            toast({ title: "Routine added successfully" });
            setOpen(false);
            form.reset();
        },
        onError: () => {
            toast({ title: "Failed to add routine", variant: "destructive" });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-routine">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Routine
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Hygiene Routine</DialogTitle>
                    <DialogDescription>
                        Create a new routine to track daily
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Routine Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value ?? ""} placeholder="Brush teeth / Skincare / Shower" data-testid="input-name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Effective Date</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value ?? ""} type="date" data-testid="input-date" />
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
                                {createMutation.isPending ? "Adding..." : "Add Routine"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

