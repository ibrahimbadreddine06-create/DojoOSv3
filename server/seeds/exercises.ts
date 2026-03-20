import { db } from "../db";
import { exerciseLibrary } from "../../shared/schema";
import rawExercises from "./free-exercise-db.json";

const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Map free-exercise-db equipment → DojoOS category
function mapCategory(equipment: string | null): string {
  switch (equipment) {
    case "barbell":
    case "e-z curl bar":
      return "Barbell";
    case "dumbbell":
    case "kettlebells":
      return "Dumbbell";
    case "machine":
    case "exercise ball":
      return "Machine";
    case "cable":
      return "Cable";
    case "bands":
    case "medicine ball":
    case "foam roll":
    case "other":
    case "body only":
    default:
      return "Bodyweight";
  }
}

// Map free-exercise-db muscle names → DojoOS BodyMap IDs
function mapMuscle(muscle: string): string {
  switch (muscle) {
    case "abdominals":
      return "abs";
    case "obliques":
      return "obliques";
    case "hamstrings":
      return "hamstring";
    case "quadriceps":
      return "quadriceps";
    case "calves":
      return "calves";
    case "glutes":
    case "abductors":
      return "gluteal";
    case "adductors":
      return "adductor";
    case "chest":
      return "chest";
    case "biceps":
      return "biceps";
    case "triceps":
      return "triceps";
    case "forearms":
      return "forearms";
    case "shoulders":
      return "front-deltoids";
    case "middle back":
    case "upper back":
    case "lats":
      return "upper-back";
    case "lower back":
      return "lower-back";
    case "traps":
    case "neck":
      return "trapezius";
    default:
      return muscle;
  }
}

export const EXERCISES_DATA = (rawExercises as any[]).map((ex) => ({
  name: ex.name,
  targetMuscleGroup: ex.primaryMuscles?.[0] ? mapMuscle(ex.primaryMuscles[0]) : null,
  secondaryMuscles: (ex.secondaryMuscles || []).map(mapMuscle),
  category: mapCategory(ex.equipment),
  instructions: Array.isArray(ex.instructions) ? ex.instructions.join("\n") : ex.instructions ?? null,
  imageUrl: ex.images?.[0] ? `${IMAGE_BASE}${ex.images[0]}` : null,
}));

async function seed() {
  console.log(`Seeding ${EXERCISES_DATA.length} exercises...`);

  // Insert in batches of 100 to avoid hitting query size limits
  const batchSize = 100;
  for (let i = 0; i < EXERCISES_DATA.length; i += batchSize) {
    const batch = EXERCISES_DATA.slice(i, i + batchSize);
    await db.insert(exerciseLibrary).values(batch).onConflictDoNothing();
  }

  console.log("Exercises seeded!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export { seed };
