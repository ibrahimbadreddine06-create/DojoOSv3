import React from "react";
import { Droplets, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface HydrationCardProps {
  waterAmount: number;
  waterGoal?: number;
}

export function HydrationCard({ waterAmount, waterGoal = 3000 }: HydrationCardProps) {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const progress = Math.min(100, (waterAmount / waterGoal) * 100);

  const addMutation = useMutation({
    mutationFn: async (amount: number) => {
      await apiRequest("POST", "/api/intake-logs", {
        name: "Water",
        type: "water",
        date: today,
        water: amount,
        calories: 0, protein: 0, carbs: 0, fats: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/intake-logs/${today}`] });
    }
  });

  return (
    <div className="bg-card border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-500">
            <Droplets className="w-4 h-4" />
            <h3 className="text-sm font-black uppercase tracking-widest">Hydration</h3>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tighter">{waterAmount}</span>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">/ {waterGoal} ml</span>
          </div>
        </div>
        <div className="text-right">
           <span className="text-xs font-mono font-black text-blue-500/50">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Fill Bar */}
        <div className="h-6 bg-blue-500/10 rounded-lg overflow-hidden border border-blue-500/20 relative">
          <div 
            className="h-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Water Ripple Layer */}
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#fff,transparent)]" />
          </div>
        </div>

        {/* Quick Add Pills */}
        <div className="grid grid-cols-4 gap-2">
          {[250, 500, 750].map(amt => (
            <Button 
              key={amt}
              variant="outline" 
              size="sm" 
              onClick={() => addMutation.mutate(amt)}
              className="h-8 text-[10px] font-black hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 font-mono"
            >
              +{amt}
            </Button>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 p-0 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30"
            onClick={() => {/* To be integrated with Log Modal */}}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
