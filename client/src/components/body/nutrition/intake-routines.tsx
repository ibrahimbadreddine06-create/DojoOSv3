import React from "react";
import { CheckCircle2, Circle, Pill, Zap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { type IntakeRoutine, type IntakeRoutineCheckin } from "@shared/schema";
import { SectionHeader } from "../section-header";

interface IntakeRoutinesProps {
  date: string;
}

export function IntakeRoutines({ date }: IntakeRoutinesProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: routines, isLoading: routinesLoading } = useQuery<IntakeRoutine[]>({
    queryKey: ["/api/intake-routines"],
  });

  const { data: checkins, isLoading: checkinsLoading } = useQuery<IntakeRoutineCheckin[]>({
    queryKey: [`/api/intake-routine-checkins/${date}`],
  });

  const toggleMutation = useMutation({
    mutationFn: async (routineId: string) => {
      await apiRequest("POST", "/api/intake-routine-checkins", { routineId, date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/intake-routine-checkins/${date}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/intake-logs/${date}`] });
    }
  });

  if (routinesLoading || checkinsLoading) return <div className="h-40 bg-card border rounded-xl animate-pulse" />;

  const routineList = routines || [];
  const checkedIds = new Set(checkins?.map(c => c.routineId) || []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline px-1">
        <div className="space-y-0.5">
          <SectionHeader title="Daily Intake Routines" kicker="Cadence" className="mb-0" />
          <p className="text-[9px] text-muted-foreground/40 font-medium tracking-wider uppercase">Auto-synced</p>
        </div>
        <button 
          onClick={() => navigate("/body/setup")}
          className="text-[10px] text-purple-500/70 hover:text-purple-500 transition-colors font-medium"
        >
          Configure →
        </button>
      </div>

      <div className="bg-card border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
        {routineList.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground/50">No routines configured.</p>
            <button className="text-[10px] border border-border rounded-full px-3 py-1 text-muted-foreground hover:text-purple-500 hover:border-purple-500/40 transition-colors font-medium">
              Add routine
            </button>
          </div>
        ) : (
          routineList.map(r => {
            const isTaken = checkedIds.has(r.id);
            const statusColor = r.type === "medication" ? "bg-red-500" : r.type === "supplement" ? "bg-emerald-500" : "bg-blue-500";

            return (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`p-2 rounded-xl border ${isTaken ? "bg-muted/50 border-border/50 text-muted-foreground/30" : "bg-purple-500/5 text-purple-500/40 border-purple-500/10"}`}>
                      {r.type === "medication" ? <Pill className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    {/* Status Dot */}
                    <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-card ${statusColor}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold tracking-tight leading-tight ${isTaken ? "line-through text-muted-foreground/40" : ""}`}>
                      {r.name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/50 mt-0.5">
                      {r.dose} {r.unit} · {r.timeOfDay || "Anytime"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleMutation.mutate(r.id)}
                  className={`h-10 w-10 flex items-center justify-center rounded-full transition-all border-2 ${
                    isTaken
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                      : "bg-transparent border-muted hover:border-purple-500/40 text-muted-foreground/20 hover:text-purple-500"
                  }`}
                >
                  {isTaken ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 stroke-1.5" />}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="px-1 flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground/40 font-medium">
          Schedules sync to your daily planner automatically
        </span>
        <button 
          onClick={() => navigate("/body/setup")}
          className="text-[10px] text-purple-500/60 hover:text-purple-500 transition-colors font-medium"
        >
          Edit routines →
        </button>
      </div>
    </div>
  );
}
