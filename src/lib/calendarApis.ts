import { ICalendar, IEventList, IEvent, IInputItem } from "./types";
import fetch from "node-fetch";
import convertTime from "./convertTime";
import { promisify } from "util";
const wait = promisify(setTimeout);

export const removeEventsFromOutput = async (
    outputCal: ICalendar,
    removeEvents: IEvent[],
    accessToken: string,
) => {
    const ids = removeEvents.map((item) => item.id);
    for (const eventid of ids) {
        for (let attempt = 0; attempt < 20; attempt++) {
            const res = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${outputCal.id}/events/${eventid}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );
            if (res.ok) {
                break;
            } else if (res.status === 403) {
                await wait(2000);
            } else {
                throw new Error("Error deleting events");
            }
        }
    }
};

export const addEventsToOutput = async (
    outputCal: ICalendar,
    addEvents: IEvent[],
    accessToken: string,
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
            const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${outputCal.id}/events`, {
                method: "POST",
                body: JSON.stringify(reducedEvent),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            if (res.ok) {
                break;
            } else if (res.status === 403) {
                await wait(2000);
            } else {
                throw new Error("Error adding events");
            }
        }
    }
};

export const getCombinedEvents = async (
    inputItems: IInputItem[],
    startDate: string,
    endDate: string,
    accessToken: string,
): Promise<IEvent[]> => {
    return (await Promise.all(inputItems.map(async (inputItem) => {
        const events = await getEvents(inputItem.cal.id, startDate, endDate, accessToken);
        const compiledRegex = new RegExp(inputItem.regex);
        return events.filter((event) => {
            if (inputItem.exclude) {
                return !compiledRegex.test(event.summary);
            } else {
                return compiledRegex.test(event.summary);
            }
        });
    }))).reduce((prev, curr) => {
        return [...prev, ...curr];
    }, [] as IEvent[]);
};

export const getEvents = async (
    calId: string,
    startDate: string,
    endDate: string,
    accessToken: string,
    nextPageToken?: string,
): Promise<IEvent[]> => {
    const isoMin = convertTime(startDate, false);
    const isoMax = convertTime(endDate, true);
    // tslint:disable-next-line: max-line-length
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${isoMin}&timeMax=${isoMax}` + (nextPageToken === undefined ? "" : `&pageToken=${nextPageToken}`);
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error("Unauthorized Token");
    }
    const events = await response.json() as IEventList;
    if (events.nextPageToken !== undefined) {
        return [
            ...events.items,
            ...(await getEvents(calId, startDate, endDate, accessToken, events.nextPageToken)),
        ];
    } else {
        return events.items;
    }
};
