import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles, Plus, Check, Trash2, Flame, Calendar,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MetricRing } from "@/components/body/metric-ring";
import { TodaySessions } from "@/components/today-sessions";
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
function contextMessage(score: number): string {
  if (score >= 120) return "This is starting to drift from your normal upkeep";
  if (score >= 100) return "Recommended window is approaching again";
  if (score >= 70) return "You usually try to do this more often";
  return "Your target rhythm suggests doing this again now";
}

const PRESET_HABITS = [
  "Shower", "AM skincare", "PM skincare", "Brush teeth", "Floss",
  "Body moisturising", "Body scrub", "Nail care", "Beard oil",
  "Hair routine", "Face mask", "Minoxidil", "Derma roller", "Hammam visit",
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
        <Button size="sm" className="gap-2 bg-red-500 hover:bg-red-600 text-white" data-testid="button-log-care">
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
              onKeyDown={(e) => e.key === "Enter" && name && addMutation.mutate()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frequency</label>
            <select
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background"
              value={frequency} onChange={(e) => setFrequency(e.target.value)}
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

type BlockTab = "linked" | "presets";

export function HygienePage() {
  const [, navigate] = useLocation();
  const [blockTab, setBlockTab] = useState<BlockTab>("linked");

  const { data: routines = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
  const { data: dailyState } = useQuery<any>({ queryKey: [`/api/daily-state/${TODAY}`] });

  const total = routines.length;

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
    if (total === 0) return "Steady";
    const avgS = routines.reduce((a, r) => a + (r.streak || 0), 0) / total;
    const avgB = routines.reduce((a, r) => a + (r.bestStreak || 0), 0) / total;
    if (avgS >= avgB * 0.8 && avgS > 0) return "Up";
    if (avgS < avgB * 0.4 && avgB > 0) return "Down";
    return "Steady";
  }, [routines]);

  const upkeepColor = upkeepScore === null ? "#9ca3af" : upkeepScore >= 70 ? "#8b5cf6" : upkeepScore >= 40 ? "#f59e0b" : "#ef4444";
  const disciplineColor = disciplineRate === null ? "#9ca3af" : disciplineRate >= 70 ? "#60a5fa" : disciplineRate >= 40 ? "#f59e0b" : "#ef4444";
  
  const glowColor = glowDirection === "Up" ? "#f97316" : glowDirection === "Down" ? "#ef4444" : "#9ca3af";
  const glowValue = glowDirection === "Up" ? 80 : glowDirection === "Down" ? 30 : 50;

  const recommended = useMemo(() =>
    routines
      .filter((r) => !isCompletedToday(r))
      .map((r) => ({ ...r, score: relevanceScore(r) }))
      .filter((r) => r.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    [routines]
  );

  const progressCards = useMemo(() => {
    return routines.map((r) => {
      const d = daysSinceFor(r);
      const interval = FREQ_DAYS[r.frequency] || 7;
      const pct = d !== null ? Math.min(100, Math.round((d / interval) * 100)) : 100;
      return { routine: r, daysSince: d, interval, pct };
    });
  }, [routines]);

  const showNoDataBanner = !isLoading && total === 0;

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

        {/* ── 2. Banner ── */}
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
        <div className="grid grid-cols-3 gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/upkeepScore")}
            data-testid="hero-upkeep-score"
          >
            <CardContent className="p-5 flex items-center justify-center">
              <MetricRing
                value={upkeepScore ?? 0} max={100}
                label="Upkeep Score" color={upkeepColor} size="lg" sublabel="this week"
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/body/looks/metric/disciplineRate")}
            data-testid="hero-discipline-rate"
          >
            <CardContent className="p-5 flex items-center justify-center">
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
            <CardContent className="p-5 flex items-center justify-center">
              <MetricRing
                value={glowValue} max={100}
                label="Glow-up" color={glowColor} size="lg" sublabel={`${glowDirection} trend`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Recommended Now (Glow-up Execution) ── */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-border/40">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Glow-up Execution</p>
              <h2 className="text-xl font-bold mt-1">Recommended now based on recency</h2>
            </div>
            <button className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
              View all routines
            </button>
          </div>

          {recommended.length === 0 ? (
            <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-11 h-11 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-500/70" />
              </div>
              <div>
                <p className="text-sm font-semibold">All routines on track</p>
                <p className="text-xs text-muted-foreground mt-0.5">Nothing is falling behind based on your personal cadence.</p>
              </div>
              {showNoDataBanner && <AddRoutineDialog />}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recommended.map((routine) => {
                const d = daysSinceFor(routine);
                let lastLabel = "Never done";
                if (d !== null) {
                  if (d === 0) lastLabel = "last done today";
                  else if (d < 2) lastLabel = `last done ${d === 1 ? "yesterday" : `${d} days ago`}`;
                  else lastLabel = `last done ${d} days ago`;
                  const hrs = Math.round(differenceInDays(new Date(), new Date(routine.lastCompletedDate)) * 24);
                  if (d === 0 && hrs > 0) lastLabel = `last done ${hrs}h ago`;
                }

                return (
                  <div key={routine.id} className="px-6 py-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{routine.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{lastLabel}</p>
                      <p className="text-[11px] mt-0.5 text-indigo-500">{contextMessage(routine.score)}</p>
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

        {/* ── 5. Toggle (Moved here, just above Planner Connection) ── */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
          {(["linked", "presets"] as BlockTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setBlockTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                blockTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "linked" ? "Linked time blocks" : "Presets"}
            </button>
          ))}
        </div>

        {/* ── 6. Planner Connection ── */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Planner Connection</p>
            <h2 className="text-xl font-bold mt-1">
              {blockTab === "linked" ? "Linked blocks / presets pattern" : "Presets"}
            </h2>
          </div>

          {blockTab === "linked" ? (
            <div className="px-6 pb-6 pt-4">
              <TodaySessions module="hygiene" />
            </div>
          ) : (
            <div className="px-6 pb-6 pt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {["Morning care", "Evening skincare", "Weekly grooming", "Deep care session"].map((p) => (
                  <div key={p} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground/60">
                    <Plus className="w-3.5 h-3.5" /> {p}
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/planner")} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-500/70 hover:text-violet-500 transition-colors">
                <Calendar className="w-3.5 h-3.5" /> Manage presets in planner
              </button>
            </div>
          )}
        </div>

        {/* ── 7. Progress ── */}
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
            <div className="px-6 pb-8 space-y-5">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm font-semibold text-muted-foreground">No routines tracked yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-[250px]">
                  Add a routine to see your goal-linked progress and cadence populate here.
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <AddRoutineDialog />
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {progressCards.map(({ routine, daysSince: d, pct }) => {
                  const fillColor = isCompletedToday(routine) ? "#8b5cf6" : pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e";
                  return (
                    <div key={routine.id} className="border border-border/60 rounded-xl p-4 space-y-3 bg-card hover:shadow-sm transition-all cursor-pointer" onClick={() => navigate(`/body/looks/metric/${routine.id}`)}>
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

          <div className="px-6 pb-6 grid grid-cols-4 gap-3">
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
        </div>

        {/* ── 9. Trends ── */}
        <HygieneTrends routines={routines} />

        <div className="h-4" />
      </div>
    </div>
  );
}
