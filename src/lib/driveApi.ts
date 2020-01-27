import fetch from "node-fetch";
import { ISetting } from "./types";

interface IFileListItem {
    kind: string;
    id: string;
    name: string;
    mimeType: string;
}

export default async (accessToken: string) => {
    const listRes = await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (listRes.ok) {
        const files = (await listRes.json()).files as IFileListItem[];
        const dataFile = files.find((item) => {
            return item.name === "compositeCalendarData";
        });
        if (dataFile !== undefined) {
            const contentRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${dataFile.id}?alt=media`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (contentRes.ok) {
                return await contentRes.json() as ISetting[];
            }
        }
    }
    return null;
};
