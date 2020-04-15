import { Credentials } from "google-auth-library";

type AccessRole = "reader" | "owner" | "freeBusyReader" | "writer";
interface IAccountDocument {
    email: string;
    credentials: Credentials;
    lastUpdate: number;
    session: Session[];
}
interface Session {
    cookie: string;
    src: string;
    lastLogin: number;
}

interface ISettingInputItem {
    cal: ISettingCalendar,
    regex: string,
    exclude: boolean,
}

interface ISetting {
    inputItems: ISettingInputItem[],
    outputCal?: ISettingCalendar,
    startDate: string,
    endDate: string,
}

interface ISettingCalendar {
    id: string;
    name: string;
    accessRole: AccessRole;
}