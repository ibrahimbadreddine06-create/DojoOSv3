/**
 * Estimate 1-Rep Max using the Epley formula.
 * weight × (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (!weight || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Estimate calories burned using the MET formula.
 * MET × 3.5 × bodyWeightKg / 200 × durationMin
 */
export function calculateCalories(
  met: number,
  bodyWeightKg: number,
  durationMin: number
): number {
  if (!met || !bodyWeightKg || !durationMin) return 0;
  return Math.round((met * 3.5 * bodyWeightKg) / 200 * durationMin);
}

/**
 * Calculate total volume load: weight × reps × sets
 */
export function calculateVolume(weight: number, reps: number, sets: number): number {
  return weight * reps * sets;
}

/**
 * Get a color class for difficulty level.
 */
export function difficultyColor(difficulty: string | null | undefined): string {
  switch (difficulty) {
    case "beginner": return "text-green-500 border-green-500/30 bg-green-500/10";
    case "intermediate": return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
    case "advanced": return "text-red-500 border-red-500/30 bg-red-500/10";
    default: return "text-muted-foreground border-border bg-muted/20";
  }
}
