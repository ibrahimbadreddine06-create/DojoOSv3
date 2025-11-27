import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodaySessions } from "@/components/today-sessions";
import { AddThemeDialog } from "@/components/dialogs/add-theme-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";

export default function SecondBrain() {
  const [, navigate] = useLocation();

  const { data: themes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/knowledge-themes", "second_brain"],
  });

  const chartData = useMemo(() => {
    if (!themes || themes.length === 0) return [];
    return themes.map(theme => ({
      name: theme.name.length > 15 ? theme.name.substring(0, 12) + "..." : theme.name,
      fullName: theme.name,
      completion: theme.completion || 0,
      readiness: theme.readiness || 0,
    }));
  }, [themes]);

  const chartConfig = {
    completion: {
      label: "Completion",
      color: "hsl(var(--chart-1))",
    },
    readiness: {
      label: "Readiness",
      color: "hsl(var(--chart-2))",
    },
  };

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
            <CardDescription>Completion and readiness across all themes</CardDescription>
          </CardHeader>
          <CardContent>
            {themes && themes.length > 0 ? (
              <div className="overflow-x-auto">
                <div style={{ minWidth: Math.max(300, chartData.length * 120) }}>
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name, item) => (
                              <span>
                                {item.payload.fullName}: {value}%
                              </span>
                            )}
                          />
                        } 
                      />
                      <Legend />
                      <Bar 
                        dataKey="completion" 
                        fill="var(--color-completion)" 
                        name="Completion"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="readiness" 
                        fill="var(--color-readiness)" 
                        name="Readiness"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Add themes to see metrics chart
              </div>
            )}
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
                    className="hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => navigate(`/second-brain/${theme.id}`)}
                    data-testid={`card-theme-${theme.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{theme.name}</CardTitle>
                          {theme.description && (
                            <CardDescription className="text-sm line-clamp-2">
                              {theme.description}
                            </CardDescription>
                          )}
                        </div>
                        <Brain className="w-5 h-5 text-chart-3" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-mono font-medium" data-testid={`text-completion-${theme.id}`}>
                            {theme.completion || 0}%
                          </span>
                        </div>
                        <Progress value={theme.completion || 0} className="h-2" />
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
