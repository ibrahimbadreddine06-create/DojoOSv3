import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch } from "lucide-react";
import { useLocation } from "wouter";

interface KpiTileProps {
  label: string;
  value: number | string | null;
  unit: string;
  color: string;
  goal?: number;
  goalUnit?: string;
  progress?: number; // 0-100
  wearableRequired?: boolean;
  wearableConnected?: boolean;
  metricKey?: string;
  subtitle?: string;
}

export function KpiTile({
  label,
  value,
  unit,
  color,
  goal,
  goalUnit,
  progress,
  wearableRequired = false,
  wearableConnected = false,
  metricKey,
  subtitle,
}: KpiTileProps) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;
  const showWearableBadge = wearableRequired && !wearableConnected;
  const progressPercent = progress != null ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => metricKey && navigate(`/body/activity/metric/${metricKey}`)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {showWearableBadge && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1">
              <Watch className="w-2.5 h-2.5" />
              Wearable
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums" style={{ color: displayValue !== "–" ? color : undefined }}>
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
          <>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              goal: {goal} {goalUnit || unit}
            </span>
          </>
        )}
      </CardContent>
    </Card>
  );
}
