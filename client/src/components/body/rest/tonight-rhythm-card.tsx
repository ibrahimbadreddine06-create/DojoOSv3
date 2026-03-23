import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Wind, Zap, Brain, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { LineChart, Line, ResponsiveContainer } from "recharts";

// Placeholder 7-day bedtime consistency sparkline (minutes after midnight)
const BEDTIME_SPARKLINE = [
  { v: 23 }, { v: 22.5 }, { v: 23.5 }, { v: 24 }, { v: 23 }, { v: 22 }, { v: 23 },
];

interface TonightRhythmCardProps {
  windDownTime?: string | null;
  bedTarget?: string | null;
  wakeTarget?: string | null;
  sleepNeeded?: number | null;
  bestSleepWindow?: string | null;
  bestFocusBlock?: string | null;
  energyDipTime?: string | null;
  rhythmConsistency?: number | null; // 0–100
}

export function TonightRhythmCard({
  windDownTime = "22:00",
  bedTarget = "23:00",
  wakeTarget = "07:00",
  sleepNeeded = 8,
  bestSleepWindow = "23:00 – 07:00",
  bestFocusBlock = "09:00 – 11:30",
  energyDipTime = "14:00 – 15:30",
  rhythmConsistency = null,
}: TonightRhythmCardProps) {
  const [, navigate] = useLocation();

  const planningItems = [
    { icon: <Wind className="w-4 h-4 text-indigo-400" />, label: "Wind-down", value: windDownTime ?? "—", color: "#818cf8" },
    { icon: <Moon className="w-4 h-4 text-indigo-500" />, label: "Bed target", value: bedTarget ?? "—", color: "#6366f1" },
    { icon: <Sun className="w-4 h-4 text-amber-400" />, label: "Wake target", value: wakeTarget ?? "—", color: "#f59e0b" },
    { icon: <Zap className="w-4 h-4 text-violet-400" />, label: "Sleep needed", value: sleepNeeded ? `${sleepNeeded}h` : "—", color: "#a78bfa" },
  ];

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border/40 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Tonight & Rhythm</p>
          <h3 className="font-bold text-sm tracking-tight">Sleep planning & circadian guidance</h3>
        </div>
        {rhythmConsistency !== null && (
          <Badge
            variant="outline"
            className="text-[10px] font-bold"
            style={{
              borderColor: rhythmConsistency >= 70 ? "#22c55e40" : "#f59e0b40",
              color: rhythmConsistency >= 70 ? "#22c55e" : "#f59e0b",
              backgroundColor: rhythmConsistency >= 70 ? "#22c55e08" : "#f59e0b08",
            }}
          >
            {rhythmConsistency >= 70 ? "Consistent" : "Irregular"} rhythm
          </Badge>
        )}
      </div>

      {/* Planning row */}
      <div className="grid grid-cols-4 divide-x divide-border/40 border-b border-border/40">
        {planningItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1.5 px-3 py-4">
            {item.icon}
            <p className="font-mono font-black text-base tabular-nums leading-none" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Rhythm sparkline + insights */}
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Bedtime consistency — 7 days</p>
        </div>
        <div className="h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={BEDTIME_SPARKLINE}>
              <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} dot={{ r: 2.5, fill: "#6366f1", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Guidance chips */}
      <div className="px-5 py-4 space-y-2">
        <div className="flex items-start gap-3">
          <Moon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold">Best sleep window tonight</p>
            <p className="text-[11px] text-muted-foreground">{bestSleepWindow}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Brain className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold">Best focus block tomorrow</p>
            <p className="text-[11px] text-muted-foreground">{bestFocusBlock}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold">Energy dip expected</p>
            <p className="text-[11px] text-muted-foreground">{energyDipTime} — plan a short rest or walk</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-[10px] font-bold uppercase tracking-widest h-8 border-indigo-500/30 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-500/50 flex items-center gap-1.5"
          onClick={() => navigate("/planner")}
        >
          <Calendar className="w-3 h-3" />
          View planner
        </Button>
        <button className="text-[10px] font-bold uppercase tracking-widest h-8 px-3 rounded-md border border-dashed border-border/60 text-muted-foreground/60 hover:text-indigo-500 hover:border-indigo-500/40 transition-colors">
          Adjust targets
        </button>
      </div>
    </div>
  );
}
