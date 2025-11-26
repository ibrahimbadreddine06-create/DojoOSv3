import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Brain, BookOpen, FileText, Link as LinkIcon, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodaySessions } from "@/components/today-sessions";

export default function SecondBrain() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const { data: themes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/knowledge-themes", "second_brain"],
  });

  const { data: selectedThemeData } = useQuery({
    queryKey: ["/api/knowledge-themes", selectedTheme],
    enabled: !!selectedTheme,
  });

  const materialIcons = {
    flashcard_deck: BookOpen,
    doc: FileText,
    link: LinkIcon,
    video: Video,
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-second-brain-title">
              Second Brain
            </h1>
            <p className="text-muted-foreground">
              Track knowledge acquisition and readiness across themes
            </p>
          </div>
          <Button size="sm" data-testid="button-add-theme">
            <Plus className="w-4 h-4 mr-2" />
            Add Theme
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Metrics</CardTitle>
            <CardDescription>Aggregate completion and readiness across all themes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aggregate chart will be implemented in integration phase
            </div>
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
                    onClick={() => setSelectedTheme(theme.id)}
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
                <Button data-testid="button-create-theme">
                  Create Theme
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="linked-blocks" className="space-y-4 mt-6">
            <TodaySessions module="second_brain" />
          </TabsContent>
        </Tabs>

        {selectedTheme && selectedThemeData && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedThemeData.name} - Metrics Over Time</CardTitle>
              <CardDescription>Completion and readiness trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Per-theme chart will be implemented in integration phase
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
