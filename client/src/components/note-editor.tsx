import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, 
  AlignRight, Heading1, Heading2, Undo, Redo, Save, X, Link2, FileText, MoreHorizontal, Trash2, Edit
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChapterNote } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteEditorProps {
  noteId?: string;
  chapterId: string;
  topicId?: string;
  courseId?: string;
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialContent?: string;
}

function ToolbarButton({ 
  onClick, 
  icon: Icon, 
  title,
  active = false
}: { 
  onClick: () => void; 
  icon: typeof Bold; 
  title: string;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      title={title}
      data-testid={`button-format-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export function NoteEditor({ 
  noteId, 
  chapterId, 
  topicId, 
  courseId, 
  open, 
  onClose,
  initialTitle = "",
  initialContent = ""
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: existingNote } = useQuery<ChapterNote>({
    queryKey: ["/api/notes", noteId],
    enabled: !!noteId && open,
  });

  useEffect(() => {
    if (existingNote && editorRef.current) {
      setTitle(existingNote.title);
      editorRef.current.innerHTML = existingNote.content;
    } else if (!noteId && editorRef.current) {
      setTitle(initialTitle);
      editorRef.current.innerHTML = initialContent;
    }
  }, [existingNote, noteId, initialTitle, initialContent, open]);

  useEffect(() => {
    if (open && editorRef.current && !noteId) {
      editorRef.current.innerHTML = "";
      setTitle("");
    }
  }, [open, noteId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = editorRef.current?.innerHTML || "";
      if (noteId) {
        return apiRequest("PATCH", `/api/notes/${noteId}`, { title, content });
      } else {
        return apiRequest("POST", "/api/notes", {
          chapterId,
          topicId,
          courseId,
          title: title || "Untitled Note",
          content,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/chapter", chapterId] });
      if (noteId) {
        queryClient.invalidateQueries({ queryKey: ["/api/notes", noteId] });
      }
      toast({ title: noteId ? "Note updated" : "Note created" });
      setHasChanges(false);
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save note", variant: "destructive" });
    },
  });

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setHasChanges(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveMutation.mutate();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      execCommand('bold');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      execCommand('italic');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      execCommand('underline');
    }
  }, [execCommand, saveMutation]);

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Discard them?");
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="sr-only">{noteId ? "Edit Note" : "Create Note"}</DialogTitle>
          <DialogDescription className="sr-only">
            {noteId ? "Edit your note with rich text formatting" : "Create a new note with rich text formatting"}
          </DialogDescription>
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
            placeholder="Note title..."
            className="text-lg font-semibold border-none px-0 focus-visible:ring-0"
            data-testid="input-note-title"
          />
        </DialogHeader>

        <div className="flex items-center gap-1 border-b pb-2 flex-wrap">
          <ToolbarButton icon={Bold} title="Bold" onClick={() => execCommand('bold')} />
          <ToolbarButton icon={Italic} title="Italic" onClick={() => execCommand('italic')} />
          <ToolbarButton icon={Underline} title="Underline" onClick={() => execCommand('underline')} />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton icon={Heading1} title="Heading 1" onClick={() => execCommand('formatBlock', 'h1')} />
          <ToolbarButton icon={Heading2} title="Heading 2" onClick={() => execCommand('formatBlock', 'h2')} />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton icon={List} title="Bullet List" onClick={() => execCommand('insertUnorderedList')} />
          <ToolbarButton icon={ListOrdered} title="Numbered List" onClick={() => execCommand('insertOrderedList')} />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton icon={AlignLeft} title="Align Left" onClick={() => execCommand('justifyLeft')} />
          <ToolbarButton icon={AlignCenter} title="Align Center" onClick={() => execCommand('justifyCenter')} />
          <ToolbarButton icon={AlignRight} title="Align Right" onClick={() => execCommand('justifyRight')} />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton icon={Link2} title="Insert Link" onClick={insertLink} />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton icon={Undo} title="Undo" onClick={() => execCommand('undo')} />
          <ToolbarButton icon={Redo} title="Redo" onClick={() => execCommand('redo')} />
        </div>

        <div
          ref={editorRef}
          contentEditable
          onInput={() => setHasChanges(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 overflow-y-auto p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none dark:prose-invert"
          style={{ minHeight: "200px" }}
          data-testid="editor-note-content"
        />

        <div className="flex justify-between items-center pt-4 flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? "Unsaved changes" : "All changes saved"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-note">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending || !title.trim()}
              data-testid="button-save-note"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface NotesListProps {
  chapterId: string;
  topicId?: string;
  courseId?: string;
  childChapterIds?: string[];
}

export function NotesList({ chapterId, topicId, courseId, childChapterIds = [] }: NotesListProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>();

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
    setSelectedNoteId(undefined);
    setEditorOpen(true);
  };

  const handleEditNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setEditorOpen(true);
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
        <Button size="sm" variant="outline" onClick={handleCreateNote} data-testid="button-create-note">
          + New Note
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

      <NoteEditor
        noteId={selectedNoteId}
        chapterId={chapterId}
        topicId={topicId}
        courseId={courseId}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
