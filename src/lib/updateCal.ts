import { ISetting } from "./types";
import { getEvents, getCombinedEvents, addEventsToOutput, removeEventsFromOutput } from "./calendarApis";
import diff from "./diff";

export default async ({ startDate, endDate, inputItems, outputCal }: ISetting, accessKey: string) => {
  if (outputCal !== undefined) {
    try {
      const [filteredEvents, oldEvents] = await Promise.all([
        getCombinedEvents(inputItems, startDate, endDate, accessKey),
        getEvents(outputCal.id, startDate, endDate, accessKey),
      ]);
      const { addEvents, removeEvents } = diff(filteredEvents, oldEvents);
      await Promise.all([
        addEventsToOutput(outputCal, addEvents, accessKey),
        removeEventsFromOutput(outputCal, removeEvents, accessKey),
      ]);
    } catch {
      process.stderr.write("Failed to sync calendars\n");
    }
  }
};
