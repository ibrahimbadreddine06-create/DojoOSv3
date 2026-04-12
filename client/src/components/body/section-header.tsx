import React from "react";

interface SectionHeaderProps {
  title: string;
  kicker?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ children }: SectionHeaderProps) {
  if (!children) return null;
  return <div className="mb-3 flex justify-end">{children}</div>;
}
