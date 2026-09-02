import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Archive, GraduationCap } from "lucide-react";
import { AddCourseDialog } from "@/components/dialogs/add-course-dialog";
import { LearningModuleDashboard } from "@/components/learning/learning-module-dashboard";
import type { LearningHistoryPoint } from "@/components/learning/learning-module-widgets";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface Course {
  id: string;
  name: string;
  description?: string;
  semester?: string;
  archived: boolean;
  lessons?: { id: string; completed: boolean }[];
  averageGrade?: string;
}

const COLORS = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#1e40af", "#1e3a8a"];

export default function Studies() {
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const { data: courses = [], isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: metricsData = [] } = useQuery<any[]>({ queryKey: ["/api/course-metrics-all"] });
  const deleteCourse = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/course-metrics-all"] });
    },
  });
  const archiveCourse = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      apiRequest("PATCH", `/api/courses/${id}`, { archived }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses"] }),
  });

  const visibleCourses = courses.filter((course) => (
    course.archived === showArchived &&
    (selectedSemester === "all" || course.semester === selectedSemester)
  ));
  const semesters = Array.from(new Set(courses.flatMap((course) => course.semester ? [course.semester] : [])));

  const latest = useMemo(() => {
    const values: Record<string, { value: number; date: string }> = {};
    for (const metric of metricsData) {
      if (!values[metric.courseId] || metric.date > values[metric.courseId].date) {
        values[metric.courseId] = { value: Number.parseFloat(metric.completion) || 0, date: metric.date };
      }
    }
    return values;
  }, [metricsData]);

  const { history, series } = useMemo(() => {
    const names = courses.map((course) => course.name);
    const dates = new Map<string, Record<string, number>>();
    for (const metric of metricsData) {
      if (!names.includes(metric.courseName)) continue;
      if (!dates.has(metric.date)) dates.set(metric.date, {});
      dates.get(metric.date)![metric.courseName] = Number.parseFloat(metric.completion) || 0;
    }
    return {
      history: Array.from(dates.keys()).sort().map((date) => ({
        date: format(parseISO(date), "MMM d"),
        fullDate: date,
        ...dates.get(date),
      })),
      series: names.map((name, index) => ({ key: name, label: name, color: COLORS[index % COLORS.length] })),
    };
  }, [courses, metricsData]);

  const config = {
    kind: "studies" as const,
    label: "Studies",
    href: "/studies",
    icon: GraduationCap,
    accent: "#2563eb",
    gridColumns: 4 as const,
    historyDefaultSize: { w: 4, h: 2 },
    plannerDefaultSize: { w: 4, h: 1 },
    entityDefaultSize: { w: 2, h: 1 },
    entities: courses.map((course) => {
      const lessons = course.lessons ?? [];
      const completedLessons = lessons.filter((lesson) => lesson.completed).length;
      return {
        id: course.id,
        name: course.name,
        href: `/studies/${course.id}`,
        description: course.description,
        completion: latest[course.id]?.value ?? (lessons.length ? completedLessons / lessons.length * 100 : 0),
        itemCount: lessons.length,
        itemLabel: "Lessons",
        secondaryValue: course.averageGrade ?? "—",
        secondaryLabel: "Average grade",
        archived: course.archived,
        onDelete: () => deleteCourse.mutate(course.id),
        onArchive: () => archiveCourse.mutate({ id: course.id, archived: !course.archived }),
      };
    }),
    history: history as LearningHistoryPoint[],
    historySeries: series,
    historyLabel: "Study history",
  };

  return (
    <LearningModuleDashboard
      title="Studies"
      description="Courses, academic progress and the study blocks reserved for today."
      config={config}
      isLoading={isLoading}
      actions={<AddCourseDialog defaultSemester={selectedSemester !== "all" ? selectedSemester : undefined} />}
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-44 rounded-full"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.map((semester) => <SelectItem key={semester} value={semester}>{semester}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={showArchived ? "secondary" : "outline"}
            className="rounded-full"
            onClick={() => setShowArchived((value) => !value)}
          >
            <Archive className="mr-2 size-4" />
            {showArchived ? "Archived courses" : "Show archived"}
          </Button>
        </div>
      }
      empty={
        <div className="rounded-[22px] border border-dashed p-12 text-center">
          <GraduationCap className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">{showArchived ? "No archived courses" : "No courses yet"}</h2>
          {!showArchived ? <div className="mt-5"><AddCourseDialog /></div> : null}
        </div>
      }
      storageVersion={4}
      visibleEntityIds={visibleCourses.map((course) => course.id)}
    />
  );
}
