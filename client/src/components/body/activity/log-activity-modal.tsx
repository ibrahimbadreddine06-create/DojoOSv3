import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Bike, Footprints, Waves, Trophy, Dumbbell, MoreHorizontal, ArrowLeft, Flame,
} from "lucide-react";

const ACTIVITY_TYPES = [
  { type: "run", label: "Run", icon: Footprints, color: "#f59e0b" },
  { type: "walk", label: "Walk", icon: Footprints, color: "#14b8a6" },
  { type: "cycle", label: "Cycle", icon: Bike, color: "#3b82f6" },
  { type: "swim", label: "Swim", icon: Waves, color: "#06b6d4" },
  { type: "sport", label: "Sport", icon: Trophy, color: "#8b5cf6" },
  { type: "workout", label: "Workout", icon: Dumbbell, color: "#ef4444" },
  { type: "other", label: "Other", icon: MoreHorizontal, color: "#6b7280" },
];

// Simple calorie estimation based on activity type and duration
function estimateCalories(type: string, durationMin: number, weightKg = 70): number {
  const metMap: Record<string, number> = {
    run: 9.8, walk: 3.8, cycle: 7.5, swim: 8.0, sport: 7.0, workout: 6.0, other: 4.0,
  };
  const met = metMap[type] || 4.0;
  return Math.round((met * 3.5 * weightKg / 200) * durationMin);
}

interface LogActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogActivityModal({ open, onOpenChange }: LogActivityModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [effort, setEffort] = useState("");
  const [activityName, setActivityName] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const durationNum = parseInt(duration) || 0;
  const estimatedCal = selectedType && durationNum > 0
    ? estimateCalories(selectedType, durationNum)
    : 0;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/activity-logs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({ title: "Activity logged" });
      resetAndClose();
    },
    onError: (e: any) => {
      toast({ title: "Failed to log activity", description: e.message, variant: "destructive" });
    },
  });

  function resetAndClose() {
    setStep(1);
    setSelectedType(null);
    setDuration("");
    setDistance("");
    setEffort("");
    setActivityName("");
    setNotes("");
    onOpenChange(false);
  }

  function handleTypeSelect(type: string) {
    if (type === "workout") {
      // Redirect to existing workout creation flow
      onOpenChange(false);
      navigate("/body/workout");
      return;
    }
    setSelectedType(type);
    setStep(2);
  }

  function handleSubmit() {
    if (!selectedType || durationNum <= 0) return;
    createMutation.mutate({
      activityType: selectedType,
      activityName: activityName || selectedType,
      durationMinutes: durationNum,
      distanceKm: distance ? parseFloat(distance) : null,
      caloriesBurned: estimatedCal,
      perceivedEffort: effort ? parseInt(effort) : null,
      notes: notes || null,
      loggedAt: new Date().toISOString(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 2 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {step === 1 ? "Log activity" : `Log ${selectedType}`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {ACTIVITY_TYPES.map((at) => {
              const Icon = at.icon;
              return (
                <button
                  key={at.type}
                  onClick={() => handleTypeSelect(at.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Icon className="w-6 h-6" style={{ color: at.color }} />
                  <span className="text-xs font-medium">{at.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {(selectedType === "sport" || selectedType === "other") && (
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder={selectedType === "sport" ? "e.g. Basketball" : "Activity name"}
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Duration (min)</Label>
                <Input
                  type="number"
                  placeholder="45"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1"
                />
              </div>
              {(selectedType === "run" || selectedType === "walk" || selectedType === "cycle") && (
                <div>
                  <Label className="text-xs">Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Perceived effort (1–10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="7"
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
                className="mt-1"
              />
            </div>

            {selectedType === "other" && (
              <div>
                <Label className="text-xs">Notes</Label>
                <Input
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {/* Calorie estimate */}
            {estimatedCal > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Estimated: <strong className="text-foreground">{estimatedCal} kcal</strong></span>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={durationNum <= 0 || createMutation.isPending}
              className="w-full"
              style={{ backgroundColor: "hsl(0 84.2% 60.2%)" }}
            >
              {createMutation.isPending ? "Saving..." : "Log activity"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
