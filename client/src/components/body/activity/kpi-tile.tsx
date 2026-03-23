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
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => metricKey && navigate(`/body/activity/metric/${metricKey}`)}
    >
      <CardContent className="p-5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {showWearableBadge && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1">
              <Watch className="w-2.5 h-2.5" />
              Wearable
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">
            {displayValue}
          </span>
          {displayValue !== "–" && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground">{subtitle}</span>
        )}
        {goal != null && (
          <span className="text-[10px] text-muted-foreground">
            goal: {goal} {goalUnit || unit}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
