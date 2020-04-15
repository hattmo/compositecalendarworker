import { ISetting } from "./types";
import { getEvents, getCombinedEvents, addEventsToOutput, removeEventsFromOutput } from "./calendarApis";
import { google } from "googleapis";
import diff from "./diff";

export default async ({ startDate, endDate, inputItems, outputCal }: ISetting, auth) => {
  if (outputCal !== undefined) {
    const calendar = google.calendar({ version: "v3", auth });
    try {
      const [filteredEvents, oldEvents] = await Promise.all([
        getCombinedEvents(inputItems, startDate, endDate, calendar),
        getEvents(outputCal.id, startDate, endDate, calendar),
      ]);
      const { addEvents, removeEvents } = diff(filteredEvents, oldEvents);
      await Promise.all([
        addEventsToOutput(outputCal.id, addEvents, calendar),
        removeEventsFromOutput(outputCal.id, removeEvents, calendar),
      ]);
    } catch {
      process.stderr.write("Failed to sync calendars\n");
    }
  }
};
