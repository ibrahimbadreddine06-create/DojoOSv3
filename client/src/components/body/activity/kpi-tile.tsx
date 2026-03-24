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
      className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
      onClick={() => metricKey && navigate(`/body/activity/metric/${metricKey}`)}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-2 min-h-[110px]">
        {/* Top */}
        <div className="flex items-start justify-between gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {showWearableBadge && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1 shrink-0">
              <Watch className="w-2.5 h-2.5" /> Wearable
            </Badge>
          )}
        </div>
        
        {/* Bottom Data Container */}
        <div className="mt-auto flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums leading-none">
              {displayValue}
            </span>
            {(displayValue !== "–" || unit) && (
              <span className="text-xs text-muted-foreground font-medium leading-none">{unit}</span>
            )}
          </div>
          {(subtitle || goal != null) && (
            <div className="flex flex-col mt-0.5">
              {subtitle && <span className="text-[10px] text-muted-foreground leading-none">{subtitle}</span>}
              {goal != null && (
                <span className="text-[10px] text-muted-foreground leading-none mt-1">
                  goal: {goal} {goalUnit || unit}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
