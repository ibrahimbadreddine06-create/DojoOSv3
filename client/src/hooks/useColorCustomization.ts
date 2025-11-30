import { useState, useEffect } from 'react';

export const DEFAULT_MODULE_COLORS = {
  planner: { h: 220, s: 10, l: 50 },      // Gray
  goals: { h: 142, s: 71, l: 35 },        // Green
  second_brain: { h: 24, s: 95, l: 53 },  // Orange
  languages: { h: 262, s: 83, l: 58 },    // Purple
  studies: { h: 4, s: 80, l: 56 },        // Red/Coral
};

export type ModuleType = keyof typeof DEFAULT_MODULE_COLORS;

export interface ColorValue {
  h: number;
  s: number;
  l: number;
}

export interface ModuleColors {
  [key: string]: ColorValue;
}

const STORAGE_KEY = 'dojo-module-colors';

export function useColorCustomization() {
  const [colors, setColors] = useState<ModuleColors>(DEFAULT_MODULE_COLORS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setColors(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored colors', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when colors change
  const updateColor = (module: ModuleType, color: ColorValue) => {
    const updated = { ...colors, [module]: color };
    setColors(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const resetColors = () => {
    setColors(DEFAULT_MODULE_COLORS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const applyColorsToCSS = () => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([module, color]) => {
      root.style.setProperty(`--module-${module}`, `${color.h} ${color.s}% ${color.l}%`);
    });
  };

  // Apply colors to CSS when they change
  useEffect(() => {
    if (isLoaded) {
      applyColorsToCSS();
    }
  }, [colors, isLoaded]);

  return {
    colors,
    updateColor,
    resetColors,
    isLoaded,
  };
}
