import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, UtensilsCrossed, Moon, Sparkles } from "lucide-react";
import { WorkoutTab } from "@/components/body/workout-tab";
import { IntakeTab } from "@/components/body/intake-tab";
import { SleepTab } from "@/components/body/sleep-tab";
import { HygieneTab } from "@/components/body/hygiene-tab";

export default function Body() {
  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-body-title">
            Body
          </h1>
          <p className="text-muted-foreground">
            Track workouts, nutrition, sleep, and hygiene
          </p>
        </div>

        <Tabs defaultValue="workout">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workout" data-testid="tab-workout">
              <Dumbbell className="w-4 h-4 mr-2" />
              Workout
            </TabsTrigger>
            <TabsTrigger value="intake" data-testid="tab-intake">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Intake
            </TabsTrigger>
            <TabsTrigger value="sleep" data-testid="tab-sleep">
              <Moon className="w-4 h-4 mr-2" />
              Sleep/Rest
            </TabsTrigger>
            <TabsTrigger value="hygiene" data-testid="tab-hygiene">
              <Sparkles className="w-4 h-4 mr-2" />
              Hygiene
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workout" className="mt-6">
            <WorkoutTab />
          </TabsContent>

          <TabsContent value="intake" className="mt-6">
            <IntakeTab />
          </TabsContent>

          <TabsContent value="sleep" className="mt-6">
            <SleepTab />
          </TabsContent>

          <TabsContent value="hygiene" className="mt-6">
            <HygieneTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
