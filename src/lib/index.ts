import db from "./db";
import getSettings from "./getSettings";
import updateCal from "./updateCal";
import { promisify } from "util";

const sleep = promisify(setTimeout);

const {
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    DB_CONNECTION,
    DB_USERNAME,
    DB_PASSWORD,
} = process.env;

if (!(OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET && DB_CONNECTION)) {
    process.stderr.write("Environment variables not set\n");
    process.exit(1);
}

export default async () => {
    let waiting = false;
    try {
        const { getOldestAccountCreds } = await db(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, DB_CONNECTION, DB_USERNAME, DB_PASSWORD);
        process.stdout.write("Worker started successfully\n");
        while (true) {
            try {
                const oauth = await getOldestAccountCreds();
                if (oauth) {
                    if (waiting) {
                        process.stdout.write("Updating Accounts...\n");
                        waiting = false;
                    }
                    try {
                        const settings = await getSettings(oauth);
                        await Promise.all(settings.map(async (setting) => updateCal(setting, oauth)));
                    } catch {
                        console.log("Did not update calendar")
                    }
                } else {
                    if (!waiting) {
                        process.stdout.write("No Accounts need updating, waiting...\n")
                        waiting = true
                    }
                    await sleep(1000);
                }
            } catch (e) {
                process.stderr.write("Failed to connect to DB will retry in 10s...\n");
                await sleep(10000);
            }
        }
    } catch (e) {
        process.stderr.write("Failed to connect to DB\n")
    }
};
