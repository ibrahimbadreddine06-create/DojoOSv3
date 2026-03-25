import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";

async function main() {
    try {
        const allUsers = await db.select().from(users);
        if (allUsers.length === 0) {
            console.log("NO_USERS");
        } else {
            console.log("USER_ID:" + allUsers[0].id);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

main();
