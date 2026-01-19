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
    const { dateFrom, dateTo } = req.query;
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      return res.status(400).json({ error: 'dateFrom and dateTo must be provided together' });
    }
    const pool = await poolPromise;
    const request = pool.request().input('mwerks', sql.VarChar, req.query.mwerks);
    let query = `
      SELECT DISTINCT WB_TICKET FROM [dbo].[WB_OUT]
      WHERE MWERKS = @mwerks
    `;
    if (dateFrom && dateTo) {
      request.input('dateFrom', sql.Date, dateFrom).input('dateTo', sql.Date, dateTo);
      query += ' AND CAST(WBDATE_IN AS DATE) BETWEEN @dateFrom AND @dateTo';
    }
    query += ' ORDER BY WB_TICKET';
    const result = await request.query(query);
    res.json(Array.isArray(result.recordset) ? result.recordset.map((r) => r.WB_TICKET) : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching WB_TICKET', details: err.message });
  }
};

export const updateBargeQuantity = async (req, res) => {
  const { wb_ticket, grossqty, netqty, mwerks } = req.body;
  const isMissing = (value) => value === undefined || value === null || value === '';
  if (isMissing(wb_ticket) || isMissing(grossqty) || isMissing(netqty) || isMissing(mwerks)) {
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
  const { wb_ticket, mwerks, dateFrom, dateTo } = req.query;
  if (!wb_ticket || !mwerks) {
    return res.status(400).json({ error: 'wb_ticket and mwerks are required' });
  }
  if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
    return res.status(400).json({ error: 'dateFrom and dateTo must be provided together' });
  }
  try {
    const pool = await poolPromise;
    const request = pool
      .request()
      .input('wb_ticket', sql.VarChar, wb_ticket)
      .input('mwerks', sql.VarChar, mwerks);
    let query = `
      SELECT GROSS_QTY, NETBG_QTY, ZWB_TRXTYP, ZSAPFLAG FROM [dbo].[WB_OUT]
      WHERE WB_TICKET = @wb_ticket AND MWERKS = @mwerks
    `;
    if (dateFrom && dateTo) {
      request.input('dateFrom', sql.Date, dateFrom).input('dateTo', sql.Date, dateTo);
      query += ' AND CAST(WBDATE_IN AS DATE) BETWEEN @dateFrom AND @dateTo';
    }
    const outResult = await request.query(query);
    res.json(outResult.recordset[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching barge quantity from WB_OUT.');
  }
};
