import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  ChevronUp, ChevronDown, MoreHorizontal, Trash2, Edit, 
  GripVertical, Brain, Sparkles, CheckCircle, AlertCircle, 
  HelpCircle, Zap, ChevronLeft, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@shared/schema";

interface FlashcardsOverviewProps {
  chapterId: string;
  topicId?: string;
  courseId?: string;
  childChapterIds?: string[];
  onBack?: () => void;
}

const masteryConfig = [
  { level: 0, label: "New", icon: Sparkles, color: "text-muted-foreground", bgColor: "bg-muted" },
  { level: 1, label: "Bad", icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
  { level: 2, label: "OK", icon: HelpCircle, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  { level: 3, label: "Good", icon: Zap, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { level: 4, label: "Mastered", icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
];

function getMasteryBadge(mastery: number) {
  const config = masteryConfig.find(m => m.level === mastery) || masteryConfig[0];
  const Icon = config.icon;
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} border-current/30 gap-1`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function FlashcardEditor({
  flashcard,
  onClose,
  chapterId,
}: {
  flashcard?: Flashcard;
  onClose: () => void;
  chapterId: string;
}) {
  const [front, setFront] = useState(flashcard?.front || "");
  const [back, setBack] = useState(flashcard?.back || "");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { front: string; back: string }) => {
      if (flashcard) {
        return apiRequest("PATCH", `/api/flashcards/${flashcard.id}`, data);
      } else {
        return apiRequest("POST", "/api/flashcards", { ...data, chapterId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
      toast({ title: flashcard ? "Flashcard updated" : "Flashcard created" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save flashcard", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    mutation.mutate({ front: front.trim(), back: back.trim() });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{flashcard ? "Edit Flashcard" : "New Flashcard"}</DialogTitle>
          <DialogDescription>
            {flashcard ? "Update your flashcard content" : "Create a new flashcard for this chapter"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Question (Front)</label>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question..."
              rows={3}
              autoFocus
              data-testid="textarea-flashcard-front"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Answer (Back)</label>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer..."
              rows={3}
              data-testid="textarea-flashcard-back"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!front.trim() || !back.trim() || mutation.isPending}
              data-testid="button-save-flashcard"
            >
              {mutation.isPending ? "Saving..." : flashcard ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FlashcardRow({
  flashcard,
  index,
  totalCards,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  flashcard: Flashcard;
  index: number;
  totalCards: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover-elevate group"
      data-testid={`flashcard-row-${flashcard.id}`}
    >
      <div className="hidden md:flex flex-col gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={onMoveUp}
          disabled={index === 0}
          data-testid={`button-move-up-${flashcard.id}`}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={onMoveDown}
          disabled={index === totalCards - 1}
          data-testid={`button-move-down-${flashcard.id}`}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="md:hidden">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p className="text-sm font-medium truncate">{flashcard.front}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{flashcard.back}</p>
      </div>

      <div className="flex items-center gap-2">
        {getMasteryBadge(flashcard.mastery)}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              data-testid={`button-flashcard-menu-${flashcard.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function FlashcardsOverview({
  chapterId,
  topicId,
  courseId,
  childChapterIds = [],
  onBack,
}: FlashcardsOverviewProps) {
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  const hasChildren = childChapterIds.length > 0;
  const childIdsParam = childChapterIds.join(',');

  const { data: flashcards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: hasChildren
      ? ["/api/flashcards/chapter", chapterId, "with-children", childIdsParam]
      : ["/api/flashcards/chapter", chapterId],
    queryFn: async () => {
      const url = hasChildren
        ? `/api/flashcards/chapter/${chapterId}/with-children?childIds=${childIdsParam}`
        : `/api/flashcards/chapter/${chapterId}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch flashcards');
      return res.json();
    },
  });

  const sortedFlashcards = useMemo(() => {
    return [...flashcards].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [flashcards]);

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

  const reorderMutation = useMutation({
    mutationFn: async (data: { id: string; newOrder: number }) => {
      return apiRequest("PATCH", `/api/flashcards/${data.id}`, { order: data.newOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
    },
  });

  const handleMoveUp = (flashcard: Flashcard, index: number) => {
    if (index === 0) return;
    const prevCard = sortedFlashcards[index - 1];
    const prevOrder = prevCard.order || index - 1;
    const currentOrder = flashcard.order || index;
    
    reorderMutation.mutate({ id: flashcard.id, newOrder: prevOrder });
    reorderMutation.mutate({ id: prevCard.id, newOrder: currentOrder });
  };

  const handleMoveDown = (flashcard: Flashcard, index: number) => {
    if (index === sortedFlashcards.length - 1) return;
    const nextCard = sortedFlashcards[index + 1];
    const nextOrder = nextCard.order || index + 1;
    const currentOrder = flashcard.order || index;
    
    reorderMutation.mutate({ id: flashcard.id, newOrder: nextOrder });
    reorderMutation.mutate({ id: nextCard.id, newOrder: currentOrder });
  };

  const stats = useMemo(() => {
    const total = flashcards.length;
    const mastered = flashcards.filter(f => f.mastery === 4).length;
    const toLearn = flashcards.filter(f => f.mastery < 4).length;
    const newCards = flashcards.filter(f => f.mastery === 0).length;
    return { total, mastered, toLearn, newCards };
  }, [flashcards]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold">Flashcards</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} cards • {stats.mastered} mastered • {stats.newCards} new
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} data-testid="button-create-flashcard">
          <Plus className="h-4 w-4 mr-2" />
          New Card
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {masteryConfig.map((config) => {
          const count = flashcards.filter(f => f.mastery === config.level).length;
          const Icon = config.icon;
          return (
            <Card key={config.level} className="p-3 text-center">
              <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </Card>
          );
        })}
      </div>

      {sortedFlashcards.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No flashcards yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first flashcard to start learning
          </p>
          <Button onClick={() => setIsCreating(true)} data-testid="button-create-first-flashcard">
            <Plus className="h-4 w-4 mr-2" />
            Create Flashcard
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedFlashcards.map((flashcard, index) => (
            <FlashcardRow
              key={flashcard.id}
              flashcard={flashcard}
              index={index}
              totalCards={sortedFlashcards.length}
              onEdit={() => setEditingFlashcard(flashcard)}
              onDelete={() => setDeleteConfirm(flashcard.id)}
              onMoveUp={() => handleMoveUp(flashcard, index)}
              onMoveDown={() => handleMoveDown(flashcard, index)}
            />
          ))}
        </div>
      )}

      {(editingFlashcard || isCreating) && (
        <FlashcardEditor
          flashcard={editingFlashcard || undefined}
          chapterId={chapterId}
          onClose={() => {
            setEditingFlashcard(null);
            setIsCreating(false);
          }}
        />
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
