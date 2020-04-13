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
        const { getOldestAccount } = await db(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, DB_CONNECTION, DB_USERNAME, DB_PASSWORD);
        process.stdout.write("Worker started successfully\n");
        while (true) {
            try {
                const account = await getOldestAccount();
                if (account !== undefined && account !== null) {
                    if (waiting) {
                        process.stdout.write("Updating Accounts...");
                        waiting = false;
                    }
                    const settings = await getSettings(account.accesstoken);
                    if (settings !== null) {
                        await Promise.all(settings.map(async (setting) => {
                            return updateCal(setting, account.accesstoken);
                        }));
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
