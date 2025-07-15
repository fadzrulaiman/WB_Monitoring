const db = require('../core/db');

// Example: POST /api/sqlexecute
// Body: { query: "SELECT * FROM Users WHERE id = @id", params: [{ name: "id", type: "Int", value: 1 }] }
exports.execute = async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }
    // Only allow SELECT queries (case-insensitive, trims leading whitespace)
    if (!/^\s*select\b/i.test(query)) {
        return res.status(403).json({ error: "Only SELECT queries are allowed." });
    }
    try {
        // No parameters, just execute the query
        const result = await db.execute(query);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SQL execution error", details: err.message });
    }
};
