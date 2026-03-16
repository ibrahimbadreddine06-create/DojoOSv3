import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Archive, ArchiveRestore, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodaySessions } from "@/components/today-sessions";
import { AddCourseDialog } from "@/components/dialogs/add-course-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Legend, CartesianGrid, Brush } from "recharts";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  name: string;
  description?: string;
  semester?: string;
  archived: boolean;
  lessons?: { id: string; completed: boolean }[];
  averageGrade?: string;
}

interface MetricData {
  courseId: string;
  courseName: string;
  date: string;
  completion: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 70%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 50%)",
];

export default function Studies() {
  const [, navigate] = useLocation();
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: metricsData } = useQuery<any[]>({
    queryKey: ["/api/course-metrics-all"],
  });

  const latestMetrics = useMemo(() => {
    if (!metricsData) return {};
    const latest: Record<string, { completion: number; importance: number }> = {};
    for (const m of metricsData) {
      if (!latest[m.courseId] || m.date > (metricsData.find(x => x.courseId === m.courseId && latest[m.courseId])?.date || '')) {
        latest[m.courseId] = { completion: parseFloat(m.completion), importance: m.importance || 0 };
      }
    }
    return latest;
  }, [metricsData]);

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      return await apiRequest("PATCH", `/api/courses/${id}`, { archived });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course updated" });
    },
    onError: () => {
      toast({ title: "Failed to update course", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/courses"] });
      const previous = queryClient.getQueryData(["/api/courses"]);
      queryClient.setQueryData(["/api/courses"], (old: any[]) =>
        old.filter((course) => course.id !== id)
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/course-metrics-all"] });
      toast({ title: "Course deleted" });
    },
    onError: (err, id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/courses"], context.previous);
      }
      toast({ title: "Failed to delete course", variant: "destructive" });
    },
  });

  const semesters = courses
    ? Array.from(new Set(courses.filter(c => c.semester).map(c => c.semester!)))
    : [];

  const filteredCourses = courses?.filter(course => {
    if (!showArchived && course.archived) return false;
    if (showArchived && !course.archived) return false;
    if (selectedSemester !== "all" && course.semester !== selectedSemester) return false;
    return true;
  }) || [];

  const { chartData, chartConfig } = useMemo(() => {
    if (!courses) {
      return { chartData: [], chartConfig: {} };
    }

    // Create a set of currently existing course names
    const existingCourseNames = new Set(courses.map(c => c.name));
    const courseNamesList = Array.from(existingCourseNames).sort();

    const dateMap = new Map<string, Record<string, number>>();

    // Always initialize with at least the last 14 days so the Brush scrollbar (arrows) can render
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {});
    }

    // Add all metrics data if available
    if (metricsData && metricsData.length > 0) {
      for (const m of metricsData) {
        if (!existingCourseNames.has(m.courseName)) continue;
        const completionVal = parseFloat(m.completion);
        if (isNaN(completionVal)) continue;
        if (!dateMap.has(m.date)) {
          dateMap.set(m.date, {});
        }
        dateMap.get(m.date)![m.courseName] = completionVal;
      }
    }

    const sortedDates = Array.from(dateMap.keys()).sort();

    // Build continuous data with all courses on each date (fill gaps with previous value or 0)
    const finalCourseNamesList = courseNamesList;
    const data = sortedDates.map((date, idx) => {
      const dayData: Record<string, string | number> = {
        date: format(parseISO(date), "MMM d"),
        fullDate: date,
      };

      for (const courseName of finalCourseNamesList) {
        // Get value for this date, or use previous value, or default to 0
        if (dateMap.get(date)?.[courseName] !== undefined) {
          dayData[courseName] = dateMap.get(date)![courseName];
        } else {
          // Find last known value
          let lastValue = 0;
          for (let i = idx - 1; i >= 0; i--) {
            if (dateMap.get(sortedDates[i])?.[courseName] !== undefined) {
              lastValue = dateMap.get(sortedDates[i])![courseName];
              break;
            }
          }
          dayData[courseName] = lastValue;
        }
      }
      return dayData;
    });

    const config: Record<string, { label: string; color: string }> = {};
    let colorIndex = 0;
    for (const name of finalCourseNamesList) {
      config[name] = {
        label: name,
        color: CHART_COLORS[colorIndex % CHART_COLORS.length],
      };
      colorIndex++;
    }

    return { chartData: data, chartConfig: config };
  }, [metricsData, courses]);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="text-studies-title">
              Studies
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track courses, lessons, and academic performance
            </p>
          </div>
          <AddCourseDialog defaultSemester={selectedSemester !== "all" ? selectedSemester : undefined} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Metrics</CardTitle>
            <CardDescription>Completion progress over time for each course</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-96 w-full aspect-auto">
              <LineChart data={chartData} margin={{ top: 12, right: 0, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  tick={{ fontSize: 12, textAnchor: 'start', dx: -8 }}
                  tickLine={false}
                  axisLine={false}
                  mirror={true}
                  width={1}
                  tickFormatter={(v) => `${v}%`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {Object.keys(chartConfig).map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={chartConfig[key].label}
                    stroke={chartConfig[key].color}
                    strokeWidth={2}
                    dot={{ fill: chartConfig[key].color, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="hsl(var(--primary) / 0.5)"
                  fill="transparent"
                  startIndex={Math.max(0, chartData.length - 14)}
                  endIndex={chartData.length - 1}
                  travellerWidth={0}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses" data-testid="tab-courses">
              Courses
            </TabsTrigger>
            <TabsTrigger value="linked-blocks" data-testid="tab-linked-blocks">
              Linked Time Blocks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-48" data-testid="select-semester-filter">
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                data-testid="button-toggle-archived"
              >
                <Archive className="w-4 h-4 mr-2" />
                {showArchived ? "Showing Archived" : "Show Archived"}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourses.map((course) => {
                  const completedLessons = course.lessons?.filter((l) => l.completed).length || 0;
                  const totalLessons = course.lessons?.length || 0;
                  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                  return (
                    <Card
                      key={course.id}
                      className={`hover-elevate active-elevate-2 cursor-pointer ${course.archived ? 'opacity-60' : ''}`}
                      onClick={() => navigate(`/studies/${course.id}`)}
                      data-testid={`card-course-${course.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{course.name}</CardTitle>
                              {course.archived && (
                                <Badge variant="secondary" className="text-xs">Archived</Badge>
                              )}
                            </div>
                            {course.description && (
                              <CardDescription className="text-sm line-clamp-2">
                                {course.description}
                              </CardDescription>
                            )}
                            {course.semester && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {course.semester}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-menu-${course.id}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => archiveMutation.mutate({ id: course.id, archived: !course.archived })}
                                  data-testid={`button-archive-${course.id}`}
                                >
                                  {course.archived ? (
                                    <>
                                      <ArchiveRestore className="w-4 h-4 mr-2" />
                                      Restore
                                    </>
                                  ) : (
                                    <>
                                      <Archive className="w-4 h-4 mr-2" />
                                      Archive
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm(`Delete "${course.name}"? This cannot be undone.`)) {
                                      deleteMutation.mutate(course.id);
                                    }
                                  }}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  data-testid={`button-delete-${course.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <GraduationCap className="w-5 h-5 text-chart-1" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress (Weighted)</span>
                            <span className="font-mono font-medium">
                              {latestMetrics[course.id]?.completion || 0}%
                            </span>
                          </div>
                          <Progress value={latestMetrics[course.id]?.completion || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Lessons</span>
                            <span className="font-mono font-medium">
                              {completedLessons}/{totalLessons}
                            </span>
                          </div>
                        </div>
                        {course.averageGrade && (
                          <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">Average Grade</span>
                            <span className="font-mono font-semibold">
                              {parseFloat(course.averageGrade).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {showArchived ? "No archived courses" : "No courses yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {showArchived
                    ? "Archive completed courses to see them here"
                    : "Start tracking your academic courses"
                  }
                </p>
                {!showArchived && <AddCourseDialog />}
              </div>
            )}
          </TabsContent>

          <TabsContent value="linked-blocks" className="space-y-4 mt-6">
            <TodaySessions module="studies" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

