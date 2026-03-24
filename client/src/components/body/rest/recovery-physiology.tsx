import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Watch, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { SectionLabel } from "./section-label";

interface PhysiologyMetric {
  label: string;
  value: number | string | null;
  unit?: string;
  color: string;
  metricKey: string;
  normal?: string;
}

function PhysiologyRow({ label, value, unit, color, metricKey, normal }: PhysiologyMetric) {
  const [, navigate] = useLocation();
  const displayValue = value === null || value === undefined ? "–" : value;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/body/rest/metric/${metricKey}`)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between w-full">
          {/* L: Label + Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <p className="text-sm font-medium truncate">{label}</p>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 shrink-0">
              <Watch className="w-2 h-2" />
            </Badge>
          </div>

          {/* R: Value + Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm tabular-nums font-semibold" style={displayValue !== "–" ? { color } : undefined}>
              {displayValue}{displayValue !== "–" && unit ? ` ${unit}` : ""}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Bottom edge label if normal exists */}
        {normal && (
          <div className="flex mt-1 pl-4">
            <p className="text-[10px] text-muted-foreground">normal: {normal}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecoveryPhysiologyProps {
  overnightHR?: number | null;
  overnightHRV?: number | null;
  respiratoryRate?: number | null;
  tempDeviation?: number | null;
  spO2?: number | null;
}

export function RecoveryPhysiology({
  overnightHR = null,
  overnightHRV = null,
  respiratoryRate = null,
  tempDeviation = null,
  spO2 = null,
}: RecoveryPhysiologyProps) {
  const metrics: PhysiologyMetric[] = [
    { label: "Overnight HR", value: overnightHR, unit: "bpm", color: "#ef4444", metricKey: "overnightHR", normal: "48–60 bpm" },
    { label: "Overnight HRV", value: overnightHRV, unit: "ms", color: "#14b8a6", metricKey: "overnightHRV", normal: "> 50 ms" },
    { label: "Respiratory rate", value: respiratoryRate, unit: "rpm", color: "#3b82f6", metricKey: "respiratoryRate", normal: "12–20 rpm" },
    {
      label: "Temp. deviation",
      value: tempDeviation !== null ? `${tempDeviation > 0 ? "+" : ""}${tempDeviation?.toFixed(1)}` : null,
      unit: "°C",
      color: tempDeviation === null ? "#6b7280" : Math.abs(tempDeviation!) < 0.5 ? "#22c55e" : "#f59e0b",
      metricKey: "tempDeviation",
      normal: "< ±0.5°C",
    },
    {
      label: "SpO₂",
      value: spO2,
      unit: "%",
      color: spO2 === null ? "#6b7280" : spO2 >= 95 ? "#22c55e" : "#ef4444",
      metricKey: "spO2",
      normal: "≥ 95%",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel className="mb-0">Recovery Physiology</SectionLabel>
        <Badge variant="outline" className="text-[9px] px-2 py-0.5 gap-1 h-5">
          <Watch className="w-2.5 h-2.5" /> Wearable
        </Badge>
      </div>
      <div className="space-y-2">
        {metrics.map((m) => (
          <PhysiologyRow key={m.metricKey} {...m} />
        ))}
      </div>
    </div>
  );
}
