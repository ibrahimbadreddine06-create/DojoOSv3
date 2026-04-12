import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles, Plus, Check, Trash2, Flame, Calendar,
  ListChecks, Star, TrendingUp, Zap, Users,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MetricRing } from "@/components/body/metric-ring";
import { TodaySessions } from "@/components/today-sessions";
import { ModuleBriefing } from "../module-briefing";
import { ModuleGrid } from "@/components/body/module-grid";
import type { WidgetDefinition, WidgetRenderContext } from "@/components/body/module-grid";

const TODAY = format(new Date(), "yyyy-MM-dd");
const FREQ_DAYS: Record<string, number>   = { daily: 1, weekly: 7, monthly: 30 };
const FREQ_LABELS: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

function isCompletedToday(r: any)     { return r.lastCompletedDate === TODAY; }
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
  if (score >= 70)  return "You usually try to do this more often";
  return "Your target rhythm suggests doing this again now";
}

const PRESET_HABITS = [
  "Shower", "AM skincare", "PM skincare", "Brush teeth", "Floss",
  "Body moisturising", "Body scrub", "Nail care", "Beard oil",
  "Hair routine", "Face mask", "Minoxidil", "Derma roller", "Hammam visit",
];

function ringSizeFor(ctx: WidgetRenderContext): "sm" | "md" | "lg" {
  if (ctx.size.h <= 1 || ctx.size.w <= 1 && ctx.shape === "square") return "sm";
  if (ctx.shape === "horizontal" || ctx.size.h === 2) return "md";
  return "lg";
}

function AddRoutineDialog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/hygiene-routines", { name: name.trim(), frequency, date: TODAY, completed: false, streak: 0, bestStreak: 0 }),
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
        <Button size="sm"
          className="gap-1.5 shrink-0 shadow-sm rounded-xl bg-violet-500 hover:bg-violet-600 border-none text-white">
          <Plus className="w-4 h-4" /> Log care
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
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${name === h
                    ? "bg-violet-500 text-white border-violet-500"
                    : "border-border text-muted-foreground hover:border-violet-400 hover:text-violet-500"}`}>{h}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Custom</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="e.g. Derma roller, Hammam visit..." value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name && addMutation.mutate()} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frequency</label>
            <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background"
              value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Button className="w-full rounded-xl bg-violet-500 hover:bg-violet-600 border-none text-white"
            onClick={() => addMutation.mutate()} disabled={!name.trim() || addMutation.isPending}>
            {addMutation.isPending ? "Adding..." : "Add routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HygienePage() {
  const [, navigate] = useLocation();

  const { data: routines = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/hygiene-routines"] });
  const { data: dailyState }               = useQuery<any>({ queryKey: [`/api/daily-state/${TODAY}`] });

  const total = routines.length;

  const upkeepScore = useMemo(() => {
    if (total === 0) return null;
    const w: any = { daily: 3, weekly: 2, monthly: 1 };
    let earned = 0, possible = 0;
    for (const r of routines) {
      const wt = w[r.frequency] ?? 1; possible += wt;
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

  const upkeepColor    = upkeepScore    === null ? "#9ca3af" : upkeepScore    >= 70 ? "#8b5cf6" : upkeepScore    >= 40 ? "#f59e0b" : "#ef4444";
  const disciplineColor = disciplineRate === null ? "#9ca3af" : disciplineRate >= 70 ? "#60a5fa" : disciplineRate >= 40 ? "#f59e0b" : "#ef4444";
  const glowColor  = glowDirection === "Up" ? "#f97316" : glowDirection === "Down" ? "#ef4444" : "#9ca3af";
  const glowValue  = glowDirection === "Up" ? 80 : glowDirection === "Down" ? 30 : 50;

  const recommended = useMemo(() =>
    routines.filter((r) => !isCompletedToday(r))
      .map((r) => ({ ...r, score: relevanceScore(r) }))
      .filter((r) => r.score >= 40).sort((a, b) => b.score - a.score).slice(0, 5),
    [routines]);

  const progressCards = useMemo(() => routines.map((r) => {
    const d = daysSinceFor(r), interval = FREQ_DAYS[r.frequency] || 7;
    const pct = d !== null ? Math.min(100, Math.round((d / interval) * 100)) : 100;
    return { routine: r, daysSince: d, interval, pct };
  }), [routines]);

  const crossBodySignals = [
    { label: "Sleep",      statement: dailyState?.recoveryScore >= 70 ? "Good recovery supporting repair" : "Low sleep is hurting appearance", path: "/body/sleep" },
    { label: "Nutrition",  statement: "Iron intake affects vitality",        path: "/body/nutrition" },
    { label: "Activity",   statement: "Missing composition goals",           path: "/body/activity" },
    { label: "Discipline", statement: "Higher skip rate on late days",       path: "/planner" },
  ];

  const showNoDataBanner = !isLoading && total === 0;

  const widgets: WidgetDefinition[] = useMemo(() => [
    // ── AI Briefing ──────────────────────────────────────────────────────────
    {
      id: "briefing", label: "AI Briefing", icon: Sparkles,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Briefing Card" }],
      render: () => (
        <ModuleBriefing title="Briefing" kicker="Sensei AI" accentColor="bg-violet-500/10"
          content={showNoDataBanner
            ? "No care routines added yet. Start building your hygiene and looks protocol."
            : recommended.length > 0
              ? "Some care routines are reaching their recommended interval."
              : "All care routines are on track based on your personal cadence."} />
      ),
    },
    // ── Hero rings ───────────────────────────────────────────────────────────
    {
      id: "upkeep_ring", label: "Upkeep Score", icon: Star,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/looks/metric/upkeepScore")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={upkeepScore ?? 0} max={100} label="Upkeep Score" color={upkeepColor} size={ringSizeFor(ctx)} sublabel="this week" />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "discipline_ring", label: "Discipline", icon: Zap,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/looks/metric/disciplineRate")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={disciplineRate ?? 0} max={100} label="Discipline" unit="%" color={disciplineColor} size={ringSizeFor(ctx)} sublabel="consistency" />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "glow_ring", label: "Glow-up Direction", icon: TrendingUp,
      defaultW: 1, defaultH: 2,
      visualizations: [
        { id: "ring", label: "Ring" },
        { id: "gauge", label: "Gauge" },
      ],
      render: (ctx: WidgetRenderContext) => (
        <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 rounded-2xl shadow-sm h-full"
          onClick={() => navigate("/body/looks/metric/glowUpDirection")}>
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-center h-full">
            <MetricRing value={glowValue} max={100} label="Glow-up" color={glowColor} size={ringSizeFor(ctx)} sublabel={`${glowDirection} trend`} />
          </CardContent>
        </Card>
      ),
    },
    // ── Sections ─────────────────────────────────────────────────────────────
    ...(recommended.length > 0 ? recommended.map((routine) => ({
      id: `recommended_${routine.id}`, label: routine.name, icon: ListChecks,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "list", label: "List" },
        { id: "alert", label: "Alert Card" },
      ],
      render: () => (
        <button type="button" onClick={() => navigate("/planner")} className="flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{routine.name}</p>
          <p className="text-sm font-medium leading-tight text-indigo-500">{contextMessage(routine.score)}</p>
        </button>
      ),
    })) : [{
      id: "recommended_clear", label: "All Routines On Track", icon: Sparkles,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "status", label: "Status Card" },
        { id: "card", label: "Card" },
      ],
      render: () => (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10">
            <Sparkles className="h-5 w-5 text-green-500/70" />
          </div>
          <p className="text-sm font-semibold">All routines on track</p>
        </div>
      ),
    }]),
    {
      id: "today_sessions", label: "Today's Sessions", icon: ListChecks,
      defaultW: 3, defaultH: 2,
      allowedSizes: [{ w: 3, h: 2 }, { w: 3, h: 3 }],
      visualizations: [{ id: "default", label: "Sessions List" }],
      render: () => <TodaySessions module="hygiene" />,
    },
    ...progressCards.map(({ routine, daysSince: d, pct }) => {
      const fillColor = isCompletedToday(routine) ? "#8b5cf6" : pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e";
      return {
        id: `progress_${routine.id}`, label: routine.name, icon: Flame,
        defaultW: 1, defaultH: 1,
        visualizations: [
          { id: "bar", label: "Bar" },
          { id: "streak", label: "Streak" },
        ],
        render: () => (
          <button type="button" onClick={() => navigate(`/body/looks/metric/${routine.id}`)} className="flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{(FREQ_LABELS[routine.frequency] || routine.frequency).toLowerCase()}</p>
              <p className="mt-1 text-sm font-bold leading-tight tracking-tight">{routine.name}</p>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-tight text-muted-foreground/40 tabular-nums">
                <span>{d === null ? "Never" : d === 0 ? "Today" : `${d}d ago`}</span>
                {routine.streak > 0 && <span className="flex items-center gap-0.5 text-orange-500"><Flame className="h-2 w-2" /> {routine.streak}</span>}
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: fillColor }} />
              </div>
            </div>
          </button>
        ),
      };
    }),
    ...crossBodySignals.map((s) => ({
      id: `cross_body_${s.label.toLowerCase().replace(/\W+/g, "_")}`, label: s.label, icon: Users,
      defaultW: 1, defaultH: 1,
      visualizations: [
        { id: "impact", label: "Impact Card" },
        { id: "card", label: "Card" },
      ],
      render: () => (
        <button type="button" onClick={() => navigate(s.path)} className="flex h-full w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{s.label}</p>
          <p className="text-sm font-bold leading-snug transition-colors hover:text-purple-500">{s.statement}</p>
        </button>
      ),
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [upkeepScore, disciplineRate, glowValue, glowDirection, upkeepColor, disciplineColor, glowColor,
      recommended, progressCards, crossBodySignals, routines, showNoDataBanner, isLoading, total]);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Body</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Hygiene & Looks</h1>
        </div>
        <AddRoutineDialog />
      </div>
      <ModuleGrid widgets={widgets} storageKey="moduleGrid_hygiene_v1" />
    </div>
  );
}
