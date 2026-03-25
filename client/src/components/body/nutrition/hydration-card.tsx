import React from "react";
import { Droplets, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Link } from "wouter";

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
        mealName: "Water",
        mealType: "water",
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
    <div className="bg-card border-border/60 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow shadow-sm">
      <Link href="/body/nutrition/metric/water">
        <div className="flex justify-between items-start cursor-pointer group">
          <div className="space-y-1">
            <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-blue-500">Hydration</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black tracking-tight tabular-nums">{waterAmount}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">/ {waterGoal} ml</span>
            </div>
          </div>
          <div className="text-right">
             <span className="text-xs font-mono font-black text-blue-500/50 tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>
      </Link>

      <div className="mt-6 space-y-4">
        {/* Fill Bar */}
        <Link href="/body/nutrition/metric/water">
          <div className="h-6 bg-blue-500/10 rounded-lg overflow-hidden border border-blue-500/20 relative cursor-pointer group">
            <div 
              className="h-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Water Ripple Layer */}
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#fff,transparent)] group-hover:opacity-30 transition-opacity" />
            </div>
          </div>
        </Link>

        {/* Quick Add Pills */}
        <div className="flex gap-2 flex-wrap">
          {[250, 500, 750].map(amt => (
            <button
              key={amt}
              onClick={() => addMutation.mutate(amt)}
              className="h-7 px-3 rounded-full border border-border text-[10px] font-medium text-muted-foreground bg-transparent hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 transition-colors"
            >
              +{amt}ml
            </button>
          ))}
          <button
            className="h-7 px-3 rounded-full border border-dashed border-border text-[10px] font-medium text-muted-foreground/50 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 transition-colors flex items-center gap-1"
            onClick={() => {/* To be integrated with Log Modal */}}
          >
            <Plus className="w-3 h-3" /> Other
          </button>
        </div>
      </div>
    </div>
  );
}
