/**
 * One-time migration: add difficulty, met, recommended_reps to exercise_library
 * Run with: npx tsx server/migrate-exercise-fields.ts
 */
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL set");
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  console.log("Running migration: adding difficulty, met, recommended_reps columns...");

  await sql`
    ALTER TABLE exercise_library
      ADD COLUMN IF NOT EXISTS difficulty text,
      ADD COLUMN IF NOT EXISTS met numeric(4,1),
      ADD COLUMN IF NOT EXISTS recommended_reps text;
  `;

  console.log("Migration complete.");
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
