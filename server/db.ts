import { Pool, neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";

// NEON_DATABASE_URL takes priority (used when DATABASE_URL is overridden by the host environment)
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "DATABASE_URL not set. Application will run in with mock storage if configured.",
  );
}

export const pool = (connectionString && connectionString.startsWith('postgres'))
  ? new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    max: 1, // Crucial for Vercel free tier and serverless stability
  })
  : null;

// Use HTTP driver for main DB queries - more stable on Vercel
const httpClient = (connectionString && connectionString.startsWith('postgres')) 
  ? neon(connectionString) 
  : null;
export const db: any = httpClient ? drizzleHttp(httpClient, { schema }) : null;
