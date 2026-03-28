import { useState, useRef, useEffect } from "react";
import { Bot, RotateCcw, Send, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useDualSidebar, type ChatMessage } from "@/contexts/dual-sidebar-context";

interface SenseiChatSidebarProps {
  onClose: () => void;
  isMobileSheet?: boolean;
  onExpand?: (expanded: boolean) => void;
}

export function SenseiChatSidebar({
  onClose,
  isMobileSheet = false,
  onExpand,
}: SenseiChatSidebarProps) {
  const { chatMessages, setChatMessages, subModuleInfo } = useDualSidebar();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleNewConversation = () => {
    setChatMessages([]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !subModuleInfo) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/ai/chat", {
        message: text,
        history: chatMessages.map(m => ({ role: m.role, content: m.content })),
        subModuleType: subModuleInfo.type,
        subModuleId: subModuleInfo.id,
      });
      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, ik kon niet antwoorden. Probeer opnieuw.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    onExpand?.(next);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header — same height as app nav bar so border-b aligns */}
      <div className="flex items-center justify-between px-4 border-b shrink-0 h-11 md:h-16">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Sensei AI</span>
        </div>
        <div className="flex items-center gap-0.5">
          {isMobileSheet && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={isExpanded ? "Kleiner maken" : "Groter maken"}
              onClick={handleToggleExpand}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Nieuw gesprek"
            onClick={handleNewConversation}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3 space-y-3">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center gap-3 py-12">
              <Bot className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Stel me een vraag over dit onderwerp. Ik heb toegang tot al je hoofdstukken, flashcards, notities en materialen.
              </p>
            </div>
          )}

          {chatMessages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap break-words",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Vraag Sensei iets..."
            rows={1}
            className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm py-2 overflow-y-auto"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Enter om te sturen · Shift+Enter voor nieuwe regel
        </p>
      </div>
    </div>
  );
}
