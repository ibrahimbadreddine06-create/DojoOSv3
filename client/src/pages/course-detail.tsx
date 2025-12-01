import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, Plus, ChevronRight, ChevronDown, Check, Trash2, Menu, TrendingUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChapterContentArea } from "@/components/chapter-content-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import type { Course, LearnPlanItem, KnowledgeMetric, Flashcard } from "@shared/schema";

interface ChapterWithChildren extends LearnPlanItem {
  children: ChapterWithChildren[];
}

function buildChapterTree(items: LearnPlanItem[]): ChapterWithChildren[] {
  const map = new Map<string, ChapterWithChildren>();
  const roots: ChapterWithChildren[] = [];
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });
  items.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortByOrder = (a: ChapterWithChildren, b: ChapterWithChildren) => a.order - b.order;
  const sortRecursive = (nodes: ChapterWithChildren[]) => {
    nodes.sort(sortByOrder);
    nodes.forEach(node => sortRecursive(node.children));
  };
  sortRecursive(roots);
  return roots;
}

function ChapterItem({ chapter, depth = 0, selectedId, onSelect, onToggleComplete, onAddSubchapter, onDelete }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = chapter.children.length > 0;
  const isSelected = selectedId === chapter.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover-elevate ${isSelected ? "bg-accent" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(chapter.id)}
        data-testid={`chapter-item-${chapter.id}`}
      >
        {hasChildren ? (
          <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        ) : <div className="w-5" />}
        <Button
          variant="ghost" size="icon" className={`h-5 w-5 p-0 ${chapter.completed ? "text-primary" : "text-muted-foreground"}`}
          onClick={(e) => { e.stopPropagation(); onToggleComplete(chapter.id, !chapter.completed); }}
        >
          <div className={`h-3.5 w-3.5 rounded-sm border ${chapter.completed ? "bg-primary border-primary" : "border-muted-foreground"}`}>
            {chapter.completed && <Check className="h-2.5 w-2.5" />}
          </div>
        </Button>
        <span className={`flex-1 text-sm truncate ${chapter.completed ? "line-through text-muted-foreground" : ""}`}>{chapter.title}</span>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); onAddSubchapter(chapter.id); }}>
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(chapter.id); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {chapter.children.map((child: ChapterWithChildren) => (
            <ChapterItem key={child.id} chapter={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onToggleComplete={onToggleComplete} onAddSubchapter={onAddSubchapter} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddChapterDialog({ courseId, parentId = null, onClose }: any) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(3);
  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/learn-plan-items", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items/course", courseId] }); onClose(); },
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ courseId, parentId, title: title.trim(), importance });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Chapter Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter chapter title..." data-testid="input-chapter-title" autoFocus />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Importance Level: {importance}</label>
        <Slider value={[importance]} onValueChange={(v) => setImportance(v[0])} min={1} max={5} step={1} data-testid="slider-chapter-importance" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!title.trim() || createMutation.isPending} data-testid="button-create-chapter">
          {createMutation.isPending ? "Creating..." : "Create Chapter"}
        </Button>
      </div>
    </form>
  );
}

export default function CourseDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/studies/:id");
  const courseId = params?.id;

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery<Course>({ queryKey: ["/api/courses", courseId], enabled: !!courseId });
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<LearnPlanItem[]>({ queryKey: ["/api/learn-plan-items/course", courseId], enabled: !!courseId });
  const { data: flashcards = [] } = useQuery<Flashcard[]>({ queryKey: ["/api/flashcards/course", courseId], enabled: !!courseId });
  const { data: knowledgeMetrics = [] } = useQuery<KnowledgeMetric[]>({ queryKey: ["/api/knowledge-metrics", courseId], enabled: !!courseId });

  const chapterTree = useMemo(() => buildChapterTree(chapters), [chapters]);
  const selectedChapter = useMemo(() => chapters.find(c => c.id === selectedChapterId), [chapters, selectedChapterId]);

  const completionPercent = useMemo(() => {
    if (chapters.length === 0) return 0;
    const completed = chapters.filter(c => c.completed).length;
    return Math.round((completed / chapters.length) * 100);
  }, [chapters]);

  const readinessPercent = useMemo(() => calculateReadinessWithDecay(flashcards), [flashcards]);
  const completedChapters = chapters.filter(c => c.completed).length;
  const totalChapters = chapters.length;

  const chartData = useMemo(() => {
    if (!knowledgeMetrics || knowledgeMetrics.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return [{ date: format(parseISO(today), "MMM d"), fullDate: today, completion: 0, readiness: 0 }];
    }
    return knowledgeMetrics.map(m => ({
      date: format(parseISO(m.date), "MMM d"),
      fullDate: m.date,
      completion: parseFloat(m.completion),
      readiness: parseFloat(m.readiness),
    }));
  }, [knowledgeMetrics]);

  const flashcardCategories = useMemo(() => {
    const now = new Date().getTime();
    const categories = { new: 0, learning: 0, mastered: 0 };
    flashcards.forEach(card => {
      if (!card.nextReview || card.nextReview === null) {
        categories.new++;
      } else {
        const nextTime = new Date(card.nextReview).getTime();
        if (nextTime > now) categories.mastered++;
        else categories.learning++;
      }
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [flashcards]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/learn-plan-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items/course", courseId] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => apiRequest("PATCH", `/api/learn-plan-items/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items/course", courseId] }),
  });

  if (courseLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/studies")} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Course not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studies")} data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold" data-testid="text-course-title">{course.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {course.semester && <span>{course.semester}</span>}
              {course.description && <span>- {course.description}</span>}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="button-toggle-trajectory">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {selectedChapterId && selectedChapter ? (
          <>
            {sidebarOpen && (
              <div className="w-72 border-r bg-muted/30 overflow-auto">
                <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-muted/50">
                  <h3 className="font-medium text-sm">Learning Trajectory</h3>
                  <Dialog open={addChapterOpen} onOpenChange={(open) => { setAddChapterOpen(open); if (!open) setParentIdForNew(null); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" data-testid="button-add-chapter">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{parentIdForNew ? "Add Sub-Chapter" : "Add Chapter"}</DialogTitle></DialogHeader>
                      <AddChapterDialog courseId={courseId!} parentId={parentIdForNew} onClose={() => { setAddChapterOpen(false); setParentIdForNew(null); }} />
                    </DialogContent>
                  </Dialog>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {chaptersLoading ? (
                      <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8" />)}</div>
                    ) : chapterTree.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">No chapters yet</p>
                        <Button size="sm" onClick={() => setAddChapterOpen(true)} data-testid="button-add-first-chapter">
                          <Plus className="h-4 w-4 mr-2" /> Add First Chapter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {chapterTree.map(chapter => (
                          <ChapterItem
                            key={chapter.id} chapter={chapter} selectedId={selectedChapterId} onSelect={setSelectedChapterId}
                            onToggleComplete={(id: string, completed: boolean) => updateMutation.mutate({ id, completed })}
                            onAddSubchapter={(parentId: string) => { setParentIdForNew(parentId); setAddChapterOpen(true); }}
                            onDelete={(id: string) => deleteMutation.mutate(id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                  <ChapterContentArea chapter={selectedChapter} courseId={courseId} onNotesChange={() => queryClient.invalidateQueries({ queryKey: ["/api/learn-plan-items/course", courseId] })} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {sidebarOpen && (
              <div className="w-72 border-r bg-muted/30 overflow-auto">
                <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-muted/50">
                  <h3 className="font-medium text-sm">Learning Trajectory</h3>
                  <Dialog open={addChapterOpen} onOpenChange={(open) => { setAddChapterOpen(open); if (!open) setParentIdForNew(null); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" data-testid="button-add-chapter">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{parentIdForNew ? "Add Sub-Chapter" : "Add Chapter"}</DialogTitle></DialogHeader>
                      <AddChapterDialog courseId={courseId!} parentId={parentIdForNew} onClose={() => { setAddChapterOpen(false); setParentIdForNew(null); }} />
                    </DialogContent>
                  </Dialog>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {chaptersLoading ? (
                      <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8" />)}</div>
                    ) : chapterTree.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">No chapters yet</p>
                        <Button size="sm" onClick={() => setAddChapterOpen(true)} data-testid="button-add-first-chapter">
                          <Plus className="h-4 w-4 mr-2" /> Add First
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {chapterTree.map(chapter => (
                          <ChapterItem
                            key={chapter.id} chapter={chapter} selectedId={selectedChapterId} onSelect={setSelectedChapterId}
                            onToggleComplete={(id: string, completed: boolean) => updateMutation.mutate({ id, completed })}
                            onAddSubchapter={(parentId: string) => { setParentIdForNew(parentId); setAddChapterOpen(true); }}
                            onDelete={(id: string) => deleteMutation.mutate(id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Overview</h2>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Completion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{completionPercent}%</div>
                        <p className="text-xs text-muted-foreground mt-1">{completedChapters}/{totalChapters}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Readiness</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{readinessPercent}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Flashcards</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">{flashcards.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total</p>
                      </CardContent>
                    </Card>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Flashcard Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                      {flashcards.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No flashcards yet</div>
                      ) : (
                        <div className="w-full h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={flashcardCategories} cx="40%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={1} dataKey="value">
                                <Cell fill="hsl(var(--primary))" />
                                <Cell fill="hsl(var(--chart-2))" />
                                <Cell fill="hsl(var(--chart-3))" />
                              </Pie>
                              <ChartTooltip formatter={(value) => `${value} cards`} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="mt-3 grid grid-cols-1 gap-1 text-xs">
                            {flashcardCategories.map((cat, i) => (
                              <div key={cat.name} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-chart-2' : 'bg-chart-3'}`} />
                                <span className="capitalize text-muted-foreground">{cat.name}: {cat.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Progress Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartData.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                      ) : (
                        <ChartContainer config={{ completion: { label: "Completion", color: "hsl(var(--primary))" }, readiness: { label: "Readiness", color: "hsl(var(--chart-2))" } }} className="h-32 w-full">
                          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={30} tickFormatter={(v) => `${v}%`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Completion" />
                            <Line type="monotone" dataKey="readiness" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", r: 3 }} name="Readiness" />
                            <Legend />
                          </LineChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
