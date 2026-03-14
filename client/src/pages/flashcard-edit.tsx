import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  X, Brain, Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Undo, Redo, Image, Volume2, Save, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { Flashcard } from "@shared/schema";

function RichTextToolbar({ onCommand }: { onCommand: (cmd: string, value?: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('bold')} title="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('italic')} title="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('underline')} title="Underline">
        <Underline className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('strikeThrough')} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
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
      
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('undo')} title="Undo">
        <Undo className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onCommand('redo')} title="Redo">
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function FlashcardEditPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const flashcardId = params.id || "";
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get("return") || "/";
  
  const [activeTab, setActiveTab] = useState("front");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  
  const { data: flashcard, isLoading } = useQuery<Flashcard>({
    queryKey: ["/api/flashcards", flashcardId],
  });

  useEffect(() => {
    if (flashcard && !initialized) {
      if (frontRef.current) frontRef.current.innerHTML = flashcard.front;
      if (backRef.current) backRef.current.innerHTML = flashcard.back;
      setImageUrl(flashcard.imageUrl || "");
      setAudioUrl(flashcard.audioUrl || "");
      setInitialized(true);
    }
  }, [flashcard, initialized]);
  
  const updateMutation = useMutation({
    mutationFn: async (data: { front: string; back: string; imageUrl?: string; audioUrl?: string }) => {
      return apiRequest("PATCH", `/api/flashcards/${flashcardId}`, data);
    },
    onSuccess: () => {
      if (flashcard?.chapterId) {
        queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", flashcard.chapterId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards", flashcardId] });
      toast({ title: "Flashcard updated" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to update flashcard", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/flashcards/${flashcardId}`);
    },
    onSuccess: () => {
      if (flashcard?.chapterId) {
        queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", flashcard.chapterId] });
      }
      toast({ title: "Flashcard deleted" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to delete flashcard", variant: "destructive" });
    },
  });

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    const activeRef = activeTab === "front" ? frontRef : backRef;
    activeRef.current?.focus();
  }, [activeTab]);

  const handleSubmit = () => {
    const front = frontRef.current?.innerHTML?.trim() || "";
    const back = backRef.current?.innerHTML?.trim() || "";
    
    if (!front || !back) {
      toast({ title: "Please fill in both front and back", variant: "destructive" });
      return;
    }
    
    updateMutation.mutate({
      front,
      back,
      imageUrl: imageUrl.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined,
    });
  };

  const handleClose = () => {
    navigate(returnUrl);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!flashcard) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Flashcard not found</p>
        <Button onClick={handleClose}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="flashcard-edit-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="font-medium flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Edit Flashcard
        </h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="button-delete-flashcard"
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateMutation.isPending}
            data-testid="button-save-flashcard"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="front" data-testid="tab-front">Front (Question)</TabsTrigger>
              <TabsTrigger value="back" data-testid="tab-back">Back (Answer)</TabsTrigger>
              <TabsTrigger value="media" data-testid="tab-media">Media</TabsTrigger>
            </TabsList>
            
            <TabsContent value="front" className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                <RichTextToolbar onCommand={execCommand} />
                <div
                  ref={frontRef}
                  contentEditable
                  className="min-h-[200px] p-4 focus:outline-none"
                  data-placeholder="Enter the question..."
                  data-testid="editor-front"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="back" className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                <RichTextToolbar onCommand={execCommand} />
                <div
                  ref={backRef}
                  contentEditable
                  className="min-h-[200px] p-4 focus:outline-none"
                  data-placeholder="Enter the answer..."
                  data-testid="editor-back"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image URL
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-image-url"
                />
                {imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img src={imageUrl} alt="Preview" className="max-h-48 object-contain mx-auto" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Audio URL
                </label>
                <Input
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  data-testid="input-audio-url"
                />
                {audioUrl && (
                  <audio controls className="w-full mt-2">
                    <source src={audioUrl} />
                  </audio>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This flashcard will be permanently deleted.
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

