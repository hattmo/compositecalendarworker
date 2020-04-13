import fetch from "node-fetch";
import { MongoClient, MongoClientOptions } from "mongodb";

interface IAccount {
    id: string;
    accesstoken: string;
    refreshtoken: string;
    lastupdate: number;
    lastrefresh: number;
}

interface IRefresh {
    access_token: string;
    expires_in: number;
    scope: string;
    id_token: string;
}

export default async (clientID: string, clientSecret: string, dbconnection: string, dbusername?: string, dbpassword?: string) => {
    const connectionSetting: MongoClientOptions = { }
    if (dbusername !== undefined && dbpassword !== undefined) {
        connectionSetting.auth = { user: dbusername, password: dbpassword }
    }
    const client = new MongoClient(dbconnection, connectionSetting);
    const session = await client.connect();
    return {
        getOldestAccount: async () => {
            const currenttime = (new Date()).getTime();
            const accounts = session.db("compositecalendar").collection<IAccount>("accounts");
            const oldestAccount = (await accounts.findOneAndUpdate(
                { lastupdate: { $gt: currenttime - 10_000 } },
                { $set: { lastupdate: currenttime } },
                { sort: { lastupdate: 1 } }
            )).value;
            if (oldestAccount !== null && oldestAccount !== undefined) {
                if ((currenttime - oldestAccount.lastrefresh) > 100_000) {
                    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            client_id: clientID,
                            client_secret: clientSecret,
                            refresh_token: oldestAccount.refreshtoken,
                            grant_type: "refresh_token",
                        }),
                    });
                    if (refreshRes.ok) {
                        const refreshJson = (await refreshRes.json()) as IRefresh;
                        accounts.updateOne({ id: oldestAccount.id }, { $set: { accesstoken: refreshJson.access_token } })
                    }
                }
            }

            return oldestAccount;
        },
    };
};
