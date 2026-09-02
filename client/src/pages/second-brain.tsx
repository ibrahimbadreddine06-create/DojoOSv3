import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Brain } from "lucide-react";
import { AddThemeDialog } from "@/components/dialogs/add-theme-dialog";
import { LearningModuleDashboard } from "@/components/learning/learning-module-dashboard";
import { apiRequest } from "@/lib/queryClient";

const SERIES_COLORS = ["#6d28d9", "#7c3aed", "#8b5cf6", "#a78bfa", "#5b21b6", "#4c1d95"];

export default function SecondBrain() {
  const queryClient = useQueryClient();
  const { data: themes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/knowledge-topics", "second_brain"],
  });
  const { data: metricsData = [] } = useQuery<any[]>({
    queryKey: ["/api/knowledge-metrics-all", "second_brain"],
  });
  const deleteTheme = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/knowledge-topics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-topics", "second_brain"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-metrics-all", "second_brain"] });
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
    const names = new Set(themes.map((theme) => theme.name));
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
      series: themes.map((theme, index) => ({
        key: theme.name,
        label: theme.name,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      })),
    };
  }, [metricsData, themes]);

  const config = {
    kind: "second_brain" as const,
    label: "Second Brain",
    href: "/second-brain",
    icon: Brain,
    accent: "#7c3aed",
    gridColumns: 4 as const,
    historyDefaultSize: { w: 4, h: 2 },
    plannerDefaultSize: { w: 4, h: 1 },
    entityDefaultSize: { w: 2, h: 1 },
    entities: themes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        href: `/second-brain/${theme.id}`,
        description: theme.description,
        completion: latest[theme.id]?.value ?? 0,
        readiness: theme.readiness ?? 0,
        itemCount: theme.learnPlanCount ?? 0,
        itemLabel: "Learn items",
        secondaryValue: theme.materialsCount ?? 0,
        secondaryLabel: "Materials",
        onDelete: () => deleteTheme.mutate(theme.id),
      })),
    history,
    historySeries: series,
    historyLabel: "Knowledge progress",
  };

  return (
    <LearningModuleDashboard
      title="Second Brain"
      description="Track knowledge acquisition and readiness across themes."
      config={config}
      actions={<AddThemeDialog type="second_brain" />}
      isLoading={isLoading}
      storageVersion={4}
      empty={
        <div className="rounded-[22px] border border-dashed p-12 text-center">
          <Brain className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No knowledge themes yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create your first theme to begin.</p>
          <div className="mt-5"><AddThemeDialog type="second_brain" /></div>
        </div>
      }
    />
  );
}
