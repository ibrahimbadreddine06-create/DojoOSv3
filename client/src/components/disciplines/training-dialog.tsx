
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Discipline, type InsertDisciplineLog } from "@shared/schema";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TrainingDialogProps {
    discipline: Discipline;
    isOpen: boolean;
    onClose: () => void;
}

export function TrainingDialog({ discipline, isOpen, onClose }: TrainingDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [duration, setDuration] = useState(30);
    const [notes, setNotes] = useState("");
    const [xpGained, setXpGained] = useState(10); // Default XP

    const mutation = useMutation({
        mutationFn: async (log: InsertDisciplineLog) => {
            await apiRequest("POST", `/api/disciplines/${discipline.id}/log`, log);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
            queryClient.invalidateQueries({ queryKey: [`/api/logs-${discipline.id}`] });
            toast({
                title: "Session Logged!",
                description: `You gained ${xpGained} XP in ${discipline.name}.`,
            });
            onClose();
            // Reset form
            setNotes("");
            setDuration(30);
            setXpGained(10);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to log session.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = () => {
        mutation.mutate({
            disciplineId: discipline.id,
            durationMinutes: duration,
            notes,
            xpGained,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Train {discipline.name}</DialogTitle>
                    <DialogDescription>
                        Log your practice session to gain XP and level up.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="duration">Duration (minutes): {duration}</Label>
                        <Slider
                            id="duration"
                            min={5}
                            max={180}
                            step={5}
                            value={[duration]}
                            onValueChange={(val) => setDuration(val[0])}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="xp">XP Gained: {xpGained}</Label>
                        <Slider
                            id="xp"
                            min={5}
                            max={100}
                            step={5}
                            value={[xpGained]}
                            onValueChange={(val) => setXpGained(val[0])}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="What did you focus on?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending}>
                        {mutation.isPending ? "Logging..." : "Complete Session"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

