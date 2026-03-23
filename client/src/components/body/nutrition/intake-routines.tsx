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
        <h2 className="text-xl font-bold tracking-tight">Daily Intake Routines</h2>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Auto-Synced</span>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden divide-y">
        {routineList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-muted-foreground/60 text-sm">No routines configured.</p>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-purple-500">Configure Routines</Button>
          </div>
        ) : (
          routineList.map(r => {
            const isTaken = checkedIds.has(r.id);
            
            return (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl border ${isTaken ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-muted/50 border-border/50 text-muted-foreground/40"}`}>
                    {r.type === "medication" ? <Pill className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
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
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => toggleMutation.mutate(r.id)}
                  className={`h-10 w-10 rounded-full transition-all ${
                    isTaken 
                      ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" 
                      : "text-muted-foreground/20 hover:text-purple-500 hover:bg-purple-500/10"
                  }`}
                >
                  {isTaken ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
