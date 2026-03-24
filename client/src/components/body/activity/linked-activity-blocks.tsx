import { useQuery } from "@tanstack/react-query";
import { Calendar, Dumbbell, Bike, Footprints, Flame, CheckCircle2, Plus, Zap } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { TimeBlock } from "@shared/schema";

const BLOCK_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  workout: {
    icon: <Dumbbell className="w-4 h-4" />,
    color: "#ef4444",
    label: "Workout",
  },
  cardio: {
    icon: <Bike className="w-4 h-4" />,
    color: "#f97316",
    label: "Cardio",
  },
  walk: {
    icon: <Footprints className="w-4 h-4" />,
    color: "#f59e0b",
    label: "Walk / Run",
  },
  strength: {
    icon: <Zap className="w-4 h-4" />,
    color: "#dc2626",
    label: "Strength",
  },
  hiit: {
    icon: <Flame className="w-4 h-4" />,
    color: "#b91c1c",
    label: "HIIT",
  },
};

function getBlockConfig(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("cardio") || lower.includes("bike") || lower.includes("cycling")) return BLOCK_TYPE_CONFIG.cardio;
  if (lower.includes("walk") || lower.includes("run") || lower.includes("jog")) return BLOCK_TYPE_CONFIG.walk;
  if (lower.includes("strength") || lower.includes("lift") || lower.includes("weight")) return BLOCK_TYPE_CONFIG.strength;
  if (lower.includes("hiit") || lower.includes("interval") || lower.includes("circuit")) return BLOCK_TYPE_CONFIG.hiit;
  return BLOCK_TYPE_CONFIG.workout;
}

export function LinkedActivityBlocks() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [, navigate] = useLocation();

  const { data: timeBlocks } = useQuery<TimeBlock[]>({
    queryKey: [`/api/time-blocks/${today}`],
  });

  const activityBlocks = timeBlocks?.filter(
    (b) => b.linkedModule === "activity" || b.linkedModule === "workout" || b.linkedModule === "sport"
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
          className="text-[10px] font-bold uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors"
        >
          Open planner →
        </button>
      </div>

      {/* Presets row */}
      <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap border-b border-border/30">
        <span className="text-[10px] text-muted-foreground/50 font-medium shrink-0">Quick add:</span>
        {["Workout", "Cardio", "Walk", "Strength", "HIIT"].map((label) => (
          <button
            key={label}
            className="h-6 px-3 rounded-full border border-dashed border-border/60 text-[10px] font-medium text-muted-foreground/40 hover:border-red-500/40 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      {/* Blocks */}
      <div className="p-4 space-y-3">
        {activityBlocks.length === 0 ? (
          <div className="py-8 border border-dashed border-border/50 rounded-xl text-center space-y-1.5">
            <Dumbbell className="w-6 h-6 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground/50 font-medium">No activity blocks planned today</p>
            <p className="text-[10px] text-muted-foreground/30 font-medium">
              Add workout, cardio or training blocks in your daily planner
            </p>
            <button
              onClick={() => navigate("/planner")}
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors"
            >
              <Calendar className="w-3 h-3" /> Go to planner
            </button>
          </div>
        ) : (
          activityBlocks.map((block) => {
            const config = getBlockConfig(block.title || "");
            const isCompleted = block.completed ?? false;

            return (
              <div
                key={block.id}
                className={`group relative bg-card border rounded-2xl p-4 transition-all hover:shadow-md ${
                  isCompleted
                    ? "border-red-500/30"
                    : "border-dashed opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-xl"
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
          className="w-full h-10 rounded-xl border border-dashed border-red-500/30 text-[11px] font-medium text-red-500/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Link from planner
        </button>
      </div>
    </div>
  );
}
