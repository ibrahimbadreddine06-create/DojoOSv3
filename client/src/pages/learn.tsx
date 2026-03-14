import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
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
type CardColor = "gray" | "red" | "yellow" | "green" | "blue";

interface StudyCard extends Flashcard {
  color: CardColor;
  locked: boolean;
  previousRating: RatingType | null;
  originalIndex: number;
}

function calculateSM2(rating: RatingType, card: Pick<Flashcard, "interval" | "ease" | "goodCount">) {
  let interval = card.interval || 0;
  let goodCount = card.goodCount || 0;
  let ease = parseFloat(card.ease?.toString() || "2.5");

  let quality = 0;
  let shouldLock = true;
  let pushPos = -1;

  switch (rating) {
    case "bad": quality = 0; break;
    case "ok": quality = 3; break;
    case "good": quality = 4; break;
    case "perfect": quality = 5; break;
  }

  if (quality < 3) {
    goodCount = 0;
    interval = 0;
    shouldLock = false;
    pushPos = 4;
  } else {
    if (interval === 0) {
      if (rating === "ok") {
        interval = 0;
        shouldLock = false;
        pushPos = 999;
      } else if (rating === "good") {
        interval = 1;
        goodCount = 1;
      } else if (rating === "perfect") {
        interval = 3;
        goodCount = 1;
      }
    } else {
      if (goodCount === 0) {
        interval = 1;
      } else if (goodCount === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
        if (rating === "ok") interval = Math.max(Math.round(interval * 0.8), interval + 1);
        if (rating === "perfect") interval = Math.round(interval * 1.3);
      }
      goodCount++;
    }
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  return { interval, ease: ease.toFixed(2), goodCount, shouldLock, pushPos };
}

function formatInterval(interval: number) {
  if (interval === 0) return "<10m";
  if (interval === 1) return "1d";
  if (interval < 30) return `${interval}d`;
  if (interval < 365) return `${Math.round(interval / 30)}mo`;
  return `${Math.round(interval / 365)}y`;
}

const colorClasses: Record<CardColor, string> = {
  gray: "bg-muted-foreground/30",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
};

function SegmentedProgressBar({
  lockedCards,
  activeCards,
  currentCardId,
  total,
}: {
  lockedCards: StudyCard[];
  activeCards: StudyCard[];
  currentCardId: string | null;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-4 py-3" data-testid="progress-bar">
      {/* Locked cards first (with thick border) */}
      {lockedCards.map((card) => (
        <div
          key={card.id}
          className={`
            h-2.5 flex-1 rounded-sm transition-all ring-2 ring-white dark:ring-zinc-900
            ${colorClasses[card.color]}
          `}
          title={`Locked (${card.color})`}
        />
      ))}

      {/* Active cards */}
      {activeCards.map((card) => {
        const isCurrent = card.id === currentCardId;
        return (
          <div
            key={card.id}
            className={`
              h-1.5 flex-1 rounded-sm transition-all
              ${colorClasses[card.color]}
              ${isCurrent ? "ring-1 ring-foreground/50" : ""}
            `}
            title={card.color === "gray" ? "Not reviewed yet" : card.color}
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
  const displayHtml = showBack ? card.back : card.front;

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
          className="relative w-full bg-card border border-border rounded-2xl shadow-xl cursor-pointer min-h-[360px] md:min-h-[420px] p-4 md:p-6 flex flex-col"
          style={{ zIndex: 3 }}
          onClick={onFlip}
          data-testid="flashcard-content"
        >
          {/* Header with menu button */}
          <div className="flex justify-end mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit card</DropdownMenuItem>
                <DropdownMenuItem>Report issue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Card content - centered */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="w-full overflow-y-auto max-h-[280px] md:max-h-[320px] px-2 py-4">
              <div
                className="text-lg md:text-2xl lg:text-3xl text-foreground text-center leading-relaxed break-words prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: displayHtml }}
              />
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
  card,
}: {
  onRate: (rating: RatingType) => void;
  disabled: boolean;
  card: StudyCard;
}) {
  const getIntervalLabel = (rating: RatingType) => {
    const next = calculateSM2(rating, card);
    if (!next.shouldLock) return "<10m";
    return formatInterval(next.interval);
  };

  const ratings = [
    {
      type: "bad" as RatingType,
      label: "Bad",
      interval: getIntervalLabel("bad"),
      icon: Frown,
      bgColor: "bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900",
    },
    {
      type: "ok" as RatingType,
      label: "OK",
      interval: getIntervalLabel("ok"),
      icon: Meh,
      bgColor: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800",
    },
    {
      type: "good" as RatingType,
      label: "Good",
      interval: getIntervalLabel("good"),
      icon: Smile,
      bgColor: "bg-green-700 hover:bg-green-800 dark:bg-green-800 dark:hover:bg-green-900",
    },
    {
      type: "perfect" as RatingType,
      label: "Perfect",
      interval: getIntervalLabel("perfect"),
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
  const [lockedCards, setLockedCards] = useState<StudyCard[]>([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode") || "all";
  const shuffle = searchParams.get("shuffle") !== "false";
  const topicId = searchParams.get("topicId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const disciplineId = searchParams.get("disciplineId") || undefined;
  const chapterTitle = searchParams.get("title") || "Learning";

  const { data: flashcards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/chapter", chapterId],
  });

  useEffect(() => {
    if (flashcards.length > 0 && !initialized) {
      let cards: Flashcard[] = [];

      switch (mode) {
        case "new":
          cards = flashcards.filter(f => !f.interval || f.interval === 0);
          break;
        case "review":
          const now = new Date();
          cards = flashcards.filter(f => {
            if (f.interval && f.interval > 0 && f.nextReview) {
              return new Date(f.nextReview) <= now;
            }
            return f.mastery > 0 && f.mastery < 4;
          });
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
        color: "gray" as CardColor,
        locked: false,
        previousRating: null,
        originalIndex: i,
      }));

      setStudyQueue(studyCards);
      setLockedCards([]);
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

      const entityId = topicId || courseId || disciplineId;
      if (entityId) {
        if (topicId) {
          await queryClient.invalidateQueries({ queryKey: ["/api/flashcards/theme", topicId] });
        }
        if (courseId) {
          await queryClient.invalidateQueries({ queryKey: ["/api/flashcards/course", courseId] });
        }
        if (disciplineId) {
          await queryClient.invalidateQueries({ queryKey: ["/api/flashcards/discipline", disciplineId] });
        }

        const chaptersKey = topicId
          ? ["/api/learn-plan-items", topicId]
          : courseId
            ? ["/api/learn-plan-items/course", courseId]
            : ["/api/learn-plan-items/discipline", disciplineId];

        const flashcardsKey = topicId
          ? ["/api/flashcards/theme", topicId]
          : courseId
            ? ["/api/flashcards/course", courseId]
            : ["/api/flashcards/discipline", disciplineId];

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

    const { interval, ease, goodCount, shouldLock, pushPos } = calculateSM2(rating, currentCard);

    // Legacy metrics fallback
    let newMastery = currentCard.mastery;
    if (rating === "bad") newMastery = 1;
    else if (rating === "ok") newMastery = Math.max(2, currentCard.mastery);
    else if (rating === "good") newMastery = Math.max(3, currentCard.mastery);
    else if (rating === "perfect") newMastery = 4;
    if (interval > 0) newMastery = 4;

    const nextReviewDate = new Date();
    if (interval > 0) {
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    }

    const newColor: CardColor = rating === "bad" ? "red" : rating === "ok" ? "yellow" : rating === "good" ? "green" : "blue";

    const newQueue = [...studyQueue];
    newQueue.shift();

    if (shouldLock) {
      const lockedCard: StudyCard = {
        ...currentCard,
        color: newColor,
        locked: true,
        mastery: newMastery,
        interval,
        ease,
        goodCount,
      };
      setLockedCards(prev => [...prev, lockedCard]);
    } else {
      const updatedCard = {
        ...currentCard,
        color: newColor,
        previousRating: rating,
        mastery: newMastery,
        interval,
        ease,
        goodCount,
      };
      const insertIdx = Math.min(pushPos, newQueue.length);
      newQueue.splice(insertIdx, 0, updatedCard);
    }

    updateMutation.mutate({
      id: currentCard.id,
      updates: {
        lastReviewed: new Date(),
        nextReview: nextReviewDate,
        interval,
        ease: ease.toString(), // ensure it persists as decimal string
        goodCount,
        mastery: newMastery,
      },
    });

    setStudyQueue(newQueue);
    setShowBack(false);

    if (newQueue.length === 0) {
      setSessionComplete(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (sessionComplete || !currentCard) return;

      if (!showBack && e.code === "Space") {
        e.preventDefault();
        setShowBack(true);
      } else if (showBack && !updateMutation.isPending) {
        if (e.key === "1") handleRate("bad");
        else if (e.key === "2") handleRate("ok");
        else if (e.key === "3") handleRate("good");
        else if (e.key === "4") handleRate("perfect");
        else if (e.code === "Space") {
          e.preventDefault();
          handleRate("good"); // Space defaults to Good
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showBack, currentCard, sessionComplete, updateMutation.isPending]);

  const handleExit = () => {
    if (topicId) {
      navigate(`/second-brain/${topicId}`);
    } else if (courseId) {
      navigate(`/studies/${courseId}`);
    } else if (disciplineId) {
      navigate(`/disciplines/${disciplineId}`);
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
        lockedCards={lockedCards}
        activeCards={studyQueue}
        currentCardId={currentCard?.id || null}
        total={initialTotal}
      />

      {sessionComplete ? (
        <SessionComplete
          stats={{
            total: initialTotal,
            mastered: lockedCards.length,
            reviewed: lockedCards.length,
          }}
          onContinue={() => {
            setInitialized(false);
            setSessionComplete(false);
            setLockedCards([]);
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

          {/* Fixed height container to prevent layout shift */}
          <div className="h-[120px]">
            {!showBack ? (
              <div className="flex flex-col items-center justify-center gap-4 p-4 h-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                >
                  <Keyboard className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-12 py-6 rounded-full text-lg"
                  onClick={() => setShowBack(true)}
                  data-testid="button-show-answer"
                >
                  Show answer
                </Button>
              </div>
            ) : (
              <RatingButtons
                onRate={handleRate}
                disabled={updateMutation.isPending}
                card={currentCard}
              />
            )}
          </div>
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

