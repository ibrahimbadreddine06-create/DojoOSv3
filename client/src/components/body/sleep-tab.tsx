import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon } from "lucide-react";
import { format } from "date-fns";
import { AddSleepLogDialog } from "@/components/dialogs/add-sleep-log-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TodaySessions } from "../today-sessions";

export function SleepTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: sleepLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sleep-logs", format(selectedDate, "yyyy-MM-dd")],
  });

  // Mock history data for chart
  const sleepHistory = [
    { day: "Mon", actual: 7.2, planned: 8 },
    { day: "Tue", actual: 6.5, planned: 8 },
    { day: "Wed", actual: 8.0, planned: 7.5 },
    { day: "Thu", actual: 7.5, planned: 8 },
    { day: "Fri", actual: 6.8, planned: 7 },
    { day: "Sat", actual: 9.0, planned: 9 },
    { day: "Sun", actual: 7.5, planned: 8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sleep & Rest Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Track planned vs actual sleep hours
          </p>
        </div>
        <AddSleepLogDialog />
      </div>

      {/* Trends Chart & Today's Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Trends (Last 7 Days)</CardTitle>
              <CardDescription>Actual vs Planned Sleep</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepHistory}>
                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <ReferenceLine y={8} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Bar dataKey="actual" name="Actual Sleep" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="planned" name="Planned Goal" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <TodaySessions module="body" itemId="body_sleep" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : sleepLogs && sleepLogs.length > 0 ? (
        <div className="space-y-3">
          {sleepLogs.map((log) => (
            <Card key={log.id} data-testid={`card-sleep-${log.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {format(new Date(log.date), "MMMM d, yyyy")}
                    </CardTitle>
                    {log.notes && (
                      <CardDescription className="text-sm">
                        {log.notes}
                      </CardDescription>
                    )}
                  </div>
                  <div className="text-right font-mono">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Planned</p>
                        <p className="text-lg font-semibold">
                          {parseFloat(log.plannedHours).toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="text-lg font-semibold">
                          {parseFloat(log.actualHours).toFixed(1)}h
                        </p>
                      </div>
                      {log.quality && (
                        <div>
                          <p className="text-xs text-muted-foreground">Quality</p>
                          <p className="text-lg font-semibold">
                            {log.quality}/5
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Moon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No sleep logs</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start tracking your sleep patterns
          </p>
          <AddSleepLogDialog />
        </div>
      )}
    </div>
  );
}

