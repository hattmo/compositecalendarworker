export default (date: string, end: boolean): string => {
    let timeZoneOffsetMinutes = new Date().getTimezoneOffset();
    let timeZoneOffset = "";
    if (timeZoneOffsetMinutes !== 0) {
        timeZoneOffset = timeZoneOffsetMinutes > 0 ? "-" : "+";
        timeZoneOffsetMinutes = Math.abs(timeZoneOffsetMinutes);
        let hours = Math.floor(timeZoneOffsetMinutes / 60).toString();
        hours = hours.length === 1 ? "0" + hours : hours;
        let mins = (timeZoneOffsetMinutes % 60).toString();
        mins = mins.length === 1 ? "0" + mins : mins;
        timeZoneOffset = timeZoneOffset + hours + mins;
    } else {
        timeZoneOffset = "Z";
    }
    try {
        const dateObj = new Date(date);
        if (end) { dateObj.setDate(dateObj.getDate() + 1); }
        const iso = dateObj.toISOString();
        const isoAdjusted = iso.substring(0, iso.length - 1) + timeZoneOffset;
        return isoAdjusted;
    } catch {
        throw new Error("Invalid Date");
    }

};
