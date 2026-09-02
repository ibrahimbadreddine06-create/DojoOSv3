import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Languages as LanguagesIcon } from "lucide-react";
import { AddThemeDialog } from "@/components/dialogs/add-theme-dialog";
import { LearningModuleDashboard } from "@/components/learning/learning-module-dashboard";
import { apiRequest } from "@/lib/queryClient";

const SERIES_COLORS = ["#0e7490", "#0891b2", "#06b6d4", "#22d3ee", "#155e75", "#164e63"];

export default function Languages() {
  const queryClient = useQueryClient();
  const { data: languages = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/knowledge-topics", "language"],
  });
  const { data: metricsData = [] } = useQuery<any[]>({
    queryKey: ["/api/knowledge-metrics-all", "language"],
  });
  const deleteLanguage = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/knowledge-topics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-topics", "language"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-metrics-all", "language"] });
    },
  });

  const latest = useMemo(() => {
    const values: Record<string, { value: number; date: string }> = {};
    for (const metric of metricsData) {
      if (!values[metric.topicId] || metric.date > values[metric.topicId].date) {
        values[metric.topicId] = { value: Number(metric.completion) || 0, date: metric.date };
      }
    }
    return values;
  }, [metricsData]);

  const { history, series } = useMemo(() => {
    const names = new Set(languages.map((language) => language.name));
    const dates = new Map<string, Record<string, number>>();
    for (const metric of metricsData) {
      if (!names.has(metric.topicName)) continue;
      if (!dates.has(metric.date)) dates.set(metric.date, {});
      dates.get(metric.date)![metric.topicName] = Number(metric.completion) || 0;
    }
    return {
      history: Array.from(dates.keys()).sort().map((date) => ({
        date: format(parseISO(date), "MMM d"),
        fullDate: date,
        ...dates.get(date),
      })),
      series: languages.map((language, index) => ({
        key: language.name,
        label: language.name,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      })),
    };
  }, [languages, metricsData]);

  const config = {
    kind: "languages" as const,
    label: "Languages",
    href: "/languages",
    icon: LanguagesIcon,
    accent: "#0891b2",
    gridColumns: 3 as const,
    historyDefaultSize: { w: 3, h: 2 },
    plannerDefaultSize: { w: 3, h: 1 },
    entityDefaultSize: { w: 1, h: 1 },
    entities: languages.map((language) => ({
        id: language.id,
        name: language.name,
        href: `/languages/${language.id}`,
        description: language.description,
        completion: latest[language.id]?.value ?? 0,
        readiness: language.readiness ?? 0,
        itemCount: language.flashcardsCount ?? 0,
        itemLabel: "Flashcards",
        secondaryValue: `${Math.round(language.readiness ?? 0)}%`,
        secondaryLabel: "Ready",
        onDelete: () => deleteLanguage.mutate(language.id),
      })),
    history,
    historySeries: series,
    historyLabel: "Language progress",
  };

  return (
    <LearningModuleDashboard
      title="Languages"
      description="Track fluency, review readiness and every language learning path."
      config={config}
      actions={<AddThemeDialog type="language" />}
      isLoading={isLoading}
      storageVersion={4}
      empty={
        <div className="rounded-[22px] border border-dashed p-12 text-center">
          <LanguagesIcon className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No languages yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add a language to begin.</p>
          <div className="mt-5"><AddThemeDialog type="language" /></div>
        </div>
      }
    />
  );
}
