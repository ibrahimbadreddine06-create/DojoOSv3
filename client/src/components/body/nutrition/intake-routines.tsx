import React from "react";
import { CheckCircle2, Circle, Pill, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type IntakeRoutine, type IntakeRoutineCheckin } from "@shared/schema";

interface IntakeRoutinesProps {
  date: string;
}

export function IntakeRoutines({ date }: IntakeRoutinesProps) {
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
    <div className="space-y-4">
      <div className="flex justify-between items-baseline px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Daily Intake Routines</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Auto-Synced</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:bg-purple-500/10"
        >
          Configure
        </Button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden divide-y divide-border/50">
        {routineList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-muted-foreground/60 text-sm">No routines configured.</p>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-purple-500">Add Routine</Button>
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
                    <p className={`font-black tracking-tight ${isTaken ? "line-through text-muted-foreground/40" : ""}`}>
                      {r.name}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                      {r.dose} {r.unit} • {r.timeOfDay || "Anytime"}
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
    </div>
  );
}
