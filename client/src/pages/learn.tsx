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

function DotProgressBar({ 
  total, 
  current,
  queue,
}: { 
  total: number; 
  current: number;
  queue: StudyCard[];
}) {
  const dotsToShow = Math.min(total, 25);
  const completedCount = total - queue.length;
  
  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {Array.from({ length: dotsToShow }).map((_, i) => {
        const isCompleted = i < completedCount;
        const isCurrent = i === completedCount;
        const card = queue[i - completedCount];
        
        let dotColor = "bg-zinc-600";
        if (isCompleted) {
          dotColor = "bg-green-500";
        } else if (isCurrent) {
          dotColor = "bg-blue-500";
        } else if (card) {
          switch (card.mastery) {
            case 0: dotColor = "bg-zinc-500"; break;
            case 1: dotColor = "bg-red-500/50"; break;
            case 2: dotColor = "bg-yellow-500/50"; break;
            case 3: dotColor = "bg-blue-500/50"; break;
            case 4: dotColor = "bg-green-500/50"; break;
          }
        }
        
        return (
          <div
            key={i}
            className={`
              rounded-full transition-all
              ${isCurrent 
                ? "w-3 h-3 ring-2 ring-blue-400/50" 
                : "w-2 h-2"
              }
              ${dotColor}
            `}
          />
        );
      })}
      {total > dotsToShow && (
        <span className="text-xs text-zinc-500 ml-1">
          +{total - dotsToShow}
        </span>
      )}
    </div>
  );
}

function FlashcardView({
  card,
  showBack,
  onFlip,
}: {
  card: StudyCard;
  showBack: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-zinc-800 rounded-2xl shadow-2xl cursor-pointer min-h-[300px] relative"
        onClick={onFlip}
      >
        <div className="absolute top-3 left-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400 hover:text-zinc-200 text-xs gap-1"
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
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200"
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

        <div className="flex items-center justify-center min-h-[300px] p-8 pt-16">
          <p className="text-xl md:text-2xl text-white text-center leading-relaxed whitespace-pre-wrap">
            {showBack ? card.back : card.front}
          </p>
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
      bgColor: "bg-red-600 hover:bg-red-700",
    },
    { 
      type: "ok" as RatingType, 
      label: "OK", 
      interval: "in 4 days",
      icon: Meh,
      bgColor: "bg-yellow-600 hover:bg-yellow-700",
    },
    { 
      type: "good" as RatingType, 
      label: "Good", 
      interval: "in 8 days",
      icon: Smile,
      bgColor: "bg-green-600 hover:bg-green-700",
    },
    { 
      type: "perfect" as RatingType, 
      label: "Perfect", 
      interval: "in 18 days",
      icon: Laugh,
      bgColor: "bg-blue-600 hover:bg-blue-700",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 p-4 bg-zinc-900">
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-white">
      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
        <Smile className="w-12 h-12 text-green-400" />
      </div>
      
      <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
      <p className="text-zinc-400 mb-8">Great work on your study session</p>

      <div className="grid grid-cols-3 gap-8 mb-10">
        <div className="text-center">
          <p className="text-4xl font-bold text-blue-400">{stats.reviewed}</p>
          <p className="text-sm text-zinc-500">Cards Studied</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-green-400">{stats.mastered}</p>
          <p className="text-sm text-zinc-500">Mastered</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-yellow-400">{stats.total - stats.mastered}</p>
          <p className="text-sm text-zinc-500">Needs Review</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={onContinue}
          className="border-zinc-600 text-white hover:bg-zinc-800"
          data-testid="button-continue-learning"
        >
          Continue Learning
        </Button>
        <Button 
          size="lg"
          onClick={onExit}
          className="bg-blue-600 hover:bg-blue-700"
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
      <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full mx-auto bg-zinc-700" />
          <Skeleton className="w-32 h-4 mx-auto bg-zinc-700" />
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-zinc-900 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-zinc-800">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleExit}
            className="text-zinc-400 hover:text-white"
            data-testid="button-close"
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-white font-medium truncate max-w-[200px]">{chapterTitle}</h1>
          <div className="w-10" />
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">No flashcards available</p>
            <Button onClick={handleExit} data-testid="button-go-back">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-900 flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-zinc-800">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleClose}
          className="text-zinc-400 hover:text-white"
          data-testid="button-close"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="text-white font-medium truncate max-w-[200px]">{chapterTitle}</h1>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <DotProgressBar 
        total={initialTotal} 
        current={completedCards.size}
        queue={studyQueue}
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
          />

          {!showBack && (
            <div className="flex flex-col items-center gap-4 p-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-zinc-500"
              >
                <Keyboard className="h-6 w-6" />
              </Button>
              <Button 
                size="lg"
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-12 py-6 rounded-full text-lg"
                onClick={() => setShowBack(true)}
                data-testid="button-show-answer"
              >
                Show answer
              </Button>
            </div>
          )}

          {showBack && (
            <RatingButtons 
              onRate={handleRate} 
              disabled={updateMutation.isPending}
            />
          )}
        </>
      ) : null}

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="bg-zinc-800 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Exit Study Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You still have {studyQueue.length} cards remaining. Your progress on completed cards has been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"
              data-testid="button-continue-session"
            >
              Continue Studying
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExit}
              className="bg-blue-600 hover:bg-blue-700"
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
