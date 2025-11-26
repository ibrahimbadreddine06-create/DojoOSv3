import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, Plus, ChevronRight, ChevronDown, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { TodaySessions } from "@/components/today-sessions";
import { ChapterContentArea } from "@/components/chapter-content-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { KnowledgeTheme, LearnPlanItem } from "@shared/schema";

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
  themeId, 
  parentId = null, 
  onClose 
}: { 
  themeId: string; 
  parentId?: string | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(3);

  const createMutation = useMutation({
    mutationFn: async (data: { themeId: string; parentId?: string | null; title: string; importance: number }) => {
      return apiRequest("POST", "/api/learn-plan-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", themeId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ themeId, parentId, title: title.trim(), importance });
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
  const themeId = isSecondBrain ? paramsSecondBrain?.id : paramsLanguage?.id;
  const backPath = isSecondBrain ? "/second-brain" : "/languages";
  const moduleType = isSecondBrain ? "second_brain" : "language";

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  const { data: theme, isLoading: themeLoading } = useQuery<KnowledgeTheme>({
    queryKey: ["/api/knowledge-themes/detail", themeId],
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<LearnPlanItem[]>({
    queryKey: ["/api/learn-plan-items", themeId],
    enabled: !!themeId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; completed?: boolean; importance?: number; notes?: string }) => {
      return apiRequest("PATCH", `/api/learn-plan-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", themeId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/learn-plan-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", themeId] });
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
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backPath)} data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-theme-title">{theme.name}</h1>
            {theme.description && (
              <p className="text-sm text-muted-foreground">{theme.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" data-testid="badge-completion">
            {completionPercent}% Complete
          </Badge>
          <Badge variant="secondary" data-testid="badge-chapter-count">
            {completedChapters}/{totalChapters} Chapters
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r flex flex-col bg-muted/30">
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
                  themeId={themeId!}
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
                  themeId={themeId}
                  onNotesChange={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items", themeId] });
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
            <TodaySessions linkedModule={moduleType} linkedItemId={themeId} />
          </div>
        </div>
      </div>
    </div>
  );
}
