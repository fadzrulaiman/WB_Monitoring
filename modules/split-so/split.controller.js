const { sql, poolPromise } = require("../../core/db");

exports.searchwbticket = async (req, res) => {
    const { mwerks, dateFrom, dateTo } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("mwerks", sql.VarChar, mwerks)
            .input("dateFrom", sql.Date, dateFrom)
            .input("dateTo", sql.Date, dateTo)
            .query(`
                SELECT WB_TICKET FROM WB_OUT
                WHERE MWERKS = @mwerks AND WBDATE_IN BETWEEN @dateFrom AND @dateTo 
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error querying data");
    }
};

exports.search = async (req, res) => {
    const { mwerks, dateFrom, dateTo, wb_ticket } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("mwerks", sql.VarChar, mwerks)
            .input("wb_ticket", sql.VarChar, wb_ticket)
            .input("dateFrom", sql.Date, dateFrom)
            .input("dateTo", sql.Date, dateTo)
            .query(`
                SELECT * FROM WB_OUT
                WHERE MWERKS = @mwerks AND WBDATE_IN BETWEEN @dateFrom AND @dateTo AND WB_TICKET = @wb_ticket
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error querying data");
    }
};

exports.amendSplittingToSingleSO = async (req, res) => {
    const { mwerks, wb_ticket, vbeln_1, posnr_1 = '10' } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input("mwerks", sql.VarChar, mwerks)
            .input("wb_ticket", sql.VarChar, wb_ticket)
            .input("vbeln_1", sql.VarChar, vbeln_1) // Use input value
            .input("posnr_1", sql.VarChar, posnr_1)
            .query(`
                UPDATE [dbo].[WB_OUT]
                SET [VBELN_1] = @vbeln_1,
                    [POSNR_1] = @posnr_1,
                    [VBELN_2] = '',
                    [POSNR_2] = '',
                    [ZSAPFLAG] = 'N'
                WHERE MWERKS = @mwerks
                  AND WB_TICKET = @wb_ticket
            `);
        res.send("Splitting amended to single SO successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating WB_OUT");
    }
};

exports.getMWerks = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT DISTINCT MWERKS FROM [dbo].[WB_OUT] ORDER BY MWERKS`);
        res.json(Array.isArray(result.recordset) ? result.recordset.map(r => r.MWERKS) : []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching MWERKS", details: err.message });
    }
};

exports.getWbTicketsByMWerksAndDate = async (req, res) => {
    const { mwerks, WBDATE_IN } = req.query;
    console.log("getWbTicketsByMWerksAndDate params:", mwerks, WBDATE_IN); // Debug log
    if (!mwerks || !WBDATE_IN) {
        return res.status(400).json({ error: "mwerks and WBDATE_IN are required" });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("mwerks", sql.VarChar, mwerks)
            .input("WBDATE_IN", sql.Date, WBDATE_IN)
            .query(`
                SELECT WB_TICKET 
                FROM [dbo].[WB_OUT] 
                WHERE MWERKS = @mwerks AND CAST(WBDATE_IN AS DATE) = @WBDATE_IN
                ORDER BY WB_TICKET
            `);
        console.log("Tickets found:", result.recordset.length); // Debug log
        res.json(result.recordset.map(r => r.WB_TICKET));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching WB_TICKET", details: err.message });
    }
};