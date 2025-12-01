import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, Plus, ChevronRight, ChevronDown, Check, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TodaySessions } from "@/components/today-sessions";
import { ChapterContentArea } from "@/components/chapter-content-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import type { KnowledgeTopic, LearnPlanItem, KnowledgeMetric, Flashcard } from "@shared/schema";

interface ChapterWithChildren extends LearnPlanItem {
  children: ChapterWithChildren[];
}

function buildChapterTree(items: LearnPlanItem[]): ChapterWithChildren[] {
  const map = new Map<string, ChapterWithChildren>();
  const roots: ChapterWithChildren[] = [];

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByOrder = (a: ChapterWithChildren, b: ChapterWithChildren) => a.order - b.order;
  const sortRecursive = (nodes: ChapterWithChildren[]) => {
    nodes.sort(sortByOrder);
    nodes.forEach(node => sortRecursive(node.children));
  };
  sortRecursive(roots);

  return roots;
}

function ChapterItem({ 
  chapter, 
  depth = 0, 
  selectedId,
  onSelect,
  onToggleComplete,
  onAddSubchapter,
  onDelete
}: { 
  chapter: ChapterWithChildren; 
  depth?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onAddSubchapter: (parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = chapter.children.length > 0;
  const isSelected = selectedId === chapter.id;

  const importanceColors: Record<number, string> = {
    1: "bg-muted/50",
    2: "bg-blue-500/10",
    3: "bg-yellow-500/10",
    4: "bg-orange-500/10",
    5: "bg-red-500/10",
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover-elevate ${
          isSelected ? "bg-accent" : ""
        } ${importanceColors[chapter.importance] || ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(chapter.id)}
        data-testid={`chapter-item-${chapter.id}`}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            data-testid={`button-toggle-chapter-${chapter.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 p-0 ${chapter.completed ? "text-primary" : "text-muted-foreground"}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(chapter.id, !chapter.completed);
          }}
          data-testid={`button-complete-chapter-${chapter.id}`}
        >
          <div className={`h-3.5 w-3.5 rounded-sm border ${chapter.completed ? "bg-primary border-primary" : "border-muted-foreground"} flex items-center justify-center`}>
            {chapter.completed && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
          </div>
        </Button>

        <span className={`flex-1 text-sm truncate ${chapter.completed ? "line-through text-muted-foreground" : ""}`}>
          {chapter.title}
        </span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubchapter(chapter.id);
            }}
            data-testid={`button-add-subchapter-${chapter.id}`}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chapter.id);
            }}
            data-testid={`button-delete-chapter-${chapter.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {chapter.children.map(child => (
            <ChapterItem
              key={child.id}
              chapter={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleComplete={onToggleComplete}
              onAddSubchapter={onAddSubchapter}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddChapterDialog({ 
  topicId, 
  parentId = null, 
  onClose 
}: { 
  topicId: string; 
  parentId?: string | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(3);

  const createMutation = useMutation({
    mutationFn: async (data: { topicId: string; parentId?: string | null; title: string; importance: number }) => {
      return apiRequest("POST", "/api/learn-plan-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", topicId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ topicId, parentId, title: title.trim(), importance });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Chapter Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter chapter title..."
          data-testid="input-chapter-title"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Importance Level: {importance}
        </label>
        <Slider
          value={[importance]}
          onValueChange={(v) => setImportance(v[0])}
          min={1}
          max={5}
          step={1}
          data-testid="slider-chapter-importance"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || createMutation.isPending} data-testid="button-create-chapter">
          {createMutation.isPending ? "Creating..." : "Create Chapter"}
        </Button>
      </div>
    </form>
  );
}

export default function ThemeDetail() {
  const [, navigate] = useLocation();
  const [matchSecondBrain, paramsSecondBrain] = useRoute("/second-brain/:id");
  const [matchLanguage, paramsLanguage] = useRoute("/languages/:id");
  
  const isSecondBrain = matchSecondBrain;
  const topicId = isSecondBrain ? paramsSecondBrain?.id : paramsLanguage?.id;
  const backPath = isSecondBrain ? "/second-brain" : "/languages";
  const moduleType = isSecondBrain ? "second_brain" : "language";

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  const { data: theme, isLoading: themeLoading } = useQuery<KnowledgeTopic>({
    queryKey: ["/api/knowledge-topics/detail", topicId],
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<LearnPlanItem[]>({
    queryKey: ["/api/learn-plan-items", topicId],
    enabled: !!topicId,
  });

  const { data: flashcards = [] } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/theme", topicId],
    enabled: !!topicId,
  });

  const { data: knowledgeMetrics = [] } = useQuery<KnowledgeMetric[]>({
    queryKey: ["/api/knowledge-metrics", topicId],
    enabled: !!topicId,
  });

  const [metricsOpen, setMetricsOpen] = useState(false);

  const readinessPercent = useMemo(() => {
    return calculateReadinessWithDecay(flashcards);
  }, [flashcards]);

  const chartData = useMemo(() => {
    if (!knowledgeMetrics || knowledgeMetrics.length === 0) {
      // Show initial data point at 0% for today
      const today = new Date().toISOString().split('T')[0];
      return [{
        date: format(parseISO(today), "MMM d"),
        fullDate: today,
        completion: 0,
        readiness: 0,
      }];
    }
    return knowledgeMetrics.map(m => ({
      date: format(parseISO(m.date), "MMM d"),
      fullDate: m.date,
      completion: parseFloat(m.completion),
      readiness: parseFloat(m.readiness),
    }));
  }, [knowledgeMetrics]);

  const chartConfig = {
    completion: {
      label: "Completion",
      color: "hsl(var(--primary))",
    },
    readiness: {
      label: "Readiness",
      color: "hsl(var(--chart-2))",
    },
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; completed?: boolean; importance?: number; notes?: string }) => {
      return apiRequest("PATCH", `/api/learn-plan-items/${id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", topicId] });
      const updatedChapters = queryClient.getQueryData<LearnPlanItem[]>(["/api/learn-plan-items", topicId]);
      const updatedFlashcards = queryClient.getQueryData<Flashcard[]>(["/api/flashcards/theme", topicId]) || [];
      
      if (updatedChapters && updatedChapters.length > 0 && topicId) {
        const total = updatedChapters.length;
        const completed = updatedChapters.filter(c => c.completed).length;
        const completion = Math.round((completed / total) * 100);
        const readiness = calculateReadinessWithDecay(updatedFlashcards);
        
        const today = format(new Date(), "yyyy-MM-dd");
        await apiRequest("PUT", `/api/knowledge-metrics/${topicId}/${today}`, { completion, readiness });
        queryClient.invalidateQueries({ queryKey: ["/api/knowledge-metrics", topicId] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/learn-plan-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", topicId] });
      if (selectedChapterId) {
        setSelectedChapterId(null);
      }
    },
  });

  const chapterTree = buildChapterTree(chapters);
  const selectedChapter = chapters.find(c => c.id === selectedChapterId);

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.completed).length;
  const completionPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  if (themeLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-[280px,1fr] gap-6 h-[calc(100vh-200px)]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(backPath)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Theme not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backPath)} data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate" data-testid="text-theme-title">{theme.name}</h1>
            {theme.description && (
              <p className="text-sm text-muted-foreground truncate">{theme.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap pl-11 sm:pl-0">
          <Badge variant="outline" className="text-xs" data-testid="badge-completion">
            {completionPercent}% Complete
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid="badge-readiness">
            {readinessPercent}% Ready
          </Badge>
          <Badge variant="secondary" className="text-xs" data-testid="badge-chapter-count">
            {completedChapters}/{totalChapters} Chapters
          </Badge>
        </div>
      </div>

      <div className="px-4 py-3 border-b bg-muted/20">
        {chartData.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
            Complete chapters and review flashcards to start tracking progress
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-32 w-full">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]} 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 10 }}
                width={30}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="completion" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
                name="Completion"
              />
              <Line 
                type="monotone" 
                dataKey="readiness" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
                name="Readiness"
              />
              <Legend />
            </LineChart>
          </ChartContainer>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r flex-shrink-0 flex flex-col bg-muted/30 max-h-[40vh] md:max-h-none overflow-auto md:overflow-visible">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium text-sm">Learning Trajectory</h3>
            <Dialog open={addChapterOpen} onOpenChange={(open) => {
              setAddChapterOpen(open);
              if (!open) setParentIdForNew(null);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-add-chapter">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {parentIdForNew ? "Add Sub-Chapter" : "Add Chapter"}
                  </DialogTitle>
                </DialogHeader>
                <AddChapterDialog
                  topicId={topicId!}
                  parentId={parentIdForNew}
                  onClose={() => {
                    setAddChapterOpen(false);
                    setParentIdForNew(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {chaptersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : chapterTree.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">No chapters yet</p>
                  <Button
                    size="sm"
                    onClick={() => setAddChapterOpen(true)}
                    data-testid="button-add-first-chapter"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Chapter
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {chapterTree.map(chapter => (
                    <ChapterItem
                      key={chapter.id}
                      chapter={chapter}
                      selectedId={selectedChapterId}
                      onSelect={setSelectedChapterId}
                      onToggleComplete={(id, completed) => updateMutation.mutate({ id, completed })}
                      onAddSubchapter={(parentId) => {
                        setParentIdForNew(parentId);
                        setAddChapterOpen(true);
                      }}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedChapter ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <ChapterContentArea 
                  chapter={selectedChapter} 
                  topicId={topicId}
                  onNotesChange={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", topicId] });
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Select a chapter to view its content</p>
                <p className="text-sm text-muted-foreground">
                  Or add a new chapter from the sidebar
                </p>
              </div>
            </div>
          )}

          <div className="border-t p-4 bg-muted/20">
            <h3 className="font-medium text-sm mb-3">Today's Sessions</h3>
            <TodaySessions module={moduleType as "second_brain" | "languages"} itemId={topicId} />
          </div>
        </div>
      </div>
    </div>
  );
}
