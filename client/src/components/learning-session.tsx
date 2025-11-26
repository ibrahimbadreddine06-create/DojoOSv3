import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, RotateCcw, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Flashcard } from "@shared/schema";

interface LearningSesionProps {
  flashcards: Flashcard[];
  chapterId: string;
  themeId?: string;
  courseId?: string;
  open: boolean;
  onClose: () => void;
}

type AnswerQuality = 0 | 1 | 2 | 3;

interface SM2Result {
  interval: number;
  ease: number;
  nextReview: Date;
  mastery: number;
}

function calculateSM2(
  quality: AnswerQuality,
  currentInterval: number,
  currentEase: number,
  isNew: boolean
): SM2Result {
  let interval: number;
  let ease = currentEase;
  let mastery: number;
  const now = new Date();

  if (isNew) {
    switch (quality) {
      case 0:
        interval = 1;
        mastery = 1;
        break;
      case 1:
        interval = 1;
        mastery = 2;
        break;
      case 2:
        interval = 3;
        mastery = 3;
        break;
      case 3:
        interval = 4;
        mastery = 4;
        break;
    }
    ease = 2.5;
  } else {
    if (quality < 2) {
      interval = 1;
    } else {
      if (currentInterval === 0) {
        interval = 1;
      } else if (currentInterval === 1) {
        interval = 6;
      } else {
        interval = Math.round(currentInterval * ease);
      }
    }

    ease = ease + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;
    if (ease > 2.5) ease = 2.5;

    switch (quality) {
      case 0:
        mastery = 1;
        break;
      case 1:
        mastery = 2;
        break;
      case 2:
        mastery = 3;
        break;
      case 3:
        mastery = 4;
        break;
    }
  }

  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    interval,
    ease: Math.round(ease * 100) / 100,
    nextReview,
    mastery,
  };
}

const answerButtons = [
  { quality: 0 as AnswerQuality, label: "Bad", color: "text-red-500 border-red-500/50 hover:bg-red-500/10" },
  { quality: 1 as AnswerQuality, label: "Okay", color: "text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10" },
  { quality: 2 as AnswerQuality, label: "Good", color: "text-blue-500 border-blue-500/50 hover:bg-blue-500/10" },
  { quality: 3 as AnswerQuality, label: "Perfect", color: "text-green-500 border-green-500/50 hover:bg-green-500/10" },
];

function FlashcardCard({
  card,
  showBack,
  onFlip,
}: {
  card: Flashcard;
  showBack: boolean;
  onFlip: () => void;
}) {
  return (
    <Card
      className="min-h-[240px] p-6 cursor-pointer transition-all duration-300 hover-elevate flex flex-col items-center justify-center text-center"
      onClick={onFlip}
      data-testid="flashcard-display"
    >
      <div className="mb-2">
        <Badge variant="outline" className="text-xs">
          {showBack ? "Answer" : "Question"}
        </Badge>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg whitespace-pre-wrap">
          {showBack ? card.back : card.front}
        </p>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        {showBack ? "Click to see question" : "Click to reveal answer"}
      </p>
    </Card>
  );
}

export function LearningSession({
  flashcards,
  chapterId,
  themeId,
  courseId,
  open,
  onClose,
}: LearningSesionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [mode, setMode] = useState<"select" | "learn" | "review">("select");
  const [learnCount, setLearnCount] = useState(5);

  const cardsToStudy = useMemo(() => {
    if (mode === "learn") {
      const newCards = flashcards.filter((f) => f.mastery === 0);
      return newCards.slice(0, learnCount);
    } else if (mode === "review") {
      const now = new Date();
      return flashcards.filter((f) => {
        if (f.mastery === 0) return false;
        if (!f.nextReview) return true;
        return new Date(f.nextReview) <= now;
      });
    }
    return [];
  }, [flashcards, mode, learnCount]);

  const currentCard = cardsToStudy[currentIndex];
  const progress = cardsToStudy.length > 0 
    ? ((answeredCount) / cardsToStudy.length) * 100 
    : 0;

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Flashcard> }) => {
      return apiRequest("PATCH", `/api/flashcards/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
      if (themeId) {
        queryClient.invalidateQueries({ queryKey: ["/api/flashcards/theme", themeId] });
      }
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["/api/flashcards/course", courseId] });
      }
    },
  });

  const handleAnswer = (quality: AnswerQuality) => {
    if (!currentCard) return;

    const isNew = currentCard.mastery === 0;
    const currentInterval = currentCard.interval || 0;
    const currentEase = currentCard.ease ? parseFloat(String(currentCard.ease)) : 2.5;

    const result = calculateSM2(quality, currentInterval, currentEase, isNew);

    updateMutation.mutate({
      id: currentCard.id,
      updates: {
        lastReviewed: new Date(),
        nextReview: result.nextReview,
        interval: result.interval,
        ease: String(result.ease),
        mastery: result.mastery,
      },
    });

    setShowBack(false);
    setAnsweredCount((prev) => prev + 1);

    if (currentIndex < cardsToStudy.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowBack(false);
    setSessionComplete(false);
    setAnsweredCount(0);
    setMode("select");
  };

  const handleClose = () => {
    resetSession();
    onClose();
  };

  const newCardsCount = flashcards.filter((f) => f.mastery === 0).length;
  const dueCardsCount = flashcards.filter((f) => {
    if (f.mastery === 0) return false;
    if (!f.nextReview) return true;
    return new Date(f.nextReview) <= new Date();
  }).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg" data-testid="learning-session-dialog">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {mode === "select" ? "Study Session" : mode === "learn" ? "Learning New Cards" : "Reviewing Cards"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {mode === "select" 
              ? "Choose how you want to study" 
              : sessionComplete 
                ? "Great job!" 
                : "Rate how well you remembered"}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" ? (
          <div className="space-y-4 py-4">
            <Card 
              className={`p-4 cursor-pointer transition-all ${newCardsCount === 0 ? "opacity-50" : "hover-elevate"}`}
              onClick={() => newCardsCount > 0 && setMode("learn")}
              data-testid="button-mode-learn"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <h4 className="font-medium">Learn New Cards</h4>
                  <p className="text-sm text-muted-foreground">
                    {newCardsCount} new cards available
                  </p>
                </div>
                {newCardsCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Learn:</span>
                    <select
                      className="border rounded px-2 py-1 text-sm bg-background"
                      value={learnCount}
                      onChange={(e) => setLearnCount(Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      data-testid="select-learn-count"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={newCardsCount}>All ({newCardsCount})</option>
                    </select>
                  </div>
                )}
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all ${dueCardsCount === 0 ? "opacity-50" : "hover-elevate"}`}
              onClick={() => dueCardsCount > 0 && setMode("review")}
              data-testid="button-mode-review"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <h4 className="font-medium">Review Due Cards</h4>
                  <p className="text-sm text-muted-foreground">
                    {dueCardsCount} cards due for review
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 opacity-50 cursor-not-allowed" data-testid="button-mode-test">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-medium">Take a Test</h4>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </Card>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleClose} data-testid="button-close-session">
                Close
              </Button>
            </div>
          </div>
        ) : sessionComplete ? (
          <div className="py-8 text-center space-y-4">
            <div className="text-4xl mb-2">
              <span role="img" aria-label="celebration">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 mx-auto text-primary">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </span>
            </div>
            <h3 className="text-xl font-semibold">Session Complete!</h3>
            <p className="text-muted-foreground">
              You reviewed {answeredCount} card{answeredCount !== 1 ? "s" : ""}
            </p>
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" onClick={resetSession} data-testid="button-study-more">
                Study More
              </Button>
              <Button onClick={handleClose} data-testid="button-finish-session">
                Done
              </Button>
            </div>
          </div>
        ) : cardsToStudy.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              {mode === "learn" ? "No new cards to learn!" : "No cards due for review!"}
            </p>
            <Button variant="outline" onClick={resetSession}>
              Go Back
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {answeredCount + 1} / {cardsToStudy.length}
              </span>
            </div>

            <FlashcardCard
              card={currentCard}
              showBack={showBack}
              onFlip={() => setShowBack(!showBack)}
            />

            {showBack ? (
              <div className="grid grid-cols-4 gap-2">
                {answerButtons.map((btn) => (
                  <Button
                    key={btn.quality}
                    variant="outline"
                    className={btn.color}
                    onClick={() => handleAnswer(btn.quality)}
                    disabled={updateMutation.isPending}
                    data-testid={`button-answer-${btn.label.toLowerCase()}`}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={() => setShowBack(true)} data-testid="button-show-answer">
                  Show Answer
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
