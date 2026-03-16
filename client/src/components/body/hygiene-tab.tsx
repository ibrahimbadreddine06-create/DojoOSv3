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
    <Card
      className={`transition-all ${done ? "border-primary/30 bg-primary/5" : ""}`}
      data-testid={`card-routine-${routine.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"}`}
            data-testid={`button-toggle-routine-${routine.id}`}
          >
            {done && <Check className="w-3.5 h-3.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                {routine.name}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {FREQUENCY_LABELS[routine.frequency] || routine.frequency}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {(routine.streak > 0) && (
                <span className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame className="w-3 h-3" />
                  {routine.streak} day streak
                </span>
              )}
              {routine.lastCompletedDate && !done && (
                <span className="text-xs text-muted-foreground">
                  Last: {format(new Date(routine.lastCompletedDate + "T00:00:00"), "MMM d")}
                </span>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={() => deleteMutation.mutate()}
            data-testid={`button-delete-routine-${routine.id}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Hygiene & Appearance</h2>
          <p className="text-sm text-muted-foreground">Recurring self-care routines</p>
        </div>
        <AddRoutineDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {total > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-semibold">Today's Progress</CardTitle>
                  <span className="text-sm text-muted-foreground">{completedToday} / {total} done</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold font-mono" data-testid="text-hygiene-completion">
                    {pct}%
                  </div>
                  <Progress value={pct} className="h-3 flex-1" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No routines yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add recurring hygiene routines to track</p>
              <AddRoutineDialog />
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <TodaySessions module="body" itemId="body_hygiene" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : total > 0 ? (
        <div className="space-y-6">
          {daily.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Daily</h3>
              <div className="space-y-2 group">
                {daily.map(r => <RoutineCard key={r.id} routine={r} />)}
              </div>
            </div>
          )}
          {weekly.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Weekly</h3>
              <div className="space-y-2 group">
                {weekly.map(r => <RoutineCard key={r.id} routine={r} />)}
              </div>
            </div>
          )}
          {monthly.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Monthly</h3>
              <div className="space-y-2 group">
                {monthly.map(r => <RoutineCard key={r.id} routine={r} />)}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
