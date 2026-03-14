import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        console.log("Checking database connection...");
        const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log("Tables found:", result.rows.map(r => r.table_name));

        const columns = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'disciplines'`);
        if (columns.rows.length > 0) {
            console.log("Disciplines table columns:", columns.rows);
        } else {
            console.log("Disciplines table NOT FOUND");
        }
    } catch (err) {
        console.error("DB Check failed:", err);
    } finally {
        process.exit(0);
    }
}

check();
