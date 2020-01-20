import { ICalendar, IEventList, IEvent, IInputItem } from "./types";
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
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${outputCal.id}/events/${eventid}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (res.status === 403) {
            await wait(2000);
            const res2 = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${outputCal.id}/events/${eventid}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!res2.ok) {
                throw new Error("Unauthorized Token");
            }
        } else if (!res.ok) {
            throw new Error("Unauthorized Token");
        }
    }
};

export const addEventsToOutput = async (
    outputCal: ICalendar,
    addEvents: IEvent[],
    accessToken: string,
) => {

    const reducedEvents = addEvents
        .map((item) => {
            return {
                description: item.description,
                summary: item.summary,
                start: item.start,
                end: item.end,
            };
        });
    for (const reducedEvent of reducedEvents) {
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${outputCal.id}/events`, {
            method: "POST",
            body: JSON.stringify(reducedEvent),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        });
        if (res.status === 403) {
            await wait(2000);
            const res2 = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${outputCal.id}/events`, {
                method: "POST",
                body: JSON.stringify(reducedEvent),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            if (!res2.ok) {
                throw new Error("Unauthorized Token");
            }
        } else if (!res.ok) {
            throw new Error("Unauthorized Token");
        }
    }
};

export const getFilteredEvents = async (
    inputItems: IInputItem[],
    startDate: string,
    endDate: string,
    accessToken: string,
): Promise<IEvent[]> => {
    const isoMin = convertTime(startDate, false);
    const isoMax = convertTime(endDate, true);
    return (await Promise.all(inputItems.map(async (inputItem) => {
        const events = await getEventsRecursive(inputItem.cal.id, isoMin, isoMax, accessToken);
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

export const getEventsRecursive = async (
    calId: string,
    timeMin: string,
    timeMax: string,
    accessToken: string,
    nextPageToken?: string,
): Promise<IEvent[]> => {
    // tslint:disable-next-line: max-line-length
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${timeMin}&timeMax=${timeMax}` + (nextPageToken === undefined ? "" : `&pageToken=${nextPageToken}`);
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
            ...(await getEventsRecursive(calId, timeMin, timeMax, accessToken, events.nextPageToken)),
        ];
    } else {
        return events.items;
    }
};
