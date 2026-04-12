import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const HR_ZONES = [
  { zone: 0, name: "Rest", color: "#6b7280", range: "0–100 bpm" },
  { zone: 1, name: "Light", color: "#3b82f6", range: "101–120 bpm" },
  { zone: 2, name: "Moderate", color: "#14b8a6", range: "121–140 bpm" },
  { zone: 3, name: "Vigorous", color: "#f59e0b", range: "141–160 bpm" },
  { zone: 4, name: "Hard", color: "#f97316", range: "161–180 bpm" },
  { zone: 5, name: "Maximum", color: "#ea580c", range: "181–200 bpm" },
];

interface HrZonesSectionProps {
  zoneData?: { zone: number; minutes: number }[];
  cardioFocus?: { aerobicLow: number; aerobicHigh: number; anaerobic: number };
  cardioLoad?: number | null;
  wearableConnected?: boolean;
}

export function HrZonesSection({
  zoneData,
  cardioFocus,
  cardioLoad,
  wearableConnected = false,
  ...rootProps
}: HrZonesSectionProps & React.HTMLAttributes<HTMLDivElement>) {
  const [, navigate] = useLocation();
  const totalMinutes = zoneData?.reduce((s, z) => s + z.minutes, 0) || 0;

  const donutData = cardioFocus
    ? [
        { name: "Aerobic low", value: cardioFocus.aerobicLow, color: "#14b8a6" },
        { name: "Aerobic high", value: cardioFocus.aerobicHigh, color: "#f59e0b" },
        { name: "Anaerobic", value: cardioFocus.anaerobic, color: "#ea580c" },
      ]
    : [{ name: "No data", value: 1, color: "#e5e7eb" }];

  const chartConfig = {
    aerobicLow: { label: "Aerobic low", color: "#14b8a6" },
    aerobicHigh: { label: "Aerobic high", color: "#f59e0b" },
    anaerobic: { label: "Anaerobic", color: "#ea580c" },
  };

  return (
      <Card
        {...rootProps}
        className={cn("h-full w-full overflow-hidden border-border/60 shadow-sm", rootProps.className)}
      >
        {rootProps.children}
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex items-center justify-between gap-3 border-b border-border p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">HR zones</p>
            <Badge variant="outline" className="h-4 gap-1 px-1.5 py-0 text-[10px]">
              <Watch className="h-2.5 w-2.5" /> Wearable
            </Badge>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
            {/* Left: HR Zones */}
            <div className="min-h-0 overflow-y-auto p-4">
              <h4 className="text-xs font-semibold mb-3">HR zones today</h4>
              <div className="space-y-2">
                {HR_ZONES.map((zone) => {
                  const data = zoneData?.find((z) => z.zone === zone.zone);
                  const minutes = data?.minutes || 0;
                  const barWidth = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;

                  return (
                    <div key={zone.zone} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                      <span className="text-[10px] w-16 shrink-0 text-muted-foreground">Zone {zone.zone}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barWidth}%`, backgroundColor: zone.color }}
                        />
                      </div>
                      <span className="text-[10px] w-8 text-right tabular-nums text-muted-foreground">
                        {minutes > 0 ? `${minutes}m` : "–"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Cardio Focus + Cardio Load */}
            <div className="min-h-0 overflow-y-auto p-4">
              <h4 className="text-xs font-semibold mb-3">Cardio focus</h4>

              <div className="flex items-center gap-4">
                <div className="w-28 h-28">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>

                <div className="space-y-1.5">
                  {(cardioFocus ? donutData : []).map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-muted-foreground">{item.name}</span>
                      <span className="text-[10px] font-medium">{item.value}%</span>
                    </div>
                  ))}
                  {!cardioFocus && (
                    <span className="text-xs text-muted-foreground">–%</span>
                  )}
                </div>
              </div>

              {/* Cardio Load */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-[10px] text-muted-foreground">Cardio load today</div>
                <div
                  className="text-xl font-bold mt-0.5 cursor-pointer"
                  onClick={() => navigate("/body/activity/metric/cardioLoad")}
                >
                  {cardioLoad ?? "–"}
                </div>
                <div className="text-[10px] text-muted-foreground">tap → history</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
