import pg from "pg";
import fetch from "node-fetch";

interface IAccount {
    id: string;
    accesstoken: string;
    refreshtoken: string;
    lastupdate: string;
    lastrefresh: string;
}

interface IRefresh {
    access_token: string;
    expires_in: number;
    scope: string;
    id_token: string;
}

export default (clientID: string, clientSecret: string) => {
    const pool = new pg.Pool();
    pool.on("error", () => {
        process.stderr.write("DB Error...\n");
    });
    return {
        getOldestAccount: async () => {
            const client = await pool.connect();
            let returnVal: IAccount | null = null;
            await client.query("BEGIN");
            const accountsQuery = await client.query<IAccount>("SELECT * FROM accounts WHERE lastupdate = (SELECT MIN(lastupdate) FROM accounts);");
            if (accountsQuery.rowCount === 1) {
                const oldestAccount = accountsQuery.rows[0];
                // Update every 10 seconds
                if (((new Date()).getTime() - Number.parseInt(oldestAccount.lastupdate, 10)) > 10_000) {
                    await client.query(
                        "UPDATE accounts SET lastupdate=$1 WHERE id=$2",
                        [(new Date()).getTime(), oldestAccount.id],
                    );
                    returnVal = oldestAccount;
                }
                // refresh the access token every 16 mins
                if (((new Date()).getTime() - Number.parseInt(oldestAccount.lastrefresh, 10)) > 100_000) {
                    await client.query(
                        "UPDATE accounts SET lastrefresh=$1 WHERE id=$2",
                        [(new Date()).getTime(), oldestAccount.id],
                    );
                    await client.query("COMMIT");
                    try {
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
                        await client.query("BEGIN");
                        if (refreshRes.ok) {
                            const refreshJson = (await refreshRes.json()) as IRefresh;
                            await client.query(
                                "UPDATE accounts SET accesstoken=$1 WHERE id=$2",
                                [refreshJson.access_token, oldestAccount.id],
                            );
                            // await client.query(
                            //     "UPDATE accounts SET accesstoken=$1 WHERE id=$2",
                            //     [(new Date()).getTime(), oldestAccount.id],
                            // );
                        }
                    } catch {
                        process.stderr.write("Unable to refresh access token\n");
                    }
                }
            }
            await client.query("COMMIT");
            client.release();
            return returnVal;
        },
    };
};
