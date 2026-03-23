import { useQuery } from "@tanstack/react-query";
import { Calendar, Sparkles, Scissors, Wind, Heart, CheckCircle2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { TimeBlock } from "@shared/schema";

const BLOCK_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  shower: {
    icon: <Wind className="w-4 h-4" />,
    color: "#8b5cf6",
    label: "Shower / Bath",
  },
  skincare: {
    icon: <Sparkles className="w-4 h-4" />,
    color: "#a78bfa",
    label: "Skincare",
  },
  grooming: {
    icon: <Scissors className="w-4 h-4" />,
    color: "#6366f1",
    label: "Grooming",
  },
  care: {
    icon: <Heart className="w-4 h-4" />,
    color: "#ec4899",
    label: "Care Routine",
  },
};

function getBlockConfig(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("shower") || lower.includes("bath")) return BLOCK_TYPE_CONFIG.shower;
  if (lower.includes("skin") || lower.includes("face")) return BLOCK_TYPE_CONFIG.skincare;
  if (lower.includes("groom") || lower.includes("hair") || lower.includes("beard") || lower.includes("nail"))
    return BLOCK_TYPE_CONFIG.grooming;
  return BLOCK_TYPE_CONFIG.care;
}

const QUICK_ADD_PRESETS = ["Shower", "Skincare", "Grooming", "Care block"];

export function LinkedHygieneBlocks() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [, navigate] = useLocation();

  const { data: timeBlocks } = useQuery<TimeBlock[]>({
    queryKey: [`/api/time-blocks/${today}`],
  });

  const hygieneBlocks =
    timeBlocks?.filter(
      (b) => b.linkedModule === "hygiene" || b.linkedModule === "looks"
    ) || [];

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex justify-between items-baseline border-b border-border/50">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Linked Time Blocks
          </p>
          <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider">
            From daily planner · today
          </p>
        </div>
        <button
          onClick={() => navigate("/planner")}
          className="text-[10px] font-bold uppercase tracking-widest text-violet-500/70 hover:text-violet-500 transition-colors"
        >
          Open planner →
        </button>
      </div>

      {/* Quick add presets */}
      <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap border-b border-border/30">
        <span className="text-[10px] text-muted-foreground/50 font-medium shrink-0">Quick add:</span>
        {QUICK_ADD_PRESETS.map((label) => (
          <button
            key={label}
            className="h-6 px-3 rounded-full border border-dashed border-border/60 text-[10px] font-medium text-muted-foreground/40 hover:border-violet-500/40 hover:text-violet-500 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      {/* Blocks */}
      <div className="p-4 space-y-3">
        {hygieneBlocks.length === 0 ? (
          <div className="py-8 border border-dashed border-border/50 rounded-xl text-center space-y-1.5">
            <Sparkles className="w-6 h-6 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground/50 font-medium">No care blocks planned today</p>
            <p className="text-[10px] text-muted-foreground/30 font-medium">
              Add shower, skincare, or grooming blocks in your daily planner
            </p>
            <button
              onClick={() => navigate("/planner")}
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-500/70 hover:text-violet-500 transition-colors"
            >
              <Calendar className="w-3 h-3" /> Go to planner
            </button>
          </div>
        ) : (
          hygieneBlocks.map((block) => {
            const config = getBlockConfig(block.title || "");
            const isCompleted = false;

            return (
              <div
                key={block.id}
                className={`group relative bg-card border rounded-2xl p-4 transition-all hover:shadow-md ${
                  isCompleted ? "border-violet-500/30" : "border-dashed opacity-60 hover:opacity-100"
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
                      style={{ color: config.color, borderColor: `${config.color}40` }}
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
          className="w-full h-10 rounded-xl border border-dashed border-violet-500/30 text-[11px] font-medium text-violet-500/70 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:border-violet-500/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Link from planner
        </button>
      </div>
    </div>
  );
}
