import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, RotateCcw, BookOpen, Lock, Brain, Sparkles, ChevronLeft, Trophy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import type { Flashcard, LearnPlanItem } from "@shared/schema";

interface LearningSesionProps {
  flashcards: Flashcard[];
  chapterId: string;
  topicId?: string;
  courseId?: string;
  open: boolean;
  onClose: () => void;
}

type SessionMode = "select" | "new" | "review" | "all";
type RatingType = "bad" | "ok" | "good" | "perfect";

interface StudyCard extends Flashcard {
  goodCount: number;
  position: number;
}

function DotProgressBar({ 
  total, 
  current, 
  completed 
}: { 
  total: number; 
  current: number; 
  completed: Set<string>;
}) {
  const dotsToShow = Math.min(total, 20);
  const startIndex = Math.max(0, Math.min(current - 5, total - dotsToShow));
  
  return (
    <div className="flex items-center justify-center gap-1.5 py-3">
      {Array.from({ length: dotsToShow }).map((_, i) => {
        const index = startIndex + i;
        const isCompleted = index < current;
        const isCurrent = index === current;
        
        return (
          <div
            key={index}
            className={`
              rounded-full transition-all duration-200
              ${isCurrent 
                ? "w-3 h-3 bg-primary ring-2 ring-primary/30" 
                : isCompleted 
                  ? "w-2 h-2 bg-green-500" 
                  : "w-2 h-2 bg-muted-foreground/30"
              }
            `}
          />
        );
      })}
      {total > dotsToShow && (
        <span className="text-xs text-muted-foreground ml-2">
          +{total - dotsToShow}
        </span>
      )}
    </div>
  );
}

function FlashcardDisplay({
  card,
  showBack,
  onFlip,
}: {
  card: StudyCard;
  showBack: boolean;
  onFlip: () => void;
}) {
  return (
    <div 
      className="relative w-full perspective-1000"
      style={{ minHeight: "280px" }}
    >
      <div
        className={`
          w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer
          ${showBack ? "rotate-y-180" : ""}
        `}
        onClick={onFlip}
      >
        <Card 
          className="absolute inset-0 p-6 backface-hidden flex flex-col items-center justify-center text-center"
          data-testid="flashcard-front"
        >
          <Badge variant="outline" className="absolute top-4 left-4 text-xs">
            Question
          </Badge>
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-xl leading-relaxed whitespace-pre-wrap">
              {card.front}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Tap to reveal answer
          </p>
        </Card>
        
        <Card 
          className="absolute inset-0 p-6 backface-hidden rotate-y-180 flex flex-col items-center justify-center text-center"
          data-testid="flashcard-back"
        >
          <Badge variant="outline" className="absolute top-4 left-4 text-xs bg-primary/10">
            Answer
          </Badge>
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-xl leading-relaxed whitespace-pre-wrap">
              {card.back}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Rate your answer below
          </p>
        </Card>
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
    { type: "bad" as RatingType, label: "Bad", sublabel: "Again soon", color: "bg-red-500 hover:bg-red-600 text-white" },
    { type: "ok" as RatingType, label: "OK", sublabel: "End of session", color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
    { type: "good" as RatingType, label: "Good", sublabel: "2x = mastered", color: "bg-green-500 hover:bg-green-600 text-white" },
    { type: "perfect" as RatingType, label: "Perfect", sublabel: "Mastered!", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {ratings.map((rating) => (
        <Button
          key={rating.type}
          className={`flex flex-col py-3 h-auto ${rating.color}`}
          onClick={() => onRate(rating.type)}
          disabled={disabled}
          data-testid={`button-rate-${rating.type}`}
        >
          <span className="font-semibold">{rating.label}</span>
          <span className="text-[10px] opacity-80">{rating.sublabel}</span>
        </Button>
      ))}
    </div>
  );
}

function SessionCompleteScreen({
  stats,
  onStudyMore,
  onClose,
}: {
  stats: { total: number; mastered: number; reviewed: number };
  onStudyMore: () => void;
  onClose: () => void;
}) {
  return (
    <div className="py-8 text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-green-500" />
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-2">Session Complete!</h3>
        <p className="text-muted-foreground">Great work on your study session</p>
      </div>

      <div className="grid grid-cols-3 gap-4 py-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">{stats.reviewed}</p>
          <p className="text-xs text-muted-foreground">Cards Studied</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-500">{stats.mastered}</p>
          <p className="text-xs text-muted-foreground">Mastered</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-yellow-500">{stats.total - stats.mastered}</p>
          <p className="text-xs text-muted-foreground">Needs Review</p>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onStudyMore} data-testid="button-study-more">
          <RotateCcw className="w-4 h-4 mr-2" />
          Study More
        </Button>
        <Button onClick={onClose} data-testid="button-finish-session">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
}

export function LearningSession({
  flashcards,
  chapterId,
  topicId,
  courseId,
  open,
  onClose,
}: LearningSesionProps) {
  const [mode, setMode] = useState<SessionMode>("select");
  const [studyQueue, setStudyQueue] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [masteredCount, setMasteredCount] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [learnCount, setLearnCount] = useState(10);

  const newCardsCount = flashcards.filter(f => f.mastery === 0).length;
  const learnedCardsCount = flashcards.filter(f => f.mastery > 0 && f.mastery < 4).length;
  const allCardsCount = flashcards.length;

  const initializeQueue = useCallback((selectedMode: SessionMode) => {
    let cards: Flashcard[] = [];
    
    switch (selectedMode) {
      case "new":
        cards = flashcards.filter(f => f.mastery === 0).slice(0, learnCount);
        break;
      case "review":
        cards = flashcards.filter(f => f.mastery > 0 && f.mastery < 4);
        break;
      case "all":
        cards = [...flashcards];
        break;
    }
    
    const shuffled = cards.sort(() => Math.random() - 0.5);
    const studyCards: StudyCard[] = shuffled.map((card, i) => ({
      ...card,
      goodCount: (card as any).goodCount || 0,
      position: i,
    }));
    
    setStudyQueue(studyCards);
    setCurrentIndex(0);
    setShowBack(false);
    setSessionComplete(false);
    setCompletedCards(new Set());
    setMasteredCount(0);
    setMode(selectedMode);
  }, [flashcards, learnCount]);

  const currentCard = studyQueue[currentIndex];

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
        const insertPos = Math.min(currentIndex + 4, studyQueue.length);
        newQueue.splice(currentIndex, 1);
        newQueue.splice(insertPos - 1, 0, { ...currentCard, goodCount: 0, mastery: newMastery });
        break;
        
      case "ok":
        newMastery = Math.max(2, currentCard.mastery);
        newGoodCount = 0;
        newQueue.splice(currentIndex, 1);
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
          const goodInsertPos = Math.min(currentIndex + 3, studyQueue.length);
          newQueue.splice(currentIndex, 1);
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
      newQueue.splice(currentIndex, 1);
      setCompletedCards(prev => new Set([...prev, currentCard.id]));
      if (wasMastered) {
        setMasteredCount(prev => prev + 1);
      }
    }

    setStudyQueue(newQueue);
    setShowBack(false);

    if (newQueue.length === 0) {
      setSessionComplete(true);
    } else if (currentIndex >= newQueue.length) {
      setCurrentIndex(newQueue.length - 1);
    }
  };

  const handleClose = () => {
    if (mode !== "select" && !sessionComplete && studyQueue.length > 0) {
      setShowExitConfirm(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setMode("select");
    setStudyQueue([]);
    setCurrentIndex(0);
    setShowBack(false);
    setSessionComplete(false);
    setCompletedCards(new Set());
    setMasteredCount(0);
    onClose();
  };

  const handleStudyMore = () => {
    setMode("select");
    setSessionComplete(false);
  };

  useEffect(() => {
    if (!open) {
      setMode("select");
      setStudyQueue([]);
      setSessionComplete(false);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent 
          className={`
            ${mode === "select" ? "max-w-lg" : "max-w-2xl"}
            transition-all duration-300
          `}
          data-testid="learning-session-dialog"
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              {mode !== "select" && !sessionComplete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowExitConfirm(true)}
                  className="h-8 w-8"
                  data-testid="button-back-to-select"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <DialogTitle>
                  {mode === "select" && "Start Learning"}
                  {mode === "new" && "Learning New Cards"}
                  {mode === "review" && "Reviewing Learned Cards"}
                  {mode === "all" && "Reviewing All Cards"}
                </DialogTitle>
                <DialogDescription>
                  {mode === "select" && "Choose a study mode to begin"}
                  {mode !== "select" && !sessionComplete && `${studyQueue.length} cards remaining`}
                  {sessionComplete && "Great job!"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {mode === "select" ? (
            <div className="space-y-3 py-4">
              <Card 
                className={`p-4 cursor-pointer transition-all ${newCardsCount === 0 ? "opacity-50 cursor-not-allowed" : "hover-elevate"}`}
                onClick={() => newCardsCount > 0 && initializeQueue("new")}
                data-testid="button-mode-new"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Learn New Cards</h4>
                    <p className="text-sm text-muted-foreground">
                      {newCardsCount} new cards available
                    </p>
                  </div>
                  {newCardsCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Count:</span>
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
                className={`p-4 cursor-pointer transition-all ${learnedCardsCount === 0 ? "opacity-50 cursor-not-allowed" : "hover-elevate"}`}
                onClick={() => learnedCardsCount > 0 && initializeQueue("review")}
                data-testid="button-mode-review"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Review Learned Cards</h4>
                    <p className="text-sm text-muted-foreground">
                      {learnedCardsCount} cards to review
                    </p>
                  </div>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer transition-all ${allCardsCount === 0 ? "opacity-50 cursor-not-allowed" : "hover-elevate"}`}
                onClick={() => allCardsCount > 0 && initializeQueue("all")}
                data-testid="button-mode-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <RotateCcw className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Review All Cards</h4>
                    <p className="text-sm text-muted-foreground">
                      {allCardsCount} total cards
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 opacity-50 cursor-not-allowed" data-testid="button-mode-test">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Take a Test</h4>
                    <p className="text-sm text-muted-foreground">Coming soon</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={resetAndClose} data-testid="button-close-session">
                  Close
                </Button>
              </div>
            </div>
          ) : sessionComplete ? (
            <SessionCompleteScreen
              stats={{
                total: completedCards.size + studyQueue.length,
                mastered: masteredCount,
                reviewed: completedCards.size,
              }}
              onStudyMore={handleStudyMore}
              onClose={resetAndClose}
            />
          ) : studyQueue.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <p className="text-muted-foreground">No cards available for this mode</p>
              <Button variant="outline" onClick={() => setMode("select")}>
                Go Back
              </Button>
            </div>
          ) : currentCard ? (
            <div className="space-y-2 py-2">
              <DotProgressBar 
                total={studyQueue.length + completedCards.size} 
                current={completedCards.size}
                completed={completedCards}
              />

              <FlashcardDisplay
                card={currentCard}
                showBack={showBack}
                onFlip={() => setShowBack(!showBack)}
              />

              {showBack ? (
                <RatingButtons 
                  onRate={handleRate} 
                  disabled={updateMutation.isPending}
                />
              ) : (
                <div className="flex justify-center mt-4">
                  <Button 
                    size="lg"
                    onClick={() => setShowBack(true)} 
                    data-testid="button-show-answer"
                  >
                    Show Answer
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Study Session?</AlertDialogTitle>
            <AlertDialogDescription>
              You still have {studyQueue.length} cards remaining. Your progress on completed cards has been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-continue-session">Continue Studying</AlertDialogCancel>
            <AlertDialogAction onClick={resetAndClose} data-testid="button-exit-session">
              Exit Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
