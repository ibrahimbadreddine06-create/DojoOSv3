
import "dotenv/config";
import { pool } from "./server/db";
import { sql } from "drizzle-orm";
import { db } from "./server/db";

async function ensureSessionTable() {
    if (!db) {
        console.error("Database connection not available.");
        process.exit(1);
    }

    try {
        console.log("Ensuring session table exists...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL,
                CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
            ) WITH (OIDS=FALSE);
        `);
        
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);
        
        console.log("Session table check complete.");
        process.exit(0);
    } catch (err) {
        console.error("Failed to ensure session table:", err);
        process.exit(1);
    }
}

ensureSessionTable();
