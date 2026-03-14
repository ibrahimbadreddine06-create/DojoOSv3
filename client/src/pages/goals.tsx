import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, ChevronRight, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddGoalDialog } from "@/components/dialogs/add-goal-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Goals() {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals, isLoading } = useQuery<any[]>({
    queryKey: ["/api/goals"],
  });

  const toggleGoalCompletionMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return await apiRequest("PATCH", `/api/goals/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
    onError: () => {
      toast({ title: "Failed to update goal", variant: "destructive" });
    },
  });

  const toggleGoal = (id: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGoals(newExpanded);
  };

  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  };

  const calculateProgress = (goal: any): number => {
    if (goal.completed) return 100;
    if (!goal.subgoals || goal.subgoals.length === 0) return 0;
    const completedSubgoals = goal.subgoals.filter((sg: any) => sg.completed).length;
    return Math.round((completedSubgoals / goal.subgoals.length) * 100);
  };

  const renderGoal = (goal: any, level: number = 0) => {
    const hasSubgoals = goal.subgoals && goal.subgoals.length > 0;
    const isExpanded = expandedGoals.has(goal.id);
    const progress = calculateProgress(goal);

    return (
      <div key={goal.id} className="space-y-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
        <Card className="hover-elevate" data-testid={`card-goal-${goal.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {hasSubgoals && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -ml-2"
                      onClick={() => toggleGoal(goal.id)}
                      data-testid={`button-toggle-${goal.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <CardTitle className="text-base">{goal.title}</CardTitle>
                  <Badge variant={priorityColors[goal.priority as keyof typeof priorityColors] as any} data-testid={`badge-priority-${goal.id}`}>
                    {goal.priority}
                  </Badge>
                </div>
                {goal.description && (
                  <CardDescription className="text-sm">
                    {goal.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-2">
                  {goal.year && (
                    <Badge variant="outline" data-testid={`badge-period-${goal.id}`}>
                      {goal.year} Q{goal.quarter}
                      {goal.month && ` - M${goal.month}`}
                    </Badge>
                  )}
                  {goal.associatedModules?.map((module: string) => (
                    <Badge key={module} variant="secondary" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono font-medium" data-testid={`text-progress-${goal.id}`}>
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
              <Button
                variant={goal.completed ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGoalCompletionMutation.mutate({ id: goal.id, completed: !goal.completed })}
                disabled={toggleGoalCompletionMutation.isPending}
                data-testid={`button-complete-${goal.id}`}
              >
                {goal.completed ? "Completed" : "Mark Complete"}
              </Button>
            </div>
          </CardHeader>
        </Card>
        {hasSubgoals && isExpanded && (
          <div className="space-y-2">
            {goal.subgoals.map((subgoal: any) => renderGoal(subgoal, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-goals-title">
              Goals
            </h1>
            <p className="text-muted-foreground">
              Track your yearly, quarterly, and monthly objectives
            </p>
          </div>
          <AddGoalDialog />
        </div>

        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current" data-testid="tab-current">
              Current ({currentYear} Q{currentQuarter})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All Goals
            </TabsTrigger>
            <TabsTrigger value="unscheduled" data-testid="tab-unscheduled">
              Unscheduled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : goals && goals.filter(g => g.year === currentYear && g.quarter === currentQuarter).length > 0 ? (
              <div className="space-y-3">
                {goals
                  .filter(g => g.year === currentYear && g.quarter === currentQuarter && !g.parentId)
                  .map(goal => renderGoal(goal))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No goals for this quarter</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start setting your quarterly objectives
                </p>
                <Button data-testid="button-create-goal">
                  Create Goal
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-3">
                {goals.filter(g => !g.parentId).map(goal => renderGoal(goal))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first goal to get started
                </p>
                <Button data-testid="button-create-first-goal">
                  Create Goal
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unscheduled" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : goals && goals.filter(g => !g.year && !g.parentId).length > 0 ? (
              <div className="space-y-3">
                {goals
                  .filter(g => !g.year && !g.parentId)
                  .map(goal => renderGoal(goal))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No unscheduled goals</h3>
                <p className="text-sm text-muted-foreground">
                  All your goals are assigned to specific periods
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Goal Evolution</CardTitle>
            <CardDescription>Track active goals vs completion over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart will be implemented in integration phase
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

