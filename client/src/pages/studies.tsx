import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, GraduationCap, BookOpen } from "lucide-react";

export default function Studies() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: lessons } = useQuery<any[]>({
    queryKey: ["/api/courses", selectedCourse, "lessons"],
    enabled: !!selectedCourse,
  });

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-studies-title">
              Studies
            </h1>
            <p className="text-muted-foreground">
              Track courses, lessons, and academic performance
            </p>
          </div>
          <Button size="sm" data-testid="button-add-course">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const completedLessons = course.lessons?.filter((l: any) => l.completed).length || 0;
              const totalLessons = course.lessons?.length || 0;
              const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

              return (
                <Card
                  key={course.id}
                  className="hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => setSelectedCourse(course.id)}
                  data-testid={`card-course-${course.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        {course.description && (
                          <CardDescription className="text-sm line-clamp-2">
                            {course.description}
                          </CardDescription>
                        )}
                      </div>
                      <GraduationCap className="w-5 h-5 text-chart-1" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono font-medium">
                          {completedLessons}/{totalLessons} lessons
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
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
            <h3 className="text-lg font-medium mb-2">No courses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your academic courses
            </p>
            <Button data-testid="button-create-course">
              Add Course
            </Button>
          </div>
        )}

        {selectedCourse && lessons && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lessons</CardTitle>
                  <CardDescription>Course curriculum and progress</CardDescription>
                </div>
                <Button size="sm" data-testid="button-add-lesson">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <Card key={lesson.id} data-testid={`card-lesson-${lesson.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm font-mono text-muted-foreground">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="space-y-1">
                            <CardTitle className="text-base">{lesson.title}</CardTitle>
                            {lesson.content && (
                              <CardDescription className="text-sm line-clamp-1">
                                {lesson.content}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <Badge variant={lesson.completed ? "default" : "outline"}>
                          {lesson.completed ? "Completed" : "Not Started"}
                        </Badge>
                      </div>
                    </CardHeader>
                    {lesson.exercises && lesson.exercises.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          <span>{lesson.exercises.length} exercises</span>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No lessons yet. Add lessons to build your course curriculum.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
