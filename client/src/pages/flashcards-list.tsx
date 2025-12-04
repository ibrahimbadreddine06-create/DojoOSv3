import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ArrowLeft, Brain, Plus, Search, Edit, Trash2, MoreHorizontal,
  Play, ChevronDown, Pencil, Frown, Meh, Smile, Laugh, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const masteryIcons: Record<number, { icon: typeof Frown; color: string; label: string }> = {
  0: { icon: HelpCircle, color: "text-zinc-400", label: "New" },
  1: { icon: Frown, color: "text-red-500", label: "Bad" },
  2: { icon: Meh, color: "text-yellow-500", label: "OK" },
  3: { icon: Smile, color: "text-green-500", label: "Good" },
  4: { icon: Laugh, color: "text-blue-500", label: "Perfect" },
};

type SortOption = "newest" | "oldest" | "mastery-asc" | "mastery-desc";

function FlashcardGridCard({
  flashcard,
  index,
  onEdit,
  onDelete,
}: {
  flashcard: Flashcard;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const frontText = stripHtml(flashcard.front);
  const backText = stripHtml(flashcard.back);
  const mastery = masteryIcons[flashcard.mastery] || masteryIcons[0];
  const MasteryIcon = mastery.icon;

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-4 flex flex-col cursor-pointer hover-elevate transition-all"
      style={{ minHeight: "180px" }}
      onClick={onEdit}
      data-testid={`flashcard-card-${index}`}
    >
      {/* Top: Mastery icon */}
      <div className="flex items-center justify-between mb-3" title={mastery.label}>
        <MasteryIcon className={`h-5 w-5 ${mastery.color}`} />
      </div>

      {/* Question */}
      <div className="mb-2 flex-shrink-0">
        <p 
          className="font-semibold text-sm overflow-hidden"
          style={{ 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {frontText || "No question"}
        </p>
      </div>

      {/* Answer */}
      <div className="flex-1 overflow-hidden relative">
        <p 
          className="text-sm text-muted-foreground overflow-hidden"
          style={{ 
            display: '-webkit-box', 
            WebkitLineClamp: 3, 
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {backText || "No answer"}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      </div>

      {/* Bottom: Menu */}
      <div className="flex items-center justify-end mt-3 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-menu-${index}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
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
}

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
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
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

  const filteredAndSortedFlashcards = useMemo(() => {
    let result = [...flashcards];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.front.toLowerCase().includes(query) || 
        f.back.toLowerCase().includes(query)
      );
    }
    
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case "mastery-asc":
        result.sort((a, b) => a.mastery - b.mastery);
        break;
      case "mastery-desc":
        result.sort((a, b) => b.mastery - a.mastery);
        break;
    }
    
    return result;
  }, [flashcards, searchQuery, sortBy]);

  const reviewCount = useMemo(() => {
    return flashcards.filter(f => f.mastery < 4).length;
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

  const handleStartReview = () => {
    const params = new URLSearchParams();
    params.set("mode", "review");
    params.set("shuffle", "true");
    params.set("title", chapterTitle);
    if (topicId) params.set("topicId", topicId);
    if (courseId) params.set("courseId", courseId);
    navigate(`/learn/${chapterId}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="flashcards-list-page">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClose} 
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1">
          <h1 className="font-semibold text-lg">{chapterTitle}</h1>
          <Badge variant="secondary" className="text-xs px-3">
            {flashcards.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAddNew}
            className="gap-2"
            data-testid="button-editor"
          >
            <Pencil className="h-4 w-4" />
            Editor
          </Button>
          
          <Button 
            size="sm"
            onClick={handleStartReview}
            disabled={reviewCount === 0}
            className="gap-2"
            data-testid="button-review"
          >
            <Play className="h-4 w-4" />
            Review {reviewCount} flashcards
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-more-options">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add flashcard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search and Sort bar */}
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flashcards"
            className="pl-10 bg-muted/50"
            data-testid="input-search"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-auto gap-2 border-0 bg-transparent" data-testid="select-sort">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="mastery-asc">Mastery (low to high)</SelectItem>
            <SelectItem value="mastery-desc">Mastery (high to low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid of flashcards */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedFlashcards.length === 0 ? (
          <div className="text-center py-16">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedFlashcards.map((flashcard, index) => (
              <FlashcardGridCard
                key={flashcard.id}
                flashcard={flashcard}
                index={index}
                onEdit={() => handleEdit(flashcard)}
                onDelete={() => setDeleteConfirm(flashcard.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
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
