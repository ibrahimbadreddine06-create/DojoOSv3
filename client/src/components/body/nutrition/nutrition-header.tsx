import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";

interface NutritionHeaderProps {
  onLogClick: () => void;
}

export function NutritionHeader({ onLogClick }: NutritionHeaderProps) {
  const { getModuleTheme } = useTheme();
  const theme = getModuleTheme("nutrition"); // Assuming 'nutrition' uses the lavender theme

  return (
    <div className="flex flex-col gap-1 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nutrition</h1>
          <p className="text-muted-foreground">Food, fuel & micronutrients</p>
        </div>
        <Button 
          onClick={onLogClick}
          className="rounded-full px-6 transition-all hover:scale-105 active:scale-95 shadow-lg"
          style={{ 
            backgroundColor: `hsl(${theme.cssVar})`,
            color: 'white'
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Log intake
        </Button>
      </div>
    </div>
  );
}
