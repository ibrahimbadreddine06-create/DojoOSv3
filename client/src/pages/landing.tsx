import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sword, Target, Brain, BookOpen, GraduationCap, Dumbbell } from "lucide-react";

export default function Landing() {
  const features = [
    { icon: Target, title: "Goals", description: "Set and track your life goals" },
    { icon: Sword, title: "Daily Planner", description: "Master your day with time blocks" },
    { icon: Brain, title: "Second Brain", description: "Organize your knowledge" },
    { icon: BookOpen, title: "Languages", description: "Learn with spaced repetition" },
    { icon: GraduationCap, title: "Studies", description: "Track your courses" },
    { icon: Dumbbell, title: "Body", description: "Monitor fitness and health" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sword className="h-4 w-4" />
              Personal Operating System
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Welcome to your{" "}
              <span className="text-primary">Dojo</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A place where you master yourself. Track your goals, organize your knowledge, 
              plan your days, and become the best version of yourself.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-start-adventure"
            >
              <Sword className="mr-2 h-5 w-5" />
              Start Your Adventure
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Log In
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12 w-full max-w-5xl">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Sign in with Google, Apple, or your email
          </p>
        </div>
      </div>
    </div>
  );
}
