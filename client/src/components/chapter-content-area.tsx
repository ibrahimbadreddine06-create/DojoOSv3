import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, FileText, Video, Link2, File, ExternalLink, Trash2, GraduationCap, BookOpen, Brain, MoreHorizontal, List, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { NotesList } from "@/components/note-editor";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import { MaterialViewerDialog } from "@/components/dialogs/material-viewer-dialog";
import { AIMaterialFinder } from "@/components/ai-material-finder";
import type { LearnPlanItem, Material, Flashcard } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChapterContentAreaProps {
  chapter: LearnPlanItem;
  topicId?: string;
  courseId?: string;
  disciplineId?: string;
  childChapterIds?: string[];
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleType: string;
    submoduleName: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYoutubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

function isYoutubeUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h.includes("youtube.com") || h.includes("youtu.be");
  } catch {
    return false;
  }
}

function getFaviconUrl(url: string): string {
  try {
    return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`;
  } catch {
    return "";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CompletionReadinessMetrics({ flashcards, chapter }: { flashcards: Flashcard[]; chapter: LearnPlanItem }) {
  const safeFlashcards = Array.isArray(flashcards) ? flashcards : [];
  const readiness = useMemo(() => calculateReadinessWithDecay(safeFlashcards), [safeFlashcards]);
  const completion = chapter.completed ? 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Completion</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{completion}%</p>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-primary/70" />
          <span className="text-sm font-medium">Readiness</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary/70 transition-all" style={{ width: `${readiness}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{readiness}%</p>
      </div>
    </div>
  );
}

function FlashcardCircleChart({ flashcards }: { flashcards: Flashcard[] }) {
  const total = flashcards.length;
  const mastered = flashcards.filter(f => f.mastery === 4).length;
  const toLearn = flashcards.filter(f => f.mastery < 4).length;
  const circumference = 2 * Math.PI * 15.91549;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="15.91549" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">0</span>
          </div>
        </div>
        <div className="text-center space-y-1 text-xs text-muted-foreground">
          <p>Mastered: 0</p><p>To learn: 0</p>
          <p className="font-medium text-foreground">Total: 0</p>
        </div>
      </div>
    );
  }

  const masteredOffset = circumference * (1 - (mastered / total));

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <circle cx="18" cy="18" r="15.91549" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
          <circle cx="18" cy="18" r="15.91549" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={circumference} strokeDashoffset={masteredOffset}
            className="text-green-500 transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold">{total}</span>
        </div>
      </div>
      <div className="text-center space-y-1 text-xs text-muted-foreground">
        <p>Mastered: {mastered}</p><p>To learn: {toLearn}</p>
        <p className="font-medium text-foreground">Total: {total}</p>
      </div>
    </div>
  );
}

// ─── Material Thumbnail ───────────────────────────────────────────────────────

function MaterialThumbnail({ material }: { material: Material }) {
  const [faviconError, setFaviconError] = useState(false);

  // YouTube thumbnail
  if (material.type === "video") {
    const thumbUrl = (material as any).thumbnailUrl as string | undefined;
    const videoId = material.url ? extractYoutubeId(material.url) : "";
    const ytThumb = thumbUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "");

    if (ytThumb) {
      return (
        <div className="w-14 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
          <img src={ytThumb} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-md bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
        <Play className="h-4 w-4 text-red-600 dark:text-red-400" />
      </div>
    );
  }

  // Website favicon
  if (material.type === "link" && material.url && !faviconError) {
    const favicon = getFaviconUrl(material.url);
    return (
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 p-2">
        <img
          src={favicon}
          alt=""
          className="w-full h-full object-contain"
          onError={() => setFaviconError(true)}
        />
      </div>
    );
  }

  // PDF
  if (material.type === "pdf") {
    return (
      <div className="w-10 h-10 rounded-md bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
        <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      </div>
    );
  }

  // File / fallback link
  const Icon = material.type === "link" ? Link2 : File;
  return (
    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChapterContentArea({
  chapter, topicId, courseId, disciplineId,
  childChapterIds = [], trajectoryContext,
}: ChapterContentAreaProps) {
  const [, navigate] = useLocation();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [aiFinderOpen, setAiFinderOpen] = useState(false);

  const currentPath = window.location.pathname;
  const buildReturnUrl = () => currentPath + window.location.search;

  const handleStartLearning = () => {
    const params = new URLSearchParams();
    params.set("mode", "all"); params.set("shuffle", "true"); params.set("title", chapter.title);
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    if (disciplineId) params.set("disciplineId", disciplineId);
    navigate(`/learn/${chapter.id}?${params.toString()}`);
  };

  const handleAddFlashcard = () => {
    const params = new URLSearchParams();
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    if (disciplineId) params.set("disciplineId", disciplineId);
    params.set("return", buildReturnUrl());
    navigate(`/flashcards/new/${chapter.id}?${params.toString()}`);
  };

  const handleViewAllFlashcards = () => {
    const params = new URLSearchParams();
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    if (disciplineId) params.set("disciplineId", disciplineId);
    params.set("title", chapter.title);
    params.set("return", buildReturnUrl());
    navigate(`/flashcards/${chapter.id}?${params.toString()}`);
  };

  const handleAddMaterial = () => {
    const params = new URLSearchParams();
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    if (disciplineId) params.set("disciplineId", disciplineId);
    params.set("return", buildReturnUrl());
    navigate(`/materials/new/${chapter.id}?${params.toString()}`);
  };

  const hasChildren = childChapterIds.length > 0;
  const childIdsParam = childChapterIds.join(",");

  const { data: materials = [], isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: hasChildren
      ? ["/api/materials/chapter", chapter.id, "with-children", childIdsParam]
      : ["/api/materials/chapter", chapter.id],
    queryFn: async () => {
      const url = hasChildren
        ? `/api/materials/chapter/${chapter.id}/with-children?childIds=${childIdsParam}`
        : `/api/materials/chapter/${chapter.id}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch materials");
      return res.json();
    },
  });

  const { data: flashcards = [], isLoading: flashcardsLoading } = useQuery<Flashcard[]>({
    queryKey: hasChildren
      ? ["/api/flashcards/chapter", chapter.id, "with-children", childIdsParam]
      : ["/api/flashcards/chapter", chapter.id],
    queryFn: async () => {
      const url = hasChildren
        ? `/api/flashcards/chapter/${chapter.id}/with-children?childIds=${childIdsParam}`
        : `/api/flashcards/chapter/${chapter.id}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch flashcards");
      return res.json();
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id] });
      if (hasChildren) {
        queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id, "with-children"] });
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-chapter-title">
            {chapter.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">Importance: {chapter.importance}/5</Badge>
            {chapter.completed && <Badge variant="secondary" className="text-xs">Completed</Badge>}
          </div>
        </div>
      </div>

      {/* Flashcards + Progress */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Flashcards</h3>
            <Button size="icon" variant="ghost" onClick={handleAddFlashcard} data-testid="button-add-flashcard">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {flashcardsLoading ? (
            <div className="flex justify-center py-4">
              <Skeleton className="w-20 h-20 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <FlashcardCircleChart flashcards={flashcards} />
              <div className="flex gap-2 w-full">
                <Button className="flex-1" onClick={handleStartLearning} disabled={flashcards.length === 0} data-testid="button-start-learning">
                  <GraduationCap className="h-4 w-4 mr-2" /> Learn
                </Button>
                <Button variant="outline" onClick={handleViewAllFlashcards} data-testid="button-view-all-flashcards">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-medium text-sm mb-4">Progress</h3>
          <CompletionReadinessMetrics flashcards={flashcards} chapter={chapter} />
        </Card>
      </div>

      {/* Materials */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">Materials</h3>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAiFinderOpen(true)}
              data-testid="button-ai-find-materials"
              title="Find Materials with AI"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAddMaterial}
              data-testid="button-add-material"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {materialsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              No materials yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiFinderOpen(true)}
              data-testid="button-ai-find-empty"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Find Materials with AI
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((material) => {
              const hasUploadedFile = !!(material as any).fileData;

              return (
                <div
                  key={material.id}
                  className="flex items-center gap-3 p-2.5 rounded-md bg-muted/30 hover-elevate cursor-pointer group"
                  onClick={() => setSelectedMaterial(material)}
                  data-testid={`material-item-${material.id}`}
                >
                  <MaterialThumbnail material={material} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{material.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {material.type.toUpperCase()}
                      {hasUploadedFile && ` • ${(material as any).fileName}`}
                      {material.url && !hasUploadedFile && (() => {
                        try { return ` • ${new URL(material.url).hostname}`; } catch { return ""; }
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 invisible group-hover:visible">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" data-testid={`button-material-menu-${material.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedMaterial(material); }}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Open Viewer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          if (hasUploadedFile) {
                            const link = document.createElement("a");
                            link.href = (material as any).fileData;
                            link.download = (material as any).fileName || material.title;
                            link.click();
                          } else if (material.url) {
                            window.open(material.url, "_blank");
                          }
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {hasUploadedFile ? "Download" : "Open in New Tab"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); deleteMaterialMutation.mutate(material.id); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Notes */}
      <Card className="p-4">
        <NotesList
          chapterId={chapter.id}
          topicId={topicId}
          courseId={courseId}
          childChapterIds={childChapterIds}
        />
      </Card>

      {/* Dialogs */}
      <MaterialViewerDialog
        material={selectedMaterial}
        open={!!selectedMaterial}
        onOpenChange={(open) => !open && setSelectedMaterial(null)}
      />

      <AIMaterialFinder
        open={aiFinderOpen}
        onClose={() => setAiFinderOpen(false)}
        chapter={{ id: chapter.id, title: chapter.title }}
        topicId={topicId}
        courseId={courseId}
        disciplineId={disciplineId}
        trajectoryContext={trajectoryContext}
        onMaterialsAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id] });
        }}
      />
    </div>
  );
}
