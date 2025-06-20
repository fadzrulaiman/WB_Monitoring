const db = require('../core/db');

exports.search = async (req, res) => {
    const { werks, dateFrom, dateTo } = req.body;
    try {
        const pool = await db.poolPromise;
        const result = await pool.request()
            .input("werks", db.sql.VarChar, werks)
            .input("dateFrom", db.sql.Date, dateFrom)
            .input("dateTo", db.sql.Date, dateTo)
            .query(`
                SELECT * FROM WB_IN
                WHERE WERKS = @werks AND WB_DATE_IN BETWEEN @dateFrom AND @dateTo
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error querying data");
    }
};

exports.reupload = async (req, res) => {
    const { werks, dateFrom, dateTo } = req.body;
    try {
        const pool = await db.poolPromise;
        await pool.request()
            .input("werks", db.sql.VarChar, werks)
            .input("dateFrom", db.sql.Date, dateFrom)
            .input("dateTo", db.sql.Date, dateTo)
            .query(`
                UPDATE WB_IN
                SET ZSAPFLAG = 'N'
                WHERE WERKS = @werks AND WB_DATE_IN BETWEEN @dateFrom AND @dateTo
            `);
        res.send("FFB tickets reuploaded successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating data");
    }
};

exports.getWerks = async (req, res) => {
    try {
        const pool = await db.poolPromise;
        const result = await pool.request()
            .query(`SELECT DISTINCT WERKS FROM [dbo].[WB_IN] ORDER BY WERKS`);
        res.json(result.recordset.map(r => r.WERKS));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching WERKS", details: err.message });
    }
};
