import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, MoreHorizontal, Trash2, Edit, Plus, Sparkles,
  Loader2, AlertCircle, ChevronRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChapterNote, Material } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Props ───────────────────────────────────────────────────────────────────

interface NotesListProps {
  chapterId: string;
  topicId?: string;
  courseId?: string;
  childChapterIds?: string[];
  materials?: Material[];
  chapterTitle?: string;
  chapterContext?: string;
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleName: string;
    submoduleType: string;
  };
}

// ─── AI Note Generator Dialog ────────────────────────────────────────────────

function AINoteDialog({
  open, onClose, chapterId, topicId, courseId, chapterTitle, chapterContext,
  trajectoryContext, materials, onNoteCreated,
}: {
  open: boolean;
  onClose: () => void;
  chapterId: string;
  topicId?: string;
  courseId?: string;
  chapterTitle?: string;
  chapterContext?: string;
  trajectoryContext?: NotesListProps["trajectoryContext"];
  materials?: Material[];
  onNoteCreated: (noteId: string) => void;
}) {
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [userPrompt, setUserPrompt] = useState("");
  const [error, setError] = useState("");

  const hasMaterials = (materials || []).length > 0;

  const generateAndSaveMutation = useMutation({
    mutationFn: async () => {
      const mats = (materials || [])
        .filter(m => selectedMaterials.has(m.id))
        .map(m => ({ title: m.title, url: m.url || undefined, type: m.type }));

      const generated = await apiRequest("POST", "/api/ai/generate-notes", {
        chapterTitle: chapterTitle || "",
        chapterContext: chapterContext || "",
        materials: mats,
        userPrompt: userPrompt || undefined,
        trajectoryContext,
      });
      const { title, content } = await generated.json();

      const noteRes = await apiRequest("POST", "/api/notes", {
        chapterId,
        topicId,
        courseId,
        title: title || `Notes: ${chapterTitle}`,
        content: content || "",
      });
      return noteRes.json() as Promise<ChapterNote>;
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/chapter", chapterId] });
      onNoteCreated(note.id);
    },
    onError: (e: any) => {
      setError(e.message || "Note generation failed. Please try again.");
    },
  });

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    setUserPrompt("");
    setError("");
    setSelectedMaterials(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg flex flex-col p-0 gap-0" style={{ maxHeight: "80vh" }}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Note with AI
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI will analyze your selected materials and create structured notes for this chapter.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {hasMaterials && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Source Materials</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setSelectedMaterials(
                        selectedMaterials.size === (materials || []).length
                          ? new Set()
                          : new Set((materials || []).map(m => m.id))
                      )
                    }
                  >
                    {selectedMaterials.size === (materials || []).length ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(materials || []).map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 p-2.5 rounded-md hover-elevate cursor-pointer"
                      data-testid={`ai-note-material-${m.id}`}
                    >
                      <Checkbox
                        checked={selectedMaterials.has(m.id)}
                        onCheckedChange={() => toggleMaterial(m.id)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.type}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedMaterials.size === 0 && (
                  <p className="text-xs text-muted-foreground">No materials selected — AI will use its knowledge of the topic.</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                What kind of notes? <span className="text-muted-foreground font-normal">(optional)</span>
              </p>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={`e.g. "Detailed summary with examples" or "Key definitions only" or "Focus on formulas"`}
                className="text-sm"
                rows={3}
                data-testid="input-note-prompt"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0">
          <Button variant="ghost" onClick={handleClose} data-testid="button-cancel-ai-note">Cancel</Button>
          <Button
            onClick={() => generateAndSaveMutation.mutate()}
            disabled={generateAndSaveMutation.isPending}
            data-testid="button-generate-note"
          >
            {generateAndSaveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Note <ChevronRight className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── NotesList Component ──────────────────────────────────────────────────────

export function NotesList({
  chapterId, topicId, courseId, childChapterIds = [],
  materials, chapterTitle, chapterContext, trajectoryContext,
}: NotesListProps) {
  const [, navigate] = useLocation();
  const [aiNoteOpen, setAiNoteOpen] = useState(false);
  const currentPath = window.location.pathname;
  const buildReturnUrl = () => currentPath + window.location.search;

  const hasChildren = childChapterIds.length > 0;
  const childIdsParam = childChapterIds.join(',');

  const { data: notes = [], isLoading } = useQuery<ChapterNote[]>({
    queryKey: hasChildren
      ? ["/api/notes/chapter", chapterId, "with-children", childIdsParam]
      : ["/api/notes/chapter", chapterId],
    queryFn: async () => {
      const url = hasChildren
        ? `/api/notes/chapter/${chapterId}/with-children?childIds=${childIdsParam}`
        : `/api/notes/chapter/${chapterId}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/chapter", chapterId] });
      if (hasChildren) {
        queryClient.invalidateQueries({ queryKey: ["/api/notes/chapter", chapterId, "with-children"] });
      }
    },
  });

  const handleCreateNote = () => {
    const params = new URLSearchParams();
    params.set("chapterId", chapterId);
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    params.set("return", buildReturnUrl());
    navigate(`/notes/new?${params.toString()}`);
  };

  const handleEditNote = (noteId: string) => {
    const params = new URLSearchParams();
    params.set("chapterId", chapterId);
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    params.set("return", buildReturnUrl());
    navigate(`/notes/${noteId}?${params.toString()}`);
  };

  const handleAINoteCreated = (noteId: string) => {
    setAiNoteOpen(false);
    handleEditNote(noteId);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-12 bg-muted animate-pulse rounded-md" />
        <div className="h-12 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Notes</h3>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setAiNoteOpen(true)}
            title="Generate note with AI"
            data-testid="button-ai-generate-note"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCreateNote} data-testid="button-create-note">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-6 border rounded-md border-dashed space-y-3">
          <p className="text-sm text-muted-foreground">No notes yet. Create notes to organize your thoughts.</p>
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setAiNoteOpen(true)} data-testid="button-ai-add-first-note">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate with AI
            </Button>
            <Button size="sm" onClick={handleCreateNote} data-testid="button-add-first-note">
              Write manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const snippet = note.content
              ? note.content.replace(/<[^>]*>/g, '').slice(0, 60) + (note.content.length > 60 ? '...' : '')
              : 'Empty note';
            return (
              <div
                key={note.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover-elevate cursor-pointer group"
                onClick={() => handleEditNote(note.id)}
                data-testid={`note-item-${note.id}`}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{note.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{snippet}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" data-testid={`button-note-menu-${note.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditNote(note.id); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this note?")) deleteMutation.mutate(note.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AINoteDialog
        open={aiNoteOpen}
        onClose={() => setAiNoteOpen(false)}
        chapterId={chapterId}
        topicId={topicId}
        courseId={courseId}
        chapterTitle={chapterTitle}
        chapterContext={chapterContext}
        trajectoryContext={trajectoryContext}
        materials={materials}
        onNoteCreated={handleAINoteCreated}
      />
    </div>
  );
}
