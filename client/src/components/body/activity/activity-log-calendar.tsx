import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay, isToday } from "date-fns";
import { SectionHeader } from "../section-header";
import type { Workout, WorkoutPreset } from "@shared/schema";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityLogCalendar(rootProps: React.HTMLAttributes<HTMLDivElement>) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: workouts } = useQuery<Workout[]>({ queryKey: ["/api/workouts"] });
  const { data: presets } = useQuery<WorkoutPreset[]>({ queryKey: ["/api/workout-presets"] });
  const { data: activityLogs } = useQuery<any[]>({ queryKey: ["/api/activity-logs"] });

  // Build map of dates → activity count
  const activityCountMap = useMemo(() => {
    const map = new Map<string, number>();
    workouts?.forEach((w) => {
      if (w.date) {
        const d = format(new Date(w.date), "yyyy-MM-dd");
        map.set(d, (map.get(d) || 0) + 1);
      }
    });
    activityLogs?.forEach((l: any) => {
      if (l.loggedAt) {
        const d = format(new Date(l.loggedAt), "yyyy-MM-dd");
        map.set(d, (map.get(d) || 0) + 1);
      }
    });
    return map;
  }, [workouts, activityLogs]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Offset: Monday = 0 ... Sunday = 6
  const startDayOffset = (getDay(monthStart) + 6) % 7;

  // Selected day data
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const dayWorkouts = workouts?.filter((w) =>
    w.date && format(new Date(w.date), "yyyy-MM-dd") === selectedDateStr
  ) || [];
  const dayActivities = activityLogs?.filter((l: any) =>
    l.loggedAt && format(new Date(l.loggedAt), "yyyy-MM-dd") === selectedDateStr
  ) || [];

  return (
    <Card {...rootProps} className={`h-full w-full overflow-visible ${rootProps.className ?? ""}`}>
      {rootProps.children}
      <SectionHeader title="Activity log" kicker="Chronology" />
      <CardContent className="h-full p-0">
        <div className="grid h-full grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Left: Calendar */}
            <div className="min-h-0 overflow-hidden p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {/* Empty cells for offset */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}
                {daysInMonth.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const count = activityCountMap.get(dateStr) || 0;
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      className={`relative h-9 flex flex-col items-center justify-center rounded-lg text-xs transition-colors
                        ${isSelected ? "bg-primary text-primary-foreground" : isCurrentDay ? "bg-muted" : "hover:bg-muted/50"}
                        ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/40" : ""}
                      `}
                    >
                      {day.getDate()}
                      {count > 0 && (
                        <div className="flex gap-0.5 absolute -bottom-0.5">
                          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-red-500" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Presets row */}
              {presets && presets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border">
                  {presets.map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-[10px] cursor-pointer hover:bg-secondary/80">
                      {p.name}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px] cursor-pointer border-dashed">
                    <Plus className="w-2.5 h-2.5 mr-0.5" /> New
                  </Badge>
                </div>
              )}
            </div>

            {/* Right: Day detail */}
            <div className="min-h-0 overflow-y-auto p-4">
              <h4 className="text-sm font-semibold mb-3">{format(selectedDate, "EEEE, MMM d")}</h4>

              {dayWorkouts.length === 0 && dayActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No activities logged</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Use a preset above or tap + Log activity</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayWorkouts.map((w) => (
                    <WorkoutDayCard key={w.id} workout={w} />
                  ))}
                  {dayActivities.map((a: any) => (
                    <Card key={a.id} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="text-sm font-medium">{a.activityName || a.activityType}</div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {a.durationMinutes && <span>{a.durationMinutes} min</span>}
                          {a.caloriesBurned && <span>{a.caloriesBurned} kcal</span>}
                          {a.distanceKm && <span>{a.distanceKm} km</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs gap-1.5">
                <Plus className="w-3 h-3" /> Add activity to this day
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutDayCard({ workout }: { workout: Workout }) {
  const [expanded, setExpanded] = useState(false);

  const { data: exercises } = useQuery<any[]>({
    queryKey: [`/api/workouts/detail/${workout.id}`],
    enabled: expanded,
  });

  return (
    <Card className="bg-muted/30">
      <CardContent
        className="p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{workout.title}</div>
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              {workout.startTime && (
                <span>{format(new Date(workout.startTime), "HH:mm")}</span>
              )}
              {workout.completed && <Badge variant="secondary" className="text-[9px] h-4">Completed</Badge>}
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>

        {expanded && exercises && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {(exercises as any)?.exercises?.map((ex: any) => (
              <div key={ex.id} className="text-xs">
                <span className="font-medium">{ex.exercise?.name || "Exercise"}</span>
                <div className="text-muted-foreground mt-0.5">
                  {ex.sets?.map((s: any, i: number) => (
                    <span key={s.id}>
                      {i > 0 && " · "}
                      {s.weight}kg × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
