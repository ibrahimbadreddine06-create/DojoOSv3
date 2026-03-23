import React from "react";
import { type IntakeLog } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface FuelFingerprintProps {
  intakeLogs: IntakeLog[];
}

const POSITIVE_CATEGORIES = [
  { id: "plants", label: "Plants", color: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-500/20", tint: "bg-emerald-50" },
  { id: "quality-protein", label: "Quality Protein", color: "bg-teal-500", text: "text-teal-600", border: "border-teal-500/20", tint: "bg-teal-50" },
  { id: "complex-carbs", label: "Complex Carbs", color: "bg-blue-500", text: "text-blue-600", border: "border-blue-500/20", tint: "bg-blue-50" },
  { id: "healthy-fats", label: "Healthy Fats", color: "bg-amber-500", text: "text-amber-600", border: "border-amber-500/20", tint: "bg-amber-50" },
];

const NEGATIVE_CATEGORIES = [
  { id: "ultra-processed", label: "Ultra-Processed", color: "bg-red-500", text: "text-red-600", border: "border-red-500/40", tint: "bg-red-50" },
  { id: "high-sodium", label: "High Sodium", color: "bg-red-500", text: "text-red-600", border: "border-red-500/40", tint: "bg-red-50" },
  { id: "added-sugars", label: "Added Sugars", color: "bg-red-500", text: "text-red-600", border: "border-red-500/40", tint: "bg-red-50" },
  { id: "red-processed-meat", label: "Red / Processed Meat", color: "bg-red-500", text: "text-red-600", border: "border-red-500/40", tint: "bg-red-50" },
];

export function FuelFingerprint({ intakeLogs }: FuelFingerprintProps) {
  // Use today's logs for quick visual feedback, but ideally this would be weekly
  const activeCategories = Array.from(new Set(
    intakeLogs.flatMap(log => log.fuelCategories || [])
  ));

  return (
    <div className="space-y-4">
      <Link href="/body/nutrition/metric/fuel">
        <div className="flex justify-between items-baseline px-1 cursor-pointer group">
          <h2 className="text-xl font-bold tracking-tight group-hover:text-purple-500 transition-colors">Fuel Fingerprint</h2>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest group-hover:text-purple-400">Daily Coverage</span>
        </div>
      </Link>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Positive Grid */}
        <div className="grid grid-rows-4 gap-3">
          {POSITIVE_CATEGORIES.map(cat => (
            <FingerprintCard 
              key={cat.id} 
              cat={cat} 
              isActive={activeCategories.includes(cat.id)} 
              type="positive"
            />
          ))}
        </div>
        {/* Negative Grid */}
        <div className="grid grid-rows-4 gap-3">
          {NEGATIVE_CATEGORIES.map(cat => (
            <FingerprintCard 
              key={cat.id} 
              cat={cat} 
              isActive={activeCategories.includes(cat.id)} 
              type="negative"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FingerprintCard({ cat, isActive, type }: { cat: any, isActive: boolean, type: "positive" | "negative" }) {
  return (
    <Link href="/body/nutrition/metric/fuel">
      <div className={`rounded-xl border p-3 flex items-center justify-between transition-all duration-500 overflow-hidden relative group cursor-pointer h-[60px] ${
        isActive 
          ? `${cat.tint} ${cat.border} ${cat.text}` 
          : "bg-muted/10 border-border/40 text-muted-foreground/30"
      } ${type === 'negative' && isActive ? "border-red-500/40 ring-1 ring-red-500/10" : ""}`}>
        
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-tight relative z-10 transition-colors group-hover:opacity-80">
            {type === 'positive' ? 'Nourishing' : 'Reducing'}
          </span>
          <span className="text-xs font-black tracking-tight relative z-10">
            {cat.label}
          </span>
        </div>
        
        {/* Visual Indicator */}
        <div className={`h-2.5 w-2.5 rounded-full transition-all duration-700 relative z-10 group-hover:scale-125 ${
          isActive ? `${cat.color} shadow-[0_0_8px_currentColor]` : "bg-muted-foreground/20"
        }`} />
      </div>
    </Link>
  );
}
