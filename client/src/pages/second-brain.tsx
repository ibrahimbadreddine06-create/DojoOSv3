import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Trash2, MoreVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodaySessions } from "@/components/today-sessions";
import { AddThemeDialog } from "@/components/dialogs/add-theme-dialog";
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

interface MetricData {
  topicId: string;
  topicName: string;
  date: string;
  completion: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 70%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 50%)",
];

export default function SecondBrain() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: themes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/knowledge-topics", "second_brain"],
  });

  const { data: metricsData } = useQuery<any[]>({
    queryKey: ["/api/knowledge-metrics-all", "second_brain"],
  });

  const latestMetrics = useMemo(() => {
    if (!metricsData) return {};
    const latest: Record<string, { completion: number; importance: number }> = {};
    for (const m of metricsData) {
      if (!latest[m.topicId] || m.date > (metricsData.find(x => x.topicId === m.topicId && latest[m.topicId])?.date || '')) {
        latest[m.topicId] = { completion: parseFloat(m.completion), importance: m.importance || 0 };
      }
    }
    return latest;
  }, [metricsData]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/knowledge-topics/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/knowledge-topics", "second_brain"] });
      const previous = queryClient.getQueryData(["/api/knowledge-topics", "second_brain"]);
      queryClient.setQueryData(["/api/knowledge-topics", "second_brain"], (old: any[]) =>
        old.filter((theme) => theme.id !== id)
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/knowledge-metrics-all", "second_brain"] });
      toast({ title: "Theme deleted" });
    },
    onError: (err, id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/knowledge-topics", "second_brain"], context.previous);
      }
      toast({ title: "Failed to delete theme", variant: "destructive" });
    },
  });

  const { chartData, chartConfig } = useMemo(() => {
    if (!themes) {
      return { chartData: [], chartConfig: {} };
    }

    // Create a set of currently existing theme names
    const existingThemeNames = new Set(themes.map(t => t.name));
    const topicNamesList = Array.from(existingThemeNames).sort();

    const dateMap = new Map<string, Record<string, number>>();

    // Always initialize with at least the last 14 days so the Brush scrollbar (arrows) can render
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {});
    }

    // Add all metrics data if available
    if (metricsData && metricsData.length > 0) {
      for (const m of metricsData) {
        if (!existingThemeNames.has(m.topicName)) continue;
        const completionVal = parseFloat(m.completion);
        if (isNaN(completionVal)) continue;
        if (!dateMap.has(m.date)) {
          dateMap.set(m.date, {});
        }
        dateMap.get(m.date)![m.topicName] = completionVal;
      }
    }

    const sortedDates = Array.from(dateMap.keys()).sort();

    // Build continuous data with all themes on each date (fill gaps with previous value or 0)
    const finalTopicNamesList = topicNamesList;
    const data = sortedDates.map((date, idx) => {
      const dayData: Record<string, string | number> = {
        date: format(parseISO(date), "MMM d"),
        fullDate: date,
      };

      for (const topicName of finalTopicNamesList) {
        // Get value for this date, or use previous value, or default to 0
        if (dateMap.get(date)?.[topicName] !== undefined) {
          dayData[topicName] = dateMap.get(date)![topicName];
        } else {
          // Find last known value
          let lastValue = 0;
          for (let i = idx - 1; i >= 0; i--) {
            if (dateMap.get(sortedDates[i])?.[topicName] !== undefined) {
              lastValue = dateMap.get(sortedDates[i])![topicName];
              break;
            }
          }
          dayData[topicName] = lastValue;
        }
      }
      return dayData;
    });

    const config: Record<string, { label: string; color: string }> = {};
    let colorIndex = 0;
    for (const name of finalTopicNamesList) {
      config[name] = {
        label: name,
        color: CHART_COLORS[colorIndex % CHART_COLORS.length],
      };
      colorIndex++;
    }

    return { chartData: data, chartConfig: config };
  }, [metricsData, themes]);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="text-second-brain-title">
              Second Brain
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track knowledge acquisition and readiness across themes
            </p>
          </div>
          <AddThemeDialog type="second_brain" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Metrics</CardTitle>
            <CardDescription>Completion progress over time for each theme</CardDescription>
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
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
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

        <Tabs defaultValue="themes">
          <TabsList>
            <TabsTrigger value="themes" data-testid="tab-themes">
              Knowledge Themes
            </TabsTrigger>
            <TabsTrigger value="linked-blocks" data-testid="tab-linked-blocks">
              Linked Time Blocks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : themes && themes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {themes.map((theme) => (
                  <Card
                    key={theme.id}
                    className="hover-elevate active-elevate-2"
                    data-testid={`card-theme-${theme.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 cursor-pointer" onClick={() => navigate(`/second-brain/${theme.id}`)}>
                          <CardTitle className="text-lg">{theme.name}</CardTitle>
                          {theme.description && (
                            <CardDescription className="text-sm line-clamp-2">
                              {theme.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-menu-${theme.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(`Delete "${theme.name}"? This cannot be undone.`)) {
                                    deleteMutation.mutate(theme.id);
                                  }
                                }}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                data-testid={`button-delete-${theme.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Brain className="w-5 h-5 text-chart-3" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 cursor-pointer" onClick={() => navigate(`/second-brain/${theme.id}`)}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion (Weighted)</span>
                          <span className="font-mono font-medium" data-testid={`text-completion-${theme.id}`}>
                            {latestMetrics[theme.id]?.completion || 0}%
                          </span>
                        </div>
                        <Progress value={latestMetrics[theme.id]?.completion || 0} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Readiness</span>
                          <span className="font-mono font-medium" data-testid={`text-readiness-${theme.id}`}>
                            {theme.readiness || 0}%
                          </span>
                        </div>
                        <Progress value={theme.readiness || 0} className="h-2" />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline">
                          {theme.learnPlanCount || 0} learn items
                        </Badge>
                        <Badge variant="outline">
                          {theme.materialsCount || 0} materials
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No knowledge themes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first theme to start tracking knowledge
                </p>
                <AddThemeDialog type="second_brain" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="linked-blocks" className="space-y-4 mt-6">
            <TodaySessions module="second_brain" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

