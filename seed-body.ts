import "dotenv/config";
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { subDays, format, startOfDay } from "date-fns";

const USER_ID = "57c66999-fd85-44f1-a9a2-014c781c979e";
const TODAY_STR = format(new Date(), "yyyy-MM-dd");
const TODAY_DATE = startOfDay(new Date());

async function main() {
    try {
        console.log("Seeding body metrics for user:", USER_ID);

        // 1. Body Profile
        await db.insert(schema.bodyProfile).values({
            dailyCalorieGoal: 2800,
            dailyProteinGoal: 180,
            dailyCarbsGoal: 300,
            dailyFatsGoal: 80,
            sleepGoalHours: "8.5",
            waterGoal: 3500,
            weightKg: "82.5",
            heightCm: "185.0",
            age: 28,
            sex: "male",
            activityLevel: "active",
            bodyGoal: "gain"
        }).onConflictDoUpdate({
            target: schema.bodyProfile.id,
            set: { dailyCalorieGoal: 2800, updatedAt: new Date() }
        });
        console.log("Seeded Body Profile.");

        // 2. Intake Logs (Today)
        const meals = [
            { mealName: "Protein Oatmeal", mealType: "breakfast", calories: "650", protein: "45", carbs: "80", fats: "15" },
            { mealName: "Chicken & Rice", mealType: "lunch", calories: "800", protein: "60", carbs: "100", fats: "20" },
            { mealName: "Post-workout Shake", mealType: "snack", calories: "300", protein: "30", carbs: "40", fats: "5" }
        ];

        for (const meal of meals) {
            await db.insert(schema.intakeLogs).values({
                ...meal,
                date: TODAY_DATE,
                status: "consumed"
            });
        }
        console.log("Seeded Intake Logs.");

        // 3. Sleep Logs (Past 7 days)
        for (let i = 0; i < 7; i++) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, "yyyy-MM-dd");
            const hours = 7 + Math.random() * 2;
            const quality = Math.floor(Math.random() * 3) + 3;
            await db.insert(schema.sleepLogs).values({
                date: dateStr,
                actualHours: hours.toFixed(1),
                plannedHours: "8.5",
                quality: quality,
                readinessScore: Math.floor(70 + Math.random() * 30)
            });
        }
        console.log("Seeded Sleep Logs.");

        // 4. Hygiene Routines
        const routines = ["Morning Shower", "Skincare", "Oral Hygiene", "Evening Reflection"];
        for (const name of routines) {
            await db.insert(schema.hygieneRoutines).values({
                name,
                date: TODAY_STR,
                completed: Math.random() > 0.3,
                lastCompletedDate: Math.random() > 0.3 ? TODAY_STR : null
            });
        }
        console.log("Seeded Hygiene Routines.");

        // 5. Workouts
        const workout = await db.insert(schema.workouts).values({
            date: TODAY_DATE,
            title: "Heavy Pull Day",
            completed: true,
            notes: "Felt strong today. Back is getting wider."
        }).returning();

        // Add some exercises to the workout
        const exercises = await db.select().from(schema.exerciseLibrary).limit(3);
        if (exercises.length > 0) {
            for (let i = 0; i < exercises.length; i++) {
                const we = await db.insert(schema.workoutExercises).values({
                    workoutId: workout[0].id,
                    exerciseId: exercises[i].id,
                    order: i
                }).returning();

                for (let s = 1; s <= 3; s++) {
                    await db.insert(schema.workoutSets).values({
                        workoutExerciseId: we[0].id,
                        setNumber: s,
                        reps: 10,
                        weight: "60.0",
                        completed: true
                    });
                }
            }
        }
        console.log("Seeded Workouts.");

        // 6. Daily State
        await db.insert(schema.dailyState).values({
            userId: USER_ID,
            date: TODAY_STR,
            recoveryScore: 88,
            readinessScore: 92,
            sleepHours: "7.8",
            caloriesConsumed: 1750,
            calorieGoal: 2800,
            workoutCompleted: true,
            steps: 12450,
            activeMinutes: 65,
            avgHeartRate: 58
        }).onConflictDoUpdate({
            target: [schema.dailyState.userId, schema.dailyState.date],
            set: { recoveryScore: 88, readinessScore: 92, updatedAt: new Date() }
        });
        console.log("Seeded Daily State.");

        console.log("Done seeding body metrics.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        process.exit(0);
    }
}

main();
