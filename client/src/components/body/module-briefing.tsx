import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";

interface ModuleBriefingProps {
  title?: string;
  kicker?: string;
  content?: string;
  isLoading?: boolean;
  className?: string;
  accentColor?: string; // e.g. "bg-indigo-500/10"
}

export function ModuleBriefing({
  title = "Briefing",
  kicker = "Sensei AI",
  content,
  isLoading = false,
  className,
  accentColor = "bg-indigo-500/10",
  ...rootProps
}: ModuleBriefingProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rootProps} className={cn("flex h-full w-full flex-col bg-card rounded-2xl p-5 border border-border/60 shadow-sm relative overflow-hidden", className)}>
      {rootProps.children}
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-50", accentColor)} />
      <div className="mb-4 space-y-0.5">
        {kicker && (
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            accentColor.replace('bg-', 'text-').replace('/10', '')
          )}>
            {kicker}
          </p>
        )}
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
      </div>
      
      {isLoading ? (
        <div className="space-y-2 relative z-10">
          <Skeleton className="h-4 w-full opacity-50" />
          <Skeleton className="h-4 w-[90%] opacity-50" />
          <Skeleton className="h-4 w-[75%] opacity-50" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-foreground/80 relative z-10 font-medium">
          {content || "No briefing available for today yet. Keep up your routines to generate insights!"}
        </p>
      )}
    </div>
  );
}
