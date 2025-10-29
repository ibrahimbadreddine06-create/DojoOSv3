import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Brain, Target, Dumbbell, Heart } from "lucide-react";

export default function Home() {
  const quickActions = [
    {
      title: "Today's Plan",
      description: "View and manage your daily time blocks",
      icon: Calendar,
      href: "/planner",
      color: "text-chart-1",
    },
    {
      title: "Goals",
      description: "Track progress on your quarterly goals",
      icon: Target,
      href: "/goals",
      color: "text-chart-2",
    },
    {
      title: "Knowledge",
      description: "Continue learning with Second Brain",
      icon: Brain,
      href: "/second-brain",
      color: "text-chart-3",
    },
    {
      title: "Body Metrics",
      description: "Log workouts and track nutrition",
      icon: Dumbbell,
      href: "/body",
      color: "text-chart-4",
    },
    {
      title: "Worship",
      description: "Record daily prayers and Quran",
      icon: Heart,
      href: "/worship",
      color: "text-chart-5",
    },
    {
      title: "Ultimate Test",
      description: "View your life summary dashboard",
      icon: Trophy,
      href: "/ultimate-test",
      color: "text-primary",
    },
  ];

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-welcome">
            Welcome to Dojo OS
          </h1>
          <p className="text-muted-foreground">
            Your personal operating system for life management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid={`card-${action.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {action.title}
                  </CardTitle>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Choose how you want to organize your life
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">1. Set up your Daily Planner</h3>
                <p className="text-sm text-muted-foreground">
                  Create time blocks and presets to structure your days effectively
                </p>
                <Button asChild variant="outline" size="sm" data-testid="button-setup-planner">
                  <Link href="/planner">Go to Planner</Link>
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">2. Define your Goals</h3>
                <p className="text-sm text-muted-foreground">
                  Set yearly, quarterly, and monthly objectives with nested subgoals
                </p>
                <Button asChild variant="outline" size="sm" data-testid="button-setup-goals">
                  <Link href="/goals">Set Goals</Link>
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">3. Customize Active Modules</h3>
                <p className="text-sm text-muted-foreground">
                  Enable or disable modules based on what you need
                </p>
                <Button asChild variant="outline" size="sm" data-testid="button-setup-settings">
                  <Link href="/settings">Configure Settings</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
