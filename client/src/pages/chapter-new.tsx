import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { X, BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function ChapterNewPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const topicId = searchParams.get("topicId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const disciplineId = searchParams.get("disciplineId") || undefined;
  const parentId = searchParams.get("parentId") || null;
  const returnUrl = searchParams.get("return") || "/";
  const parentTitle = searchParams.get("parentTitle") || "";

  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(3);

  const queryKey = courseId
    ? ["/api/learn-plan-items/course", courseId]
    : disciplineId
      ? ["/api/learn-plan-items/discipline", disciplineId]
      : ["/api/learn-plan-items", topicId];

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/learn-plan-items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: parentId ? "Sub-chapter created" : "Chapter created" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to create chapter", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    const data: any = { parentId, title: title.trim(), importance };
    if (courseId) data.courseId = courseId;
    if (topicId) data.topicId = topicId;
    if (disciplineId) data.disciplineId = disciplineId;
    createMutation.mutate(data);
  };

  const handleClose = () => {
    navigate(returnUrl);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="chapter-new-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>

        <h1 className="font-medium flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {parentId ? "New Sub-chapter" : "New Chapter"}
        </h1>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || createMutation.isPending}
          data-testid="button-save-chapter"
        >
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {parentTitle && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Adding sub-chapter to:</p>
              <p className="font-medium">{parentTitle}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Chapter Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chapter title..."
              autoFocus
              data-testid="input-chapter-title"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Importance Level</Label>
              <span className="text-sm text-muted-foreground">{importance}/5</span>
            </div>
            <Slider
              value={[importance]}
              onValueChange={(v) => setImportance(v[0])}
              min={1}
              max={5}
              step={1}
              data-testid="slider-importance"
            />
            <p className="text-xs text-muted-foreground">
              Higher importance chapters contribute more to overall completion metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

