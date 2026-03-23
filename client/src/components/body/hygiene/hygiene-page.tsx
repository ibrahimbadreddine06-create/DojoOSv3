import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles, AlertCircle, Plus, Flame, Check, Trash2,
  Moon, Utensils, Dumbbell, Target, TrendingUp, TrendingDown,
  ChevronRight, Calendar, ArrowUpRight,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MetricRing } from "@/components/body/metric-ring";
import { LinkedHygieneBlocks } from "./linked-hygiene-blocks";
import { HygieneTrends } from "./hygiene-trends";

const TODAY = format(new Date(), "yyyy-MM-dd");
const FREQ_LABELS: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
const FREQ_DAYS: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 };

function isCompletedToday(r: any) { return r.lastCompletedDate === TODAY; }
function daysSince(r: any): number | null {
  if (!r.lastCompletedDate) return null;
  return differenceInDays(new Date(), new Date(r.lastCompletedDate));
}
function relevanceScore(r: any): number {
  const d = daysSince(r);
  if (d === null) return 100;
  return Math.round((d / (FREQ_DAYS[r.frequency] || 7)) * 100);
}

// ─── Preset habits for dialog ─────────────────────────────────────────────────
const PRESET_HABITS = [
  "Shower", "Skincare routine", "Brush teeth", "Floss",
  "Body moisturising", "Body scrub", "Nail care",
  "Beard care", "Hair routine", "Face mask", "Minoxidil",
  "Derma roller", "Hammam visit",
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
    onError: () => toast({ title: "Failed to add routine", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" data-testid="button-log-care">
          <Plus className="w-4 h-4" /> Log care
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add care routine</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick pick</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pb-1">
              {PRESET_HABITS.map((h) => (
                <button
                  key={h} type="button" onClick={() => setName(h)}
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
              placeholder="e.g. Hammam visit, Derma roller..."
              value={name} onChange={(e) => setName(e.target.value)}
              data-testid="input-routine-name"
              onKeyDown={(e) => e.key === "Enter" && name && addMutation.mutate()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frequency</label>
            <select
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none"
              value={frequency} onChange={(e) => setFrequency(e.target.value)}
              data-testid="select-routine-frequency"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Button className="w-full rounded-xl" onClick={() => addMutation.mutate()} disabled={!name.trim() || addMutation.isPending}>
            {addMutation.isPending ? "Adding..." : "Add routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Recommended Now (full width, strong) ────────────────────────────────────
function RecommendedNow({ routines }: { routines: any[] }) {
  const recommended = useMemo(() =>
    routines
      .filter((r) => !isCompletedToday(r))
      .map((r) => ({ ...r, score: relevanceScore(r) }))
      .filter((r) => r.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    [routines]
  );

  const urgencyFor = (score: number) =>
    score >= 90 ? { label: "Due now", color: "#ef4444" }
    : score >= 70 ? { label: "Becoming relevant", color: "#f59e0b" }
    : { label: "Upcoming", color: "#8b5cf6" };

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/40">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Recommended now based on recency
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Routines becoming relevant based on your own cadence and self-care rhythm
        </p>
      </div>

      {recommended.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-green-500/70" />
          </div>
          <div>
            <p className="text-sm font-semibold">All routines on track</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nothing is falling behind based on your personal cadence. Keep it up.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {recommended.map((routine) => {
            const d = daysSince(routine);
            const interval = FREQ_DAYS[routine.frequency] || 7;
            const urgency = urgencyFor(routine.score);
            return (
              <div key={routine.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                {/* Left: urgency dot + info */}
                <div
                  className="shrink-0 w-2 h-10 rounded-full"
                  style={{ backgroundColor: urgency.color, opacity: 0.7 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{routine.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {d === null
                      ? "Never done — worth starting"
                      : d === 0
                      ? "Done today"
                      : `${d}d since last · usually every ${interval}d`}
                  </p>
                </div>
                {/* Right: frequency + urgency */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 h-auto"
                    style={{ color: urgency.color, borderColor: `${urgency.color}40` }}
                  >
                    {urgency.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{FREQ_LABELS[routine.frequency]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {routines.length === 0 && (
        <div className="px-6 pb-6 pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground">Add routines to see what's becoming relevant based on your cadence.</p>
        </div>
      )}
    </div>
  );
}

// ─── Routine Progress Card ────────────────────────────────────────────────────
function RoutineCard({ routine }: { routine: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const done = isCompletedToday(routine);
  const d = daysSince(routine);
  const interval = FREQ_DAYS[routine.frequency] || 7;
  const fillPct = d !== null ? Math.min(100, Math.round((d / interval) * 100)) : 100;
  const fillColor = done ? "#8b5cf6" : fillPct >= 90 ? "#ef4444" : fillPct >= 60 ? "#f59e0b" : "#22c55e";

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

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${done ? "border-violet-500/30 bg-violet-500/5" : "border-border/60 bg-card hover:shadow-sm"}`}
      data-testid={`card-routine-${routine.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Completion button */}
        <button
          onClick={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}
          className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            done ? "bg-violet-500 border-violet-500 text-white" : "border-muted-foreground/30 hover:border-violet-400"
          }`}
          data-testid={`button-toggle-routine-${routine.id}`}
        >
          {done && <Check className="w-3 h-3" />}
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
              {routine.name}
            </span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">
              {FREQ_LABELS[routine.frequency] || routine.frequency}
            </Badge>
          </div>

          {/* Recency bar + metadata */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-medium">
                {d === null ? "Never done" : d === 0 ? "Done today" : `${d}d since last`}
              </span>
              <div className="flex items-center gap-3">
                {routine.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-500 font-semibold">
                    <Flame className="w-2.5 h-2.5" />
                    {routine.streak} streak
                  </span>
                )}
                <span className="text-muted-foreground/60">every {interval}d</span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(fillPct, 100)}%`, backgroundColor: fillColor }}
              />
            </div>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => deleteMutation.mutate()}
          data-testid={`button-delete-routine-${routine.id}`}
          className="shrink-0 p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Cross-Body Impact ────────────────────────────────────────────────────────
function CrossBodyImpact({ dailyState }: { dailyState?: any }) {
  const [, navigate] = useLocation();

  const cards = [
    {
      icon: Moon, title: "Sleep", path: "/body/sleep", color: "#6366f1",
      metric: dailyState?.recoveryScore ?? null, metricLabel: "recovery",
      body: dailyState?.recoveryScore
        ? dailyState.recoveryScore >= 70
          ? "Good overnight recovery is supporting skin repair and appearance refresh."
          : "Low recovery may slow skin repair and reduce morning freshness."
        : "Sleep quality shapes overnight skin recovery. Log sleep to see your impact.",
      trend: dailyState?.recoveryScore ? (dailyState.recoveryScore >= 70 ? "up" : "down") : null,
    },
    {
      icon: Utensils, title: "Nutrition", path: "/body/nutrition", color: "#f97316",
      metric: null, metricLabel: null,
      body: "Hydration, skin-supportive nutrients, and dietary quality all affect vitality and appearance.",
      trend: null,
    },
    {
      icon: Dumbbell, title: "Activity", path: "/body/activity", color: "#ef4444",
      metric: null, metricLabel: null,
      body: "Exercise drives circulation, body composition, and the physical baseline behind glow-up.",
      trend: null,
    },
    {
      icon: Target, title: "Discipline", path: "/planner", color: "#14b8a6",
      metric: null, metricLabel: null,
      body: "Daily planner consistency is the core engine of routine follow-through and self-care execution.",
      trend: null,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Cross-body impact
        </p>
        <p className="text-xs text-muted-foreground">
          How the rest of your body systems support or hinder glow-up progress
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.title}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(c.path)}
            >
              <CardContent className="p-5 flex flex-col gap-4">
                {/* Top row: icon + title + trend */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${c.color}18` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: c.color }} />
                    </div>
                    <span className="text-sm font-semibold">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    {c.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                    {c.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    {c.trend === null && <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>

                {/* Metric value */}
                {c.metric !== null && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: c.color }}>
                      {c.metric}
                    </span>
                    {c.metricLabel && (
                      <span className="text-xs text-muted-foreground">{c.metricLabel}</span>
                    )}
                  </div>
                )}

                {/* Body copy */}
                <p className="text-[11px] text-muted-foreground leading-relaxed">{c.body}</p>
              </CardContent>
            </Card>
          );
        })}
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
    const weights: any = { daily: 3, weekly: 2, monthly: 1 };
    let earned = 0, possible = 0;
    for (const r of routines) {
      const w = weights[r.frequency] ?? 1;
      possible += w;
      if (isCompletedToday(r)) earned += w;
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
    if (total === 0) return "neutral";
    const avgS = routines.reduce((a, r) => a + (r.streak || 0), 0) / total;
    const avgB = routines.reduce((a, r) => a + (r.bestStreak || 0), 0) / total;
    if (avgS >= avgB * 0.8 && avgS > 0) return "up";
    if (avgS < avgB * 0.4 && avgB > 0) return "down";
    return "neutral";
  }, [routines]);

  const upkeepColor = upkeepScore === null ? "#6b7280" : upkeepScore >= 70 ? "#22c55e" : upkeepScore >= 40 ? "#f59e0b" : "#ef4444";
  const disciplineColor = disciplineRate === null ? "#6b7280" : disciplineRate >= 70 ? "#22c55e" : disciplineRate >= 40 ? "#f59e0b" : "#ef4444";
  const glowColor = glowDirection === "up" ? "#22c55e" : glowDirection === "down" ? "#ef4444" : "#8b5cf6";
  const glowValue = glowDirection === "up" ? 80 : glowDirection === "down" ? 25 : 55;

  const showNoDataBanner = !isLoading && total === 0;
  const showDriftBanner = !showNoDataBanner && !isLoading && upkeepScore !== null && upkeepScore < 30;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700">
      <div className="space-y-6">

        {/* ── 1. Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Hygiene & Looks</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Self-care, grooming &amp; glow-up execution
            </p>
          </div>
          <AddRoutineDialog />
        </div>

        {/* ── 2. Status Banner ── */}
        {showNoDataBanner && (
          <div className="flex items-start gap-3 bg-violet-500/8 border border-violet-500/20 rounded-2xl px-5 py-4">
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">No routines yet</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Tap <strong>Log care</strong> to add your first routine. Your cadence, streaks, and glow-up progress will build from there.
              </p>
            </div>
          </div>
        )}
        {showDriftBanner && (
          <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">Upkeep is drifting</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Your completion rate is low. Some routines you usually follow are slipping — worth a check-in.
              </p>
            </div>
          </div>
        )}

        {/* ── 3. Hero Metrics Row ── */}
        <div className="grid grid-cols-3 gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/upkeepScore")}
            data-testid="hero-upkeep-score"
          >
            <CardContent className="p-5 flex items-center justify-center min-h-[160px]">
              <MetricRing
                value={upkeepScore ?? 0} max={100}
                label="Upkeep Score" color={upkeepColor} size="lg" sublabel="today"
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/disciplineRate")}
            data-testid="hero-discipline-rate"
          >
            <CardContent className="p-5 flex items-center justify-center min-h-[160px]">
              <MetricRing
                value={disciplineRate ?? 0} max={100}
                label="Discipline" unit="%" color={disciplineColor} size="lg" sublabel="consistency"
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/glowUpDirection")}
            data-testid="hero-glow-direction"
          >
            <CardContent className="p-5 flex items-center justify-center min-h-[160px]">
              <MetricRing
                value={glowValue} max={100}
                label="Glow-up"
                color={glowColor}
                size="lg"
                sublabel={
                  glowDirection === "up" ? "↑ trending up"
                  : glowDirection === "down" ? "↓ drifting"
                  : "— holding steady"
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Toggle: Linked Blocks / Presets (outside the content box) ── */}
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

        {/* ── 5. Recommended Now (full-width, primary featured section) ── */}
        <RecommendedNow routines={routines} />

        {/* ── 6. Planner Connection (Linked Blocks or Presets) ── */}
        {blockTab === "linked" ? (
          <LinkedHygieneBlocks />
        ) : (
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Presets</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save routine blocks as reusable presets in the planner for quick daily scheduling.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {["Morning care", "Evening skincare", "Weekly grooming", "Deep care session"].map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground/60"
                  >
                    <Plus className="w-3.5 h-3.5" /> {p}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/planner")}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-500/70 hover:text-violet-500 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Manage presets in planner
              </button>
            </div>
          </div>
        )}

        {/* ── 7. Progress Section ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your self-care habits · recency, cadence &amp; follow-through
              </p>
            </div>
            {total > 0 && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                {completedToday} / {total} today
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 border border-dashed border-border rounded-2xl text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/8 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-violet-400/60" />
              </div>
              <div>
                <p className="text-sm font-semibold">No routines set up yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your first care habit to start tracking cadence, streaks, and glow-up progress.
                </p>
              </div>
              <AddRoutineDialog />
            </div>
          ) : (
            <div className="space-y-3">
              {routines.map((r) => <RoutineCard key={r.id} routine={r} />)}
            </div>
          )}
        </div>

        {/* ── 8. Cross-Body Impact ── */}
        <CrossBodyImpact dailyState={dailyState} />

        {/* ── 9. Trends ── */}
        <HygieneTrends
          upkeepScore={upkeepScore}
          disciplineRate={disciplineRate}
          routines={routines}
        />

        <div className="h-4" />
      </div>
    </div>
  );
}
