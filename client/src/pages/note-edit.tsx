import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  X, FileText, Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Heading1, Heading2, Heading3, Link, Undo, Redo, Save, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChapterNote } from "@shared/schema";

function RichTextToolbar({ onCommand }: { onCommand: (cmd: string, value?: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10">
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('bold')} title="Bold (Ctrl+B)">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('italic')} title="Italic (Ctrl+I)">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('underline')} title="Underline (Ctrl+U)">
        <Underline className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('strikeThrough')} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('formatBlock', 'h1')} title="Heading 1">
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('formatBlock', 'h2')} title="Heading 2">
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('formatBlock', 'h3')} title="Heading 3">
        <Heading3 className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('justifyLeft')} title="Align Left">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('justifyCenter')} title="Align Center">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('justifyRight')} title="Align Right">
        <AlignRight className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('insertUnorderedList')} title="Bullet List">
        <List className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('insertOrderedList')} title="Numbered List">
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button type="button" variant="ghost" size="icon" onClick={() => {
        const url = prompt("Enter URL:");
        if (url) onCommand('createLink', url);
      }} title="Insert Link">
        <Link className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('undo')} title="Undo (Ctrl+Z)">
        <Undo className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('redo')} title="Redo (Ctrl+Y)">
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function NoteEditPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const noteId = params.id;
  const isNew = noteId === "new";
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const chapterId = searchParams.get("chapterId") || "";
  const topicId = searchParams.get("topicId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const returnUrl = searchParams.get("return") || "/";
  
  const [title, setTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { data: note, isLoading } = useQuery<ChapterNote>({
    queryKey: ["/api/notes", noteId],
    enabled: !isNew && !!noteId,
  });

  useEffect(() => {
    if (note && !initialized) {
      setTitle(note.title);
      if (editorRef.current) editorRef.current.innerHTML = note.content;
      setInitialized(true);
    }
  }, [note, initialized]);
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = editorRef.current?.innerHTML || "";
      if (isNew) {
        return apiRequest("POST", "/api/notes", {
          chapterId,
          topicId,
          courseId,
          title: title || "Untitled Note",
          content,
        });
      } else {
        return apiRequest("PATCH", `/api/notes/${noteId}`, { title, content });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/chapter", chapterId] });
      if (!isNew) {
        queryClient.invalidateQueries({ queryKey: ["/api/notes", noteId] });
      }
      toast({ title: isNew ? "Note created" : "Note updated" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to save note", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/chapter", chapterId] });
      toast({ title: "Note deleted" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveMutation.mutate();
    }
  }, [saveMutation]);

  const handleClose = () => {
    navigate(returnUrl);
  };

  if (!isNew && isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="note-edit-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="font-medium flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {isNew ? "New Note" : "Edit Note"}
        </h1>
        
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              data-testid="button-delete-note"
            >
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
          )}
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
            data-testid="button-save-note"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="border-b p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
            data-testid="input-note-title"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <RichTextToolbar onCommand={execCommand} />
          <div
            ref={editorRef}
            contentEditable
            className="flex-1 p-4 focus:outline-none prose prose-sm max-w-none"
            onKeyDown={handleKeyDown}
            data-placeholder="Start writing your note..."
            data-testid="editor-content"
          />
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This note will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

