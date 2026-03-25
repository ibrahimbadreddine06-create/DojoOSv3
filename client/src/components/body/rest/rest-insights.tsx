import { Moon, BookOpen, Lightbulb, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "../section-header";

const INSIGHTS = [
  {
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    title: "Sleep consistency matters more than duration",
    body: "Going to bed and waking at the same time each day synchronizes your circadian rhythm and improves sleep quality more than sleeping extra hours on weekends.",
    color: "#6366f1",
  },
  {
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    title: "HRV is your recovery compass",
    body: "Heart Rate Variability (HRV) measures the variation in time between heartbeats. Higher overnight HRV indicates better parasympathetic activity and recovery.",
    color: "#f59e0b",
  },
  {
    icon: <BookOpen className="w-4 h-4 text-violet-400" />,
    title: "Sleep debt compounds",
    body: "Each night of under-sleeping accumulates into a sleep debt that reduces cognitive performance, mood, and immune function — and can't be fully recovered in one night.",
    color: "#a78bfa",
  },
];

interface RestInsightsProps {
  hasData?: boolean;
}

export function RestInsights({ hasData = false }: RestInsightsProps) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Insights & Education" kicker="Knowledge" />
      {/* Why no data notice */}
      {!hasData && (
        <div className="border border-dashed border-indigo-500/30 rounded-2xl px-5 py-5 flex items-start gap-4 bg-indigo-500/5">
          <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-1">How to get started</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Tap <strong>Log rest</strong> to record a sleep entry. Connect a wearable in{" "}
              <strong>Settings → Integrations</strong> to unlock overnight physiology, HRV, and
              automatic sleep detection. Link sleep and wind-down blocks in the Daily Planner to
              start seeing your plan vs. actual comparison here.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INSIGHTS.map((insight, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all cursor-pointer group shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${insight.color}15` }}
              >
                {insight.icon}
              </div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {insight.title}
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground/90 font-medium">
              {insight.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
