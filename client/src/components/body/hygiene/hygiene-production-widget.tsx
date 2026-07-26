import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TbCheck, TbPlus, TbSparkles } from "react-icons/tb";
import { bodyLocalDateKey, EWidgetCard } from "@/components/body/e-widget-card";
import { defineWidget, type WidgetSize } from "@/components/body/module-grid";
import { apiRequest } from "@/lib/queryClient";

type Routine = {
  id: string; name: string; completed: boolean; date: string;
  frequency: "daily" | "weekly" | "monthly" | null; streak: number;
};
const sizes = [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 1, h: 2 }, { w: 2, h: 2 }] as const;
const today = bodyLocalDateKey;

function RoutinesCard({ size, accentColor }: { size: WidgetSize; accentColor?: string }) {
  const client = useQueryClient();
  const query = useQuery<Routine[]>({ queryKey: ["/api/hygiene-routines"] });
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hygiene-routines", {
      name: name.trim(), date: today(), frequency: "daily", completed: false,
    }),
    onSuccess: () => { setName(""); client.invalidateQueries({ queryKey: ["/api/hygiene-routines"] }); },
  });
  const complete = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/hygiene-routines/${id}/complete`, {}),
    onSuccess: () => client.invalidateQueries({ queryKey: ["/api/hygiene-routines"] }),
  });
  const routines = query.data ?? [];
  const due = routines.filter((item) => !item.completed);
  return (
    <EWidgetCard size={size} accentColor={accentColor}>
      <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}>
        <header className="flex items-start justify-between">
          <div><h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">Routines</h3><p className="mt-1 text-[11px] text-[#747d89]">Hygiene & Looks</p></div>
          <TbSparkles className="h-6 w-6 text-[var(--widget-accent)]" />
        </header>
        <div className="min-h-0 overflow-visible">
          {due.length ? (
            <div className="flex h-full flex-col justify-center gap-2">
              {due.slice(0, size.h > 1 ? 5 : 3).map((routine) => (
                <button key={routine.id} type="button" onClick={(e) => { e.stopPropagation(); complete.mutate(routine.id); }}
                  className="flex items-center justify-between rounded-lg border border-[#e4e7eb] bg-white px-2.5 py-2 text-left text-[11px] font-medium hover:border-[var(--widget-accent)]">
                  <span className="truncate">{routine.name}</span><TbCheck className="ml-2 h-4 w-4 text-[var(--widget-accent)]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center"><strong className="text-[22px] font-semibold leading-none tracking-[-.035em]">All clear</strong><span className="mt-2 text-[11px] text-[#747d89]">Add whatever matters to your routine.</span></div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add anything" aria-label="New routine name" className="min-w-0 flex-1 rounded-lg border border-[#e4e7eb] px-2.5 py-1.5 text-[11px] outline-none focus:border-[var(--widget-accent)]" />
          <button type="button" aria-label="Add routine" disabled={!name.trim() || create.isPending} onClick={(e) => { e.stopPropagation(); create.mutate(); }} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--widget-accent)] text-white disabled:opacity-40"><TbPlus className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </EWidgetCard>
  );
}

function RoutineProgressCard({ size, accentColor }: { size: WidgetSize; accentColor?: string }) {
  const query = useQuery<Routine[]>({ queryKey: ["/api/hygiene-routines"] });
  const routines = query.data ?? [];
  const completed = routines.filter((item) => item.completed).length;
  const visible = routines.slice(0, size.h > 1 ? 12 : size.w > 1 ? 10 : 8);
  return <EWidgetCard size={size} accentColor={accentColor}>
    <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}>
      <header className="flex items-start justify-between"><div><h3 className="text-[15px] font-semibold leading-none tracking-[-.015em]">Routines</h3><p className="mt-1 text-[11px] text-[#747d89]">Hygiene & Looks</p></div><TbSparkles className="h-6 w-6 text-[var(--widget-accent)]" /></header>
      <div className={`grid h-full min-h-0 ${size.w > size.h ? "grid-cols-[1fr_auto] items-center gap-6" : "grid-rows-[1fr_auto] gap-3"}`}>
        <div className="grid grid-cols-4 gap-2 self-center">
          {visible.length ? visible.map((routine) => <div key={routine.id} title={routine.name} className={`aspect-square rounded-[8px] ${routine.completed ? "bg-[var(--widget-accent)]" : "bg-[var(--widget-soft)]"}`} />) : <span className="col-span-4 text-[12px] text-[#747d89]">No routines configured</span>}
        </div>
        <strong className="text-[28px] font-semibold leading-none tracking-[-.045em] tabular-nums">{routines.length ? `${completed}/${routines.length}` : "—"}</strong>
      </div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Today’s field</span><span className="font-medium">{routines.length - completed} remaining</span></div>
    </div>
  </EWidgetCard>;
}

export const productionRoutinesWidget = defineWidget({
  id: "hygiene.routines", label: "Routines", icon: TbSparkles, defaultW: 1, defaultH: 1, defaultAccentColor: "#db2777",
  visualizations: [
    { id: "progress-field", label: "Progress field", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
    { id: "due", label: "Due routines", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
  ],
  render: ({ size, accentColor, visualizationId }) => visualizationId === "progress-field" ? <RoutineProgressCard size={size} accentColor={accentColor} /> : <RoutinesCard size={size} accentColor={accentColor} />,
});

function ConsistencyCard({ size, accentColor, variant }: { size: WidgetSize; accentColor?: string; variant: string }) {
  const query = useQuery<Routine[]>({ queryKey: ["/api/hygiene-routines"] });
  const routines = query.data ?? [];
  const completed = routines.filter((item) => item.completed).length;
  const ratio = routines.length ? completed / routines.length : null;
  const best = Math.max(0, ...routines.map((item) => item.streak ?? 0));
  if (variant === "streak-landscape") {
    const visible = routines.slice(0, size.h > 1 ? 8 : size.w > 1 ? 6 : 4);
    const max = Math.max(...visible.map((item) => item.streak ?? 0), 1);
    return <EWidgetCard size={size} accentColor={accentColor}>
      <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}>
        <header className="flex items-start justify-between"><div><h3 className="text-[15px] font-semibold leading-none">Routine Consistency</h3><p className="mt-1 text-[11px] text-[#747d89]">Configured routines</p></div><TbSparkles className="h-6 w-6 text-[var(--widget-accent)]" /></header>
        <div className="flex h-full min-h-0 items-end gap-2">{visible.length ? visible.map((routine, index) => <div key={routine.id} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="flex min-h-0 flex-1 items-end"><div className="w-full rounded-[8px] bg-[var(--widget-accent)]" style={{ height: `${Math.max(12, (routine.streak ?? 0) / max * 100)}%`, opacity: .5 + index / Math.max(1, visible.length - 1) * .5 }} /></div><span className="mt-1.5 truncate text-center text-[9px] text-[#747d89]">{routine.name}</span></div>) : <span className="self-center text-[12px] text-[#747d89]">No routines configured</span>}</div>
        <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Current streaks</span><strong className="font-semibold tabular-nums">Best {best}</strong></div>
      </div>
    </EWidgetCard>;
  }
  return <EWidgetCard size={size} accentColor={accentColor}>
    <div className="grid h-full min-h-0 gap-[15px]" style={{ gridTemplateRows: size.h > size.w ? "33px minmax(0,1fr) 54px" : "33px minmax(0,1fr) 33px" }}>
      <header className="flex items-start justify-between"><div><h3 className="text-[15px] font-semibold leading-none">Routine Consistency</h3><p className="mt-1 text-[11px] text-[#747d89]">Configured routines</p></div><TbSparkles className="h-6 w-6 text-[var(--widget-accent)]" /></header>
      <div className="flex h-full flex-col justify-center"><strong className="text-[36px] font-semibold leading-none tracking-[-.055em] tabular-nums">{ratio === null ? "—" : `${Math.round(ratio * 100)}%`}</strong><span className="mt-2 text-[11px] text-[#747d89]">{ratio === null ? "No routines configured" : `${completed} of ${routines.length} complete`}</span></div>
      <div className="flex items-end justify-between text-[11px]"><span className="text-[#747d89]">Current records</span><span className="font-medium">Best streak {best}</span></div>
    </div>
  </EWidgetCard>;
}
export const productionRoutineConsistencyWidget = defineWidget({
  id: "hygiene.routine_consistency", label: "Routine Consistency", icon: TbSparkles, defaultW: 1, defaultH: 1, defaultAccentColor: "#7c3aed",
  visualizations: [
    { id: "streak-landscape", label: "Streak landscape", defaultSize: { w: 1, h: 1 }, allowedSizes: [...sizes] },
    { id: "completion", label: "Completion", allowedSizes: [...sizes] },
  ],
  render: ({ size, accentColor, visualizationId }) => <ConsistencyCard size={size} accentColor={accentColor} variant={visualizationId} />,
});
