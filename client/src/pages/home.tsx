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
  GripVertical, X, ChevronUp, ChevronDown, ImageIcon, Upload, Plus, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Goal, KnowledgeTopic, Course, TimeBlock, PageSetting } from "@shared/schema";

type BentoSize = "1x1" | "1x2" | "1x3" | "2x1" | "2x2" | "2x3" | "3x1" | "3x2" | "3x3";

const ALL_SIZES: BentoSize[] = ["1x1", "1x2", "1x3", "2x1", "2x2", "2x3", "3x1", "3x2", "3x3"];

interface DashboardConfig {
  order: string[];
  sizes: Record<string, BentoSize>;
  hidden: string[];
  imageData: Record<string, string>;
  nextWidgetId: number;
}

const CORE_MODULES = ["planner", "goals", "second_brain", "languages", "studies"];

const defaultConfig: DashboardConfig = {
  order: ["planner", "goals", "second_brain", "languages", "studies"],
  sizes: {},
  hidden: [],
  imageData: {},
  nextWidgetId: 1,
};

function isValidWidgetId(id: string): boolean {
  // Core modules are valid
  if (CORE_MODULES.includes(id)) return true;
  // Dynamic widgets must have pattern type_number (clock_1, image_2, etc.)
  if (id.startsWith("clock_") || id.startsWith("image_")) return true;
  // Anything else (like bare "clock" or "image") is invalid
  return false;
}

function loadDashboardConfig(): DashboardConfig {
  try {
    const saved = localStorage.getItem("dashboardConfigV2");
    if (saved) {
      const config = JSON.parse(saved) as DashboardConfig;
      if (!Array.isArray(config.order)) {
        return defaultConfig;
      }
      // Remove any invalid widget IDs (like bare "clock" or "image")
      config.order = config.order.filter(id => isValidWidgetId(id));
      // Ensure core modules exist in order
      const missingCore = CORE_MODULES.filter(m => !config.order.includes(m));
      if (missingCore.length > 0) {
        config.order = [...missingCore, ...config.order];
      }
      config.sizes = config.sizes && typeof config.sizes === 'object' ? config.sizes : {};
      config.hidden = Array.isArray(config.hidden) ? config.hidden : [];
      config.imageData = config.imageData && typeof config.imageData === 'object' ? config.imageData : {};
      config.nextWidgetId = typeof config.nextWidgetId === 'number' ? config.nextWidgetId : 1;
      return config;
    }
  } catch {}
  return defaultConfig;
}

function saveDashboardConfig(config: DashboardConfig) {
  localStorage.setItem("dashboardConfigV2", JSON.stringify(config));
}

function getWidgetType(id: string): string {
  if (id.startsWith("clock_")) return "clock";
  if (id.startsWith("image_")) return "image";
  return id;
}

function getWidgetLabel(id: string): string {
  const type = getWidgetType(id);
  if (type === "clock") return "Clock";
  if (type === "image") return "Image";
  return moduleLabels[id] || id;
}

const moduleLabels: Record<string, string> = {
  planner: "Today's Plan",
  goals: "Goals",
  second_brain: "Second Brain",
  languages: "Languages",
  studies: "Studies",
};

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
    queryKey: ["/api/knowledge-topics", "second_brain"],
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
    queryKey: ["/api/knowledge-topics", "language"],
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

function ClockBox({ id }: { id: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');

  return (
    <Card className="h-full flex items-center justify-center" data-testid={`bento-${id}`}>
      <CardContent className="p-4 flex flex-col items-center justify-center">
        <span className="text-5xl font-mono font-bold tracking-wider">
          {hours}:{minutes}
        </span>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {format(time, "EEEE, MMMM d")}
        </p>
      </CardContent>
    </Card>
  );
}

function ImageBox({ 
  id, 
  imageData, 
  onImageChange 
}: { 
  id: string; 
  imageData: string | null; 
  onImageChange: (id: string, data: string | null) => void;
}) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onImageChange(id, base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="h-full overflow-hidden" data-testid={`bento-${id}`}>
      {imageData ? (
        <div className="relative w-full h-full min-h-[120px]">
          <img
            src={imageData}
            alt="Dashboard image"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <label 
          className="flex flex-col items-center justify-center h-full min-h-[120px] cursor-pointer hover-elevate transition-colors"
          data-testid={`button-upload-${id}`}
        >
          <Upload className="w-10 h-10 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload</span>
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            data-testid={`input-upload-${id}`}
          />
        </label>
      )}
    </Card>
  );
}

const coreModuleComponents: Record<string, { component: () => JSX.Element; icon: React.ComponentType<{ className?: string }> }> = {
  planner: { component: PlannerBox, icon: Calendar },
  goals: { component: GoalsBox, icon: Target },
  second_brain: { component: SecondBrainBox, icon: Brain },
  languages: { component: LanguagesBox, icon: BookOpen },
  studies: { component: StudiesBox, icon: GraduationCap },
};

function getWidgetIcon(id: string): React.ComponentType<{ className?: string }> {
  const type = getWidgetType(id);
  if (type === "clock") return Clock;
  if (type === "image") return ImageIcon;
  return coreModuleComponents[id]?.icon || Sparkles;
}

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
  const safeConfig = {
    ...defaultConfig,
    ...config,
    hidden: config?.hidden || [],
    sizes: config?.sizes || {},
  };
  const safeSizes = safeConfig.sizes;

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

  const changeSize = (id: string, newSize: BentoSize) => {
    onConfigChange({ 
      ...safeConfig, 
      sizes: { ...safeSizes, [id]: newSize }
    });
  };

  const addWidget = (type: "clock" | "image") => {
    const newId = `${type}_${safeConfig.nextWidgetId}`;
    onConfigChange({
      ...safeConfig,
      order: [...safeConfig.order, newId],
      nextWidgetId: safeConfig.nextWidgetId + 1,
    });
  };

  const removeWidget = (id: string) => {
    const newOrder = safeConfig.order.filter(i => i !== id);
    const newSizes = { ...safeSizes };
    delete newSizes[id];
    const newImageData = { ...safeConfig.imageData };
    delete newImageData[id];
    onConfigChange({
      ...safeConfig,
      order: newOrder,
      sizes: newSizes,
      imageData: newImageData,
    });
  };

  const isDynamicWidget = (id: string) => {
    return id.startsWith("clock_") || id.startsWith("image_");
  };

  const isCoreModule = (id: string) => {
    return CORE_MODULES.includes(id);
  };

  const toggleHidden = (id: string) => {
    const isHidden = safeConfig.hidden.includes(id);
    const newHidden = isHidden
      ? safeConfig.hidden.filter(h => h !== id)
      : [...safeConfig.hidden, id];
    onConfigChange({ ...safeConfig, hidden: newHidden });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" data-testid="customize-dashboard-dialog">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Arrange widgets, change sizes, and add new ones
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWidget("clock")}
            data-testid="button-add-clock"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Clock
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWidget("image")}
            data-testid="button-add-image"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Image
          </Button>
        </div>

        <div className="space-y-2 py-2">
          {safeConfig.order.map((id, index) => {
            const Icon = getWidgetIcon(id);
            const label = getWidgetLabel(id);
            const size = safeSizes[id] || "1x1";
            const canDelete = isDynamicWidget(id);
            const canToggle = isCoreModule(id);
            const isHidden = safeConfig.hidden.includes(id);
            
            return (
              <div
                key={id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${isHidden ? 'opacity-50' : ''}`}
                data-testid={`customize-item-${id}`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                {canToggle && (
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => toggleHidden(id)}
                    data-testid={`switch-toggle-${id}`}
                  />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium truncate">{label}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Select
                    value={size}
                    onValueChange={(v) => changeSize(id, v as BentoSize)}
                  >
                    <SelectTrigger className="w-16 h-7 text-xs" data-testid={`select-size-${id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_SIZES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveUp(id)}
                    disabled={index === 0}
                    data-testid={`button-move-up-${id}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveDown(id)}
                    disabled={index === safeConfig.order.length - 1}
                    data-testid={`button-move-down-${id}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWidget(id)}
                      data-testid={`button-delete-${id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)} data-testid="button-done-customize">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getSizeClass(size: BentoSize): string {
  const [cols, rows] = size.split("x").map(Number);
  let className = "";
  if (cols === 2) className += "sm:col-span-2 ";
  if (cols === 3) className += "sm:col-span-2 lg:col-span-3 ";
  if (rows === 2) className += "row-span-2 ";
  if (rows === 3) className += "row-span-3 ";
  return className.trim();
}

function getRowHeight(size: BentoSize): string {
  const [, rows] = size.split("x").map(Number);
  if (rows === 1) return "min-h-[140px]";
  if (rows === 2) return "min-h-[296px]";
  if (rows === 3) return "min-h-[452px]";
  return "min-h-[140px]";
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

  const visibleWidgets = config.order.filter(id => {
    // Filter out hidden widgets
    if (config.hidden.includes(id)) {
      return false;
    }
    // Filter out core modules that are disabled in page settings
    const type = getWidgetType(id);
    if (CORE_MODULES.includes(type) && pageSettings && activeModuleIds[type] === false) {
      return false;
    }
    return true;
  });

  const handleImageChange = (id: string, data: string | null) => {
    const newImageData = { ...config.imageData };
    if (data) {
      newImageData[id] = data;
    } else {
      delete newImageData[id];
    }
    setConfig({ ...config, imageData: newImageData });
  };

  const renderWidget = (id: string) => {
    const type = getWidgetType(id);
    
    if (type === "clock") {
      return <ClockBox id={id} />;
    }
    
    if (type === "image") {
      return (
        <ImageBox 
          id={id} 
          imageData={config.imageData[id] || null}
          onImageChange={handleImageChange}
        />
      );
    }
    
    const coreModule = coreModuleComponents[id];
    if (coreModule) {
      const Component = coreModule.component;
      return <Component />;
    }
    
    return null;
  };

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
        ) : visibleWidgets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No widgets on dashboard</p>
            <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
              Customize Dashboard
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-min">
            {visibleWidgets.map(id => {
              const size = config.sizes[id] || "1x1";
              const sizeClass = getSizeClass(size);
              const heightClass = getRowHeight(size);
              return (
                <div key={id} className={`${sizeClass} ${heightClass}`} data-testid={`bento-wrapper-${id}`}>
                  {renderWidget(id)}
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
