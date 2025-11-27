import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Languages as LanguagesIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodaySessions } from "@/components/today-sessions";
import { AddThemeDialog } from "@/components/dialogs/add-theme-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Legend } from "recharts";

export default function Languages() {
  const [, navigate] = useLocation();

  const { data: languages, isLoading } = useQuery<any[]>({
    queryKey: ["/api/knowledge-themes", "language"],
  });

  const chartData = useMemo(() => {
    if (!languages || languages.length === 0) return [];
    return languages.map(lang => ({
      name: lang.name.length > 15 ? lang.name.substring(0, 12) + "..." : lang.name,
      fullName: lang.name,
      completion: lang.completion || 0,
      readiness: lang.readiness || 0,
    }));
  }, [languages]);

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
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="text-languages-title">
              Languages
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track language learning progress and fluency
            </p>
          </div>
          <AddThemeDialog type="language" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Metrics</CardTitle>
            <CardDescription>Completion and readiness across all languages</CardDescription>
          </CardHeader>
          <CardContent>
            {languages && languages.length > 0 ? (
              <div className="overflow-x-auto">
                <div style={{ minWidth: Math.max(400, chartData.length * 150) }}>
                  <ChartContainer config={chartConfig} className="h-96 w-full">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 12, bottom: 40 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 14 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                        tick={{ fontSize: 14 }} 
                        width={50}
                        tickFormatter={(v) => `${v}%`}
                      />
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
                      <Legend wrapperStyle={{ fontSize: 14 }} />
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
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Add languages to see metrics chart
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="languages">
          <TabsList>
            <TabsTrigger value="languages" data-testid="tab-languages">
              Languages
            </TabsTrigger>
            <TabsTrigger value="linked-blocks" data-testid="tab-linked-blocks">
              Linked Time Blocks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="languages" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : languages && languages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {languages.map((language) => (
                  <Card
                    key={language.id}
                    className="hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => navigate(`/languages/${language.id}`)}
                    data-testid={`card-language-${language.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{language.name}</CardTitle>
                          {language.description && (
                            <CardDescription className="text-sm line-clamp-2">
                              {language.description}
                            </CardDescription>
                          )}
                        </div>
                        <LanguagesIcon className="w-5 h-5 text-chart-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-mono font-medium">
                            {language.completion || 0}%
                          </span>
                        </div>
                        <Progress value={language.completion || 0} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Readiness</span>
                          <span className="font-mono font-medium">
                            {language.readiness || 0}%
                          </span>
                        </div>
                        <Progress value={language.readiness || 0} className="h-2" />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline">
                          {language.flashcardsCount || 0} flashcards
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <LanguagesIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No languages yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your language learning journey
                </p>
                <AddThemeDialog type="language" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="linked-blocks" className="space-y-4 mt-6">
            <TodaySessions module="languages" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
