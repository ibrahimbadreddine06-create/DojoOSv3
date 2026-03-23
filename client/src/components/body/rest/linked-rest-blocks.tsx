import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Wind, Moon, Coffee, Heart, CheckCircle2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { TimeBlock } from "@shared/schema";

const BLOCK_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  sleep: {
    icon: <Moon className="w-4 h-4" />,
    color: "#6366f1",
    label: "Sleep Block",
  },
  wind_down: {
    icon: <Wind className="w-4 h-4" />,
    color: "#818cf8",
    label: "Wind-down",
  },
  nap: {
    icon: <Coffee className="w-4 h-4" />,
    color: "#a78bfa",
    label: "Nap",
  },
  recovery: {
    icon: <Heart className="w-4 h-4" />,
    color: "#14b8a6",
    label: "Recovery",
  },
};

function getBlockConfig(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("wind")) return BLOCK_TYPE_CONFIG.wind_down;
  if (lower.includes("nap")) return BLOCK_TYPE_CONFIG.nap;
  if (lower.includes("recover")) return BLOCK_TYPE_CONFIG.recovery;
  return BLOCK_TYPE_CONFIG.sleep;
}

export function LinkedRestBlocks() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [, navigate] = useLocation();

  const { data: timeBlocks } = useQuery<TimeBlock[]>({
    queryKey: [`/api/time-blocks/${today}`],
  });

  const restBlocks = timeBlocks?.filter(
    (b) => b.linkedModule === "rest" || b.linkedModule === "sleep"
  ) || [];

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex justify-between items-baseline border-b border-border/50">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Linked Time Blocks</p>
          <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider">From daily planner · today</p>
        </div>
        <button
          onClick={() => navigate("/planner")}
          className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 hover:text-indigo-500 transition-colors"
        >
          Open planner →
        </button>
      </div>

      {/* Presets row */}
      <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap border-b border-border/30">
        <span className="text-[10px] text-muted-foreground/50 font-medium shrink-0">Quick add:</span>
        {["Sleep", "Wind-down", "Nap", "Recovery"].map((label) => (
          <button
            key={label}
            className="h-6 px-3 rounded-full border border-dashed border-border/60 text-[10px] font-medium text-muted-foreground/40 hover:border-indigo-500/40 hover:text-indigo-500 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      {/* Blocks */}
      <div className="p-4 space-y-3">
        {restBlocks.length === 0 ? (
          <div className="py-8 border border-dashed border-border/50 rounded-xl text-center space-y-1.5">
            <Moon className="w-6 h-6 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground/50 font-medium">No rest blocks planned today</p>
            <p className="text-[10px] text-muted-foreground/30 font-medium">
              Add sleep, wind-down, or nap blocks in your daily planner
            </p>
            <button
              onClick={() => navigate("/planner")}
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 hover:text-indigo-500 transition-colors"
            >
              <Calendar className="w-3 h-3" /> Go to planner
            </button>
          </div>
        ) : (
          restBlocks.map((block) => {
            const config = getBlockConfig(block.title || "");
            const isCompleted = false; // derive from logs if needed

            return (
              <div
                key={block.id}
                className={`group relative bg-card border rounded-2xl p-4 transition-all hover:shadow-md ${
                  isCompleted
                    ? "border-indigo-500/30"
                    : "border-dashed opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl`}
                      style={{
                        backgroundColor: isCompleted ? config.color : "hsl(var(--muted))",
                        color: isCompleted ? "white" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-tight">{block.title}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {block.startTime} – {block.endTime}
                      </p>
                      <p
                        className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </p>
                    </div>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: config.color }} />
                  ) : (
                    <button
                      className="text-[10px] font-medium px-3 py-1 rounded-full border transition-colors"
                      style={{
                        color: config.color,
                        borderColor: `${config.color}40`,
                      }}
                    >
                      Log
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate("/planner")}
          className="w-full h-10 rounded-xl border border-dashed border-indigo-500/30 text-[11px] font-medium text-indigo-500/70 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-500/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Link from planner
        </button>
      </div>
    </div>
  );
}
