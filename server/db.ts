import { Pool, neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set. Application will run in with mock storage if configured.",
  );
}

export const pool = (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'))
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: 1, // Crucial for Vercel free tier and serverless stability
  })
  : null;

// Use HTTP driver for main DB queries - more stable on Vercel
const httpClient = (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) 
  ? neon(process.env.DATABASE_URL) 
  : null;
export const db: any = httpClient ? drizzleHttp(httpClient, { schema }) : null;


