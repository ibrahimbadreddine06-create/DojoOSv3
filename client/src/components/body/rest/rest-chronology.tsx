import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Moon, Sun, Coffee, Wind, BookOpen, Pen, AlertCircle } from "lucide-react";
import { SectionHeader } from "../section-header";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  sleep: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
  wake: <Sun className="w-3.5 h-3.5 text-amber-400" />,
  nap: <Coffee className="w-3.5 h-3.5 text-violet-400" />,
  winddown: <Wind className="w-3.5 h-3.5 text-blue-400" />,
  meditation: <BookOpen className="w-3.5 h-3.5 text-teal-400" />,
  manual: <Pen className="w-3.5 h-3.5 text-muted-foreground" />,
  symptom: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
};

interface ChronologyEvent {
  id: string | number;
  icon: React.ReactNode;
  label: string;
  time: string;
  sub?: string;
}

function deriveEvents(logs: any[]): ChronologyEvent[] {
  return logs.flatMap((log) => {
    const events: ChronologyEvent[] = [];
    const date = log.date ? format(parseISO(log.date), "EEE, MMM d") : "";

    if (log.actualHours) {
      events.push({
        id: `${log.id}-sleep`,
        icon: EVENT_ICONS.sleep,
        label: "Sleep detected",
        time: date,
        sub: `${parseFloat(log.actualHours).toFixed(1)}h actual`,
      });
    }

    if (log.notes) {
      events.push({
        id: `${log.id}-note`,
        icon: EVENT_ICONS.manual,
        label: "Manual note",
        time: date,
        sub: log.notes.slice(0, 60) + (log.notes.length > 60 ? "…" : ""),
      });
    }

    return events;
  });
}

export function RestChronology() {
  const { data: allLogs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sleep-logs/all"],
  });

  const events = deriveEvents(allLogs?.slice(0, 7) || []);

  return (
    <div className="space-y-4">
      <SectionHeader title="Chronology" kicker="Timeline" />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 border border-dashed border-border/50 rounded-2xl">
          <Moon className="w-7 h-7 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60">No rest events logged yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border/50" />

          <div className="space-y-1">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 pl-2">
                {/* Dot */}
                <div className="w-6 h-6 rounded-full bg-card border border-border/60 flex items-center justify-center shrink-0 z-10 mt-2.5">
                  {event.icon}
                </div>

                {/* Card */}
                <div className="flex-1 bg-card border border-border/60 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm group hover:shadow-md transition-shadow cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{event.label}</p>
                    {event.sub && (
                      <p className="text-sm font-medium text-muted-foreground/90 truncate mt-0.5">{event.sub}</p>
                    )}
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground/40 shrink-0 tabular-nums">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
