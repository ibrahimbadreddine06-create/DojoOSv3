/**
 * Recovery Score Calculation Utility
 * Computes a 0-100 muscle recovery score based on elapsed time, volume, and exertion.
 */

interface RecoveryParams {
  muscleId: string;
  lastTrainedAt: Date | null;
  volumeAccumulated: number; // total kg·reps in the last session
  rpe: number | null; // Rate of Perceived Exertion (1-10)
}

/**
 * Muscle-specific base recovery time in hours (before accounting for intensity/volume).
 * Larger muscle groups need more time.
 */
const MUSCLE_RECOVERY_HOURS: Record<string, number> = {
  // Major lower body
  quadriceps: 72,
  hamstrings: 72,
  glutes: 72,
  adductors: 60,
  calves: 48,
  // Major upper body
  chest: 72,
  back: 72,
  "upper-back": 72,
  "lower-back": 72,
  lats: 72,
  traps: 60,
  // Shoulders & arms
  shoulders: 60,
  "front-delts": 60,
  "side-delts": 60,
  "rear-delts": 60,
  biceps: 48,
  triceps: 48,
  forearms: 36,
  // Core
  abs: 36,
  obliques: 36,
};

const DEFAULT_RECOVERY_HOURS = 60;

/**
 * Calculate recovery score (0–100) for a muscle group.
 * 100 = fully recovered, 0 = severely fatigued.
 */
export function calculateRecoveryScore({
  muscleId,
  lastTrainedAt,
  volumeAccumulated,
  rpe,
}: RecoveryParams): number {
  if (!lastTrainedAt) return 100;

  const baseHours = MUSCLE_RECOVERY_HOURS[muscleId] ?? DEFAULT_RECOVERY_HOURS;

  // Adjust base recovery time based on volume (high volume → longer recovery)
  const volumeFactor = Math.min(2.0, 1 + volumeAccumulated / 5000);
  // Adjust based on RPE (high intensity → longer recovery)
  const rpeFactor = rpe ? Math.min(1.5, 1 + (rpe - 5) / 10) : 1.0;

  const adjustedHours = baseHours * volumeFactor * rpeFactor;

  const elapsedMs = Date.now() - lastTrainedAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const rawScore = (elapsedHours / adjustedHours) * 100;
  return Math.min(100, Math.round(rawScore));
}

/**
 * Get a human-readable recovery status label.
 */
export function getRecoveryStatus(score: number): string {
  if (score >= 90) return "Fully Recovered";
  if (score >= 70) return "Nearly Ready";
  if (score >= 50) return "Recovering";
  if (score >= 25) return "Fatigued";
  return "Overtrained";
}
