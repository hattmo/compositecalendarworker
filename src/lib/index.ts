import db from "./db";
import getSettings from "./getSettings";
import updateCal from "./updateCal";
import { promisify } from "util";
const sleep = promisify(setTimeout);

const { CLIENT_ID, CLIENT_SECRET } = process.env;

if (!(CLIENT_ID && CLIENT_SECRET)) {
    process.stderr.write("Environment variables not set\n");
    process.exit(1);
}

export default async () => {
    const { getOldestAccount } = db(CLIENT_ID, CLIENT_SECRET);
    process.stdout.write("Worker started successfully\n");
    while (true) {
        try {
            const account = await getOldestAccount();
            if (account !== null) {
                const settings = await getSettings(account.accesstoken);
                if (settings !== null) {
                    await Promise.all(settings.map(async (setting) => {
                        return updateCal(setting, account.accesstoken);
                    }));
                }
            } else {
                await sleep(10000);
            }
        } catch (e) {
            process.stderr.write("Failed to connect to DB will retry in 10s...\n");
            await sleep(10000);
        }
    }
};
