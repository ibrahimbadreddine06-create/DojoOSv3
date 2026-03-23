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

  const briefText = intakeLogs.length > 0 
    ? (data?.brief || briefTextFallback) 
    : "No intake logged yet today. Tap '+ Log intake' to get started.";

  return (
    <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30 p-4 flex items-start gap-4 shadow-sm min-h-[80px]">
      <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40 mt-0.5 shrink-0">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-600/20" />
      </div>
      <div className="flex-1">
        {isLoading && intakeLogs.length > 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-amber-200/30" />
          </div>
        ) : (
          <p className="text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
            {briefText}
          </p>
        )}
      </div>
    </div>
  );
}

const briefTextFallback = "Analyzing your nutrition data...";
