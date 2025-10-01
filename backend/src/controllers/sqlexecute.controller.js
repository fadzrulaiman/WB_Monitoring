import { execute as executeQuery } from '../core/db.js';

const isExecutorEnabled = process.env.ENABLE_SQL_EXECUTOR === 'true';

function hasMultipleStatements(query) {
  const sanitized = query
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  const withoutTrailingSemicolon = sanitized.replace(/;\s*$/, '');
  return withoutTrailingSemicolon.includes(';');
}

export const execute = async (req, res) => {
  if (!isExecutorEnabled) {
    return res.status(403).json({ error: 'SQL executor is disabled.' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!/^\s*select\b/i.test(query)) {
    return res.status(403).json({ error: 'Only SELECT queries are allowed.' });
  }

  if (hasMultipleStatements(query)) {
    return res.status(400).json({ error: 'Only a single SELECT statement is allowed.' });
  }

  try {
    const result = await executeQuery(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'SQL execution error', details: err.message });
  }
};
