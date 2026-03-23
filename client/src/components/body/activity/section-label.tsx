interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <h3 className={`text-[11px] font-medium tracking-wider text-muted-foreground mb-3 ${className}`}>
      {children}
    </h3>
  );
}
