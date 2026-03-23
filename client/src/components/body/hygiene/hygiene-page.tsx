import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Sparkles, AlertCircle, Plus, Flame, ArrowUp, ArrowRight,
  Wind, Moon, Utensils, Dumbbell, Target, Clock, Check, Trash2,
  TrendingUp, TrendingDown, Minus, ChevronRight,
} from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { MetricRing } from "@/components/body/metric-ring";
import { SectionLabel } from "./section-label";
import { LinkedHygieneBlocks } from "./linked-hygiene-blocks";
import { HygieneTrends } from "./hygiene-trends";

const TODAY = format(new Date(), "yyyy-MM-dd");

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const FREQUENCY_INTERVAL_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

function isCompletedToday(routine: any) {
  return routine.lastCompletedDate === TODAY;
}

function getDaysSinceLast(routine: any): number | null {
  if (!routine.lastCompletedDate) return null;
  return differenceInDays(new Date(), new Date(routine.lastCompletedDate));
}

function getRelevanceScore(routine: any): number {
  const daysSince = getDaysSinceLast(routine);
  if (daysSince === null) return 100; // never done = most relevant
  const interval = FREQUENCY_INTERVAL_DAYS[routine.frequency] || 7;
  return Math.round((daysSince / interval) * 100);
}

// ─── Add Routine Dialog ─────────────────────────────────────────────────────

const PRESET_HABITS = [
  "Shower", "Skincare routine", "Brush teeth", "Floss",
  "Body moisturising", "Body scrub", "Nail care",
  "Beard care", "Hair routine", "Face mask", "Minoxidil",
];

function AddRoutineDialog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/hygiene-routines", {
        name: name.trim(),
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
        <Button size="sm" className="gap-2" data-testid="button-log-care">
          <Plus className="w-4 h-4" /> Log care
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add care routine</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Preset quick-pick */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Quick pick</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {PRESET_HABITS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setName(h)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    name === h
                      ? "bg-violet-500 text-white border-violet-500"
                      : "border-border text-muted-foreground hover:border-violet-400 hover:text-violet-500"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Custom name</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              placeholder="e.g. Hammam visit, Derma roller..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-routine-name"
              onKeyDown={(e) => e.key === "Enter" && name && addMutation.mutate()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Frequency</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              data-testid="select-routine-frequency"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <Button
            className="w-full"
            onClick={() => addMutation.mutate()}
            disabled={!name.trim() || addMutation.isPending}
          >
            {addMutation.isPending ? "Adding..." : "Add routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Routine Card (progress section) ─────────────────────────────────────────

function RoutineProgressCard({ routine }: { routine: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const done = isCompletedToday(routine);
  const daysSince = getDaysSinceLast(routine);
  const interval = FREQUENCY_INTERVAL_DAYS[routine.frequency] || 7;
  const recencyPct = daysSince !== null ? Math.min(100, Math.round((daysSince / interval) * 100)) : 100;

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
        return apiRequest("PATCH", `/api/hygiene-routines/${routine.id}`, {
          lastCompletedDate: TODAY,
          completed: true,
          streak: newStreak,
          bestStreak: Math.max(routine.bestStreak || 0, newStreak),
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

  const recencyColor =
    recencyPct >= 90 ? "#ef4444" : recencyPct >= 60 ? "#f59e0b" : "#22c55e";

  return (
    <div
      className={`border rounded-2xl p-4 transition-all ${
        done ? "border-violet-500/40 bg-violet-500/5" : "border-border/60 bg-card"
      }`}
      data-testid={`card-routine-${routine.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Completion toggle */}
        <button
          onClick={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
          className={`shrink-0 mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            done
              ? "bg-violet-500 border-violet-500 text-white"
              : "border-muted-foreground/30 hover:border-violet-400"
          }`}
          data-testid={`button-toggle-routine-${routine.id}`}
        >
          {done && <Check className="w-3.5 h-3.5" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
              {routine.name}
            </span>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
              {FREQUENCY_LABELS[routine.frequency] || routine.frequency}
            </Badge>
          </div>

          {/* Recency bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">
                {daysSince === null
                  ? "Never done"
                  : daysSince === 0
                  ? "Done today"
                  : `${daysSince}d ago`}
              </span>
              {routine.streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <Flame className="w-2.5 h-2.5" /> {routine.streak}
                </span>
              )}
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(recencyPct, 100)}%`, backgroundColor: recencyColor }}
              />
            </div>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => deleteMutation.mutate()}
          data-testid={`button-delete-routine-${routine.id}`}
          className="shrink-0 p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Recommended Now Card ─────────────────────────────────────────────────────

function RecommendedNowSection({ routines }: { routines: any[] }) {
  const recommended = useMemo(() => {
    return routines
      .filter((r) => !isCompletedToday(r))
      .map((r) => ({ ...r, score: getRelevanceScore(r) }))
      .filter((r) => r.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [routines]);

  if (recommended.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <SectionLabel>Recommended now based on your cadence</SectionLabel>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sparkles className="w-8 h-8 text-green-500/60" />
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">All routines on track</p>
          <p className="text-xs text-muted-foreground">
            Nothing is overdue based on your personal cadence. Keep it up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <SectionLabel>Recommended now based on your cadence</SectionLabel>
        <p className="text-xs text-muted-foreground -mt-1 mb-3">
          These routines are becoming relevant again based on your own rhythm and goals.
        </p>
      </div>
      <div className="px-4 pb-5 space-y-2">
        {recommended.map((routine) => {
          const daysSince = getDaysSinceLast(routine);
          const interval = FREQUENCY_INTERVAL_DAYS[routine.frequency] || 7;
          const urgency = routine.score >= 90 ? "high" : routine.score >= 70 ? "medium" : "low";
          const urgencyColor =
            urgency === "high" ? "#ef4444" : urgency === "medium" ? "#f59e0b" : "#8b5cf6";

          return (
            <div
              key={routine.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: urgencyColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{routine.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {daysSince === null
                    ? "Never done — worth starting"
                    : `${daysSince}d since last · usually every ${interval}d`}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] shrink-0"
                style={{ borderColor: `${urgencyColor}40`, color: urgencyColor }}
              >
                {urgency === "high" ? "Due now" : urgency === "medium" ? "Soon" : "Upcoming"}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cross-Body Impact Section ────────────────────────────────────────────────

function CrossBodyImpactSection({ bodyProfile, dailyState }: { bodyProfile?: any; dailyState?: any }) {
  const [, navigate] = useLocation();

  const signals = [
    {
      icon: <Moon className="w-4 h-4" />,
      title: "Sleep",
      path: "/body/sleep",
      color: "#6366f1",
      description: dailyState?.recoveryScore
        ? dailyState.recoveryScore >= 70
          ? "Good recovery supporting skin repair overnight"
          : "Low recovery may slow skin & appearance regeneration"
        : "Connect sleep data to see impact",
      value: dailyState?.recoveryScore ?? null,
      unit: "recovery",
      positive: dailyState?.recoveryScore ? dailyState.recoveryScore >= 70 : null,
    },
    {
      icon: <Utensils className="w-4 h-4" />,
      title: "Nutrition",
      path: "/body/nutrition",
      color: "#f97316",
      description: "Hydration, skin nutrients, and vitality markers affect appearance.",
      value: null,
      unit: null,
      positive: null,
    },
    {
      icon: <Dumbbell className="w-4 h-4" />,
      title: "Activity",
      path: "/body/activity",
      color: "#ef4444",
      description: "Exercise drives circulation and body composition, supporting glow-up goals.",
      value: null,
      unit: null,
      positive: null,
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: "Planner Discipline",
      path: "/planner",
      color: "#14b8a6",
      description: "Consistency in your daily blocks is the core driver of self-care follow-through.",
      value: null,
      unit: null,
      positive: null,
    },
  ];

  return (
    <div className="space-y-3">
      <SectionLabel>Cross-body impact</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {signals.map((s) => (
          <Card
            key={s.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(s.path)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.icon}
                </div>
                <div className="flex items-center gap-1">
                  {s.positive === true && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {s.positive === false && <TrendingDown className="w-3 h-3 text-red-400" />}
                  {s.positive === null && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              </div>
              <p className="text-xs font-semibold mb-1">{s.title}</p>
              {s.value !== null ? (
                <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>
                  {s.value}
                  {s.unit && <span className="text-xs font-normal text-muted-foreground ml-1">{s.unit}</span>}
                </p>
              ) : null}
              <p className="text-[10px] text-muted-foreground leading-snug mt-1">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type BlockTab = "linked" | "presets";

export function HygienePage() {
  const [, navigate] = useLocation();
  const [blockTab, setBlockTab] = useState<BlockTab>("linked");

  const { data: routines = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/hygiene-routines"],
  });

  const { data: bodyProfile } = useQuery<any>({
    queryKey: ["/api/body-profile"],
  });

  const { data: dailyState } = useQuery<any>({
    queryKey: [`/api/daily-state/${TODAY}`],
  });

  // ── Derived metrics ──────────────────────────────────────────────────────

  const completedToday = useMemo(
    () => routines.filter((r) => isCompletedToday(r)).length,
    [routines]
  );
  const total = routines.length;

  // Upkeep Score: weighted by frequency importance
  const upkeepScore = useMemo(() => {
    if (total === 0) return null;
    const weights = { daily: 3, weekly: 2, monthly: 1 };
    let earned = 0, possible = 0;
    for (const r of routines) {
      const w = (weights as any)[r.frequency] ?? 1;
      possible += w;
      if (isCompletedToday(r)) earned += w;
    }
    return possible > 0 ? Math.round((earned / possible) * 100) : 0;
  }, [routines]);

  // Discipline Rate: average streak / max possible vs frequency
  const disciplineRate = useMemo(() => {
    if (total === 0) return null;
    const streakScores = routines.map((r) => {
      const maxExpected = r.frequency === "daily" ? 14 : r.frequency === "weekly" ? 8 : 3;
      return Math.min(1, (r.streak || 0) / maxExpected);
    });
    return Math.round((streakScores.reduce((a, b) => a + b, 0) / streakScores.length) * 100);
  }, [routines]);

  // Glow-up Direction: trending up if avg streak increasing
  const glowDirection = useMemo(() => {
    if (total === 0) return "neutral";
    const avgStreak = routines.reduce((a, r) => a + (r.streak || 0), 0) / total;
    const avgBest = routines.reduce((a, r) => a + (r.bestStreak || 0), 0) / total;
    if (avgStreak >= avgBest * 0.8 && avgStreak > 0) return "up";
    if (avgStreak < avgBest * 0.4) return "down";
    return "neutral";
  }, [routines]);

  // Color helpers
  const upkeepColor =
    upkeepScore === null ? "#6b7280"
    : upkeepScore >= 70 ? "#22c55e"
    : upkeepScore >= 40 ? "#f59e0b"
    : "#ef4444";

  const disciplineColor =
    disciplineRate === null ? "#6b7280"
    : disciplineRate >= 70 ? "#22c55e"
    : disciplineRate >= 40 ? "#f59e0b"
    : "#ef4444";

  const glowColor =
    glowDirection === "up" ? "#22c55e"
    : glowDirection === "down" ? "#ef4444"
    : "#8b5cf6";

  const glowValue = glowDirection === "up" ? 75 : glowDirection === "down" ? 30 : 55;

  const showNoDataBanner = !isLoading && total === 0;
  const showDriftBanner =
    !showNoDataBanner && !isLoading && upkeepScore !== null && upkeepScore < 30;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in fade-in duration-700">
      <div className="space-y-6">

        {/* ── 1. Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Hygiene & Looks</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Self-care, grooming & glow-up execution
            </p>
          </div>
          <AddRoutineDialog />
        </div>

        {/* ── 2. Status Banner ── */}
        {showNoDataBanner && (
          <div className="flex items-start gap-3 bg-violet-500/8 border border-violet-500/20 rounded-2xl px-5 py-4">
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">No routines set up yet</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Tap <strong>Log care</strong> to add your first hygiene or grooming routine. Your cadence, streaks, and glow-up progress will build from there.
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
                Your completion rate is low today. A few routines you usually follow are slipping — worth a quick check-in with yourself.
              </p>
            </div>
          </div>
        )}

        {/* ── 3. Hero Metrics Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Upkeep Score */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/upkeepScore")}
            data-testid="hero-upkeep-score"
          >
            <CardContent className="p-5 flex items-center justify-center">
              <MetricRing
                value={upkeepScore ?? 0}
                max={100}
                label="Upkeep Score"
                color={upkeepColor}
                size="lg"
                sublabel="today"
              />
            </CardContent>
          </Card>

          {/* Discipline Rate */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/disciplineRate")}
            data-testid="hero-discipline-rate"
          >
            <CardContent className="p-5 flex items-center justify-center">
              <MetricRing
                value={disciplineRate ?? 0}
                max={100}
                label="Discipline"
                unit="%"
                color={disciplineColor}
                size="lg"
                sublabel="consistency"
              />
            </CardContent>
          </Card>

          {/* Glow-up Direction */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/glowUpDirection")}
            data-testid="hero-glow-direction"
          >
            <CardContent className="p-5 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <MetricRing
                  value={glowValue}
                  max={100}
                  label="Glow-up"
                  color={glowColor}
                  size="lg"
                  sublabel={glowDirection === "up" ? "↑ trending" : glowDirection === "down" ? "↓ drifting" : "— steady"}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Tab Toggle: Linked Blocks / Presets ── */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
          <button
            onClick={() => setBlockTab("linked")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              blockTab === "linked"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Linked time blocks
          </button>
          <button
            onClick={() => setBlockTab("presets")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              blockTab === "presets"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Presets
          </button>
        </div>

        {/* ── 5. Recommended Now (full width) ── */}
        <RecommendedNowSection routines={routines} />

        {/* ── 6. Linked Time Blocks / Presets ── */}
        {blockTab === "linked" ? (
          <LinkedHygieneBlocks />
        ) : (
          <div className="bg-card border border-border/60 rounded-2xl p-5">
            <SectionLabel>Presets</SectionLabel>
            <p className="text-sm text-muted-foreground mb-4">
              Presets let you quickly drop a routine block into your planner. Set them up in the planner.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Morning care", "Evening skincare", "Weekly grooming", "Deep care"].map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border/60 text-sm text-muted-foreground"
                >
                  <Plus className="w-3.5 h-3.5" /> {p}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/50 mt-3">
              Go to the planner to create and manage your presets.
            </p>
          </div>
        )}

        {/* ── 7. Progress Section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel className="mb-0">Progress</SectionLabel>
            {total > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {completedToday}/{total} today
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 border border-dashed border-border rounded-2xl">
              <Sparkles className="w-9 h-9 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Add routines to track your progress</p>
              <AddRoutineDialog />
            </div>
          ) : (
            <div className="space-y-2">
              {routines.map((r) => (
                <RoutineProgressCard key={r.id} routine={r} />
              ))}
            </div>
          )}
        </div>

        {/* ── 8. Cross-Body Impact ── */}
        <CrossBodyImpactSection bodyProfile={bodyProfile} dailyState={dailyState} />

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
