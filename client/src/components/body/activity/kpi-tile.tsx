import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch } from "lucide-react";
import { useLocation } from "wouter";

interface KpiTileProps {
  label: string;
  value: number | string | null;
  unit: string;
  color?: string;
  goal?: number;
  goalUnit?: string;
  progress?: number;
  wearableRequired?: boolean;
  wearableConnected?: boolean;
  metricKey?: string;
  subtitle?: string;
}

export function KpiTile({
  label,
  value,
  unit,
  goal,
  goalUnit,
  wearableRequired = false,
  wearableConnected = false,
  metricKey,
  subtitle,
}: KpiTileProps) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;
  const showWearableBadge = wearableRequired && !wearableConnected;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col border-border/60 rounded-2xl shadow-sm"
      onClick={() => metricKey && navigate(`/body/activity/metric/${metricKey}`)}
    >
      <CardContent className="p-5 pt-5 sm:p-5 sm:pt-5 flex flex-col h-full min-h-[110px]">
        {/* Label Row */}
        <div className="flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 leading-none">
            {label}
          </span>
          {showWearableBadge && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1 shrink-0 font-bold uppercase tracking-tighter">
              <Watch className="w-2.5 h-2.5" /> Wearable
            </Badge>
          )}
        </div>
        
        {/* Main Value Area */}
        <div className="mt-1 flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5 align-bottom">
            <span className="text-2xl font-black tabular-nums leading-none tracking-tight">
              {displayValue}
            </span>
            {(displayValue !== "–" || unit) && (
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none mb-0.5">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-[10px] font-medium text-muted-foreground/60 leading-tight mt-0.5 italic">
              {subtitle}
            </span>
          )}
        </div>

        {/* Goal Indicator - Aligned Bottom */}
        {goal != null && (
          <div className="mt-auto pt-2 border-t border-border/5">
            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight">
              goal: {goal} {goalUnit || unit}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
