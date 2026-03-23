import React from "react";
import { type IntakeLog } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface FuelFingerprintProps {
  intakeLogs: IntakeLog[];
}

const CATEGORIES = [
  "Protein-rich", "High-fiber", "Heart-healthy", "Probiotic",
  "Anti-inflammatory", "Antioxidant", "Electrolyte", "Nourishing"
];

export function FuelFingerprint({ intakeLogs }: FuelFingerprintProps) {
  // Logic to determine if a category is "active" based on recent logs (Weekly window ideally)
  // For now, checking today's logs for presence of categories
  const activeCategories = Array.from(new Set(
    intakeLogs.flatMap(log => log.fuelCategories || [])
  ));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline px-1">
        <h2 className="text-xl font-bold tracking-tight">Fuel Fingerprint</h2>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Last 7 Days</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {CATEGORIES.map(cat => (
          <FingerprintCard 
            key={cat} 
            label={cat} 
            isActive={activeCategories.includes(cat)} 
          />
        ))}
      </div>
    </div>
  );
}

function FingerprintCard({ label, isActive }: { label: string, isActive: boolean }) {
  return (
    <div className={`aspect-square rounded-xl border p-3 flex flex-col justify-between transition-all duration-500 overflow-hidden relative group cursor-help ${
      isActive 
        ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400" 
        : "bg-muted/30 border-border/50 text-muted-foreground/30"
    }`}>
      {/* Abstract Pattern background for active */}
      {isActive && (
        <div className="absolute inset-0 opacity-[0.1] bg-[radial-gradient(circle_at_50%_50%,currentColor_1px,transparent_1px)] bg-[length:4px_4px]" />
      )}
      
      <div className="text-[10px] font-black uppercase tracking-[0.15em] leading-tight relative z-10">
        {label}
      </div>
      
      {/* Visual Indicator */}
      <div className={`h-1.5 w-6 rounded-full transition-all duration-700 relative z-10 ${
        isActive ? "bg-purple-500 shadow-[0_0_8px_currentColor]" : "bg-muted-foreground/20"
      }`} />
    </div>
  );
}
