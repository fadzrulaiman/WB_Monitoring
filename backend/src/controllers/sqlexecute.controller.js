import { execute as executeQuery, poolPromise, sql } from '../core/db.js';

const isExecutorEnabled = process.env.ENABLE_SQL_EXECUTOR === 'true';
const pendingUpdateByUser = new Map();
const pendingUpdateTtlMs = Number(process.env.SQL_UPDATE_PENDING_TTL_MS || 120000);

function hasMultipleStatements(query) {
  const sanitized = query
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  const withoutTrailingSemicolon = sanitized.replace(/;\s*$/, '');
  return withoutTrailingSemicolon.includes(';');
}

export const commitUpdate = async (req, res) => {
  if (!isExecutorEnabled) {
    return res.status(403).json({ error: 'SQL executor is disabled.' });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user context.' });
  }

  const pending = pendingUpdateByUser.get(userId);
  if (!pending) {
    return res.status(404).json({ error: 'No pending update to commit.' });
  }

  try {
    await pending.transaction.commit();
    clearTimeout(pending.timer);
    pendingUpdateByUser.delete(userId);
    return res.json({ message: 'Pending update committed successfully.', rowsAffected: pending.rowsAffected });
  } catch (err) {
    console.error(err);
    clearTimeout(pending.timer);
    pendingUpdateByUser.delete(userId);
    return res.status(500).json({ error: 'Failed to commit pending update.', details: err.message });
  }
};

export const rollbackUpdate = async (req, res) => {
  if (!isExecutorEnabled) {
    return res.status(403).json({ error: 'SQL executor is disabled.' });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user context.' });
  }

  const pending = pendingUpdateByUser.get(userId);
  if (!pending) {
    return res.status(404).json({ error: 'No pending update to rollback.' });
  }

  try {
    await pending.transaction.rollback();
    clearTimeout(pending.timer);
    pendingUpdateByUser.delete(userId);
    return res.json({ message: 'Pending update rolled back successfully.', rowsAffected: pending.rowsAffected });
  } catch (err) {
    console.error(err);
    clearTimeout(pending.timer);
    pendingUpdateByUser.delete(userId);
    return res.status(500).json({ error: 'Failed to rollback pending update.', details: err.message });
  }
};

export const execute = async (req, res) => {
  if (!isExecutorEnabled) {
    return res.status(403).json({ error: 'SQL executor is disabled.' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!/^\s*(select|update)\b/i.test(query)) {
    return res.status(403).json({ error: 'Only SELECT and UPDATE queries are allowed.' });
  }

  if (hasMultipleStatements(query)) {
    return res.status(400).json({ error: 'Only a single SELECT or UPDATE statement is allowed.' });
  }

  try {
    const isUpdate = /^\s*update\b/i.test(query);
    if (isUpdate) {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized user context.' });
      }
      if (pendingUpdateByUser.has(userId)) {
        return res.status(409).json({
          error: 'You already have a pending UPDATE. Commit or rollback it before running another UPDATE.',
        });
      }

      const pool = await poolPromise;
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const request = new sql.Request(transaction);
        const result = await request.query(query);
        const affected = Array.isArray(result.rowsAffected)
          ? result.rowsAffected.reduce((sum, n) => sum + Number(n || 0), 0)
          : 0;

        const timer = setTimeout(async () => {
          const pending = pendingUpdateByUser.get(userId);
          if (!pending) {
            return;
          }
          try {
            await pending.transaction.commit();
          } catch (err) {
            console.error('Auto-commit failed for pending UPDATE:', err);
          } finally {
            clearTimeout(pending.timer);
            pendingUpdateByUser.delete(userId);
          }
        }, pendingUpdateTtlMs);

        pendingUpdateByUser.set(userId, { transaction, timer, rowsAffected: affected });

        return res.json([{
          rowsAffected: affected,
          status: 'PENDING_UPDATE',
          ttlSeconds: Math.floor(pendingUpdateTtlMs / 1000),
          message: 'UPDATE is pending. Commit to persist or rollback to revert.',
        }]);
      } catch (err) {
        try {
          await transaction.rollback();
        } catch (rollbackErr) {
          console.error('Rollback failed after UPDATE error:', rollbackErr);
        }
        throw err;
      }
    }

    const result = await executeQuery(query);

    res.json(Array.isArray(result.recordset) ? result.recordset : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SQL execution error', details: err.message });
  }
};
