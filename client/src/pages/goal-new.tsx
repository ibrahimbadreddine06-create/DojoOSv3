import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { X, Target, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function GoalNewPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get("return") || "/goals";
  const defaultTimeframe = searchParams.get("timeframe") || "year";
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState(defaultTimeframe);

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  const timeframes = [
    { value: "year", label: `${currentYear} Goals` },
    { value: "quarter", label: `Q${currentQuarter} ${currentYear}` },
    { value: "month", label: `${currentMonth} ${currentYear}` },
  ];

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; timeframe: string }) => {
      return apiRequest("POST", "/api/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal created successfully" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to create goal", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Please enter a goal title", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      timeframe,
    });
  };

  const handleClose = () => {
    navigate(returnUrl);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="goal-new-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="font-medium flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          New Goal
        </h1>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!title.trim() || createMutation.isPending}
          data-testid="button-save-goal"
        >
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="space-y-2">
            <Label>Goal Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              autoFocus
              data-testid="input-goal-title"
            />
          </div>

          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger data-testid="select-timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about your goal..."
              rows={4}
              data-testid="input-goal-description"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
