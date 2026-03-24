import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface WeeklyEffortGaugeProps {
  currentEffort: number; // sum of effort scores this week
  target: number; // weeklyEffortTarget
}

export function WeeklyEffortGauge({ currentEffort, target }: WeeklyEffortGaugeProps) {
  const [, navigate] = useLocation();
  const percentage = target > 0 ? Math.round((currentEffort / target) * 100) : 0;
  // Fill maps to 0-200% range. At 100% the fill reaches the midpoint.
  const fillPercent = Math.min(100, (percentage / 200) * 100);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/body/activity/metric/weeklyEffort")}
    >
      <CardContent className="p-5 sm:p-6 flex flex-col items-center justify-center text-center">
        {/* Top: percentage */}
        <span className="text-4xl font-bold tabular-nums text-foreground leading-none">
          {percentage}%
        </span>
        <p className="text-[11px] text-muted-foreground mt-2 mb-5 uppercase tracking-wider font-semibold">
          Weekly effort vs target
        </p>

        {/* Bottom: gauge track */}
        <div className="w-full max-w-sm">
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${fillPercent}%`,
                background: "linear-gradient(90deg, hsl(0 84.2% 60.2% / 0.7), hsl(0 84.2% 60.2%))",
              }}
            />
            {/* Target line at 50% (= 100% effort) */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-foreground/40" />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">0%</span>
            <span className="text-[10px] text-muted-foreground font-medium">Target</span>
            <span className="text-[10px] text-muted-foreground">200%</span>
          </div>
        </div>

        {target <= 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Set your weekly target in Settings to track effort.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
