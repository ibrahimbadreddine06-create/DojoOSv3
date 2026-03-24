import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface AiBriefCardProps {
  dailyData: any;
}

export function AiBriefCard({ dailyData }: AiBriefCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/activity/ai-brief", JSON.stringify(dailyData)],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/activity/ai-brief", { dailyData });
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });

  const briefText = data?.brief || "No activity logged yet today. Tap '+ Log activity' to get started.";

  return (
    <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30 px-5 py-4 flex items-start gap-3">
      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      {isLoading ? (
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full bg-amber-200/30" />
          <Skeleton className="h-4 w-3/4 bg-amber-200/30" />
        </div>
      ) : (
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          {briefText}
        </p>
      )}
    </div>
  );
}
