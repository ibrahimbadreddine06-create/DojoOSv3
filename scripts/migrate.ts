#!/usr/bin/env tsx
/**
 * Safe migration script — adds only missing tables/columns without touching
 * any existing data. Uses IF NOT EXISTS / IF NOT EXISTS guards throughout.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Starting safe migration...");

  // 1. Add meal_type column to intake_logs if missing
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS meal_type text`;
  console.log("✓ intake_logs.meal_type");

  // 2. Add meal_name column (alias) if missing
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS meal_name text`;
  console.log("✓ intake_logs.meal_name");

  // 3. Add any other new intake_logs columns
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS fuel_categories jsonb`;
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS linked_block_id varchar`;
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS routine_id varchar`;
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'consumed'`;
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS image_url text`;
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS omega_3 numeric(6, 2)`;
  await sql`ALTER TABLE intake_logs ADD COLUMN IF NOT EXISTS vitamin_b12 numeric(6, 2)`;
  console.log("✓ intake_logs extra columns");

  // 4. Create body_profile table
  await sql`
    CREATE TABLE IF NOT EXISTS body_profile (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar,
      sex text,
      date_of_birth date,
      height_cm numeric(5, 1),
      weight_kg numeric(5, 1),
      body_fat_pct numeric(4, 1),
      daily_calorie_goal integer,
      daily_protein_goal integer,
      daily_carbs_goal integer,
      daily_fats_goal integer,
      water_goal integer,
      fiber_goal numeric(5, 1),
      fasting_program text,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `;
  console.log("✓ body_profile table");

  // 5. Create daily_state table
  await sql`
    CREATE TABLE IF NOT EXISTS daily_state (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL,
      date date NOT NULL,
      active_minutes integer DEFAULT 0,
      steps integer DEFAULT 0,
      effort_score integer DEFAULT 0,
      calories_burned integer DEFAULT 0,
      recovery_score integer DEFAULT 0,
      mood integer,
      energy integer,
      notes text,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now(),
      UNIQUE(user_id, date)
    )
  `;
  console.log("✓ daily_state table");

  // 6. Create fasting_logs table
  await sql`
    CREATE TABLE IF NOT EXISTS fasting_logs (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar,
      start_time timestamp NOT NULL,
      end_time timestamp,
      target_hours numeric(4, 1),
      actual_hours numeric(4, 1),
      status text DEFAULT 'active',
      notes text,
      created_at timestamp DEFAULT now()
    )
  `;
  console.log("✓ fasting_logs table");

  // 7. Create activity_logs table
  await sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar,
      date date NOT NULL,
      type text NOT NULL,
      name text,
      duration_minutes integer,
      calories_burned integer,
      steps integer,
      distance_km numeric(7, 2),
      notes text,
      created_at timestamp DEFAULT now()
    )
  `;
  console.log("✓ activity_logs table");

  // 8. Create meal_presets table
  await sql`
    CREATE TABLE IF NOT EXISTS meal_presets (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar,
      name text NOT NULL,
      calories numeric(7, 2),
      protein numeric(6, 2),
      carbs numeric(6, 2),
      fats numeric(6, 2),
      fiber numeric(6, 2),
      water numeric(6, 2),
      meal_type text,
      notes text,
      created_at timestamp DEFAULT now()
    )
  `;
  console.log("✓ meal_presets table");

  // 9. Create supplement_logs table
  await sql`
    CREATE TABLE IF NOT EXISTS supplement_logs (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar,
      date date NOT NULL,
      name text NOT NULL,
      amount numeric(7, 2),
      unit text,
      time_taken text,
      notes text,
      created_at timestamp DEFAULT now()
    )
  `;
  console.log("✓ supplement_logs table");

  // 10. Create intake_routines table
  await sql`
    CREATE TABLE IF NOT EXISTS intake_routines (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar,
      name text NOT NULL,
      type text DEFAULT 'supplement',
      dose numeric(7, 2),
      unit text,
      time_of_day text,
      days_of_week text[],
      notes text,
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now()
    )
  `;
  console.log("✓ intake_routines table");

  // 11. Create intake_routine_checkins table
  await sql`
    CREATE TABLE IF NOT EXISTS intake_routine_checkins (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      routine_id varchar NOT NULL,
      date date NOT NULL,
      taken_at timestamp DEFAULT now(),
      UNIQUE(routine_id, date)
    )
  `;
  console.log("✓ intake_routine_checkins table");

  console.log("\n✅ Migration complete!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
