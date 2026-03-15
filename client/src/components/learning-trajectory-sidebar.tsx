import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Check,
  Trash2,
  MoreHorizontal,
  LayoutDashboard,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { LearnPlanItem, KnowledgeTopic, Course, Flashcard, Discipline } from "@shared/schema";

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
        className={`group relative flex items-center gap-2 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-200 ${isSelected
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
              strokeDasharray={`${completionPercent * 0.628} 62.8`}
              className="text-primary transition-all duration-500"
            />
          </svg>
          {chapter.completed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" />
            </div>
          )}
        </div>

        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded
              ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
              : <ChevronRight className="w-3 h-3 text-muted-foreground" />
            }
          </button>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{chapter.title}</p>
          {(chapter.flashcardCount ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">{chapter.flashcardCount} cards</p>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
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

interface LearningTrajectorySidebarProps {
  isMobileSheet?: boolean;
}

export function LearningTrajectorySidebar({ isMobileSheet = false }: LearningTrajectorySidebarProps) {
  const [, navigate] = useLocation();
  const {
    subModuleInfo,
    isMobile,
    learningData,
    closeAllSidebars
  } = useDualSidebar();

  const isDiscipline = subModuleInfo?.type === "disciplines";
  const topicId = (subModuleInfo?.type !== "studies" && subModuleInfo?.type !== "disciplines") ? subModuleInfo?.id : undefined;
  const courseId = subModuleInfo?.type === "studies" ? subModuleInfo?.id : undefined;
  const disciplineId = subModuleInfo?.type === "disciplines" ? subModuleInfo?.id : undefined;

  const { data: theme } = useQuery<KnowledgeTopic>({
    queryKey: ["/api/knowledge-topics/detail", topicId],
    enabled: !!topicId
  });

  const { data: discipline } = useQuery<Discipline>({
    queryKey: ["/api/disciplines", disciplineId],
    enabled: !!disciplineId
  });

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<LearnPlanItem[]>({
    queryKey: courseId
      ? ["/api/learn-plan-items/course", courseId]
      : disciplineId
        ? ["/api/learn-plan-items/discipline", disciplineId]
        : ["/api/learn-plan-items", topicId],
    enabled: !!topicId || !!courseId || !!disciplineId
  });

  const { data: flashcards = [] } = useQuery<Flashcard[]>({
    queryKey: courseId
      ? ["/api/flashcards/course", courseId]
      : disciplineId
        ? ["/api/flashcards/discipline", disciplineId]
        : ["/api/flashcards/theme", topicId],
    enabled: !!topicId || !!courseId || !!disciplineId
  });

  const chapterTree = useMemo(() => buildChapterTree(chapters, flashcards), [chapters, flashcards]);

  const selectedChapterId = learningData?.selectedChapterId ?? null;
  const onSelectChapter = learningData?.onSelectChapter;

  const queryKey = courseId
    ? ["/api/learn-plan-items/course", courseId]
    : disciplineId
      ? ["/api/learn-plan-items/discipline", disciplineId]
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
    if (isMobile || isMobileSheet) {
      closeAllSidebars();
    }
  };

  const handleGoToOverview = () => {
    handleSelectChapter(null);
  };

  const handleAddChapter = (parentId: string | null = null) => {
    const currentPath = window.location.pathname + window.location.search;
    const params = new URLSearchParams();
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    if (parentId) params.set("parentId", parentId);
    params.set("return", currentPath);
    navigate(`/chapters/new?${params.toString()}`);
  };

  const title = (isDiscipline ? discipline?.name : theme?.name) || course?.name || "Loading...";

  if (!subModuleInfo) return null;

  return (
    <div className="flex flex-col h-full bg-background" data-testid="sidebar-trajectory">
      <div className="flex items-center justify-between px-4 h-16 border-b shrink-0">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Chapters</h2>
          <p className="text-sm font-medium truncate">{title}</p>
        </div>
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
                onClick={() => handleAddChapter(null)}
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
                  onAddSubchapter={(parentId) => handleAddChapter(parentId)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  animationDelay={index}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleAddChapter(null)}
          data-testid="button-add-chapter"
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Chapter
        </Button>
      </div>
      {/* Structural spacer for home-indicator area */}
      <div className="h-[env(safe-area-inset-bottom)] min-h-[env(safe-area-inset-bottom)] w-full" />
    </div>
  );
}

