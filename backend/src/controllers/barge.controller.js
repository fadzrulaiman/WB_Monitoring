import { sql, poolPromise } from '../core/db.js';

export const getMWerks = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT DISTINCT MWERKS FROM [dbo].[WB_OUT] ORDER BY MWERKS');
    res.json(Array.isArray(result.recordset) ? result.recordset.map((r) => r.MWERKS) : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching MWERKS', details: err.message });
  }
};

export const getwbticket = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('mwerks', sql.VarChar, req.query.mwerks)
      .query(`
        SELECT DISTINCT WB_TICKET FROM [dbo].[WB_OUT]
        WHERE MWERKS = @mwerks ORDER BY WB_TICKET
      `);
    res.json(Array.isArray(result.recordset) ? result.recordset.map((r) => r.WB_TICKET) : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching WB_TICKET', details: err.message });
  }
};

export const updateBargeQuantity = async (req, res) => {
  const { wb_ticket, grossqty, netqty, mwerks } = req.body;
  if (!wb_ticket || !grossqty || !netqty || !mwerks) {
    return res.status(400).json({ error: 'wb_ticket, grossqty, netqty, and mwerks are required' });
  }
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('wb_ticket', sql.VarChar, wb_ticket)
      .input('grossqty', sql.VarChar, grossqty)
      .input('netqty', sql.VarChar, netqty)
      .input('mwerks', sql.VarChar, mwerks)
      .query(`
        UPDATE [dbo].[WB_OUT]
        SET [GROSS_QTY] = @grossqty, [NETBG_QTY] = @netqty, [ZSAPFLAG] = 'N'
        WHERE MWERKS = @mwerks AND WB_TICKET = @wb_ticket
      `);
    res.send('Barge quantity updated successfully in WB_OUT.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating barge quantity in WB_OUT.');
  }
};

export const viewBargeQuantity = async (req, res) => {
  const { wb_ticket, mwerks } = req.query;
  if (!wb_ticket || !mwerks) {
    return res.status(400).json({ error: 'wb_ticket and mwerks are required' });
  }
  try {
    const pool = await poolPromise;
    const outResult = await pool
      .request()
      .input('wb_ticket', sql.VarChar, wb_ticket)
      .input('mwerks', sql.VarChar, mwerks)
      .query(`
        SELECT GROSS_QTY, NETBG_QTY, ZSAPFLAG FROM [dbo].[WB_OUT]
        WHERE WB_TICKET = @wb_ticket AND MWERKS = @mwerks
      `);
    res.json(outResult.recordset[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching barge quantity from WB_OUT.');
  }
};
