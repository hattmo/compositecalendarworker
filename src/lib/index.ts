import db from "./db";
import getSettings from "./driveApi";
import updateCal from "./updateCal";
import { promisify } from "util";
const sleep = promisify(setTimeout);

export default async () => {
    const { getOldestAccount } = db();
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
                await sleep(1000);
            }
        } catch (e) {
            console.log("Failed to connect to DB will retry in 10s...");
            await sleep(10000);
        }
    }
};
