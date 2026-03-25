import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  kicker?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, kicker, className, children }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
      <div>
        {kicker && <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{kicker}</p>}
        {kicker ? (
          <h2 className="text-xl font-bold mt-1 tracking-tight">{title}</h2>
        ) : (
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
