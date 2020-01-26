import pg from "pg";

describe("Tests", () => {
    it("Setup DB", async () => {
        const pool = new pg.Pool({
            database: "compositecalendar",
            host: "localhost",
            password: "password",
            user: "compositecalendar",
            port:5432,
        });
        // const res = await pool.query("CREATE TABLE updatetracker (email VARCHAR(50) PRIMARY KEY, apikey VARCHAR(50), lastupdate VARCHAR(50))");
        // console.log(res);
        const addres = await pool.query("INSERT INTO updatetracker VALUES ('matthowardh2o','bdnf9bns9fdrb','123512352345');");
        console.log(addres);

    });
});
