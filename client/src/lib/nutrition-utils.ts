import { type IntakeLog, type BodyProfile } from "@shared/schema";

export function calculateNutritionScore(logs: IntakeLog[], profile?: BodyProfile) {
  const calories = logs.reduce((acc, log) => acc + Number(log.calories || 0), 0);
  
  if (calories < 750) {
    return { locked: true, reason: "Requires 750 kcal logged to unlock" };
  }

  // Placeholder logic for Food Quality (0-10)
  // Based on fuel categories: POSITIVE (Nourishing) vs NEGATIVE (Reducing)
  const totalFoodItems = logs.filter(l => l.mealType !== 'water').length;
  const nourishingItems = logs.filter(l => l.fuelCategories?.includes("Nourishing")).length;
  const reducingItems = logs.filter(l => l.fuelCategories?.includes("Reducing")).length;
  
  let foodQuality = 5; // Start at 5
  if (totalFoodItems > 0) {
    foodQuality = Math.min(10, Math.max(0, 5 + (nourishingItems - reducingItems)));
  }

  // Placeholder logic for Macro Balance (0-10)
  // Based on deviation from goals
  const goals = {
    protein: profile?.dailyProteinGoal || 150,
    carbs: profile?.dailyCarbsGoal || 250,
    fats: profile?.dailyFatsGoal || 70,
  };
  
  const totals = logs.reduce((acc, log) => ({
    protein: acc.protein + Number(log.protein || 0),
    carbs: acc.carbs + Number(log.carbs || 0),
    fats: acc.fats + Number(log.fats || 0),
  }), { protein: 0, carbs: 0, fats: 0 });

  const pDiff = Math.abs(totals.protein - (goals.protein * 0.75)) / (goals.protein * 0.75); // Check against 75% of goal for today's snapshot
  const cDiff = Math.abs(totals.carbs - (goals.carbs * 0.75)) / (goals.carbs * 0.75);
  const fDiff = Math.abs(totals.fats - (goals.fats * 0.75)) / (goals.fats * 0.75);
  
  const macroBalance = Math.min(10, Math.max(0, 10 - (pDiff + cDiff + fDiff) * 5));

  const totalScore = Math.round((foodQuality * 0.5 + macroBalance * 0.5) * 10);

  return {
    locked: false,
    score: totalScore,
    subScores: {
      foodQuality: Math.round(foodQuality * 10) / 10,
      macroBalance: Math.round(macroBalance * 10) / 10,
    }
  };
}
