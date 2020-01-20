import { ISetting } from "./types";
import { getFilteredEvents, getEventsRecursive, addEventsToOutput, removeEventsFromOutput } from "./calendarApis";
import diff from "./diff";

export default async ({ startDate, endDate, inputItems, outputCal }: ISetting, accessKey: string) => {
  if (outputCal !== undefined) {
    const [filteredEvents, oldEvents] = await Promise.all([
      getFilteredEvents(inputItems, startDate, endDate, accessKey),
      getEventsRecursive(outputCal.id, startDate, endDate, accessKey),
    ]);
    const { addEvents, removeEvents } = diff(filteredEvents, oldEvents);
    addEventsToOutput(outputCal, addEvents, accessKey);
    removeEventsFromOutput(outputCal, removeEvents, accessKey);
  }
};
