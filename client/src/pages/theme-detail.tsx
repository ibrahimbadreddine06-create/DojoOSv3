import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { TrendingUp, BookOpen, Brain, GraduationCap, Languages } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChapterContentArea } from "@/components/chapter-content-area";
import { useDualSidebar } from "@/contexts/dual-sidebar-context";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import type { KnowledgeTopic, LearnPlanItem, KnowledgeMetric, Flashcard } from "@shared/schema";
import { TodaySessions } from "@/components/today-sessions";

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
  theme,
  chapters,
  flashcards,
  knowledgeMetrics,
  isLanguage
}: {
  theme: KnowledgeTopic;
  chapters: LearnPlanItem[];
  flashcards: Flashcard[];
  knowledgeMetrics: KnowledgeMetric[];
  isLanguage?: boolean;
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2" data-testid="text-theme-title">{theme.name}</h1>
        {theme.description && (
          <p className="text-muted-foreground">{theme.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <Card className="p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-semibold">Progress Trend</h3>
            </div>
            <ChartContainer
              config={{
                completion: { label: "Completion", color: "hsl(var(--primary))" },
                readiness: { label: "Readiness", color: "hsl(var(--primary) / 0.7)" }
              }}
              className="flex-1 w-full min-h-[250px]"
            >
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={30} tickFormatter={(v) => `${v}%`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Completion" />
                <Line type="monotone" dataKey="readiness" stroke="hsl(var(--primary) / 0.7)" strokeWidth={2} dot={{ fill: "hsl(var(--primary) / 0.7)", r: 3 }} name="Readiness" />
                <Legend />
              </LineChart>
            </ChartContainer>
          </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-3">
          <Card className="p-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
            <p className="text-3xl font-bold">{completionPercent}%</p>
            <p className="text-xs text-muted-foreground mt-2">{completedChapters} of {totalChapters} chapters</p>
          </Card>
          <Card className="p-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              {isLanguage ? (
                <Languages className="h-4 w-4 text-primary/80" />
              ) : (
                <Brain className="h-4 w-4 text-primary/80" />
              )}
              <p className="text-xs text-muted-foreground">Readiness</p>
            </div>
            <p className="text-3xl font-bold">{readinessPercent}%</p>
            <p className="text-xs text-muted-foreground mt-2">Ready to review</p>
          </Card>
          <Card className="p-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-primary/60" />
              <p className="text-xs text-muted-foreground">Flashcards</p>
            </div>
            <p className="text-3xl font-bold text-primary">{flashcards.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Created</p>
          </Card>
        </div>
      </div>

      <div className="mt-2">
        <TodaySessions module={isLanguage ? "languages" : "second_brain"} itemId={theme.id} />
      </div>


    </div>
  );
}

export default function ThemeDetail() {
  const [matchSecondBrain, paramsSecondBrain] = useRoute("/second-brain/:id");
  const [matchLanguage, paramsLanguage] = useRoute("/languages/:id");
  const isSecondBrain = matchSecondBrain;
  const topicId = isSecondBrain ? paramsSecondBrain?.id : paramsLanguage?.id;

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const { setLearningData, learningData } = useDualSidebar();

  const { data: theme, isLoading: themeLoading } = useQuery<KnowledgeTopic>({
    queryKey: ["/api/knowledge-topics/detail", topicId]
  });
  const { data: chapters = [] } = useQuery<LearnPlanItem[]>({
    queryKey: ["/api/learn-plan-items", topicId],
    enabled: !!topicId
  });
  const { data: flashcards = [] } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/theme", topicId],
    enabled: !!topicId
  });
  const { data: knowledgeMetrics = [] } = useQuery<KnowledgeMetric[]>({
    queryKey: ["/api/knowledge-metrics", topicId],
    enabled: !!topicId
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
      topicId,
      selectedChapterId,
      onSelectChapter: setSelectedChapterId,
    });
  }, [topicId, selectedChapterId, setLearningData]);

  useEffect(() => {
    return () => setLearningData(null);
  }, [setLearningData]);



  if (themeLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Theme not found</p>
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
            topicId={topicId}
            childChapterIds={selectedChapterChildIds}
          />
        </div>
      ) : (
        <OverviewDashboard
          theme={theme}
          chapters={chapters}
          flashcards={flashcards}
          knowledgeMetrics={knowledgeMetrics}
          isLanguage={!!matchLanguage}
        />
      )}
    </div>
  );
}

