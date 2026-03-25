import React from "react";
import { type IntakeLog, type BodyProfile } from "@shared/schema";
import { Link } from "wouter";
import { Leaf, Dumbbell, Wheat, Droplets, AlertTriangle } from "lucide-react";
import { SectionHeader } from "../section-header";

interface FuelFingerprintProps {
  intakeLogs: IntakeLog[];
}

const POSITIVE_CATEGORIES = [
  {
    id: "plants",
    label: "Plants",
    description: "Vegetables, fruit, legumes",
    statText: "0 servings · goal 7/day",
    icon: Leaf,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    border: "border-emerald-500/20",
    tint: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "quality-protein",
    label: "Quality Protein",
    description: "Lean meat, eggs, legumes",
    statText: "0g · goal 150g/day",
    icon: Dumbbell,
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    iconColor: "text-teal-600 dark:text-teal-400",
    barColor: "bg-teal-500",
    border: "border-teal-500/20",
    tint: "bg-teal-50 dark:bg-teal-950/20",
    text: "text-teal-700 dark:text-teal-300",
  },
  {
    id: "complex-carbs",
    label: "Complex Carbs",
    description: "Oats, rice, sweet potato",
    statText: "0g · goal 200g/day",
    icon: Wheat,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    barColor: "bg-blue-500",
    border: "border-blue-500/20",
    tint: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-700 dark:text-blue-300",
  },
  {
    id: "healthy-fats",
    label: "Healthy Fats",
    description: "Avocado, nuts, olive oil",
    statText: "0g · goal 55g/day",
    icon: Droplets,
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    barColor: "bg-amber-500",
    border: "border-amber-500/20",
    tint: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-700 dark:text-amber-300",
  },
];

const NEGATIVE_CATEGORIES = [
  {
    id: "ultra-processed",
    label: "Ultra-Processed",
    description: "Packaged snacks, fast food",
    statText: "0 items · limit 1/day",
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-orange-500",
    barColor: "bg-orange-500",
    border: "border-orange-500/30",
    tint: "bg-red-50/50 dark:bg-red-950/20",
    text: "text-red-700 dark:text-red-300",
  },
  {
    id: "high-sodium",
    label: "High Sodium",
    description: "Processed & cured foods",
    statText: "0mg · limit 2300mg/day",
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-orange-500",
    barColor: "bg-orange-500",
    border: "border-orange-500/30",
    tint: "bg-red-50/50 dark:bg-red-950/20",
    text: "text-red-700 dark:text-red-300",
  },
  {
    id: "added-sugars",
    label: "Added Sugars",
    description: "Sodas, sweets, syrups",
    statText: "0g · limit 25g/day",
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-orange-500",
    barColor: "bg-orange-500",
    border: "border-orange-500/30",
    tint: "bg-red-50/50 dark:bg-red-950/20",
    text: "text-red-700 dark:text-red-300",
  },
  {
    id: "red-processed-meat",
    label: "Red / Processed Meat",
    description: "Beef, pork, deli meats",
    statText: "0g · limit 500g/week",
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-500",
    barColor: "bg-red-500",
    border: "border-red-500/30",
    tint: "bg-red-50/50 dark:bg-red-950/20",
    text: "text-red-700 dark:text-red-300",
  },
];

export function FuelFingerprint({ intakeLogs }: FuelFingerprintProps) {
  const activeCategories = Array.from(new Set(
    intakeLogs.flatMap(log => log.fuelCategories || [])
  ));

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline px-1">
        <Link href="/body/nutrition/metric/fuel">
          <div className="cursor-pointer group">
            <SectionHeader title="Fuel Fingerprint" kicker="Qualitative" className="mb-0 group-hover:text-purple-500 transition-colors" />
          </div>
        </Link>
        <span className="text-[10px] text-muted-foreground/50 font-medium">Daily Coverage</span>
      </div>

      <p className="text-[10px] text-muted-foreground/60 px-1">
        What your body actually ran on this week. Green = nourishing. Red = worth reducing.
      </p>

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

      <Link href="/body/nutrition/metric/fuel">
        <button className="text-[10px] text-muted-foreground/40 hover:text-purple-500 transition-colors w-full text-right px-1 mt-1">
          How is this calculated? →
        </button>
      </Link>
    </div>
  );
}

function FingerprintCard({ cat, isActive, type }: { cat: any, isActive: boolean, type: "positive" | "negative" }) {
  const IconComponent = cat.icon;
  const progress = isActive ? Math.floor(Math.random() * 40 + 30) : 0; // placeholder

  return (
    <Link href="/body/nutrition/metric/fuel">
      <div className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300 cursor-pointer group shadow-sm ${
        isActive
          ? `${cat.tint} ${cat.border}`
          : "bg-muted/10 border-border/60"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            isActive ? cat.iconBg : "bg-muted/40"
          }`}>
            <IconComponent className={`w-3.5 h-3.5 ${isActive ? cat.iconColor : "text-muted-foreground/30"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-widest leading-tight truncate ${isActive ? cat.text : "text-muted-foreground/30"}`}>
              {cat.label}
            </p>
            <p className={`text-[10px] font-medium leading-tight truncate mt-0.5 ${isActive ? "text-muted-foreground/60" : "text-muted-foreground/20"}`}>
              {cat.description}
            </p>
          </div>
        </div>

        <div className={`h-1.5 rounded-full overflow-hidden mt-auto ${isActive ? "bg-muted/30" : "bg-muted/20"}`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ${isActive ? cat.barColor : "bg-muted-foreground/10"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? "text-muted-foreground/50" : "text-muted-foreground/20"}`}>
          {cat.statText}
        </p>
      </div>
    </Link>
  );
}
