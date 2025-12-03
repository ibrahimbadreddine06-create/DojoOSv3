import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Trash2, 
  MoreHorizontal, 
  LayoutDashboard,
  BookOpen,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useDualSidebar } from "@/contexts/dual-sidebar-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import type { LearnPlanItem, KnowledgeTopic, Course, Flashcard } from "@shared/schema";

interface ChapterWithChildren extends LearnPlanItem {
  children: ChapterWithChildren[];
  flashcardCount?: number;
}

function buildChapterTree(items: LearnPlanItem[], flashcards: Flashcard[] = []): ChapterWithChildren[] {
  const flashcardCountByChapter = new Map<string, number>();
  flashcards.forEach(fc => {
    if (fc.chapterId) {
      flashcardCountByChapter.set(fc.chapterId, (flashcardCountByChapter.get(fc.chapterId) || 0) + 1);
    }
  });

  const map = new Map<string, ChapterWithChildren>();
  const roots: ChapterWithChildren[] = [];
  
  items.forEach(item => {
    map.set(item.id, { 
      ...item, 
      children: [],
      flashcardCount: flashcardCountByChapter.get(item.id) || 0
    });
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

interface ChapterCardProps {
  chapter: ChapterWithChildren;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onAddSubchapter: (parentId: string) => void;
  onDelete: (id: string) => void;
  animationDelay: number;
}

function ChapterCard({
  chapter,
  depth,
  selectedId,
  onSelect,
  onToggleComplete,
  onAddSubchapter,
  onDelete,
  animationDelay,
}: ChapterCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = chapter.children.length > 0;
  const isSelected = selectedId === chapter.id;
  const completionPercent = chapter.completed ? 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: animationDelay * 0.04 }}
    >
      <div
        className={`group relative flex items-center gap-2 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected 
            ? "bg-accent shadow-sm" 
            : "hover-elevate"
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={() => onSelect(chapter.id)}
        data-testid={`chapter-card-${chapter.id}`}
      >
        <div className="relative flex-shrink-0 w-6 h-6">
          <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${(completionPercent / 100) * 62.83} 62.83`}
              className={chapter.completed ? "text-primary" : "text-muted-foreground"}
            />
          </svg>
          {chapter.completed && (
            <Check className="absolute inset-0 m-auto w-3 h-3 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${chapter.completed ? "text-muted-foreground line-through" : ""}`}>
            {chapter.title}
          </p>
          {(chapter.flashcardCount ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {chapter.flashcardCount} cards
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasChildren && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              data-testid={`button-toggle-chapter-${chapter.id}`}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
                data-testid={`button-menu-chapter-${chapter.id}`}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleComplete(chapter.id, !chapter.completed)}>
                <Check className="h-3 w-3 mr-2" />
                {chapter.completed ? "Mark Incomplete" : "Mark Complete"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubchapter(chapter.id)}>
                <Plus className="h-3 w-3 mr-2" />
                Add Subchapter
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(chapter.id)}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {chapter.children.map((child, index) => (
              <ChapterCard
                key={child.id}
                chapter={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onToggleComplete={onToggleComplete}
                onAddSubchapter={onAddSubchapter}
                onDelete={onDelete}
                animationDelay={animationDelay + index + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface AddChapterDialogProps {
  topicId?: string;
  courseId?: string;
  parentId: string | null;
  onClose: () => void;
}

function AddChapterDialog({ topicId, courseId, parentId, onClose }: AddChapterDialogProps) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(3);
  
  const queryKey = courseId 
    ? ["/api/learn-plan-items/course", courseId]
    : ["/api/learn-plan-items", topicId];

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/learn-plan-items", data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey }); 
      onClose(); 
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data: any = { parentId, title: title.trim(), importance };
    if (courseId) data.courseId = courseId;
    if (topicId) data.topicId = topicId;
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Chapter Title</label>
        <Input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Enter chapter title..." 
          data-testid="input-new-chapter-title" 
          autoFocus 
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Importance Level: {importance}</label>
        <Slider 
          value={[importance]} 
          onValueChange={(v) => setImportance(v[0])} 
          min={1} max={5} step={1} 
          data-testid="slider-new-chapter-importance" 
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!title.trim() || createMutation.isPending} data-testid="button-create-new-chapter">
          {createMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}

export function LearningTrajectorySidebar() {
  const [, navigate] = useLocation();
  const { 
    subModuleInfo, 
    trajectorySidebarOpen, 
    isMobile,
    learningData,
    closeAllSidebars
  } = useDualSidebar();

  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  const topicId = subModuleInfo?.type !== "studies" ? subModuleInfo?.id : undefined;
  const courseId = subModuleInfo?.type === "studies" ? subModuleInfo?.id : undefined;

  const { data: theme } = useQuery<KnowledgeTopic>({ 
    queryKey: ["/api/knowledge-topics/detail", topicId], 
    enabled: !!topicId 
  });
  
  const { data: course } = useQuery<Course>({ 
    queryKey: ["/api/courses", courseId], 
    enabled: !!courseId 
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<LearnPlanItem[]>({ 
    queryKey: courseId 
      ? ["/api/learn-plan-items/course", courseId]
      : ["/api/learn-plan-items", topicId], 
    enabled: !!topicId || !!courseId 
  });

  const { data: flashcards = [] } = useQuery<Flashcard[]>({ 
    queryKey: courseId 
      ? ["/api/flashcards/course", courseId]
      : ["/api/flashcards/theme", topicId], 
    enabled: !!topicId || !!courseId 
  });

  const chapterTree = useMemo(() => buildChapterTree(chapters, flashcards), [chapters, flashcards]);
  
  const selectedChapterId = learningData?.selectedChapterId ?? null;
  const onSelectChapter = learningData?.onSelectChapter;

  const queryKey = courseId 
    ? ["/api/learn-plan-items/course", courseId]
    : ["/api/learn-plan-items", topicId];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/learn-plan-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => apiRequest("PATCH", `/api/learn-plan-items/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleSelectChapter = (id: string | null) => {
    if (onSelectChapter) {
      onSelectChapter(id);
    }
    if (isMobile) {
      closeAllSidebars();
    }
  };

  const handleGoToOverview = () => {
    handleSelectChapter(null);
    if (isMobile) {
      closeAllSidebars();
    }
  };

  const handleAddSubchapter = (parentId: string) => {
    setParentIdForNew(parentId);
    setAddChapterOpen(true);
  };

  const title = theme?.name || course?.name || "Loading...";

  if (!subModuleInfo) return null;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chapters</h2>
          <p className="text-sm font-medium truncate mt-0.5">{title}</p>
        </div>
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeAllSidebars}
            data-testid="button-close-trajectory"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-2">
        <Button
          variant={selectedChapterId === null ? "secondary" : "ghost"}
          className="w-full justify-start gap-2"
          onClick={handleGoToOverview}
          data-testid="button-overview"
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {chaptersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : chapterTree.length === 0 ? (
            <div className="text-center py-8 px-4">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No chapters yet</p>
              <Button 
                size="sm" 
                onClick={() => setAddChapterOpen(true)} 
                data-testid="button-add-first-chapter"
              >
                <Plus className="h-4 w-4 mr-2" /> Add First Chapter
              </Button>
            </div>
          ) : (
            <div>
              {chapterTree.map((chapter, index) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  depth={0}
                  selectedId={selectedChapterId}
                  onSelect={handleSelectChapter}
                  onToggleComplete={(id, completed) => updateMutation.mutate({ id, completed })}
                  onAddSubchapter={handleAddSubchapter}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  animationDelay={index}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Dialog 
          open={addChapterOpen} 
          onOpenChange={(open) => { 
            setAddChapterOpen(open); 
            if (!open) setParentIdForNew(null); 
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" data-testid="button-add-chapter">
              <Plus className="h-4 w-4 mr-2" /> Add New Chapter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{parentIdForNew ? "Add Sub-Chapter" : "Add Chapter"}</DialogTitle>
            </DialogHeader>
            <AddChapterDialog 
              topicId={topicId}
              courseId={courseId}
              parentId={parentIdForNew} 
              onClose={() => { 
                setAddChapterOpen(false); 
                setParentIdForNew(null); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {trajectorySidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={closeAllSidebars}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 shadow-xl"
              data-testid="sidebar-trajectory"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (!trajectorySidebarOpen) return null;

  return (
    <div className="w-80 border-r flex-shrink-0" data-testid="sidebar-trajectory">
      {sidebarContent}
    </div>
  );
}
