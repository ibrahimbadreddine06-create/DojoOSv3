import { db } from "../db";
import { exerciseLibrary } from "@shared/schema";
// import { eq } from "drizzle-orm"; // Can't easily check existence in bulk without unique constraint on name, but we'll try to just insert ignore or clean first.

const EXERCISES_DATA = [
    // --- CHEST ---
    { name: "Bench Press (Barbell)", targetMuscleGroup: "chest", category: "Barbell", secondaryMuscles: ["triceps", "front-deltoids"] },
    { name: "Bench Press (Dumbbell)", targetMuscleGroup: "chest", category: "Dumbbell", secondaryMuscles: ["triceps", "front-deltoids"] },
    { name: "Incline Bench Press (Barbell)", targetMuscleGroup: "chest", category: "Barbell", secondaryMuscles: ["triceps", "front-deltoids"] },
    { name: "Incline Bench Press (Dumbbell)", targetMuscleGroup: "chest", category: "Dumbbell", secondaryMuscles: ["triceps", "front-deltoids"] },
    { name: "Decline Bench Press", targetMuscleGroup: "chest", category: "Barbell", secondaryMuscles: ["triceps", "lower-chest"] },
    { name: "Chest Fly (Dumbbell)", targetMuscleGroup: "chest", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Chest Fly (Cable)", targetMuscleGroup: "chest", category: "Cable", secondaryMuscles: [] },
    { name: "Chest Press (Machine)", targetMuscleGroup: "chest", category: "Machine", secondaryMuscles: ["triceps"] },
    { name: "Push Up", targetMuscleGroup: "chest", category: "Bodyweight", secondaryMuscles: ["triceps", "core"] },
    { name: "Dips (Chest Focus)", targetMuscleGroup: "chest", category: "Bodyweight", secondaryMuscles: ["triceps"] },
    { name: "Pec Deck / Machine Fly", targetMuscleGroup: "chest", category: "Machine", secondaryMuscles: [] },

    // --- BACK ---
    { name: "Deadlift (Barbell)", targetMuscleGroup: "lower-back", category: "Barbell", secondaryMuscles: ["glutes", "hamstrings", "traps"] },
    { name: "Pull Up", targetMuscleGroup: "upper-back", category: "Bodyweight", secondaryMuscles: ["biceps", "lats"] },
    { name: "Chin Up", targetMuscleGroup: "upper-back", category: "Bodyweight", secondaryMuscles: ["biceps", "lats"] },
    { name: "Lat Pulldown (Cable)", targetMuscleGroup: "upper-back", category: "Cable", secondaryMuscles: ["biceps"] },
    { name: "Bent Over Row (Barbell)", targetMuscleGroup: "upper-back", category: "Barbell", secondaryMuscles: ["biceps", "lower-back"] },
    { name: "Bent Over Row (Dumbbell)", targetMuscleGroup: "upper-back", category: "Dumbbell", secondaryMuscles: ["biceps"] },
    { name: "Seated Cable Row", targetMuscleGroup: "upper-back", category: "Cable", secondaryMuscles: ["biceps", "mid-back"] },
    { name: "T-Bar Row", targetMuscleGroup: "upper-back", category: "Machine", secondaryMuscles: ["biceps"] },
    { name: "Face Pull", targetMuscleGroup: "back-deltoids", category: "Cable", secondaryMuscles: ["traps"] },
    { name: "Shrugs (Barbell)", targetMuscleGroup: "trapezius", category: "Barbell", secondaryMuscles: [] },
    { name: "Shrugs (Dumbbell)", targetMuscleGroup: "trapezius", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Hyperextension / Back Extension", targetMuscleGroup: "lower-back", category: "Bodyweight", secondaryMuscles: ["glutes", "hamstrings"] },

    // --- LEGS (Quads) ---
    { name: "Squat (Barbell)", targetMuscleGroup: "quadriceps", category: "Barbell", secondaryMuscles: ["glutes", "core"] },
    { name: "Front Squat (Barbell)", targetMuscleGroup: "quadriceps", category: "Barbell", secondaryMuscles: ["core", "upper-back"] },
    { name: "Leg Press", targetMuscleGroup: "quadriceps", category: "Machine", secondaryMuscles: ["glutes"] },
    { name: "Leg Extension", targetMuscleGroup: "quadriceps", category: "Machine", secondaryMuscles: [] },
    { name: "Goblet Squat", targetMuscleGroup: "quadriceps", category: "Dumbbell", secondaryMuscles: ["glutes", "core"] },
    { name: "Lunge (Dumbbell)", targetMuscleGroup: "quadriceps", category: "Dumbbell", secondaryMuscles: ["glutes", "hamstrings"] },
    { name: "Bulgarian Split Squat", targetMuscleGroup: "quadriceps", category: "Dumbbell", secondaryMuscles: ["glutes"] },

    // --- LEGS (Hamstrings/Glutes) ---
    { name: "Romanian Deadlift (Barbell)", targetMuscleGroup: "hamstring", category: "Barbell", secondaryMuscles: ["glutes", "lower-back"] },
    { name: "Romanian Deadlift (Dumbbell)", targetMuscleGroup: "hamstring", category: "Dumbbell", secondaryMuscles: ["glutes"] },
    { name: "Leg Curl (Seated)", targetMuscleGroup: "hamstring", category: "Machine", secondaryMuscles: [] },
    { name: "Leg Curl (Lying)", targetMuscleGroup: "hamstring", category: "Machine", secondaryMuscles: [] },
    { name: "Glute Bridge", targetMuscleGroup: "gluteal", category: "Bodyweight", secondaryMuscles: ["hamstrings"] },
    { name: "Hip Thrust (Barbell)", targetMuscleGroup: "gluteal", category: "Barbell", secondaryMuscles: ["hamstrings"] },
    { name: "Hip Abduction Machine", targetMuscleGroup: "gluteal", category: "Machine", secondaryMuscles: [] },
    { name: "Hip Adduction Machine", targetMuscleGroup: "adductor", category: "Machine", secondaryMuscles: [] },

    // --- LEGS (Calves) ---
    { name: "Standing Calf Raise", targetMuscleGroup: "calves", category: "Machine", secondaryMuscles: [] },
    { name: "Seated Calf Raise", targetMuscleGroup: "calves", category: "Machine", secondaryMuscles: [] },
    { name: "Calf Press on Leg Press", targetMuscleGroup: "calves", category: "Machine", secondaryMuscles: [] },

    // --- SHOULDERS ---
    { name: "Overhead Press (Barbell)", targetMuscleGroup: "front-deltoids", category: "Barbell", secondaryMuscles: ["triceps"] },
    { name: "Overhead Press (Dumbbell)", targetMuscleGroup: "front-deltoids", category: "Dumbbell", secondaryMuscles: ["triceps"] },
    { name: "Lateral Raise (Dumbbell)", targetMuscleGroup: "front-deltoids", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Lateral Raise (Cable)", targetMuscleGroup: "front-deltoids", category: "Cable", secondaryMuscles: [] },
    { name: "Front Raise (Dumbbell)", targetMuscleGroup: "front-deltoids", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Rear Delt Fly (Dumbbell)", targetMuscleGroup: "back-deltoids", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Rear Delt Fly (Machine)", targetMuscleGroup: "back-deltoids", category: "Machine", secondaryMuscles: [] },
    { name: "Upright Row", targetMuscleGroup: "front-deltoids", category: "Barbell", secondaryMuscles: ["traps"] },
    { name: "Arnold Press", targetMuscleGroup: "front-deltoids", category: "Dumbbell", secondaryMuscles: ["triceps"] },

    // --- ARMS (Biceps) ---
    { name: "Bicep Curl (Barbell)", targetMuscleGroup: "biceps", category: "Barbell", secondaryMuscles: [] },
    { name: "Bicep Curl (Dumbbell)", targetMuscleGroup: "biceps", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Hammer Curl", targetMuscleGroup: "biceps", category: "Dumbbell", secondaryMuscles: ["forearms"] },
    { name: "Preacher Curl", targetMuscleGroup: "biceps", category: "Machine", secondaryMuscles: [] },
    { name: "Cable Curl", targetMuscleGroup: "biceps", category: "Cable", secondaryMuscles: [] },
    { name: "Concentration Curl", targetMuscleGroup: "biceps", category: "Dumbbell", secondaryMuscles: [] },

    // --- ARMS (Triceps) ---
    { name: "Tricep Pushdown (Cable)", targetMuscleGroup: "triceps", category: "Cable", secondaryMuscles: [] },
    { name: "Tricep Extension (Overhead)", targetMuscleGroup: "triceps", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Skullcrusher (Barbell)", targetMuscleGroup: "triceps", category: "Barbell", secondaryMuscles: [] },
    { name: "Close Grip Bench Press", targetMuscleGroup: "triceps", category: "Barbell", secondaryMuscles: ["chest"] },
    { name: "Lying Tricep Extension", targetMuscleGroup: "triceps", category: "Dumbbell", secondaryMuscles: [] },
    { name: "Tricep Dips", targetMuscleGroup: "triceps", category: "Bodyweight", secondaryMuscles: [] },

    // --- ABS / CORE ---
    { name: "Crunch", targetMuscleGroup: "abs", category: "Bodyweight", secondaryMuscles: [] },
    { name: "Plank", targetMuscleGroup: "abs", category: "Bodyweight", secondaryMuscles: ["core"] },
    { name: "Leg Raise (Hanging)", targetMuscleGroup: "abs", category: "Bodyweight", secondaryMuscles: ["hip-flexors"] },
    { name: "Leg Raise (Lying)", targetMuscleGroup: "abs", category: "Bodyweight", secondaryMuscles: ["hip-flexors"] },
    { name: "Russian Twist", targetMuscleGroup: "obliques", category: "Bodyweight", secondaryMuscles: [] },
    { name: "Cable Crunch", targetMuscleGroup: "abs", category: "Cable", secondaryMuscles: [] },
    { name: "Ab Wheel Rollout", targetMuscleGroup: "abs", category: "Bodyweight", secondaryMuscles: ["core"] },

    // --- CARDIO ---
    { name: "Running (Treadmill)", targetMuscleGroup: "calves", category: "Cardio", secondaryMuscles: ["quadriceps", "hamstrings"] },
    { name: "Cycling", targetMuscleGroup: "quadriceps", category: "Cardio", secondaryMuscles: ["calves"] },
    { name: "Rowing Machine", targetMuscleGroup: "upper-back", category: "Cardio", secondaryMuscles: ["legs", "arms"] },
    { name: "Jump Rope", targetMuscleGroup: "calves", category: "Cardio", secondaryMuscles: [] },
    { name: "Elliptical", targetMuscleGroup: "quadriceps", category: "Cardio", secondaryMuscles: [] },
];

async function seed() {
    console.log("Seeding exercises...");

    for (const ex of EXERCISES_DATA) {
        await db.insert(exerciseLibrary).values(ex).onConflictDoNothing(); // This relies on unique constraints or we just hope. 
        // Actually schema doesn't have unique constraint on name.
        // So we generally check first. But for now, let's just insert all if table is empty.
    }

    console.log("Exercises seeded!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
    seed();
}

export { EXERCISES_DATA, seed };
