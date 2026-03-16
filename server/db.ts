import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set. Application will run without database.",
  );
}

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    })
  : null;

export const db: any = pool ? drizzle(pool, { schema }) : null;
