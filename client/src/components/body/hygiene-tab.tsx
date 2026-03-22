import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Flame, Trash2, Plus, Check } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TodaySessions } from "../today-sessions";
import { MetricRing } from "./metric-ring";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const TODAY = format(new Date(), "yyyy-MM-dd");

function isCompletedToday(routine: any): boolean {
  return routine.lastCompletedDate === TODAY;
}

function AddRoutineDialog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hygiene-routines", {
      name,
      frequency,
      date: TODAY,
      completed: false,
      streak: 0,
      bestStreak: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hygiene-routines"] });
      setName(""); setFrequency("daily"); setOpen(false);
      toast({ title: "Routine added" });
    },
    onError: () => toast({ title: "Failed to add routine", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" data-testid="button-add-routine">
          <Plus className="w-4 h-4" /> Add Routine
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Hygiene Routine</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Routine Name</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              placeholder="e.g. Brush teeth, Skincare, Shower..."
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="input-routine-name"
              onKeyDown={e => e.key === "Enter" && name && addMutation.mutate()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Frequency</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              data-testid="select-routine-frequency"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!name || addMutation.isPending}>
            Add Routine
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoutineCard({ routine }: { routine: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const done = isCompletedToday(routine);

  const toggleMutation = useMutation({
    mutationFn: () => {
      if (done) {
        return apiRequest("PATCH", `/api/hygiene-routines/${routine.id}`, {
          lastCompletedDate: null,
          completed: false,
          streak: Math.max(0, (routine.streak || 0) - 1),
        });
      } else {
        const newStreak = (routine.streak || 0) + 1;
        const newBest = Math.max(routine.bestStreak || 0, newStreak);
        return apiRequest("PATCH", `/api/hygiene-routines/${routine.id}`, {
          lastCompletedDate: TODAY,
          completed: true,
          streak: newStreak,
          bestStreak: newBest,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/hygiene-routines"] }),
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/hygiene-routines/${routine.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hygiene-routines"] });
      toast({ title: "Routine removed" });
    },
  });

  return (
    <div
      className={`bg-card border rounded-2xl px-4 py-3 flex items-center gap-3 transition-all ${done ? "border-violet-500/30 bg-violet-500/5" : "border-border/60"}`}
      data-testid={`card-routine-${routine.id}`}
    >
      <button
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${done ? "bg-violet-500 border-violet-500 text-white" : "border-muted-foreground/30 hover:border-violet-500"}`}
        data-testid={`button-toggle-routine-${routine.id}`}
      >
        {done && <Check className="w-3.5 h-3.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
            {routine.name}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
            {FREQUENCY_LABELS[routine.frequency] || routine.frequency}
          </Badge>
        </div>
        {routine.streak > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-orange-500 mt-0.5">
            <Flame className="w-3 h-3" />
            {routine.streak} day streak
          </span>
        )}
      </div>
      <button
        onClick={() => deleteMutation.mutate()}
        data-testid={`button-delete-routine-${routine.id}`}
        className="shrink-0 p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function HygieneTab() {
  const { data: routines, isLoading } = useQuery<any[]>({
    queryKey: ["/api/hygiene-routines"],
  });

  const completedToday = routines?.filter(r => isCompletedToday(r)).length || 0;
  const total = routines?.length || 0;
  const pct = total > 0 ? Math.round((completedToday / total) * 100) : 0;

  const daily = routines?.filter(r => r.frequency === "daily") || [];
  const weekly = routines?.filter(r => r.frequency === "weekly") || [];
  const monthly = routines?.filter(r => r.frequency === "monthly") || [];

  const bestStreak = routines?.reduce((max, r) => Math.max(max, r.bestStreak || 0), 0) || 0;
  const totalStreak = routines?.reduce((sum, r) => sum + (r.streak || 0), 0) || 0;
  const dailyDone = daily.filter(r => isCompletedToday(r)).length;
  const weeklyDone = weekly.filter(r => isCompletedToday(r)).length;
  const monthlyDone = monthly.filter(r => isCompletedToday(r)).length;

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Looks</h2>
          <p className="text-xs text-muted-foreground">Self-care & hygiene routines</p>
        </div>
        <AddRoutineDialog />
      </div>

      {/* Progress ring */}
      {total > 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-6">
          <MetricRing
            value={pct}
            max={100}
            label="Today"
            unit="%"
            color="#8b5cf6"
            size="lg"
            sublabel={`${completedToday}/${total} done`}
          />
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-black text-3xl font-mono tabular-nums" data-testid="text-hygiene-completion">{pct}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Completion today</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {/* Breakdown by frequency */}
            <div className="grid grid-cols-3 gap-2">
              {daily.length > 0 && (
                <div className="text-center">
                  <p className="font-mono font-bold text-sm">{dailyDone}/{daily.length}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Daily</p>
                </div>
              )}
              {weekly.length > 0 && (
                <div className="text-center">
                  <p className="font-mono font-bold text-sm">{weeklyDone}/{weekly.length}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Weekly</p>
                </div>
              )}
              {monthly.length > 0 && (
                <div className="text-center">
                  <p className="font-mono font-bold text-sm">{monthlyDone}/{monthly.length}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Monthly</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10 border border-dashed border-border rounded-2xl">
          <Sparkles className="w-9 h-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No routines yet</p>
          <AddRoutineDialog />
        </div>
      )}

      {/* Routine lists */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-2xl" />)}</div>
      ) : total > 0 ? (
        <div className="space-y-5">
          {daily.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Daily</p>
              <div className="space-y-2">{daily.map(r => <RoutineCard key={r.id} routine={r} />)}</div>
            </div>
          )}
          {weekly.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Weekly</p>
              <div className="space-y-2">{weekly.map(r => <RoutineCard key={r.id} routine={r} />)}</div>
            </div>
          )}
          {monthly.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Monthly</p>
              <div className="space-y-2">{monthly.map(r => <RoutineCard key={r.id} routine={r} />)}</div>
            </div>
          )}
        </div>
      ) : null}

      {/* Streak stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-border/60 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="font-mono font-black text-xl leading-none">{totalStreak}</p>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">Active streaks</p>
            </div>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="font-mono font-black text-xl leading-none">{bestStreak}</p>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">Best streak</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}
