import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Heart, Dumbbell, Award, Brain, MessageCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const categories = [
  {
    id: "worship",
    title: "Worship",
    description: "Salah, Quran, Dhikr, and Du'a consistency",
    icon: Heart,
    color: "text-chart-5",
  },
  {
    id: "beneficial",
    title: "Beneficial to People",
    description: "Social purpose activities and impact",
    icon: Trophy,
    color: "text-chart-1",
  },
  {
    id: "physical",
    title: "Physical Body",
    description: "Workout consistency, nutrition, sleep quality",
    icon: Dumbbell,
    color: "text-chart-4",
  },
  {
    id: "character",
    title: "Character",
    description: "Personal development and discipline",
    icon: Award,
    color: "text-chart-2",
  },
  {
    id: "knowledge",
    title: "Knowledge",
    description: "Second Brain, Languages, Disciplines, Studies",
    icon: Brain,
    color: "text-chart-3",
  },
  {
    id: "speech",
    title: "Speech",
    description: "Communication quality and impact",
    icon: MessageCircle,
    color: "text-chart-1",
  },
];

export default function UltimateTest() {
  const { data: metrics } = useQuery<Record<string, number>>({
    queryKey: ["/api/ultimate-test/metrics"],
  });

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-ultimate-test-title">
            Ultimate Test
          </h1>
          <p className="text-muted-foreground">
            Six-category life summary dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const score = metrics?.[category.id] || 0;

            return (
              <Card key={category.id} data-testid={`card-category-${category.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    </div>
                    <Icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Score</span>
                      <span className="font-mono font-semibold text-lg" data-testid={`score-${category.id}`}>
                        {score.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Based on aggregated metrics from relevant Dojo modules
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Metric Sources</CardTitle>
            <CardDescription>
              How categories derive their scores from Dojo modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Worship</h3>
              <p className="text-sm text-muted-foreground">
                Reads from Worship module: Salah completion rate, Quran reading consistency, Dhikr frequency
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Beneficial to People</h3>
              <p className="text-sm text-muted-foreground">
                Reads from Social Purpose module: Activity completion, people interactions, impact metrics
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Physical Body</h3>
              <p className="text-sm text-muted-foreground">
                Reads from Body module: Workout completion, nutrition tracking, sleep quality, hygiene consistency
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Character</h3>
              <p className="text-sm text-muted-foreground">
                Reads from Goals and Disciplines: Goal progress, discipline completion, consistency metrics
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Reads from Second Brain, Languages, Disciplines, Studies: Aggregate completion and readiness scores
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Speech</h3>
              <p className="text-sm text-muted-foreground">
                Pluggable metric - can be configured to read from relevant activity tracking
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
