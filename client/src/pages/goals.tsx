import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronDown, ChevronRight, Target } from "lucide-react";
import { AddGoalDialog } from "@/components/dialogs/add-goal-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Goal = {
  id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  year?: number | null;
  quarter?: number | null;
  month?: number | null;
  associatedModules?: string[] | null;
  subgoals?: Goal[];
};

function progress(goal: Goal) {
  if (goal.completed) return 100;
  if (!goal.subgoals?.length) return 0;
  return Math.round(goal.subgoals.filter((item) => item.completed).length / goal.subgoals.length * 100);
}

function GoalRow({ goal, nested = false }: { goal: Goal; nested?: boolean }) {
  const [open, setOpen] = useState(!nested);
  const toggle = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/goals/${goal.id}`, { completed: !goal.completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }),
  });
  const amount = progress(goal);
  return (
    <div className={nested ? "ml-7 border-l pl-4" : ""}>
      <div className="group grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_140px_44px] sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {goal.subgoals?.length ? (
              <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-muted">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : <span className="w-7" />}
            <h3 className={`truncate text-base font-semibold ${goal.completed ? "text-muted-foreground line-through" : "text-[#18202a]"}`}>{goal.title}</h3>
            {goal.priority === "high" ? <Badge variant="destructive" className="text-[10px]">Priority</Badge> : null}
          </div>
          {goal.description ? <p className="ml-9 mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{goal.description}</p> : null}
          <div className="ml-9 mt-3 flex flex-wrap gap-2">
            {goal.year ? <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{goal.year}{goal.quarter ? ` · Q${goal.quarter}` : ""}{goal.month ? ` · month ${goal.month}` : ""}</span> : null}
            {goal.associatedModules?.map((module) => <span key={module} className="text-[10px] capitalize text-muted-foreground">{module.replace("_", " ")}</span>)}
          </div>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-[11px]"><span className="text-muted-foreground">Progress</span><strong>{amount}%</strong></div>
          <Progress value={amount} className="h-1.5" />
        </div>
        <button type="button" onClick={() => toggle.mutate()} className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${goal.completed ? "border-[#20a65a] bg-[#20a65a] text-white" : "hover:border-[#20a65a] hover:text-[#20a65a]"}`} aria-label={goal.completed ? "Mark incomplete" : "Complete goal"}>
          <Check className="h-4 w-4" />
        </button>
      </div>
      {open && goal.subgoals?.map((subgoal) => <GoalRow key={subgoal.id} goal={subgoal} nested />)}
    </div>
  );
}

export default function Goals() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({ queryKey: ["/api/goals"] });
  const active = useMemo(() => goals.filter((goal) => !goal.completed), [goals]);
  const completed = useMemo(() => goals.filter((goal) => goal.completed), [goals]);
  const moving = active.filter((goal) => progress(goal) > 0).length;

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
        <header className="grid gap-6 border-b pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Direction</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-.04em] text-[#18202a]">Goals</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Turn direction into outcomes, then connect those outcomes to the work already scheduled across Dojo.</p>
          </div>
          <AddGoalDialog />
        </header>

        <div className="grid gap-3 py-7 sm:grid-cols-3">
          <div><strong className="text-2xl tracking-[-.04em]">{active.length}</strong><p className="mt-1 text-xs text-muted-foreground">active goals</p></div>
          <div><strong className="text-2xl tracking-[-.04em]">{moving}</strong><p className="mt-1 text-xs text-muted-foreground">showing progress</p></div>
          <div><strong className="text-2xl tracking-[-.04em]">{completed.length}</strong><p className="mt-1 text-xs text-muted-foreground">completed</p></div>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-[#18202a] data-[state=active]:bg-transparent data-[state=active]:shadow-none">Active</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-[#18202a] data-[state=active]:bg-transparent data-[state=active]:shadow-none">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="divide-y">
            {isLoading ? <p className="py-10 text-sm text-muted-foreground">Loading goals…</p> : active.length ? active.map((goal) => <GoalRow key={goal.id} goal={goal} />) : <div className="grid min-h-72 place-items-center text-center"><div><Target className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-4 font-semibold">Choose a direction</h2><p className="mt-2 text-sm text-muted-foreground">Start with one outcome that matters.</p></div></div>}
          </TabsContent>
          <TabsContent value="completed" className="divide-y">
            {completed.length ? completed.map((goal) => <GoalRow key={goal.id} goal={goal} />) : <p className="py-10 text-sm text-muted-foreground">Completed goals will collect here.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
