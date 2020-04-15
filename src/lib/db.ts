// import fetch from "node-fetch";
import { MongoClient, MongoClientOptions } from "mongodb";
import { google } from "googleapis";
import { IAccountDocument } from "./types";

export default async (clientId: string, clientSecret: string, dbconnection: string, dbusername?: string, dbpassword?: string) => {
    const connectionSetting: MongoClientOptions = {}
    if (dbusername !== undefined && dbpassword !== undefined) {
        connectionSetting.auth = { user: dbusername, password: dbpassword }
    }
    const client = new MongoClient(dbconnection, connectionSetting);
    const conn = (await client.connect()).db("compositecalendar");
    return {
        getOldestAccountCreds: async () => {
            const currenttime = (new Date()).getTime();
            const accounts = conn.collection<IAccountDocument>("accounts");
            const oldestAccount = (await accounts.findOneAndUpdate(
                { lastUpdate: { $lt: currenttime - 10_000 } },
                { $set: { lastUpdate: currenttime } },
                { sort: { lastUpdate: 1 } },
            )).value;
            if (!oldestAccount) {
                return null;
            }
            const oauth = new google.auth.OAuth2({ clientId, clientSecret });
            oauth.setCredentials(oldestAccount.credentials);
            oauth.on("tokens", (tokens) => {
                const { access_token, expiry_date, refresh_token } = tokens;
                conn.collection<IAccountDocument>("accounts").update(
                    { email: oldestAccount.email },
                    { $set: { credentials: { access_token, expiry_date, refresh_token } } },
                )
            })
            return oauth;
        },
    };
};