import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  X, Plus, MoreVertical, Bold, Italic, Underline, Strikethrough,
  Image, ChevronDown, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Flashcard } from "@shared/schema";

interface FlashcardDraft {
  id: string;
  front: string;
  back: string;
  tags: string[];
  isNew: boolean;
}

function FormatToolbar({ 
  onCommand, 
  onFontSize,
  onImageUpload,
  fontSize 
}: { 
  onCommand: (cmd: string) => void;
  onFontSize: (size: string) => void;
  onImageUpload: () => void;
  fontSize: string;
}) {
  return (
    <div className="flex items-center gap-1 py-2 border-t border-border mt-2">
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => onCommand('bold')} 
        title="Bold"
        data-testid="format-bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => onCommand('italic')} 
        title="Italic"
        data-testid="format-italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => onCommand('underline')} 
        title="Underline"
        data-testid="format-underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => onCommand('strikeThrough')} 
        title="Strikethrough"
        data-testid="format-strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <Select value={fontSize} onValueChange={onFontSize}>
        <SelectTrigger className="w-16 h-8 text-xs" data-testid="format-fontsize">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Small</SelectItem>
          <SelectItem value="3">Normal</SelectItem>
          <SelectItem value="5">Large</SelectItem>
          <SelectItem value="7">Huge</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 ml-auto"
        onClick={onImageUpload}
        title="Add image/attachment"
        data-testid="format-image"
      >
        <Image className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FlashcardPreviewCard({ 
  card, 
  isSelected, 
  onClick 
}: { 
  card: FlashcardDraft; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const frontText = stripHtml(card.front);
  const backText = stripHtml(card.back);
  const isEmpty = !frontText && !backText;

  return (
    <div
      className={`
        p-3 rounded-lg cursor-pointer transition-all border overflow-hidden
        ${isSelected 
          ? "border-l-4 border-l-primary border-t border-r border-b border-border bg-card" 
          : "border-border hover-elevate bg-card/50"
        }
      `}
      onClick={onClick}
      data-testid={`flashcard-preview-${card.id}`}
    >
      {isEmpty ? (
        <div className="h-16 flex items-center justify-center text-muted-foreground text-sm">
          Empty flashcard
        </div>
      ) : (
        <div className="h-20 overflow-hidden relative">
          <div className="space-y-1">
            <p 
              className="text-xs text-muted-foreground overflow-hidden"
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
            <p 
              className="text-sm overflow-hidden"
              style={{ 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {backText || "No answer"}
            </p>
          </div>
          {/* Fade effect at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );
}

function InlineEditor({
  value,
  onChange,
  onClose,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  placeholder: string;
  label: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fontSize, setFontSize] = useState("3");

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
      editorRef.current.focus();
    }
  }, []);

  const execCommand = useCallback((command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  }, []);

  const handleFontSize = useCallback((size: string) => {
    setFontSize(size);
    document.execCommand('fontSize', false, size);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 100);
  }, [onChange]);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      
      // Insert image at cursor position in the editor
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertImage', false, base64);
        onChange(editorRef.current.innerHTML);
      }
    };
    reader.readAsDataURL(file);
    
    e.target.value = "";
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="px-6 pt-5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[140px] px-6 py-4 focus:outline-none text-foreground text-base [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2"
        onInput={handleInput}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        data-testid={`editor-${label.toLowerCase()}`}
      />
      <div className="px-6 pb-4">
        <FormatToolbar 
          onCommand={execCommand}
          onFontSize={handleFontSize}
          onImageUpload={handleImageUpload}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
}

function CardSidePlaceholder({
  label,
  onClick,
  content,
  isEditing,
}: {
  label: string;
  onClick: () => void;
  content: string;
  isEditing: boolean;
}) {
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const textContent = stripHtml(content);
  const hasContent = textContent.trim().length > 0;

  if (isEditing) return null;

  return (
    <div 
      className="rounded-lg border border-dashed border-border p-6 cursor-pointer hover-elevate transition-all min-h-[120px]"
      onClick={onClick}
      data-testid={`placeholder-${label.toLowerCase()}`}
    >
      {hasContent ? (
        <div className="space-y-3">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div 
            className="text-foreground prose prose-base max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      ) : (
        <div className="h-full flex items-center justify-center gap-2 text-muted-foreground min-h-[72px]">
          <Plus className="h-4 w-4" />
          <span>Add {label.toLowerCase()}</span>
        </div>
      )}
    </div>
  );
}

export default function FlashcardNewPage() {
  const params = useParams<{ chapterId: string }>();
  const [, navigate] = useLocation();
  const chapterId = params.chapterId || "";
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const topicId = searchParams.get("topicId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const returnUrl = searchParams.get("return") || "/";
  
  // State for flashcard drafts
  const [cards, setCards] = useState<FlashcardDraft[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editingSide, setEditingSide] = useState<"question" | "answer" | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Fetch existing flashcards for this chapter
  const { data: existingCards = [] } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/chapter", chapterId],
    enabled: !!chapterId,
  });

  // Initialize cards from existing flashcards
  useEffect(() => {
    if (existingCards.length > 0 && cards.length === 0) {
      const drafts: FlashcardDraft[] = existingCards.map(fc => ({
        id: fc.id,
        front: fc.front,
        back: fc.back,
        tags: [],
        isNew: false,
      }));
      setCards(drafts);
      if (drafts.length > 0) {
        setSelectedCardId(drafts[0].id);
      }
    } else if (existingCards.length === 0 && cards.length === 0) {
      // Create initial empty card
      const newCard: FlashcardDraft = {
        id: `new-${Date.now()}`,
        front: "",
        back: "",
        tags: [],
        isNew: true,
      };
      setCards([newCard]);
      setSelectedCardId(newCard.id);
    }
  }, [existingCards]);

  const selectedCard = cards.find(c => c.id === selectedCardId);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { front: string; back: string; imageUrl?: string; chapterId: string; topicId?: string; courseId?: string }) => {
      return apiRequest("POST", "/api/flashcards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; front: string; back: string; imageUrl?: string }) => {
      return apiRequest("PATCH", `/api/flashcards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/flashcards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
    },
  });

  // Auto-save function
  const saveCard = useCallback(async (card: FlashcardDraft) => {
    if (!card.front.trim() && !card.back.trim()) return;
    
    setSaveStatus("saving");
    
    try {
      if (card.isNew) {
        const response = await createMutation.mutateAsync({
          front: card.front,
          back: card.back,
          chapterId,
          topicId,
          courseId,
        });
        
        // Update the card ID to the real one
        const newId = (response as any).id;
        setCards(prev => prev.map(c => 
          c.id === card.id ? { ...c, id: newId, isNew: false } : c
        ));
        if (selectedCardId === card.id) {
          setSelectedCardId(newId);
        }
      } else {
        await updateMutation.mutateAsync({
          id: card.id,
          front: card.front,
          back: card.back,
        });
      }
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("unsaved");
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }, [chapterId, topicId, courseId, createMutation, updateMutation, selectedCardId, toast]);

  // Debounced auto-save
  useEffect(() => {
    if (!selectedCard) return;
    
    const timer = setTimeout(() => {
      if (selectedCard.front.trim() || selectedCard.back.trim()) {
        saveCard(selectedCard);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedCard?.front, selectedCard?.back]);

  const handleNewFlashcard = () => {
    // Save current card first if it has content
    if (selectedCard && (selectedCard.front.trim() || selectedCard.back.trim())) {
      saveCard(selectedCard);
    }
    
    const newCard: FlashcardDraft = {
      id: `new-${Date.now()}`,
      front: "",
      back: "",
      tags: [],
      isNew: true,
    };
    setCards(prev => [newCard, ...prev]);
    setSelectedCardId(newCard.id);
    setEditingSide(null);
  };

  const handleSelectCard = (cardId: string) => {
    // Save current card before switching
    if (selectedCard && selectedCard.id !== cardId) {
      if (selectedCard.front.trim() || selectedCard.back.trim()) {
        saveCard(selectedCard);
      }
    }
    setSelectedCardId(cardId);
    setEditingSide(null);
  };

  const handleSideClick = (side: "question" | "answer") => {
    setEditingSide(side);
  };

  const handleContentChange = (side: "question" | "answer", value: string) => {
    if (!selectedCardId) return;
    
    setSaveStatus("unsaved");
    setCards(prev => prev.map(card => {
      if (card.id === selectedCardId) {
        return side === "question" 
          ? { ...card, front: value }
          : { ...card, back: value };
      }
      return card;
    }));
  };

  const handleClose = () => {
    // Save current card before closing
    if (selectedCard && (selectedCard.front.trim() || selectedCard.back.trim())) {
      saveCard(selectedCard);
    }
    navigate(returnUrl);
  };

  const handleDeleteCard = async () => {
    if (!selectedCardId) return;
    
    const cardToDelete = cards.find(c => c.id === selectedCardId);
    if (!cardToDelete) return;

    // If it's not a new card, delete from API
    if (!cardToDelete.isNew) {
      try {
        await deleteMutation.mutateAsync(selectedCardId);
      } catch (error) {
        toast({ title: "Failed to delete flashcard", variant: "destructive" });
        return;
      }
    }
    
    // Get remaining cards before removing
    const remainingCards = cards.filter(c => c.id !== selectedCardId);
    
    // Remove from local state
    setCards(remainingCards);
    
    // Select another card or create new empty one (without triggering save)
    if (remainingCards.length > 0) {
      setSelectedCardId(remainingCards[0].id);
    } else {
      // Create a new empty card directly (don't call handleNewFlashcard which would try to save)
      const newCard: FlashcardDraft = {
        id: `new-${Date.now()}`,
        front: "",
        back: "",
        tags: [],
        isNew: true,
      };
      setCards([newCard]);
      setSelectedCardId(newCard.id);
      setEditingSide(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex" data-testid="flashcard-new-page">
      {/* Left Panel - Flashcard List */}
      <div className="w-64 border-r border-border flex flex-col bg-muted/30">
        <div className="p-4 border-b border-border">
          <Button 
            variant="outline" 
            className="w-full justify-center gap-2"
            onClick={handleNewFlashcard}
            data-testid="button-new-flashcard"
          >
            <Plus className="h-4 w-4" />
            New flashcard
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {cards.map(card => (
              <FlashcardPreviewCard
                key={card.id}
                card={card}
                isSelected={card.id === selectedCardId}
                onClick={() => handleSelectCard(card.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Card Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              data-testid="button-close"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-medium">Flashcards</h1>
              <p className="text-xs text-muted-foreground">
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "All changes saved" : "Unsaved changes"}
              </p>
            </div>
          </div>
        </header>

        {/* Card Editor Content */}
        <div className="flex-1 overflow-y-auto p-8 flex items-start justify-center">
          {selectedCard && (
            <div className="w-full max-w-2xl">
              {/* Tags and Menu Bar */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground gap-1"
                  data-testid="button-add-tags"
                >
                  <Plus className="h-3 w-3" />
                  Add tags
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-card-menu">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={handleDeleteCard}
                    >
                      Delete flashcard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Flashcard Content */}
              <div className="bg-card rounded-xl border border-border p-8 space-y-8">
                {/* Question Section */}
                {editingSide === "question" ? (
                  <InlineEditor
                    value={selectedCard.front}
                    onChange={(value) => handleContentChange("question", value)}
                    onClose={() => setEditingSide(null)}
                    placeholder="Enter your question..."
                    label="Question"
                  />
                ) : (
                  <CardSidePlaceholder
                    label="Question"
                    content={selectedCard.front}
                    onClick={() => handleSideClick("question")}
                    isEditing={false}
                  />
                )}

                {/* Answer Section */}
                {editingSide === "answer" ? (
                  <InlineEditor
                    value={selectedCard.back}
                    onChange={(value) => handleContentChange("answer", value)}
                    onClose={() => setEditingSide(null)}
                    placeholder="Enter your answer..."
                    label="Answer"
                  />
                ) : (
                  <CardSidePlaceholder
                    label="Answer"
                    content={selectedCard.back}
                    onClick={() => handleSideClick("answer")}
                    isEditing={false}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
