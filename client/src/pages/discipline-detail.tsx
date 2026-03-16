import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { TrendingUp, BookOpen, Brain, GraduationCap, Zap, Trophy, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChapterContentArea } from "@/components/chapter-content-area";
import { useDualSidebar } from "@/contexts/dual-sidebar-context";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import type { Discipline, LearnPlanItem, Flashcard, DisciplineLog } from "@shared/schema";
import { TodaySessions } from "@/components/today-sessions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

function getAllChildChapterIds(chapter: ChapterWithChildren): string[] {
    const ids: string[] = [];
    const collectIds = (node: ChapterWithChildren) => {
        node.children.forEach(child => {
            ids.push(child.id);
            collectIds(child);
        });
    };
    collectIds(chapter);
    return ids;
}

function findChapterInTree(tree: ChapterWithChildren[], id: string): ChapterWithChildren | undefined {
    for (const chapter of tree) {
        if (chapter.id === id) return chapter;
        const found = findChapterInTree(chapter.children, id);
        if (found) return found;
    }
    return undefined;
}

function OverviewDashboard({
    discipline,
    chapters,
    flashcards,
    logs
}: {
    discipline: Discipline;
    chapters: LearnPlanItem[];
    flashcards: Flashcard[];
    logs: DisciplineLog[];
}) {
    const completionPercent = useMemo(() => {
        if (chapters.length === 0) return 0;
        const completed = chapters.filter(c => c.completed).length;
        return Math.round((completed / chapters.length) * 100);
    }, [chapters]);

    const readinessPercent = useMemo(() => calculateReadinessWithDecay(flashcards), [flashcards]);
    const completedChapters = chapters.filter(c => c.completed).length;
    const totalChapters = chapters.length;

    const chartData = useMemo(() => {
        // Generate some mock history if logs are empty, or use logs if available
        const today = new Date().toISOString().split('T')[0];
        if (logs.length === 0) {
            return [{ date: format(parseISO(today), "MMM d"), fullDate: today, completion: completionPercent, xp: discipline.currentXp || 0 }];
        }
        // Aggregate logs by date for XP growth?
        return logs.map(l => ({
            date: format(new Date(l.date!), "MMM d"),
            fullDate: l.date?.toString().split('T')[0],
            xp: l.xpGained,
            completion: completionPercent // Simplified for now
        }));
    }, [logs, completionPercent, discipline]);

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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Badge variant="outline" className="mb-2 uppercase tracking-widest text-[10px] font-bold">Discipline Focus</Badge>
                    <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                        {discipline.name}
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-sm border border-amber-500/20">
                            <Zap className="h-4 w-4 fill-amber-500" />
                            Level {discipline.level}
                        </div>
                    </h1>
                    {discipline.description && (
                        <p className="text-muted-foreground">{discipline.description}</p>
                    )}
                </div>
                <div className="text-right space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Next Level: {discipline.currentXp}/{discipline.maxXp} XP</div>
                    <Progress value={((discipline.currentXp || 0) / (discipline.maxXp || 100)) * 100} className="w-48 h-2" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    <Card className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4 w-4" />
                            <h3 className="font-semibold">Growth Trend</h3>
                        </div>
                        <ChartContainer
                            config={{
                                xp: { label: "XP Gained", color: "hsl(var(--primary))" },
                                completion: { label: "Completion", color: "hsl(var(--primary) / 0.7)" }
                            }}
                            className="flex-1 w-full min-h-[250px]"
                        >
                            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={30} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={30} tickFormatter={(v) => `${v}%`} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line yAxisId="left" type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="XP Gained" />
                                <Line yAxisId="right" type="monotone" dataKey="completion" stroke="hsl(var(--primary) / 0.7)" strokeWidth={2} dot={{ fill: "hsl(var(--primary) / 0.7)", r: 3 }} name="Completion" />
                                <Legend />
                            </LineChart>
                        </ChartContainer>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Recent Milestones</h3>
                        <div className="space-y-4">
                            {logs.slice(0, 5).map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Zap className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{log.notes || "Mastery Session"}</div>
                                            <div className="text-[10px] text-muted-foreground">{format(new Date(log.date!), "PPP")}</div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">+{log.xpGained} XP</Badge>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm italic">
                                    No training logs yet. Complete a linked time block or log progress manually.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-3">
                    <Card className="p-4 bg-primary/5 border-primary/20 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Completion</p>
                        </div>
                        <p className="text-2xl font-bold">{completionPercent}%</p>
                        <Progress value={completionPercent} className="h-1 mt-2" />
                    </Card>
                    <Card className="p-4 bg-primary/5 border-primary/20 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-primary/80" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Readiness</p>
                        </div>
                        <p className="text-2xl font-bold">{readinessPercent}%</p>
                        <Progress value={readinessPercent} className="h-1 mt-2" />
                    </Card>
                    <Card className="p-4 bg-primary/5 border-primary/20 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-4 w-4 text-primary/60" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Sessions</p>
                        </div>
                        <p className="text-2xl font-bold">{logs.length}</p>
                        <div className="text-[10px] text-muted-foreground mt-2">Total focused sessions</div>
                    </Card>
                    <Card className="p-4 bg-primary/5 border-primary/20 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer className="h-4 w-4 text-primary/40" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Time</p>
                        </div>
                        <p className="text-2xl font-bold">{logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0)}m</p>
                        <div className="text-[10px] text-muted-foreground mt-2">Historical focused time</div>
                    </Card>
                </div>
            </div>

            <div className="mt-2">
                <TodaySessions module="disciplines" itemId={discipline.id} />
            </div>


        </div>
    );
}

export default function DisciplineDetail() {
    const [, params] = useRoute("/disciplines/:id");
    const disciplineId = params?.id;

    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const { setLearningData, learningData } = useDualSidebar();

    const { data: discipline, isLoading: disciplineLoading } = useQuery<Discipline>({
        queryKey: ["/api/disciplines", disciplineId],
        enabled: !!disciplineId
    });
    const { data: chapters = [] } = useQuery<LearnPlanItem[]>({
        queryKey: ["/api/learn-plan-items/discipline", disciplineId],
        enabled: !!disciplineId
    });
    const { data: flashcards = [] } = useQuery<Flashcard[]>({
        queryKey: ["/api/flashcards/discipline", disciplineId],
        enabled: !!disciplineId
    });
    const { data: logs = [] } = useQuery<DisciplineLog[]>({
        queryKey: ["/api/disciplines", disciplineId, "logs"],
        enabled: !!disciplineId
    });

    const chapterTree = useMemo(() => buildChapterTree(chapters), [chapters]);
    const selectedChapter = useMemo(() => chapters.find(c => c.id === selectedChapterId), [chapters, selectedChapterId]);

    const selectedChapterChildIds = useMemo(() => {
        if (!selectedChapterId) return [];
        const chapterNode = findChapterInTree(chapterTree, selectedChapterId);
        return chapterNode ? getAllChildChapterIds(chapterNode) : [];
    }, [chapterTree, selectedChapterId]);

    useEffect(() => {
        setLearningData({
            topicId: disciplineId,
            selectedChapterId,
            onSelectChapter: setSelectedChapterId,
        });
    }, [disciplineId, selectedChapterId, setLearningData]);

    useEffect(() => {
        return () => setLearningData(null);
    }, [setLearningData]);



    if (disciplineLoading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (!discipline) {
        return (
            <div className="p-6 text-center">
                <Card className="p-8">
                    <p className="text-muted-foreground">Discipline not found</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            {selectedChapterId && selectedChapter ? (
                <div className="max-w-3xl mx-auto">
                    <ChapterContentArea
                        chapter={selectedChapter}
                        disciplineId={disciplineId}
                        childChapterIds={selectedChapterChildIds}
                        trajectoryContext={(discipline as any)?.trajectoryContext ?? undefined}
                    />
                </div>
            ) : (
                <OverviewDashboard
                    discipline={discipline}
                    chapters={chapters}
                    flashcards={flashcards}
                    logs={logs}
                />
            )}
        </div>
    );
}

