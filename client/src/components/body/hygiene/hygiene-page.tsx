import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles, Plus, AlertTriangle, Check, Trash2, Flame, Calendar,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MetricRing } from "@/components/body/metric-ring";
import { LinkedHygieneBlocks } from "./linked-hygiene-blocks";
import { HygieneTrends } from "./hygiene-trends";

const TODAY = format(new Date(), "yyyy-MM-dd");
const FREQ_DAYS: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 };
const FREQ_LABELS: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

function isCompletedToday(r: any) { return r.lastCompletedDate === TODAY; }
function daysSinceFor(r: any): number | null {
  if (!r.lastCompletedDate) return null;
  return differenceInDays(new Date(), new Date(r.lastCompletedDate));
}
function relevanceScore(r: any): number {
  const d = daysSinceFor(r);
  if (d === null) return 100;
  return Math.round((d / (FREQ_DAYS[r.frequency] || 7)) * 100);
}
function recencyLabel(r: any): string {
  const d = daysSinceFor(r);
  if (d === null) return "Never done";
  if (d === 0) return "Done today";
  if (d === 1) return "last done 1 day ago";
  if (d < 24) return `last done ${d}h ago`;
  return `last done ${d} days ago`;
}
function contextMessage(score: number): string {
  if (score >= 120) return "This is starting to drift from your normal upkeep";
  if (score >= 100) return "Recommended window is approaching again";
  if (score >= 70) return "You usually try to do this more often";
  return "Your target rhythm suggests doing this again now";
}

// ─── Preset habits ─────────────────────────────────────────────────────────────
const PRESET_HABITS = [
  "Shower", "AM skincare", "PM skincare", "Brush teeth", "Floss",
  "Body moisturising", "Body scrub", "Nail care", "Beard oil",
  "Hair routine", "Face mask", "Minoxidil", "Derma roller", "Hammam visit",
];

// ─── Add Routine Dialog ───────────────────────────────────────────────────────
function AddRoutineDialog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/hygiene-routines", {
        name: name.trim(), frequency, date: TODAY, completed: false, streak: 0, bestStreak: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hygiene-routines"] });
      setName(""); setFrequency("daily"); setOpen(false);
      toast({ title: "Routine added" });
    },
    onError: () => toast({ title: "Failed to add", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-red-500 hover:bg-red-600 text-white"
          data-testid="button-log-care"
        >
          <Plus className="w-4 h-4" /> Log Care
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add care routine</DialogTitle></DialogHeader>
        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick pick</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {PRESET_HABITS.map((h) => (
                <button key={h} type="button" onClick={() => setName(h)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    name === h
                      ? "bg-violet-500 text-white border-violet-500"
                      : "border-border text-muted-foreground hover:border-violet-400 hover:text-violet-500"
                  }`}
                >{h}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Custom</label>
            <input
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="e.g. Derma roller, Hammam visit..."
              value={name} onChange={(e) => setName(e.target.value)}
              data-testid="input-routine-name"
              onKeyDown={(e) => e.key === "Enter" && name && addMutation.mutate()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frequency</label>
            <select
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background"
              value={frequency} onChange={(e) => setFrequency(e.target.value)}
              data-testid="select-routine-frequency"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Button className="w-full rounded-xl" onClick={() => addMutation.mutate()}
            disabled={!name.trim() || addMutation.isPending}>
            {addMutation.isPending ? "Adding..." : "Add routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Progress Routine Card (for progress section list) ────────────────────────
function ProgressRoutineCard({ routine }: { routine: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const done = isCompletedToday(routine);

  const toggleMutation = useMutation({
    mutationFn: () => {
      if (done) {
        return apiRequest("PATCH", `/api/hygiene-routines/${routine.id}`, {
          lastCompletedDate: null, completed: false, streak: Math.max(0, (routine.streak || 0) - 1),
        });
      } else {
        const s = (routine.streak || 0) + 1;
        return apiRequest("PATCH", `/api/hygiene-routines/${routine.id}`, {
          lastCompletedDate: TODAY, completed: true, streak: s,
          bestStreak: Math.max(routine.bestStreak || 0, s),
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

  const d = daysSinceFor(routine);
  const interval = FREQ_DAYS[routine.frequency] || 7;
  const fillPct = d !== null ? Math.min(100, Math.round((d / interval) * 100)) : 100;
  const fillColor = done ? "#8b5cf6" : fillPct >= 90 ? "#ef4444" : fillPct >= 60 ? "#f59e0b" : "#22c55e";

  return (
    <div
      className={`rounded-xl border p-4 space-y-2.5 transition-all ${
        done ? "border-violet-500/30 bg-violet-500/5" : "border-border/60 bg-card hover:shadow-sm"
      }`}
      data-testid={`card-routine-${routine.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}
          className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            done ? "bg-violet-500 border-violet-500 text-white" : "border-muted-foreground/30 hover:border-violet-400"
          }`}
          data-testid={`button-toggle-routine-${routine.id}`}
        >
          {done && <Check className="w-2.5 h-2.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${done ? "line-through text-muted-foreground" : ""}`}>
            {routine.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {FREQ_LABELS[routine.frequency] || routine.frequency}
            {routine.streak > 0 && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-orange-500">
                <Flame className="w-2.5 h-2.5" />{routine.streak} streak
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => deleteMutation.mutate()}
          data-testid={`button-delete-routine-${routine.id}`}
          className="shrink-0 p-1 text-muted-foreground/30 hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Recency bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{d === null ? "Never done" : d === 0 ? "Done today" : `${d}d since last`}</span>
          <span>every {interval}d</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(fillPct, 100)}%`, backgroundColor: fillColor }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type BlockTab = "linked" | "presets";

export function HygienePage() {
  const [, navigate] = useLocation();
  const [blockTab, setBlockTab] = useState<BlockTab>("linked");

  const { data: routines = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
  const { data: dailyState } = useQuery<any>({ queryKey: [`/api/daily-state/${TODAY}`] });

  // ── Derived metrics ──────────────────────────────────────────────────────
  const total = routines.length;
  const completedToday = useMemo(() => routines.filter(isCompletedToday).length, [routines]);

  const upkeepScore = useMemo(() => {
    if (total === 0) return null;
    const w: any = { daily: 3, weekly: 2, monthly: 1 };
    let earned = 0, possible = 0;
    for (const r of routines) {
      const wt = w[r.frequency] ?? 1;
      possible += wt;
      if (isCompletedToday(r)) earned += wt;
    }
    return possible > 0 ? Math.round((earned / possible) * 100) : 0;
  }, [routines]);

  const disciplineRate = useMemo(() => {
    if (total === 0) return null;
    const scores = routines.map((r) => {
      const maxExp = r.frequency === "daily" ? 14 : r.frequency === "weekly" ? 8 : 3;
      return Math.min(1, (r.streak || 0) / maxExp);
    });
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
  }, [routines]);

  const glowDirection = useMemo(() => {
    if (total === 0) return "–";
    const avgS = routines.reduce((a, r) => a + (r.streak || 0), 0) / total;
    const avgB = routines.reduce((a, r) => a + (r.bestStreak || 0), 0) / total;
    if (avgS >= avgB * 0.8 && avgS > 0) return "Up";
    if (avgS < avgB * 0.4 && avgB > 0) return "Down";
    return "Steady";
  }, [routines]);

  const upkeepColor = upkeepScore === null ? "#9ca3af"
    : upkeepScore >= 70 ? "#8b5cf6" : upkeepScore >= 40 ? "#f59e0b" : "#ef4444";
  const disciplineColor = disciplineRate === null ? "#9ca3af"
    : disciplineRate >= 70 ? "#60a5fa" : disciplineRate >= 40 ? "#f59e0b" : "#ef4444";
  const glowColor = glowDirection === "Up" ? "#f97316"
    : glowDirection === "Down" ? "#ef4444" : "#9ca3af";

  // Recommended now
  const recommended = useMemo(() =>
    routines
      .filter((r) => !isCompletedToday(r))
      .map((r) => ({ ...r, score: relevanceScore(r) }))
      .filter((r) => r.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    [routines]
  );

  // Progress bento cards — derive from user's own routines
  const progressCards = useMemo(() => {
    return routines.map((r) => {
      const d = daysSinceFor(r);
      const interval = FREQ_DAYS[r.frequency] || 7;
      const pct = d !== null ? Math.min(100, Math.round((d / interval) * 100)) : 100;
      return { routine: r, daysSince: d, interval, pct };
    });
  }, [routines]);

  const showNoDataBanner = !isLoading && total === 0;

  // Cross-body signals
  const crossBodySignals = [
    {
      label: "Sleep support",
      statement: dailyState?.recoveryScore
        ? dailyState.recoveryScore >= 70
          ? "Good recovery supporting overnight skin repair"
          : "Low sleep is hurting appearance recovery"
        : "Low sleep is hurting appearance recovery",
      path: "/body/sleep",
    },
    {
      label: "Nutrition support",
      statement: "Iron intake may be affecting vitality",
      path: "/body/nutrition",
    },
    {
      label: "Activity support",
      statement: "You are missing body-composition goals",
      path: "/body/activity",
    },
    {
      label: "Discipline support",
      statement: "You skip self-care more on late days",
      path: "/planner",
    },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl animate-in fade-in duration-700">
      <div className="space-y-6">

        {/* ── 1. Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hygiene & Looks</h1>
            <p className="text-sm text-muted-foreground mt-1">Self-care, grooming & glow-up execution</p>
          </div>
          <AddRoutineDialog />
        </div>

        {/* ── 2. Contextual Notice Banner ── */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-5 py-4">
          <p className="text-sm text-amber-700 dark:text-amber-400 leading-snug">
            {showNoDataBanner
              ? "Add your first care routine to start tracking your cadence and glow-up execution."
              : recommended.length > 0
              ? "Some care routines are reaching their recommended interval again. Surfaced here as gentle alerts based on your own cadence and goals, not as hard overdue states."
              : "All care routines are on track based on your personal cadence and goals."}
          </p>
        </div>

        {/* ── 3. Hero Metrics Row ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* Upkeep Score */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/upkeepScore")}
            data-testid="hero-upkeep-score"
          >
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <MetricRing
                value={upkeepScore ?? 0} max={100}
                label="Upkeep Score" color={upkeepColor} size="lg"
              />
              <div className="text-center">
                <p className="font-semibold text-sm">Upkeep Score</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">this week</p>
              </div>
            </CardContent>
          </Card>

          {/* Discipline Rate */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/disciplineRate")}
            data-testid="hero-discipline-rate"
          >
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <MetricRing
                value={disciplineRate ?? 0} max={100}
                label="Discipline Rate" unit="%" color={disciplineColor} size="lg"
              />
              <div className="text-center">
                <p className="font-semibold text-sm">Discipline Rate</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">planned tasks completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Glow-up Direction — text value inside ring */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/glowUpDirection")}
            data-testid="hero-glow-direction"
          >
            <CardContent className="p-6 flex flex-col items-center gap-4">
              {/* Custom ring with text value */}
              <div className="relative" style={{ width: 110, height: 110 }}>
                <svg width={110} height={110} viewBox="0 0 110 110" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={55} cy={55} r={46} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} />
                  <circle
                    cx={55} cy={55} r={46} fill="none"
                    stroke={glowColor} strokeWidth={10}
                    strokeDasharray={`${2 * Math.PI * 46 * 0.7} ${2 * Math.PI * 46}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: glowColor }}>{glowDirection}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Glow-up Direction</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">7-day trend</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Toggle: Linked time blocks / Presets (outside card) ── */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
          {(["linked", "presets"] as BlockTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setBlockTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                blockTab === tab
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "linked" ? "Linked time blocks" : "Presets"}
            </button>
          ))}
        </div>

        {/* ── 5. Recommended Now (full-width featured section) ── */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Glow-up Execution
              </p>
              <h2 className="text-xl font-bold mt-1">Recommended now based on recency</h2>
            </div>
            <button
              className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
              onClick={() => {/* show all */}}
            >
              View all routines
            </button>
          </div>

          {/* Routine rows */}
          {recommended.length === 0 ? (
            <div className="px-6 pb-8 pt-2 flex flex-col items-center gap-3 text-center">
              <div className="w-11 h-11 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-500/70" />
              </div>
              <div>
                <p className="text-sm font-semibold">All routines on track</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nothing is falling behind based on your personal cadence.
                </p>
              </div>
              {showNoDataBanner && <AddRoutineDialog />}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recommended.map((routine) => {
                const d = daysSinceFor(routine);
                const interval = FREQ_DAYS[routine.frequency] || 7;
                // Human-readable last-done string
                let lastLabel = "Never done";
                if (d !== null) {
                  if (d === 0) lastLabel = "last done today";
                  else if (d < 2) lastLabel = `last done ${d === 1 ? "yesterday" : `${d} days ago`}`;
                  else lastLabel = `last done ${d} days ago`;

                  // Try hours for recent
                  const hrs = Math.round(differenceInDays(new Date(), new Date(routine.lastCompletedDate)) * 24);
                  if (d === 0 && hrs > 0) lastLabel = `last done ${hrs}h ago`;
                }

                return (
                  <div key={routine.id} className="px-6 py-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{routine.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{lastLabel}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#6366f1" }}>
                        {contextMessage(routine.score)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/planner")}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Add to planner
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 6. Planner Connection (Linked Blocks or Presets) ── */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Planner Connection
            </p>
            <h2 className="text-xl font-bold mt-1">
              {blockTab === "linked" ? "Linked blocks / presets pattern" : "Presets"}
            </h2>
          </div>

          {blockTab === "linked" ? (
            <div className="px-6 pb-6 pt-4">
              <div className="bg-muted/40 border border-border/40 rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This section reuses the same linked time-block / preset system already used on other pages.
                  Add care blocks in your daily planner to see them here and link them to your hygiene routines.
                </p>
              </div>
              <LinkedHygieneBlocks />
            </div>
          ) : (
            <div className="px-6 pb-6 pt-4 space-y-4">
              <div className="bg-muted/40 border border-border/40 rounded-xl p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Presets let you quickly drop routine blocks into your planner. Set them up in the planner and they'll appear here for fast scheduling.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Morning care", "Evening skincare", "Weekly grooming", "Deep care session"].map((p) => (
                  <div key={p}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground/60"
                  >
                    <Plus className="w-3.5 h-3.5" /> {p}
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/planner")}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-500/70 hover:text-violet-500 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" /> Manage presets in planner
              </button>
            </div>
          )}
        </div>

        {/* ── 7. Progress: Goal-linked progress ── */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Progress</p>
            <h2 className="text-xl font-bold mt-1">Goal-linked progress</h2>
          </div>

          {isLoading ? (
            <div className="px-6 pb-6 grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : total === 0 ? (
            <div className="px-6 pb-8 space-y-4">
              <div className="bg-muted/40 border border-border/40 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Progress cards will be generated based on your own care goals, recurring habits, and cadence. They adapt to specifically what you track and want to improve.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="border border-dashed border-border/40 rounded-xl p-4 min-h-[100px] flex flex-col gap-2">
                    <div className="h-2 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-full" />
                    <div className="h-2 bg-muted rounded w-5/6" />
                  </div>
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <AddRoutineDialog />
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6 space-y-4">
              <div className="bg-muted/40 border border-border/40 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Progress cards adapt to your own care goals, recurring habits, and cadence.
                </p>
              </div>
              {/* Bento grid — 3 columns */}
              <div className="grid grid-cols-3 gap-3">
                {progressCards.map(({ routine, daysSince: d, interval, pct }) => {
                  const fillColor = isCompletedToday(routine) ? "#8b5cf6" : pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e";
                  return (
                    <div key={routine.id} className="border border-border/60 rounded-xl p-4 space-y-3 bg-card hover:shadow-sm transition-all">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {(FREQ_LABELS[routine.frequency] || routine.frequency).toLowerCase()}
                        </p>
                        <p className="text-sm font-semibold mt-0.5 leading-tight">{routine.name}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{d === null ? "Never" : d === 0 ? "Today" : `${d}d ago`}</span>
                          {routine.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-orange-500">
                              <Flame className="w-2 h-2" /> {routine.streak}
                            </span>
                          )}
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: fillColor }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 8. Cross-Body Impact ── */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Cross-body impact</p>
            <h2 className="text-xl font-bold mt-1">Glow-up support from the rest of Body</h2>
          </div>

          {/* 4-column horizontal cards */}
          <div className="px-6 pb-4 grid grid-cols-4 gap-3">
            {crossBodySignals.map((s) => (
              <button
                key={s.label}
                onClick={() => navigate(s.path)}
                className="text-left border border-border/60 rounded-xl p-4 hover:shadow-sm hover:bg-muted/30 transition-all space-y-2"
              >
                <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold leading-snug">{s.statement}</p>
              </button>
            ))}
          </div>

          {/* AI analysis area */}
          <div className="mx-6 mb-6 bg-muted/30 border border-border/40 rounded-xl px-5 py-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This lower analysis area is AI-driven. It can interpret your broader Body data and generate
              observations about whether sleep, nutrition, activity, or other body systems are helping or
              hurting your glow-up progress.
            </p>
          </div>
        </div>

        {/* ── 9. Trends (outside card wrapper, just label + grid) ── */}
        <HygieneTrends routines={routines} />

        <div className="h-4" />
      </div>
    </div>
  );
}
