import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon } from "lucide-react";

const allModules = [
  { id: "planner", label: "Daily Planner", description: "Time blocks and daily scheduling" },
  { id: "goals", label: "Goals", description: "Yearly, quarterly, and monthly objectives" },
  { id: "second_brain", label: "Second Brain", description: "Knowledge themes and learning" },
  { id: "languages", label: "Languages", description: "Language learning tracking" },
  { id: "disciplines", label: "Disciplines", description: "Skills development" },
  { id: "body", label: "Body", description: "Workout, nutrition, sleep, hygiene" },
  { id: "worship", label: "Worship", description: "Salah, Quran, Dhikr, Du'a" },
  { id: "finances", label: "Finances", description: "Income, expenses, transactions" },
  { id: "masterpieces", label: "Masterpieces", description: "Large creative projects" },
  { id: "possessions", label: "Possessions", description: "Inventory and clothing" },
  { id: "studies", label: "Studies", description: "Academic courses and grades" },
  { id: "business", label: "Business", description: "Business ventures and projects" },
  { id: "work", label: "Work", description: "Job projects and tasks" },
  { id: "social_purpose", label: "Social Purpose", description: "Social impact activities" },
];

export default function Settings() {
  const { data: pageSettings, isLoading } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/page-settings"],
  });

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-settings-title">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure which modules are active in your Dojo
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Modules</CardTitle>
            <CardDescription>
              Enable or disable modules based on what you need
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              allModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                  data-testid={`setting-${module.id}`}
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={module.id} className="text-base font-medium cursor-pointer">
                      {module.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <Switch
                    id={module.id}
                    checked={pageSettings?.[module.id] !== false}
                    data-testid={`switch-${module.id}`}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About DojoOS</CardTitle>
            <CardDescription>
              Your personal operating system for life management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              DojoOS helps you track and manage all aspects of your life in one integrated system.
              Use the module toggles above to customize your experience.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
