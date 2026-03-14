
import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function fix() {
    try {
        console.log("Attempting to clean up session table...");
        // Drop the index explicitly if it exists
        await db.execute(sql`DROP INDEX IF EXISTS "IDX_session_expire"`);
        console.log("Dropped index IDX_session_expire");

        // Drop the table explicitly (cascade should kill the index too, but being safe)
        await db.execute(sql`DROP TABLE IF EXISTS "session" CASCADE`);
        console.log("Dropped table session");

        console.log("Cleanup complete. You can now restart the server.");
        process.exit(0);
    } catch (err) {
        console.error("Fix failed:", err);
        process.exit(1);
    }
}

fix();
