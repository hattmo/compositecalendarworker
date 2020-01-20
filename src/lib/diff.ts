import { IEvent } from "./types";

export default (newEventList: IEvent[], oldEventList: IEvent[]) => {
    const removeEvents = [...oldEventList];
    const addEvents: IEvent[] = [];
    for (const newEvent of newEventList) {
        const matchIndex = removeEvents.findIndex((oldEvent) => {
            return (
                newEvent.start === oldEvent.start &&
                newEvent.end === oldEvent.end &&
                newEvent.description === oldEvent.description &&
                newEvent.summary === oldEvent.summary
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
