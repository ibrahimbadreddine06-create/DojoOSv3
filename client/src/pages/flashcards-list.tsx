import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  X, Brain, Plus, Search, Shuffle, ArrowDownAZ, 
  GraduationCap, Eye, Edit, Trash2, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const masteryColors: Record<number, string> = {
  0: "bg-zinc-500",
  1: "bg-red-500",
  2: "bg-yellow-500",
  3: "bg-blue-500",
  4: "bg-green-500",
};

const masteryLabels: Record<number, string> = {
  0: "New",
  1: "Learning",
  2: "Reviewing",
  3: "Almost",
  4: "Mastered",
};

export default function FlashcardsListPage() {
  const params = useParams<{ chapterId: string }>();
  const [, navigate] = useLocation();
  const chapterId = params.chapterId || "";
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const topicId = searchParams.get("topicId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const returnUrl = searchParams.get("return") || "/";
  const chapterTitle = searchParams.get("title") || "Flashcards";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);
  
  const { data: flashcards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/chapter", chapterId],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/flashcards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
      toast({ title: "Flashcard deleted" });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({ title: "Failed to delete flashcard", variant: "destructive" });
    },
  });

  const filteredFlashcards = useMemo(() => {
    if (!searchQuery.trim()) return flashcards;
    const query = searchQuery.toLowerCase();
    return flashcards.filter(f => 
      f.front.toLowerCase().includes(query) || 
      f.back.toLowerCase().includes(query)
    );
  }, [flashcards, searchQuery]);

  const masteryStats = useMemo(() => {
    const stats = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    flashcards.forEach(f => {
      stats[f.mastery as keyof typeof stats]++;
    });
    return stats;
  }, [flashcards]);

  const handleClose = () => {
    navigate(returnUrl);
  };

  const handleAddNew = () => {
    const params = new URLSearchParams();
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    params.set("return", window.location.pathname + window.location.search);
    navigate(`/flashcards/new/${chapterId}?${params.toString()}`);
  };

  const handleEdit = (flashcard: Flashcard) => {
    const params = new URLSearchParams();
    params.set("return", window.location.pathname + window.location.search);
    navigate(`/flashcards/edit/${flashcard.id}?${params.toString()}`);
  };

  const handleStartLearning = (mode: "all" | "new" | "review" = "all") => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("shuffle", "true");
    params.set("title", chapterTitle);
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    navigate(`/learn/${chapterId}?${params.toString()}`);
  };

  const handlePreview = (card: Flashcard) => {
    setPreviewCard(card);
    setShowBack(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-24" />
        </header>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="flashcards-list-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="font-medium flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {chapterTitle}
        </h1>
        
        <Button onClick={handleAddNew} data-testid="button-add-flashcard">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </header>

      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flashcards..."
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Object.entries(masteryStats).map(([level, count]) => (
              <div key={level} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${masteryColors[Number(level)]}`} />
                <span className="text-xs text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
          
          <div className="flex-1" />
          
          <Button 
            size="sm" 
            onClick={() => handleStartLearning("all")}
            disabled={flashcards.length === 0}
            data-testid="button-learn-all"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Learn All
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredFlashcards.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No flashcards match your search" : "No flashcards yet"}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddNew} data-testid="button-add-first">
                <Plus className="h-4 w-4 mr-2" />
                Create your first flashcard
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {filteredFlashcards.map((flashcard, index) => (
              <Card 
                key={flashcard.id} 
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => handlePreview(flashcard)}
                data-testid={`flashcard-item-${index}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${masteryColors[flashcard.mastery]}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: flashcard.front }}
                    />
                    <p 
                      className="text-sm text-muted-foreground line-clamp-1 mt-1"
                      dangerouslySetInnerHTML={{ __html: flashcard.back }}
                    />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(flashcard)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteConfirm(flashcard.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {previewCard && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setPreviewCard(null)}
        >
          <Card 
            className="w-full max-w-lg p-8 cursor-pointer min-h-[300px] flex flex-col items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowBack(!showBack);
            }}
          >
            <Badge className={`mb-4 ${masteryColors[previewCard.mastery]} text-white`}>
              {masteryLabels[previewCard.mastery]}
            </Badge>
            <p 
              className="text-xl text-center"
              dangerouslySetInnerHTML={{ __html: showBack ? previewCard.back : previewCard.front }}
            />
            <p className="text-sm text-muted-foreground mt-6">
              {showBack ? "Click to see question" : "Click to reveal answer"}
            </p>
          </Card>
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
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
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
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
