import { IEvent } from "./types";

export default (newEventList: IEvent[], oldEventList: IEvent[]) => {
    const removeEvents = [...oldEventList];
    const addEvents: IEvent[] = [];
    for (const newEvent of newEventList) {
        const matchIndex = removeEvents.findIndex((oldEvent) => {
            return (
                newEvent.start.dateTime === oldEvent.start.dateTime &&
                newEvent.end.dateTime === oldEvent.end.dateTime &&
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
