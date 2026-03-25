import "dotenv/config";
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { subDays, format, startOfDay } from "date-fns";
import { sql } from "drizzle-orm";

const USER_ID = "57c66999-fd85-44f1-a9a2-014c781c979e";

async function main() {
    try {
        console.log("Seeding 30-day body history for user:", USER_ID);

        // Clean up recent history for this user to ensure fresh data
        console.log("Cleaning up recent history...");
        await db.delete(schema.dailyState).where(sql`${schema.dailyState.userId} = ${USER_ID}`);
        await db.delete(schema.muscleStats).where(sql`${schema.muscleStats.userId} = ${USER_ID}`);
        
        // Find existing exercises to link to workouts
        const exercises = await db.select().from(schema.exerciseLibrary).limit(5);

        for (let i = 29; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, "yyyy-MM-dd");
            const dateObj = startOfDay(date);

            console.log(`Seeding data for ${dateStr}...`);

            // 1. Sleep Logs
            const sleepHours = 6.5 + Math.random() * 2.5;
            const sleepQuality = Math.floor(Math.random() * 3) + 3;
            const readiness = Math.floor(65 + Math.random() * 35);
            
            await db.insert(schema.sleepLogs).values({
                date: dateStr,
                actualHours: sleepHours.toFixed(1),
                plannedHours: "8.0",
                quality: sleepQuality,
                readinessScore: readiness
            }).onConflictDoNothing();

            // 2. Intake Logs
            const calories = 2400 + Math.random() * 800;
            const protein = 140 + Math.random() * 60;
            const carbs = 250 + Math.random() * 100;
            const fats = 60 + Math.random() * 30;

            await db.insert(schema.intakeLogs).values({
                date: dateObj,
                mealName: "Daily Total",
                mealType: "other",
                calories: calories.toFixed(0),
                protein: protein.toFixed(0),
                carbs: carbs.toFixed(0),
                fats: fats.toFixed(0),
                water: (2000 + Math.random() * 2000).toFixed(0),
                status: "consumed"
            });

            // 3. Workouts (4 times a week)
            let workoutCompleted = false;
            let workoutDuration = 0;
            let totalVolume = 0;
            const dayOfWeek = date.getDay(); // 0-6
            
            if ([1, 3, 5, 0].includes(dayOfWeek)) {
                workoutCompleted = true;
                workoutDuration = 45 + Math.floor(Math.random() * 45);
                const [workout] = await db.insert(schema.workouts).values({
                    date: dateObj,
                    title: `Training Session`,
                    completed: true,
                    notes: "High intensity session."
                }).returning();

                if (exercises.length > 0) {
                    for (let j = 0; j < 3; j++) {
                        const ex = exercises[j];
                        const [we] = await db.insert(schema.workoutExercises).values({
                            workoutId: workout.id,
                            exerciseId: ex.id,
                            order: j
                        }).returning();

                        for (let s = 1; s <= 3; s++) {
                            const weight = 40 + Math.random() * 60;
                            const reps = 8 + Math.floor(Math.random() * 6);
                            totalVolume += weight * reps;
                            await db.insert(schema.workoutSets).values({
                                workoutExerciseId: we.id,
                                setNumber: s,
                                reps,
                                weight: weight.toFixed(1),
                                completed: true
                            });
                        }
                    }
                }
            }

            // 4. Daily State
            const steps = 8000 + Math.floor(Math.random() * 8000);
            const activeMin = workoutCompleted ? workoutDuration + 15 : 15 + Math.floor(Math.random() * 20);
            const calBurned = 2200 + (steps / 20) + (activeMin * 5);
            const recovery = 60 + Math.random() * 40;
            
            // New realistic signal scores
            const balanceScore = Math.floor(70 + Math.random() * 25);
            const stressScore = Math.floor(20 + Math.random() * 40);
            const momentumScore = Math.floor(60 + Math.random() * 35);
            const effortScore = workoutCompleted ? Math.floor(70 + Math.random() * 30) : Math.floor(Math.random() * 20);

            await db.insert(schema.dailyState).values({
                userId: USER_ID,
                date: dateStr,
                sleepHours: sleepHours.toFixed(1),
                sleepQuality,
                readinessScore: readiness,
                recoveryScore: Math.floor(recovery),
                caloriesConsumed: Math.floor(calories),
                calorieGoal: 2800,
                proteinConsumed: protein.toFixed(1),
                carbsConsumed: carbs.toFixed(1),
                fatsConsumed: fats.toFixed(1),
                waterConsumed: (2000 + Math.random() * 2000).toFixed(0),
                workoutCompleted,
                workoutDurationMin: workoutDuration,
                totalVolume: Math.floor(totalVolume),
                steps,
                activeMinutes: activeMin,
                caloriesBurned: Math.floor(calBurned),
                avgHeartRate: Math.floor(55 + Math.random() * 15),
                effortScore,
                balanceScore,
                stressScore,
                momentumScore,
                updatedAt: new Date()
            }).onConflictDoUpdate({
                target: [schema.dailyState.userId, schema.dailyState.date],
                set: { 
                    steps, 
                    activeMinutes: activeMin, 
                    caloriesConsumed: Math.floor(calories),
                    effortScore,
                    balanceScore,
                    stressScore,
                    momentumScore,
                    totalVolume: Math.floor(totalVolume),
                    updatedAt: new Date() 
                }
            });

        }

        // 5. Final Muscle Stats update (based on total accumulated volume/state)
        console.log("Updating final muscle stats...");
        if (exercises.length > 0) {
            for (let j = 0; j < Math.min(exercises.length, 6); j++) {
                const ex = exercises[j];
                if (ex.targetMuscleGroup) {
                    const mId = ex.targetMuscleGroup.toLowerCase();
                    await db.insert(schema.muscleStats).values({
                        userId: USER_ID,
                        muscleId: mId,
                        recoveryScore: Math.floor(70 + Math.random() * 30),
                        lastTrained: new Date(),
                        volumeAccumulated: Math.floor(2000 + Math.random() * 5000), 
                        updatedAt: new Date()
                    });
                }
            }
        }

        console.log("Successfully seeded 30 days of history.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        process.exit(0);
    }
}

main();
