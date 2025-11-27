import { differenceInDays } from "date-fns";
import type { Flashcard } from "@shared/schema";

export function calculateReadinessWithDecay(flashcards: Flashcard[]): number {
  if (flashcards.length === 0) return 0;
  const now = new Date();
  
  let totalAdjustedMastery = 0;
  flashcards.forEach(card => {
    let effectiveMastery = card.mastery;
    
    if (card.nextReview && card.mastery > 0) {
      const daysOverdue = differenceInDays(now, new Date(card.nextReview));
      if (daysOverdue > 0) {
        const decayFactor = Math.max(0.3, 1 - (daysOverdue * 0.1));
        effectiveMastery = Math.max(0, Math.round(card.mastery * decayFactor));
      }
    }
    totalAdjustedMastery += effectiveMastery;
  });
  
  return Math.round((totalAdjustedMastery / (flashcards.length * 4)) * 100);
}
