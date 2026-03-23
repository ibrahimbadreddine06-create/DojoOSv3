import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { type IntakeLog, type BodyProfile } from "@shared/schema";

interface NutritionAiBriefProps {
  intakeLogs: IntakeLog[];
  bodyProfile?: BodyProfile;
}

export function NutritionAiBrief({ intakeLogs, bodyProfile }: NutritionAiBriefProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/nutrition/ai-brief", intakeLogs.length, !!bodyProfile],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/nutrition/ai-brief", { 
        intakeLogs, 
        bodyProfile 
      });
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  });

  const briefText = data?.brief || "No intake logged yet today. Tap '+ Log intake' to get started.";

  return (
    <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30 p-4 flex items-start gap-3 shadow-sm min-h-[100px]">
      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 mt-0.5 shrink-0">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 dark:text-amber-400/70">AI Nutrition Specialist</span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-amber-200/30" />
            <Skeleton className="h-4 w-3/4 bg-amber-200/30" />
          </div>
        ) : (
          <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed italic">
            "{briefText}"
          </p>
        )}
      </div>
    </div>
  );
}
