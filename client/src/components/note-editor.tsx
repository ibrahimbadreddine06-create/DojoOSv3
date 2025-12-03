import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, MoreHorizontal, Trash2, Edit, Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChapterNote } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotesListProps {
  chapterId: string;
  topicId?: string;
  courseId?: string;
  childChapterIds?: string[];
}

export function NotesList({ chapterId, topicId, courseId, childChapterIds = [] }: NotesListProps) {
  const [, navigate] = useLocation();
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
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notes/${id}`);
    },
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
        <Button size="sm" variant="ghost" onClick={handleCreateNote} data-testid="button-create-note">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-6 border rounded-md border-dashed">
          <p className="text-sm text-muted-foreground mb-2">No notes yet. Create notes to organize your thoughts.</p>
          <Button size="sm" onClick={handleCreateNote} data-testid="button-add-first-note">
            Create your first note
          </Button>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-note-menu-${note.id}`}>
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
                          if (confirm("Delete this note?")) {
                            deleteMutation.mutate(note.id);
                          }
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
    </div>
  );
}
