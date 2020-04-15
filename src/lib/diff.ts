import { calendar_v3 } from "googleapis";

export default (newEventList: calendar_v3.Schema$Event[], oldEventList: calendar_v3.Schema$Event[]) => {
    const removeEvents = [...oldEventList];
    const addEvents: calendar_v3.Schema$Event[] = [];
    for (const newEvent of newEventList) {
        const matchIndex = removeEvents.findIndex((oldEvent) => {
            return (
                newEvent.start?.dateTime === oldEvent.start?.dateTime &&
                newEvent.end?.dateTime === oldEvent.end?.dateTime &&
                newEvent.summary === oldEvent.summary &&
                newEvent.description === oldEvent.description
            );
        });
        if (matchIndex !== -1) {
            removeEvents.splice(matchIndex, 1);
        } else {
            addEvents.push(newEvent);
        }
    }
    return {
        addEvents,
        removeEvents,
    };
};
