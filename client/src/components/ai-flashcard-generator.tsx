import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, ChevronRight, RefreshCw, Plus, Trash2, Scissors, Merge,
  ArrowLeft, Check, Loader2, AlertCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Material } from "@shared/schema";

// ─── Types ─────────────────────────────────────────────────────────────────────

type FlashcardStyle = "basic" | "cloze" | "concept" | "feynman" | "scenario" | "custom";

interface GeneratedCard {
  front: string;
  back: string;
}

interface AIFlashcardGeneratorProps {
  open: boolean;
  onClose: () => void;
  chapter: { id: string; title: string };
  topicId?: string;
  courseId?: string;
  disciplineId?: string;
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleName: string;
    submoduleType: string;
  };
  materials: Material[];
  chapterContext?: string;
  onFlashcardsAdded?: () => void;
}

// ─── Style options ──────────────────────────────────────────────────────────────

const STYLES: { id: FlashcardStyle; label: string; description: string }[] = [
  { id: "basic", label: "Basic Q&A", description: "Direct question → clear answer" },
  { id: "cloze", label: "Fill in the Blank", description: "Sentence with key term blanked out" },
  { id: "concept", label: "Concept + Definition", description: "Term → definition + example" },
  { id: "feynman", label: "Feynman", description: "Explain simply, like to a curious beginner" },
  { id: "scenario", label: "Scenario", description: "Real situation → what approach/concept applies" },
  { id: "custom", label: "Custom", description: "Describe your own style" },
];

// ─── Card Editor ────────────────────────────────────────────────────────────────

function CardEditor({
  card, index, total, onUpdate, onDelete, onSplit, selectedForMerge, onToggleMerge,
}: {
  card: GeneratedCard;
  index: number;
  total: number;
  onUpdate: (front: string, back: string) => void;
  onDelete: () => void;
  onSplit: () => void;
  selectedForMerge: boolean;
  onToggleMerge: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);

  const save = () => {
    onUpdate(front, back);
    setEditing(false);
  };

  return (
    <div
      className={`rounded-md border p-3 space-y-2 transition-all ${selectedForMerge ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border"}`}
      data-testid={`flashcard-preview-${index}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox
            checked={selectedForMerge}
            onCheckedChange={onToggleMerge}
            data-testid={`checkbox-merge-${index}`}
          />
          <Badge variant="outline" className="text-xs shrink-0">Card {index + 1}/{total}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {!editing && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} data-testid={`button-edit-card-${index}`}>
                Edit
              </Button>
              <Button size="icon" variant="ghost" onClick={onSplit} title="Split into 2 cards" data-testid={`button-split-card-${index}`}>
                <Scissors className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-card-${index}`}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          )}
          {editing && (
            <Button size="sm" onClick={save} data-testid={`button-save-card-${index}`}>
              <Check className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Front</p>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              data-testid={`input-card-front-${index}`}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Back</p>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              data-testid={`input-card-back-${index}`}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Front</p>
            <p className="text-sm leading-snug">{card.front}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Back</p>
            <p className="text-sm leading-snug text-muted-foreground">{card.back}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function AIFlashcardGenerator({
  open, onClose, chapter, topicId, courseId, disciplineId,
  trajectoryContext, materials, chapterContext, onFlashcardsAdded,
}: AIFlashcardGeneratorProps) {
  const [phase, setPhase] = useState<"config" | "review">("config");
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [style, setStyle] = useState<FlashcardStyle>("basic");
  const [customStyle, setCustomStyle] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [mergeSelected, setMergeSelected] = useState<Set<number>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const hasMaterials = materials.length > 0;

  const generateMutation = useMutation({
    mutationFn: async (opts: { previousCards?: GeneratedCard[]; feedback?: string }) => {
      const mats = materials
        .filter(m => selectedMaterials.has(m.id))
        .map(m => ({ title: m.title, url: m.url || undefined, type: m.type }));

      const res = await apiRequest("POST", "/api/ai/generate-flashcards", {
        chapterTitle: chapter.title,
        chapterContext: chapterContext || "",
        materials: mats,
        userPrompt: userPrompt || undefined,
        style,
        customStyle: style === "custom" ? customStyle : undefined,
        trajectoryContext,
        previousCards: opts.previousCards,
        feedback: opts.feedback,
      });
      return res.json() as Promise<GeneratedCard[]>;
    },
    onSuccess: (data) => {
      setCards(data);
      setPhase("review");
      setShowFeedback(false);
      setFeedback("");
      setMergeSelected(new Set());
      setError("");
    },
    onError: (e: any) => {
      setError(e.message || "Generation failed. Please try again.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        cards.map((card, i) =>
          apiRequest("POST", "/api/flashcards", {
            chapterId: chapter.id,
            topicId,
            courseId,
            disciplineId,
            front: card.front,
            back: card.back,
            order: i,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapter.id] });
      onFlashcardsAdded?.();
      handleClose();
    },
    onError: (e: any) => {
      setError(e.message || "Failed to save flashcards.");
    },
  });

  const handleClose = () => {
    setPhase("config");
    setCards([]);
    setMergeSelected(new Set());
    setShowFeedback(false);
    setFeedback("");
    setError("");
    onClose();
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateCard = (index: number, front: string, back: string) => {
    setCards(prev => prev.map((c, i) => i === index ? { front, back } : c));
  };

  const deleteCard = (index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
    setMergeSelected(prev => {
      const next = new Set<number>();
      prev.forEach(i => { if (i !== index) next.add(i > index ? i - 1 : i); });
      return next;
    });
  };

  const splitCard = (index: number) => {
    const card = cards[index];
    const half = Math.ceil(card.front.length / 2);
    const newCards = [...cards];
    newCards.splice(index, 1,
      { front: card.front.substring(0, half).trim() + "...", back: card.back },
      { front: card.front.substring(half).trim(), back: "[Add the back for this card]" }
    );
    setCards(newCards);
  };

  const mergeSelectedCards = () => {
    if (mergeSelected.size < 2) return;
    const indices = Array.from(mergeSelected).sort((a, b) => a - b);
    const merged: GeneratedCard = {
      front: indices.map(i => cards[i].front).join(" | "),
      back: indices.map(i => cards[i].back).join(" | "),
    };
    const newCards = cards.filter((_, i) => !mergeSelected.has(i));
    newCards.splice(indices[0], 0, merged);
    setCards(newCards);
    setMergeSelected(new Set());
  };

  const addBlankCard = () => {
    setCards(prev => [...prev, { front: "New question", back: "Answer" }]);
  };

  const toggleMergeSelect = (index: number) => {
    setMergeSelected(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Flashcard Generator
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {phase === "config"
              ? `Generating flashcards for: ${chapter.title}`
              : `${cards.length} flashcards generated — review before saving`}
          </p>
        </DialogHeader>

        {phase === "config" && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Materials */}
              {hasMaterials && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Source Materials</p>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setSelectedMaterials(
                          selectedMaterials.size === materials.length
                            ? new Set()
                            : new Set(materials.map(m => m.id))
                        )
                      }
                    >
                      {selectedMaterials.size === materials.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {materials.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 p-2.5 rounded-md hover-elevate cursor-pointer"
                        data-testid={`material-checkbox-${m.id}`}
                      >
                        <Checkbox
                          checked={selectedMaterials.has(m.id)}
                          onCheckedChange={() => toggleMaterial(m.id)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{m.type}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedMaterials.size === 0 && (
                    <p className="text-xs text-muted-foreground">No materials selected — AI will use its knowledge of the topic.</p>
                  )}
                </div>
              )}

              {/* Style */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Flashcard Style</p>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`text-left p-3 rounded-md border transition-all ${style === s.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border hover-elevate"}`}
                      data-testid={`style-option-${s.id}`}
                    >
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    </button>
                  ))}
                </div>
                {style === "custom" && (
                  <Textarea
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="Describe how you want the flashcards to look (e.g. 'One concept per card with a mnemonic on the back')"
                    className="mt-2 text-sm"
                    rows={3}
                    data-testid="input-custom-style"
                  />
                )}
              </div>

              {/* Optional prompt */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Additional Instructions <span className="text-muted-foreground font-normal">(optional)</span></p>
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={`e.g. "Focus on formulas and derivations" or "Make it exam-prep focused"`}
                  className="text-sm"
                  rows={2}
                  data-testid="input-flashcard-prompt"
                />
              </div>
            </div>
          </ScrollArea>
        )}

        {phase === "review" && (
          <div className="flex-1 min-h-0 flex flex-col">
            {error && (
              <div className="flex items-center gap-2 px-6 py-3 border-b bg-destructive/10 text-destructive text-sm shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 shrink-0 flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => setPhase("config")} data-testid="button-back-config">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
              <Separator orientation="vertical" className="h-5" />
              {mergeSelected.size >= 2 && (
                <Button size="sm" variant="outline" onClick={mergeSelectedCards} data-testid="button-merge-cards">
                  <Merge className="h-3.5 w-3.5 mr-1" /> Merge {mergeSelected.size}
                </Button>
              )}
              {mergeSelected.size > 0 && mergeSelected.size < 2 && (
                <p className="text-xs text-muted-foreground">Select 2+ cards to merge</p>
              )}
              <Button size="sm" variant="ghost" onClick={addBlankCard} data-testid="button-add-blank">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add card
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFeedback(!showFeedback)}
                data-testid="button-regenerate"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Regenerate
              </Button>
            </div>

            {/* Feedback panel */}
            {showFeedback && (
              <div className="px-4 py-3 border-b bg-muted/20 space-y-2 shrink-0">
                <p className="text-sm font-medium">What should be improved?</p>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. 'Too basic, add more depth' or 'Cover the formulas more' or 'The cloze blanks are in wrong spots'"
                  className="text-sm"
                  rows={2}
                  data-testid="input-feedback"
                />
                <Button
                  size="sm"
                  onClick={() => generateMutation.mutate({ previousCards: cards, feedback })}
                  disabled={generateMutation.isPending || !feedback.trim()}
                  data-testid="button-submit-feedback"
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Regenerating...</>
                  ) : (
                    <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate with feedback</>
                  )}
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-3 space-y-3">
                {generateMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Regenerating flashcards...</p>
                  </div>
                ) : (
                  cards.map((card, i) => (
                    <CardEditor
                      key={i}
                      card={card}
                      index={i}
                      total={cards.length}
                      onUpdate={(f, b) => updateCard(i, f, b)}
                      onDelete={() => deleteCard(i)}
                      onSplit={() => splitCard(i)}
                      selectedForMerge={mergeSelected.has(i)}
                      onToggleMerge={() => toggleMergeSelect(i)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0 gap-3">
          {phase === "config" ? (
            <>
              <Button variant="ghost" onClick={handleClose} data-testid="button-cancel">Cancel</Button>
              <Button
                onClick={() => generateMutation.mutate({})}
                disabled={generateMutation.isPending}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate Flashcards <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{cards.length} cards ready to add</p>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || cards.length === 0}
                data-testid="button-save-flashcards"
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Add {cards.length} Flashcards</>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
