import pg from "pg";

interface IAccount {
    id: string;
    accesstoken: string;
    refreshtoken: string;
    lastupdate: string;
    lastrefresh: string;
}

export default () => {
    const pool = new pg.Pool();
    pool.on("error", () => {
        console.log("DB Error...");
    });
    return {
        getOldestAccount: async () => {
            const client = await pool.connect();
            let returnVal: IAccount | null = null;
            await client.query("BEGIN");
            const res = await client.query<IAccount>("SELECT * FROM accounts WHERE lastUpdate = (SELECT MIN(lastUpdate) FROM accounts);");
            if (res.rowCount === 1) {
                const oldestAccount = res.rows[0];
                if (((new Date()).getTime() - Number.parseInt(oldestAccount.lastupdate, 10)) > 10000) {
                    await client.query(
                        "UPDATE accounts SET lastUpdate=$1 WHERE id=$2",
                        [(new Date()).getTime(), res.rows[0].id],
                    );
                    returnVal = oldestAccount;
                }
            }
            await client.query("COMMIT");
            client.release();
            return returnVal;
        },
    };
};
