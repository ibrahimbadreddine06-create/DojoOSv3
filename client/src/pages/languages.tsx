import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Languages as LanguagesIcon, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Languages() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const { data: languages, isLoading } = useQuery<any[]>({
    queryKey: ["/api/knowledge-themes", "language"],
  });

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-languages-title">
              Languages
            </h1>
            <p className="text-muted-foreground">
              Track language learning progress and fluency
            </p>
          </div>
          <Button size="sm" data-testid="button-add-language">
            <Plus className="w-4 h-4 mr-2" />
            Add Language
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Metrics</CardTitle>
            <CardDescription>Aggregate completion and readiness across all languages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aggregate chart will be implemented in integration phase
            </div>
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
                    onClick={() => setSelectedLanguage(language.id)}
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
                <Button data-testid="button-create-language">
                  Add Language
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="linked-blocks" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No linked time blocks</h3>
              <p className="text-sm text-muted-foreground">
                Time blocks associated with Languages will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
