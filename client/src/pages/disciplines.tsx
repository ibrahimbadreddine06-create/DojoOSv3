import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Target } from "lucide-react";
import type { Discipline } from "@shared/schema";
import { CreateDisciplineDialog } from "@/components/disciplines/create-discipline-dialog";
import { LearningModuleDashboard } from "@/components/learning/learning-module-dashboard";
import type { LearningHistoryPoint } from "@/components/learning/learning-module-widgets";
import { apiRequest } from "@/lib/queryClient";

const COLORS = ["#c2410c", "#ea580c", "#f97316", "#fb923c", "#9a3412", "#7c2d12"];

export default function Disciplines() {
  const queryClient = useQueryClient();
  const { data: disciplines = [], isLoading } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
  });
  const { data: metricsData = [] } = useQuery<any[]>({
    queryKey: ["/api/discipline-metrics-all"],
  });
  const deleteDiscipline = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/disciplines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/discipline-metrics-all"] });
    },
  });

  const latest = useMemo(() => {
    const values: Record<string, { value: number; date: string }> = {};
    for (const metric of metricsData) {
      if (!values[metric.topicId] || metric.date > values[metric.topicId].date) {
        values[metric.topicId] = {
          value: Number.parseFloat(metric.completion) || 0,
          date: metric.date,
        };
      }
    }
    return values;
  }, [metricsData]);

  const { history, series } = useMemo(() => {
    const names = disciplines.map((discipline) => discipline.name);
    const dates = new Map<string, Record<string, number>>();
    for (const metric of metricsData) {
      if (!names.includes(metric.topicName)) continue;
      if (!dates.has(metric.date)) dates.set(metric.date, {});
      dates.get(metric.date)![metric.topicName] = Number.parseFloat(metric.completion) || 0;
    }
    return {
      history: Array.from(dates.keys()).sort().map((date) => ({
        date: format(parseISO(date), "MMM d"),
        fullDate: date,
        ...dates.get(date),
      })),
      series: names.map((name, index) => ({
        key: name,
        label: name,
        color: COLORS[index % COLORS.length],
      })),
    };
  }, [disciplines, metricsData]);

  const config = {
    kind: "disciplines" as const,
    label: "Disciplines",
    href: "/disciplines",
    icon: Target,
    accent: "#ea7c16",
    gridColumns: 3 as const,
    historyDefaultSize: { w: 3, h: 2 },
    plannerDefaultSize: { w: 3, h: 1 },
    entityDefaultSize: { w: 1, h: 1 },
    entities: disciplines.map((discipline) => ({
      id: discipline.id,
      name: discipline.name,
      href: `/disciplines/${discipline.id}`,
      description: discipline.description,
      completion: latest[discipline.id]?.value ?? 0,
      itemCount: discipline.level ?? 1,
      itemLabel: "Level",
      secondaryValue: `${discipline.currentXp ?? 0}/${discipline.maxXp ?? 100}`,
      secondaryLabel: "XP",
      onDelete: () => deleteDiscipline.mutate(discipline.id),
    })),
    history: history as LearningHistoryPoint[],
    historySeries: series,
    historyLabel: "Discipline history",
  };

  return (
    <LearningModuleDashboard
      title="Disciplines"
      description="Skills, deliberate practice and the sessions that move each discipline forward."
      config={config}
      isLoading={isLoading}
      actions={<CreateDisciplineDialog />}
      empty={
        <div className="rounded-[22px] border border-dashed p-12 text-center">
          <Target className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No disciplines tracked</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a discipline to start deliberate practice.</p>
          <div className="mt-5"><CreateDisciplineDialog /></div>
        </div>
      }
      storageVersion={4}
    />
  );
}
