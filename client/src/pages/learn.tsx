import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  X, Settings, HelpCircle, Keyboard, MoreHorizontal,
  Plus, Frown, Meh, Smile, Laugh
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import type { Flashcard, LearnPlanItem } from "@shared/schema";

type RatingType = "bad" | "ok" | "good" | "perfect";

interface StudyCard extends Flashcard {
  goodCount: number;
  position: number;
}

function SegmentedProgressBar({ 
  total, 
  completed,
  current,
}: { 
  total: number; 
  completed: number;
  current: number;
}) {
  if (total === 0) return null;
  
  return (
    <div className="flex items-center gap-0.5 px-4 py-3" data-testid="progress-bar">
      {Array.from({ length: total }).map((_, i) => {
        const isCompleted = i < completed;
        const isCurrent = i === current;
        
        return (
          <div
            key={i}
            className={`
              h-1.5 flex-1 rounded-sm transition-all
              ${isCompleted 
                ? "bg-primary" 
                : isCurrent 
                  ? "bg-primary/60" 
                  : "bg-muted-foreground/20"
              }
            `}
          />
        );
      })}
    </div>
  );
}

function FlashcardView({
  card,
  showBack,
  onFlip,
  queueLength,
}: {
  card: StudyCard;
  showBack: boolean;
  onFlip: () => void;
  queueLength: number;
}) {
  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const displayText = showBack ? stripHtml(card.back) : stripHtml(card.front);

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
      {/* Card stack container */}
      <div className="relative w-full max-w-3xl">
        {/* Stacked cards behind (show up to 2 cards in queue) */}
        {queueLength > 2 && (
          <div 
            className="absolute inset-0 bg-card/40 border border-border/30 rounded-2xl transform translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4"
            style={{ zIndex: 1 }}
          />
        )}
        {queueLength > 1 && (
          <div 
            className="absolute inset-0 bg-card/60 border border-border/50 rounded-2xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2"
            style={{ zIndex: 2 }}
          />
        )}
        
        {/* Main flashcard */}
        <div 
          className="relative w-full bg-card border border-border rounded-2xl shadow-xl cursor-pointer min-h-[360px] md:min-h-[420px]"
          style={{ zIndex: 3 }}
          onClick={onFlip}
          data-testid="flashcard-content"
        >
          <div className="absolute top-3 left-3 md:top-4 md:left-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground text-xs gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-3 w-3" />
              Add tags
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-3 right-3 md:top-4 md:right-4 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit card</DropdownMenuItem>
              <DropdownMenuItem>Report issue</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Card content with proper overflow handling */}
          <div className="flex items-center justify-center min-h-[360px] md:min-h-[420px] p-6 md:p-10 pt-16 md:pt-20 pb-16 overflow-hidden">
            <div className="w-full max-h-[280px] md:max-h-[340px] overflow-y-auto">
              <p className="text-lg md:text-2xl lg:text-3xl text-foreground text-center leading-relaxed break-words">
                {displayText}
              </p>
            </div>
          </div>

          {/* Show answer button at bottom */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Keyboard className="h-5 w-5" />
              </Button>
              {!showBack && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlip();
                  }}
                  data-testid="button-show-answer"
                >
                  Show answer
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RatingButtons({
  onRate,
  disabled,
}: {
  onRate: (rating: RatingType) => void;
  disabled: boolean;
}) {
  const ratings = [
    { 
      type: "bad" as RatingType, 
      label: "Bad", 
      interval: "in 4 cards",
      icon: Frown,
      bgColor: "bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900",
    },
    { 
      type: "ok" as RatingType, 
      label: "OK", 
      interval: "in 4 days",
      icon: Meh,
      bgColor: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800",
    },
    { 
      type: "good" as RatingType, 
      label: "Good", 
      interval: "in 8 days",
      icon: Smile,
      bgColor: "bg-green-700 hover:bg-green-800 dark:bg-green-800 dark:hover:bg-green-900",
    },
    { 
      type: "perfect" as RatingType, 
      label: "Perfect", 
      interval: "in 18 days",
      icon: Laugh,
      bgColor: "bg-blue-700 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-900",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 p-4 border-t border-border bg-background">
      {ratings.map((rating) => {
        const Icon = rating.icon;
        return (
          <button
            key={rating.type}
            className={`
              flex flex-col items-center py-3 px-2 rounded-xl transition-all
              ${rating.bgColor} text-white
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            onClick={() => onRate(rating.type)}
            disabled={disabled}
            data-testid={`button-rate-${rating.type}`}
          >
            <Icon className="h-7 w-7 mb-1" />
            <span className="font-semibold text-sm">{rating.label}</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] opacity-80">
              <span>{rating.interval}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SessionComplete({
  stats,
  onContinue,
  onExit,
}: {
  stats: { total: number; mastered: number; reviewed: number };
  onContinue: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
        <Smile className="w-12 h-12 text-green-500" />
      </div>
      
      <h2 className="text-3xl font-bold mb-2 text-foreground">Session Complete!</h2>
      <p className="text-muted-foreground mb-8">Great work on your study session</p>

      <div className="grid grid-cols-3 gap-8 mb-10">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{stats.reviewed}</p>
          <p className="text-sm text-muted-foreground">Cards Studied</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-green-500">{stats.mastered}</p>
          <p className="text-sm text-muted-foreground">Mastered</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-yellow-500">{stats.total - stats.mastered}</p>
          <p className="text-sm text-muted-foreground">Needs Review</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={onContinue}
          data-testid="button-continue-learning"
        >
          Continue Learning
        </Button>
        <Button 
          size="lg"
          onClick={onExit}
          data-testid="button-finish"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const params = useParams<{ chapterId: string }>();
  const [, navigate] = useLocation();
  const chapterId = params.chapterId || "";
  
  const [studyQueue, setStudyQueue] = useState<StudyCard[]>([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [masteredCount, setMasteredCount] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode") || "all";
  const shuffle = searchParams.get("shuffle") !== "false";
  const topicId = searchParams.get("topicId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const chapterTitle = searchParams.get("title") || "Learning";

  const { data: flashcards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/chapter", chapterId],
  });

  useEffect(() => {
    if (flashcards.length > 0 && !initialized) {
      let cards: Flashcard[] = [];
      
      switch (mode) {
        case "new":
          cards = flashcards.filter(f => f.mastery === 0);
          break;
        case "review":
          cards = flashcards.filter(f => f.mastery > 0 && f.mastery < 4);
          break;
        case "all":
        default:
          cards = [...flashcards];
          break;
      }
      
      const orderedCards = shuffle 
        ? cards.sort(() => Math.random() - 0.5)
        : cards.sort((a, b) => (a.order || 0) - (b.order || 0));
        
      const studyCards: StudyCard[] = orderedCards.map((card, i) => ({
        ...card,
        goodCount: (card as any).goodCount || 0,
        position: i,
      }));
      
      setStudyQueue(studyCards);
      setInitialTotal(studyCards.length);
      setInitialized(true);
    }
  }, [flashcards, mode, shuffle, initialized]);

  const currentCard = studyQueue[0];
  const currentIndex = initialTotal - studyQueue.length;

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Flashcard> }) => {
      return apiRequest("PATCH", `/api/flashcards/${data.id}`, data.updates);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
      
      const entityId = topicId || courseId;
      if (entityId) {
        if (topicId) {
          await queryClient.invalidateQueries({ queryKey: ["/api/flashcards/theme", topicId] });
        }
        if (courseId) {
          await queryClient.invalidateQueries({ queryKey: ["/api/flashcards/course", courseId] });
        }
        
        const chaptersKey = topicId ? ["/api/learn-plan-items", topicId] : ["/api/learn-plan-items/course", courseId];
        const flashcardsKey = topicId ? ["/api/flashcards/theme", topicId] : ["/api/flashcards/course", courseId];
        
        const chapters = queryClient.getQueryData<LearnPlanItem[]>(chaptersKey);
        const allFlashcards = queryClient.getQueryData<Flashcard[]>(flashcardsKey) || [];
        
        if (chapters && chapters.length > 0) {
          const total = chapters.length;
          const completed = chapters.filter(c => c.completed).length;
          const completion = Math.round((completed / total) * 100);
          const readiness = calculateReadinessWithDecay(allFlashcards);
          
          const today = format(new Date(), "yyyy-MM-dd");
          await apiRequest("PUT", `/api/knowledge-metrics/${entityId}/${today}`, { completion, readiness });
          queryClient.invalidateQueries({ queryKey: ["/api/knowledge-metrics", entityId] });
        }
      }
    },
  });

  const handleRate = (rating: RatingType) => {
    if (!currentCard) return;

    let newMastery = currentCard.mastery;
    let newGoodCount = currentCard.goodCount;
    const newQueue = [...studyQueue];
    let shouldComplete = false;
    let wasMastered = false;

    switch (rating) {
      case "bad":
        newMastery = Math.max(1, currentCard.mastery);
        newGoodCount = 0;
        const insertPos = Math.min(4, newQueue.length);
        newQueue.shift();
        newQueue.splice(insertPos - 1, 0, { ...currentCard, goodCount: 0, mastery: newMastery });
        break;
        
      case "ok":
        newMastery = Math.max(2, currentCard.mastery);
        newGoodCount = 0;
        newQueue.shift();
        newQueue.push({ ...currentCard, goodCount: 0, mastery: newMastery });
        break;
        
      case "good":
        newGoodCount = currentCard.goodCount + 1;
        if (newGoodCount >= 2) {
          newMastery = 4;
          wasMastered = true;
          shouldComplete = true;
        } else {
          newMastery = 3;
          const goodInsertPos = Math.min(3, newQueue.length);
          newQueue.shift();
          newQueue.splice(goodInsertPos - 1, 0, { ...currentCard, goodCount: newGoodCount, mastery: newMastery });
        }
        break;
        
      case "perfect":
        newMastery = 4;
        wasMastered = true;
        shouldComplete = true;
        break;
    }

    updateMutation.mutate({
      id: currentCard.id,
      updates: {
        lastReviewed: new Date(),
        mastery: newMastery,
        goodCount: newGoodCount,
      },
    });

    if (shouldComplete) {
      newQueue.shift();
      setCompletedCards(prev => new Set(Array.from(prev).concat(currentCard.id)));
      if (wasMastered) {
        setMasteredCount(prev => prev + 1);
      }
    }

    setStudyQueue(newQueue);
    setShowBack(false);

    if (newQueue.length === 0) {
      setSessionComplete(true);
    }
  };

  const handleExit = () => {
    if (topicId) {
      navigate(`/second-brain/${topicId}`);
    } else if (courseId) {
      navigate(`/studies/${courseId}`);
    } else {
      navigate("/");
    }
  };

  const handleClose = () => {
    if (!sessionComplete && studyQueue.length > 0) {
      setShowExitConfirm(true);
    } else {
      handleExit();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center" data-testid="learn-page-loading">
        <div className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="w-32 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col" data-testid="learn-page-empty">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleExit}
            data-testid="button-close"
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="font-medium truncate max-w-[200px]">{chapterTitle}</h1>
          <div className="w-10" />
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No flashcards available</p>
            <Button onClick={handleExit} data-testid="button-go-back">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="learn-page-container">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleClose}
          data-testid="button-close"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="font-medium truncate max-w-[200px]">{chapterTitle}</h1>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <SegmentedProgressBar 
        total={initialTotal} 
        completed={completedCards.size}
        current={currentIndex}
      />

      {sessionComplete ? (
        <SessionComplete
          stats={{
            total: initialTotal,
            mastered: masteredCount,
            reviewed: completedCards.size,
          }}
          onContinue={() => {
            setInitialized(false);
            setSessionComplete(false);
            setCompletedCards(new Set());
            setMasteredCount(0);
          }}
          onExit={handleExit}
        />
      ) : currentCard ? (
        <>
          <FlashcardView
            card={currentCard}
            showBack={showBack}
            onFlip={() => setShowBack(!showBack)}
            queueLength={studyQueue.length}
          />

          {showBack && (
            <RatingButtons 
              onRate={handleRate} 
              disabled={updateMutation.isPending}
            />
          )}
        </>
      ) : null}

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Study Session?</AlertDialogTitle>
            <AlertDialogDescription>
              You still have {studyQueue.length} cards remaining. Your progress on completed cards has been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-continue-session">
              Continue Studying
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExit}
              data-testid="button-exit-session"
            >
              Exit Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
