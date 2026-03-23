import { type IntakeLog, type BodyProfile } from "@shared/schema";

export function calculateNutritionScore(logs: IntakeLog[], profile?: BodyProfile) {
  const calories = logs.reduce((acc, log) => acc + Number(log.calories || 0), 0);
  
  if (calories < 750) {
    return { locked: true, reason: "Logged intake required for daily score (750 kcal min)" };
  }

  // 1. Food Quality (0-10)
  // Positive: plants, quality-protein, complex-carbs, healthy-fats
  // Negative: ultra-processed, high-sodium, added-sugars, red-processed-meat
  const positiveCats = ["plants", "quality-protein", "complex-carbs", "healthy-fats"];
  const negativeCats = ["ultra-processed", "high-sodium", "added-sugars", "red-processed-meat"];

  let qualityPoints = 0;
  logs.forEach(log => {
    if (!log.fuelCategories) return;
    log.fuelCategories.forEach(cat => {
      if (positiveCats.includes(cat)) qualityPoints += 1;
      if (negativeCats.includes(cat)) qualityPoints -= 1;
    });
  });

  const foodQuality = Math.min(10, Math.max(0, 5 + qualityPoints));

  // 2. Macro Balance (0-10)
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

  // Compare against percentage of goal based on total calories consumed vs target
  const targetCalories = profile?.dailyCalorieGoal || 2500;
  const progressRatio = Math.min(1.0, calories / targetCalories);
  
  const pDiff = Math.abs(totals.protein - (goals.protein * progressRatio)) / Math.max(1, (goals.protein * progressRatio));
  const cDiff = Math.abs(totals.carbs - (goals.carbs * progressRatio)) / Math.max(1, (goals.carbs * progressRatio));
  const fDiff = Math.abs(totals.fats - (goals.fats * progressRatio)) / Math.max(1, (goals.fats * progressRatio));
  
  const macroBalance = Math.min(10, Math.max(0, 10 - (pDiff + cDiff + fDiff) * 5));

  // 3. Weighted Score (60% Quality, 40% Balance)
  const totalScore = Math.round((foodQuality * 0.6 + macroBalance * 0.4) * 10);

  return {
    locked: false,
    score: totalScore,
    subScores: {
      foodQuality: Math.round(foodQuality * 10) / 10,
      macroBalance: Math.round(macroBalance * 10) / 10,
    }
  };
}
