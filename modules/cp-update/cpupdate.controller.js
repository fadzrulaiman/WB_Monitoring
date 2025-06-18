const { sql, poolPromise } = require("../../core/db");

// Get all Mwerks from WB_OUT
const getMWerks = async (req, res) => {
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

const getWerks = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT DISTINCT WERKS FROM [dbo].[WB_IN] ORDER BY WERKS`);
        res.json(result.recordset.map(r => r.WERKS));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching WERKS", details: err.message });
    }
};

// Update car plate number in WB_OUT and WB_IN by WB_TICKET
const updateCarPlate = async (req, res) => {
  const { wb_ticket, cplate } = req.body;
  if (!wb_ticket || !cplate) {
    return res.status(400).json({ error: "wb_ticket and cplate are required" });
  }
  try {
    const pool = await poolPromise;
    // Update WB_OUT
    await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .input("cplate", sql.VarChar, cplate)
      .query(`
        UPDATE [dbo].[WB_OUT]
        SET [CPLATE] = @cplate, [ZSAPFLAG] = 'N'
        WHERE WB_TICKET = @wb_ticket
      `);
    // Update WB_IN
    await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .input("cplate", sql.VarChar, cplate)
      .query(`
        UPDATE [dbo].[WB_IN]
        SET [CPLATE] = @cplate, [ZSAPFLAG] = 'N'
        WHERE WB_TICKET = @wb_ticket
      `);
    res.send("Car plate updated successfully in WB_OUT and WB_IN.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating car plate number.");
  }
};

// View car plate number details by WB_TICKET
const viewCarPlate = async (req, res) => {
  const { wb_ticket } = req.query;
  if (!wb_ticket) {
    return res.status(400).json({ error: "wb_ticket is required" });
  }
  try {
    const pool = await poolPromise;
    // Get from WB_OUT
    const outResult = await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .query(`
        SELECT CPLATE, ZSAPFLAG FROM [dbo].[WB_OUT]
        WHERE WB_TICKET = @wb_ticket
      `);
    // Get from WB_IN
    const inResult = await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .query(`
        SELECT CPLATE, ZSAPFLAG FROM [dbo].[WB_IN]
        WHERE WB_TICKET = @wb_ticket
      `);
    res.json({
      WB_OUT: outResult.recordset[0] || null,
      WB_IN: inResult.recordset[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching car plate details.");
  }
};

// Update car plate number in WB_OUT by WB_TICKET and MWERKS
const updateCarPlateOut = async (req, res) => {
  const { wb_ticket, cplate, mwerks } = req.body;
  if (!wb_ticket || !cplate || !mwerks) {
    return res.status(400).json({ error: "wb_ticket, cplate, and mwerks are required" });
  }
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .input("cplate", sql.VarChar, cplate)
      .input("mwerks", sql.VarChar, mwerks)
      .query(`
        UPDATE [dbo].[WB_OUT]
        SET [CPLATE] = @cplate, [ZSAPFLAG] = 'N'
        WHERE MWERKS = @mwerks AND WB_TICKET = @wb_ticket
      `);
    res.send("Car plate updated successfully in WB_OUT.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating car plate number in WB_OUT.");
  }
};

// Update car plate number in WB_IN by WB_TICKET and WERKS
const updateCarPlateIn = async (req, res) => {
  const { wb_ticket, cplate, werks } = req.body;
  if (!wb_ticket || !cplate || !werks) {
    return res.status(400).json({ error: "wb_ticket, cplate, and werks are required" });
  }
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .input("cplate", sql.VarChar, cplate)
      .input("werks", sql.VarChar, werks)
      .query(`
        UPDATE [dbo].[WB_IN]
        SET [CPLATE] = @cplate, [ZSAPFLAG] = 'N'
        WHERE WERKS = @werks AND WB_TICKET = @wb_ticket
      `);
    res.send("Car plate updated successfully in WB_IN.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating car plate number in WB_IN.");
  }
};

// View car plate number details by WB_TICKET and MWERKS for WB_OUT
const viewCarPlateOut = async (req, res) => {
  const { wb_ticket, mwerks } = req.query;
  if (!wb_ticket || !mwerks) {
    return res.status(400).json({ error: "wb_ticket and mwerks are required" });
  }
  try {
    const pool = await poolPromise;
    const outResult = await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .input("mwerks", sql.VarChar, mwerks)
      .query(`
        SELECT CPLATE, ZSAPFLAG FROM [dbo].[WB_OUT]
        WHERE WB_TICKET = @wb_ticket AND MWERKS = @mwerks
      `);
    res.json(outResult.recordset[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching car plate details from WB_OUT.");
  }
};

// View car plate number details by WB_TICKET and WERKS for WB_IN
const viewCarPlateIn = async (req, res) => {
  const { wb_ticket, werks } = req.query;
  if (!wb_ticket || !werks) {
    return res.status(400).json({ error: "wb_ticket and werks are required" });
  }
  try {
    const pool = await poolPromise;
    const inResult = await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .input("werks", sql.VarChar, werks)
      .query(`
        SELECT CPLATE, ZSAPFLAG FROM [dbo].[WB_IN]
        WHERE WB_TICKET = @wb_ticket AND WERKS = @werks
      `);
    res.json(inResult.recordset[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching car plate details from WB_IN.");
  }
};

// Get WERKS from WB_IN by WB_TICKET
const getWerksByTicket = async (req, res) => {
  let { wb_ticket } = req.query;

  if (!wb_ticket) {
    return res.status(400).json({ error: "wb_ticket is required" });
  }

  wb_ticket = wb_ticket.trim();
  console.log("getWerksByTicket called with wb_ticket:", wb_ticket, "type:", typeof wb_ticket);

  try {
    const pool = await poolPromise;
    const sqlQuery = `SELECT DISTINCT WERKS FROM [dbo].[WB_IN] WHERE WB_TICKET = @wb_ticket`;
    console.log("Running SQL:", sqlQuery, "with wb_ticket:", wb_ticket);

    const result = await pool
      .request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .query(sqlQuery);

    console.log("Raw SQL result:", result);
    console.log("Query Results:", result.recordset);

    res.json(result.recordset.map((r) => r.WERKS));
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Error fetching WERKS by ticket", details: err.message });
  }
};

// Get MWERKS from WB_OUT by WB_TICKET
const getMWerksByTicket = async (req, res) => {
  const { wb_ticket } = req.query;
  if (!wb_ticket) {
    return res.status(400).json({ error: "wb_ticket is required" });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("wb_ticket", sql.VarChar, wb_ticket)
      .query(`SELECT DISTINCT MWERKS FROM [dbo].[WB_OUT] WHERE WB_TICKET = @wb_ticket`);
    res.json(result.recordset.map(r => r.MWERKS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching MWERKS by ticket", details: err.message });
  }
};

// Export all functions as named exports
module.exports = {
    getMWerks,
    getWerks,
    updateCarPlateOut,
    updateCarPlateIn,
    viewCarPlateOut,
    viewCarPlateIn,
    getWerksByTicket,
    getMWerksByTicket
};
