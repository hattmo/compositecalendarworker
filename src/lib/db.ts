import pg from "pg";

export default () => {
    const pool = new pg.Pool();
    return {
        getNextSetting: async () => {
            const client = await pool.connect();
            const res = await client.query<string[]>("");
            res.
            client.release();
        }
    }
}