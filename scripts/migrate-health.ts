#!/usr/bin/env tsx
/**
 * Migration script to add health sync tokens to the users table
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Starting health api migration...");

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_fit_tokens jsonb`;
  console.log("✓ users.google_fit_tokens added");

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_health_sync_token text`;
  console.log("✓ users.apple_health_sync_token added");

  console.log("\n✅ Health migration complete!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
