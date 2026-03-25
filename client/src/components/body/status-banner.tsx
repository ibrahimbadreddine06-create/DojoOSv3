import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusBannerProps {
  title?: string;
  description: string | React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "error" | "info" | "success";
  className?: string;
}

export function StatusBanner({
  title,
  description,
  icon: Icon,
  variant = "default",
  className
}: StatusBannerProps) {
  const variantStyles = {
    default: "bg-muted/30 border-border/40 text-muted-foreground",
    warning: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 text-amber-900 dark:text-amber-200",
    error: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-900 dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30 text-blue-900 dark:text-blue-200",
    success: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-200"
  };

  return (
    <Alert 
      className={cn(
        "rounded-2xl p-5 border shadow-none", // shadow-none to stay clean, or shadow-sm if desired
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-4 w-full">
        {Icon && (
          <div className="mt-0.5 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 space-y-1">
          {title && <AlertTitle className="text-sm font-bold tracking-tight">{title}</AlertTitle>}
          <AlertDescription className="text-sm leading-relaxed opacity-90">
            {description}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
