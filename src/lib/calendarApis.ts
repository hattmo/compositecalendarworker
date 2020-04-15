import { ISettingInputItem } from "./types";
import convertTime from "./convertTime";
import { promisify } from "util";
import { calendar_v3 } from "googleapis";
const wait = promisify(setTimeout);

export const removeEventsFromOutput = async (
    calId: string,
    removeEvents: calendar_v3.Schema$Event[],
    calendar: calendar_v3.Calendar,
) => {
    const ids = removeEvents.map((item) => item.id);
    for (const eventid of ids) {
        if (eventid) {
            for (let attempt = 0; attempt < 20; attempt++) {
                try {
                    await calendar.events.delete({ calendarId: calId, eventId: eventid })
                    break;
                } catch (error) {
                    if (error.response?.status === 403) {
                        await wait(200 * attempt);
                    } else {
                        throw new Error("Error deleting events");
                    }
                }
            }
        }
    }
};

export const addEventsToOutput = async (
    calId: string,
    addEvents: calendar_v3.Schema$Event[],
    calendar: calendar_v3.Calendar,
) => {

    const reducedEvents = addEvents.map((item) => {
        return {
            description: item.description,
            summary: item.summary,
            start: item.start,
            end: item.end,
        };
    });
    for (const reducedEvent of reducedEvents) {
        for (let attempt = 0; attempt < 20; attempt++) {
            try {
                await calendar.events.insert({ requestBody: reducedEvent, calendarId: calId });
            } catch (error) {
                if (error.response?.status === 403) {
                    await wait(200 * attempt);
                } else {
                    throw new Error("Error deleting events");
                }
            }
        }
    }
};

export const getCombinedEvents = async (
    inputItems: ISettingInputItem[],
    startDate: string,
    endDate: string,
    calendar: calendar_v3.Calendar,
): Promise<calendar_v3.Schema$Event[]> => {
    return (await Promise.all(inputItems.map(async (inputItem) => {
        const events = await getEvents(inputItem.cal.id, startDate, endDate, calendar);
        const compiledRegex = new RegExp(inputItem.regex);
        return events.filter((event) => {
            if (inputItem.exclude) {
                return !compiledRegex.test(event.summary ?? "");
            } else {
                return compiledRegex.test(event.summary ?? "");
            }
        });
    }))).reduce((prev, curr) => {
        return [...prev, ...curr];
    }, [] as calendar_v3.Schema$Event[]);
};

export const getEvents = async (
    calId: string,
    startDate: string,
    endDate: string,
    calendar: calendar_v3.Calendar,
    nextPageToken?: string,
): Promise<calendar_v3.Schema$Event[]> => {
    const isoMin = convertTime(startDate, false);
    const isoMax = convertTime(endDate, true);
    const res = await calendar.events.list({ calendarId: calId, timeMin: isoMin, timeMax: isoMax, pageToken: nextPageToken })
    if (res.data.items === undefined) {
        return [];
    }
    if (res.data.nextPageToken) {
        return [
            ...res.data.items,
            ...(await getEvents(calId, startDate, endDate, calendar, res.data.nextPageToken)),
        ]
    } else {
        return res.data.items;
    }
};
