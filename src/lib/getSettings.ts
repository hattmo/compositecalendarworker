import { google } from "googleapis";
import { ISetting } from "./types";


export default async (auth) => {
    const drive = google.drive({ version: "v3", auth });
    const listres = await drive.files.list({ spaces: "appDataFolder" });
    const dataFileid = listres.data.files?.find(item => item.name === "compositeCalendarData")?.id;
    if (!dataFileid) {
        throw new Error("Cannot find file compositeCalendarData\n");
    }
    const constentres = await drive.files.get({ fileId: dataFileid, alt: "media" }, { responseType: "text" })
    return JSON.parse(constentres.data as string) as ISetting[];
};
