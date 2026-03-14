
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertDiscipline } from "@shared/schema";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";

export function CreateDisciplineDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("text-primary");

    const mutation = useMutation({
        mutationFn: async (discipline: InsertDiscipline) => {
            await apiRequest("POST", "/api/disciplines", discipline);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
            queryClient.invalidateQueries({ queryKey: ["/api/discipline-metrics-all"] });
            toast({
                title: "Discipline Created!",
                description: `${name} has been added to your training list.`,
            });
            setIsOpen(false);
            setName("");
            setDescription("");
            setColor("text-primary");
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create discipline.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = () => {
        mutation.mutate({
            name,
            description: description || undefined,
            color,
            icon: "Zap",
            level: 1,
            currentXp: 0,
            maxXp: 100
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
                    <Plus className="mr-2 h-4 w-4" /> New Discipline
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <DialogHeader>
                        <DialogTitle>Create New Discipline</DialogTitle>
                        <DialogDescription>
                            Define a new skill or habit to track and master.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Coding, Piano, Running"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="What is this discipline about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                                {["text-primary", "text-red-500", "text-blue-500", "text-green-500", "text-yellow-500", "text-purple-500"].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`w-6 h-6 rounded-full border ${c.replace("text-", "bg-")} ${color === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending || !name.trim()}>
                            {mutation.isPending ? "Creating..." : "Create Discipline"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

