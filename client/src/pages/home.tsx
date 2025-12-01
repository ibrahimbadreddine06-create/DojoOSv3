import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, Target, Brain, BookOpen, GraduationCap, 
  ArrowRight, CheckCircle2, Clock, Sparkles, Settings2,
  GripVertical, X, ChevronUp, ChevronDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Goal, KnowledgeTopic, Course, TimeBlock, PageSetting } from "@shared/schema";

type BentoSize = "1x1" | "2x1";

interface DashboardConfig {
  order: string[];
  hidden: string[];
  sizes: Record<string, BentoSize>;
}

const defaultConfig: DashboardConfig = {
  order: ["planner", "goals", "second_brain", "languages", "studies"],
  hidden: [],
  sizes: {},
};

function loadDashboardConfig(): DashboardConfig {
  try {
    const saved = localStorage.getItem("dashboardConfig");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return defaultConfig;
}

function saveDashboardConfig(config: DashboardConfig) {
  localStorage.setItem("dashboardConfig", JSON.stringify(config));
}

function PlannerBox() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: blocks = [], isLoading } = useQuery<TimeBlock[]>({
    queryKey: ["/api/time-blocks", today],
  });
  const { data: dailyMetrics } = useQuery<{ plannerCompletion?: string }>({
    queryKey: ["/api/daily-metrics", today],
  });

  const completedBlocks = blocks.filter(b => b.completed).length;
  const completion = dailyMetrics?.plannerCompletion 
    ? parseFloat(dailyMetrics.plannerCompletion) 
    : blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0;

  return (
    <Link href="/planner">
      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid="bento-planner">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-chart-1" />
            <CardTitle className="text-base font-medium">Today's Plan</CardTitle>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : blocks.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No blocks planned</p>
              <p className="text-xs text-muted-foreground/70">Start planning your day</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{Math.round(completion)}%</span>
                <span className="text-sm text-muted-foreground">
                  {completedBlocks}/{blocks.length} blocks
                </span>
              </div>
              <Progress value={completion} className="h-2" />
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function GoalsBox() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <Link href="/goals">
      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid="bento-goals">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-chart-2" />
            <CardTitle className="text-base font-medium">Goals</CardTitle>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : goals.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <Target className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No goals set</p>
              <p className="text-xs text-muted-foreground/70">Define what you want to achieve</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{activeGoals.length}</span>
                <span className="text-sm text-muted-foreground">active goals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {completedGoals.length} completed
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function SecondBrainBox() {
  const { data: themes = [], isLoading } = useQuery<KnowledgeTopic[]>({
    queryKey: ["/api/knowledge-themes", "second_brain"],
  });

  return (
    <Link href="/second-brain">
      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid="bento-second-brain">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-chart-3" />
            <CardTitle className="text-base font-medium">Second Brain</CardTitle>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : themes.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <Brain className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No themes yet</p>
              <p className="text-xs text-muted-foreground/70">Organize your knowledge</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{themes.length}</span>
                <span className="text-sm text-muted-foreground">themes</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function LanguagesBox() {
  const { data: languages = [], isLoading } = useQuery<KnowledgeTopic[]>({
    queryKey: ["/api/knowledge-themes", "language"],
  });

  return (
    <Link href="/languages">
      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid="bento-languages">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-chart-4" />
            <CardTitle className="text-base font-medium">Languages</CardTitle>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : languages.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No languages</p>
              <p className="text-xs text-muted-foreground/70">Start learning a language</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{languages.length}</span>
                <span className="text-sm text-muted-foreground">languages</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function StudiesBox() {
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const activeCourses = courses.filter(c => !c.archived);
  const archivedCourses = courses.filter(c => c.archived);

  return (
    <Link href="/studies">
      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid="bento-studies">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-chart-5" />
            <CardTitle className="text-base font-medium">Studies</CardTitle>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : courses.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <GraduationCap className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No courses</p>
              <p className="text-xs text-muted-foreground/70">Add your academic courses</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{activeCourses.length}</span>
                <span className="text-sm text-muted-foreground">active courses</span>
              </div>
              {archivedCourses.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    {archivedCourses.length} archived
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface ModuleComponentEntry {
  component: () => JSX.Element;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const moduleComponents: Record<string, ModuleComponentEntry> = {
  planner: { component: PlannerBox, label: "Today's Plan", icon: Calendar },
  goals: { component: GoalsBox, label: "Goals", icon: Target },
  second_brain: { component: SecondBrainBox, label: "Second Brain", icon: Brain },
  languages: { component: LanguagesBox, label: "Languages", icon: BookOpen },
  studies: { component: StudiesBox, label: "Studies", icon: GraduationCap },
};

function CustomizeDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DashboardConfig;
  onConfigChange: (config: DashboardConfig) => void;
}) {
  const safeConfig = config || defaultConfig;
  const safeSizes = safeConfig.sizes || {};

  const moveUp = (id: string) => {
    const idx = safeConfig.order.indexOf(id);
    if (idx > 0) {
      const newOrder = [...safeConfig.order];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      onConfigChange({ ...safeConfig, order: newOrder });
    }
  };

  const moveDown = (id: string) => {
    const idx = safeConfig.order.indexOf(id);
    if (idx < safeConfig.order.length - 1) {
      const newOrder = [...safeConfig.order];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      onConfigChange({ ...safeConfig, order: newOrder });
    }
  };

  const toggleVisibility = (id: string) => {
    const hidden = safeConfig.hidden.includes(id)
      ? safeConfig.hidden.filter(h => h !== id)
      : [...safeConfig.hidden, id];
    onConfigChange({ ...safeConfig, hidden });
  };

  const toggleSize = (id: string) => {
    const currentSize = safeSizes[id] || "1x1";
    const newSize: BentoSize = currentSize === "1x1" ? "2x1" : "1x1";
    onConfigChange({ 
      ...safeConfig, 
      sizes: { ...safeSizes, [id]: newSize }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="customize-dashboard-dialog">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Choose which modules to show, their order, and size
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {safeConfig.order.map((id, index) => {
            const mod = moduleComponents[id];
            if (!mod) return null;
            const Icon = mod.icon;
            const isHidden = safeConfig.hidden.includes(id);
            const size = safeSizes[id] || "1x1";
            
            return (
              <div
                key={id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${isHidden ? "opacity-50" : ""}`}
                data-testid={`customize-item-${id}`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-sm font-medium">{mod.label}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant={size === "2x1" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleSize(id)}
                    disabled={isHidden}
                    data-testid={`button-size-${id}`}
                  >
                    {size}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveUp(id)}
                    disabled={index === 0}
                    data-testid={`button-move-up-${id}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveDown(id)}
                    disabled={index === safeConfig.order.length - 1}
                    data-testid={`button-move-down-${id}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => toggleVisibility(id)}
                    data-testid={`switch-visibility-${id}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} data-testid="button-done-customize">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [config, setConfig] = useState<DashboardConfig>(loadDashboardConfig);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const { data: pageSettings, isLoading: settingsLoading } = useQuery<PageSetting[]>({
    queryKey: ["/api/page-settings"],
  });

  useEffect(() => {
    saveDashboardConfig(config);
  }, [config]);

  const activeModuleIds = pageSettings
    ? Object.fromEntries(pageSettings.map(s => [s.module, s.active]))
    : {};

  const visibleModules = config.order.filter(id => {
    if (config.hidden.includes(id)) return false;
    if (pageSettings && activeModuleIds[id] === false) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-7xl">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" data-testid="text-welcome">
              Welcome to your dojo
            </h1>
            <p className="text-muted-foreground text-lg">
              Where you master yourself
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomizeOpen(true)}
            data-testid="button-customize-dashboard"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>

        {settingsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : visibleModules.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No modules visible</p>
            <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
              Customize Dashboard
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleModules.map(id => {
              const mod = moduleComponents[id];
              if (!mod) return null;
              const Component = mod.component;
              const size = (config?.sizes?.[id]) || "1x1";
              const sizeClass = size === "2x1" ? "sm:col-span-2" : "";
              return (
                <div key={id} className={sizeClass} data-testid={`bento-wrapper-${id}`}>
                  <Component />
                </div>
              );
            })}
          </div>
        )}

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-medium">More modules coming soon</h3>
                <p className="text-sm text-muted-foreground">
                  Body, Worship, Finances, and more are on the way
                </p>
              </div>
              <Button variant="outline" asChild data-testid="button-view-profile">
                <Link href="/profile">View Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        config={config}
        onConfigChange={setConfig}
      />
    </div>
  );
}
