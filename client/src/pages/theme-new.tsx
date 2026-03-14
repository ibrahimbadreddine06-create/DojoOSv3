import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { X, Brain, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function ThemeNewPage() {
  const params = useParams<{ type: string }>();
  const [, navigate] = useLocation();
  const type = params.type === "language" ? "language" : "second_brain";
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get("return") || (type === "language" ? "/languages" : "/second-brain");
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const isLanguage = type === "language";
  const Icon = isLanguage ? Globe : Brain;
  const label = isLanguage ? "Language" : "Theme";

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; type: string }) => {
      return apiRequest("POST", "/api/knowledge-topics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-topics", type] });
      toast({ title: `${label} created successfully` });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: `Failed to create ${label.toLowerCase()}`, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
    });
  };

  const handleClose = () => {
    navigate(returnUrl);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="theme-new-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="font-medium flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          New {label}
        </h1>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!name.trim() || createMutation.isPending}
          data-testid="button-save-theme"
        >
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="space-y-2">
            <Label>{label} Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isLanguage ? "e.g., Spanish, Japanese" : "e.g., Machine Learning, Philosophy"}
              autoFocus
              data-testid="input-theme-name"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe your ${label.toLowerCase()} goals...`}
              rows={4}
              data-testid="input-theme-description"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

