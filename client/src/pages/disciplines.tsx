import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Trash2, MoreVertical, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodaySessions } from "@/components/today-sessions";
import { CreateDisciplineDialog } from "@/components/disciplines/create-discipline-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Legend, CartesianGrid, Brush } from "recharts";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Discipline } from "@shared/schema";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#8b5cf6", // Violet
];

export default function Disciplines() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: disciplines, isLoading } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
  });

  const { data: metricsData = [] } = useQuery<any[]>({
    queryKey: ["/api/discipline-metrics-all"],
  });

  const latestMetrics = useMemo(() => {
    if (!metricsData) return {};
    const latest: Record<string, { completion: number; date: string }> = {};
    for (const m of metricsData) {
      if (!latest[m.topicId] || m.date > latest[m.topicId].date) {
        latest[m.topicId] = { completion: parseFloat(m.completion) || 0, date: m.date };
      }
    }
    return latest;
  }, [metricsData]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/disciplines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/discipline-metrics-all"] });
      toast({ title: "Discipline deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete discipline", variant: "destructive" });
    },
  });

  const { chartData, chartConfig } = useMemo(() => {
    if (!disciplines) {
      return { chartData: [], chartConfig: {} };
    }

    const existingNames = new Set(disciplines.map(d => d.name));
    const names = Array.from(existingNames).sort();
    const dateMap = new Map<string, Record<string, number>>();

    // Always initialize with at least the last 14 days so the Brush scrollbar (arrows) can render
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {});
    }

    if (metricsData && metricsData.length > 0) {
      for (const m of metricsData) {
        if (!existingNames.has(m.topicName)) continue;
        const completionVal = parseFloat(m.completion);
        if (isNaN(completionVal)) continue;
        if (!dateMap.has(m.date)) {
          dateMap.set(m.date, {});
        }
        dateMap.get(m.date)![m.topicName] = completionVal;
      }
    }

    const sortedDates = Array.from(dateMap.keys()).sort();

    const data = sortedDates.map((date, idx) => {
      const dayData: Record<string, string | number> = {
        date: format(parseISO(date), "MMM d"),
        fullDate: date,
      };

      for (const name of names) {
        if (dateMap.get(date)?.[name] !== undefined) {
          dayData[name] = dateMap.get(date)![name];
        } else {
          let lastValue = 0;
          for (let i = idx - 1; i >= 0; i--) {
            if (dateMap.get(sortedDates[i])?.[name] !== undefined) {
              lastValue = dateMap.get(sortedDates[i])![name];
              break;
            }
          }
          dayData[name] = lastValue;
        }
      }
      return dayData;
    });

    const config: Record<string, { label: string; color: string }> = {};
    let colorIndex = 0;
    for (const name of names) {
      config[name] = {
        label: name,
        color: CHART_COLORS[colorIndex % CHART_COLORS.length],
      };
      colorIndex++;
    }

    return { chartData: data, chartConfig: config };
  }, [metricsData, disciplines]);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Disciplines
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Master your skills and track your growth
            </p>
          </div>
          <CreateDisciplineDialog />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mastery Progress</CardTitle>
            <CardDescription>Progression across your disciplines</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-96 w-full aspect-auto">
              <LineChart data={chartData} margin={{ top: 12, right: 0, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  tick={{ fontSize: 12, textAnchor: 'start', dx: -8 }}
                  tickLine={false}
                  axisLine={false}
                  mirror={true}
                  width={1}
                  tickFormatter={(v) => `${v}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {Object.keys(chartConfig).map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={chartConfig[key].label}
                    stroke={chartConfig[key].color}
                    strokeWidth={2}
                    dot={{ fill: chartConfig[key].color, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="hsl(var(--primary) / 0.5)"
                  fill="transparent"
                  startIndex={Math.max(0, chartData.length - 14)}
                  endIndex={chartData.length - 1}
                  travellerWidth={0}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">All Disciplines</TabsTrigger>
            <TabsTrigger value="linked-blocks">Linked Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : disciplines && disciplines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disciplines.map((discipline) => (
                  <Card
                    key={discipline.id}
                    className="hover-elevate active-elevate-2"
                    data-testid={`card-discipline-${discipline.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 cursor-pointer" onClick={() => navigate(`/disciplines/${discipline.id}`)}>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {discipline.name}
                            <Badge variant="secondary" className="font-mono">
                              Lvl {discipline.level || 1}
                            </Badge>
                          </CardTitle>
                          {discipline.description && (
                            <CardDescription className="text-sm line-clamp-2 italic">
                              {discipline.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-menu-${discipline.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(`Delete "${discipline.name}"? This cannot be undone.`)) {
                                    deleteMutation.mutate(discipline.id);
                                  }
                                }}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                data-testid={`button-delete-${discipline.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 cursor-pointer" onClick={() => navigate(`/disciplines/${discipline.id}`)}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion (Weighted)</span>
                          <span className="font-mono font-medium" data-testid={`text-completion-${discipline.id}`}>
                            {latestMetrics[discipline.id]?.completion || 0}%
                          </span>
                        </div>
                        <Progress value={latestMetrics[discipline.id]?.completion || 0} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No disciplines tracked</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Disciplines represent skills, habits, or areas of focus you want to master through deliberate practice.
                </p>
                <CreateDisciplineDialog />
              </div>
            )}
          </TabsContent>

          <TabsContent value="linked-blocks" className="space-y-4 mt-6">
            <TodaySessions module="disciplines" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

