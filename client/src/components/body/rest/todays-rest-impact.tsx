import { Brain, Dumbbell, Coffee, ChevronRight, Zap, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "./section-label";

interface ImpactItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "good" | "warn" | "bad" | "info";
  description?: string;
}

const STATUS_COLORS = {
  good: { bg: "#22c55e12", border: "#22c55e30", text: "#22c55e", badge: "bg-green-500/10 text-green-600" },
  warn: { bg: "#f59e0b12", border: "#f59e0b30", text: "#f59e0b", badge: "bg-amber-500/10 text-amber-600" },
  bad: { bg: "#ef444412", border: "#ef444430", text: "#ef4444", badge: "bg-red-500/10 text-red-600" },
  info: { bg: "#6366f112", border: "#6366f130", text: "#6366f1", badge: "bg-indigo-500/10 text-indigo-600" },
};

interface TodaysRestImpactProps {
  restScore?: number | null;
  recoveryReadiness?: number | null;
}

export function TodaysRestImpact({ restScore = null, recoveryReadiness = null }: TodaysRestImpactProps) {
  const [, navigate] = useLocation();

  const score = recoveryReadiness ?? restScore ?? null;

  const focusStatus: ImpactItem["status"] =
    score === null ? "info" : score >= 70 ? "good" : score >= 40 ? "warn" : "bad";
  const workoutStatus: ImpactItem["status"] =
    score === null ? "info" : score >= 75 ? "good" : score >= 45 ? "warn" : "bad";

  const impacts: ImpactItem[] = [
    {
      icon: <Brain className="w-4 h-4" />,
      label: "Focus capacity",
      value: score === null ? "—" : score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low",
      status: focusStatus,
      description: score === null ? "Log rest to see focus guidance" : score >= 70 ? "You're sharp — tackle deep work early." : "Prefer structured, manageable tasks.",
    },
    {
      icon: <Dumbbell className="w-4 h-4" />,
      label: "Workout readiness",
      value: score === null ? "—" : score >= 75 ? "Ready" : score >= 45 ? "Light only" : "Rest day",
      status: workoutStatus,
      description: score === null ? "Log rest to get workout guidance" : score >= 75 ? "Your body is ready for a full session." : score >= 45 ? "Keep it light — mobility or zone 1." : "Prioritise recovery over training today.",
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Midday energy dip",
      value: "14:00 – 15:30",
      status: "info",
      description: "Plan a 20-min rest or short walk at this time.",
    },
    {
      icon: <Coffee className="w-4 h-4" />,
      label: "Nap recommendation",
      value: score !== null && score < 60 ? "Recommended" : "Optional",
      status: score !== null && score < 60 ? "warn" : "info",
      description: "10–20 min power nap before 15:00 to restore alertness.",
    },
  ];

  return (
    <div>
      <SectionLabel>Today's Rest Impact</SectionLabel>

      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        <div className="divide-y divide-border/40">
          {impacts.map((item) => {
            const colors = STATUS_COLORS[item.status];
            return (
              <div key={item.label} className="flex items-start gap-4 px-5 py-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {item.value}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Planner action */}
        <div className="px-5 py-3 border-t border-border/40 bg-muted/20">
          <button
            onClick={() => navigate("/planner")}
            className="flex items-center gap-2 text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Apply rest guidance to today's planner
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
