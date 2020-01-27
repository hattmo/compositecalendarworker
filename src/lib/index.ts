import db from "./db";
import getSettings from "./driveApi";
import { getFilteredEvents } from "./calendarApis";

export default async () => {
    const { getOldestAccount } = db();
    const account = await getOldestAccount();
    if (account !== null) {
        const settings = await getSettings(account.accesstoken);
        if (settings !== null) {
            const newEvents = await getFilteredEvents(
                settings[0].inputItems,
                settings[0].startDate,
                settings[0].endDate,
                account.accesstoken,
            );
            console.log(newEvents);
        } else {
            console.log("no settings found");
        }
    } else {
        console.log("no accounts ready for update");
    }
};
