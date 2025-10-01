import React, { useState } from "react";
import axios from "../api/axios";

const PAGE_SIZE = 25;
const isSqlExecutorEnabled = (import.meta.env.VITE_ENABLE_SQL_EXECUTOR ?? 'false') === 'true';

const SQLExecute = () => {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

    if (!isSqlExecutorEnabled) {
        return (
            <div className="page-container">
                <h2 style={{ color: "var(--primary)", marginBottom: 24 }}>SQL SELECT Executor</h2>
                <div className="message" style={{ color: "var(--danger)" }}>
                    This tool is disabled. Contact an administrator if you believe this is an error.
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResult(null);
        setPage(1);
        try {
            const res = await axios.post("sqlexecute", { query });
            setResult(res.data);
        } catch (err) {
            let msg = err.response?.data?.error || "Execution error";
            if (err.response?.data?.details) {
                msg += ": " + err.response.data.details;
            }
            setError(msg);
        }
    };

    const renderTable = (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            return <div className="message" style={{ color: "#d32f2f" }}>No data.</div>;
        }
        const columns = Object.keys(data[0]);
        const startIdx = (page - 1) * PAGE_SIZE;
        const pageRows = data.slice(startIdx, startIdx + PAGE_SIZE);
        const totalPages = Math.ceil(data.length / PAGE_SIZE);

        return (
            <div>
                <table className="tickets-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((row, idx) => (
                            <tr key={idx}>
                                {columns.map(col => (
                                    <td key={col}>
                                        {row[col] !== null && row[col] !== undefined ? row[col].toString() : ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <button
                        className="btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Prev
                    </button>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="page-container">
            <h2 style={{ color: "var(--primary)", marginBottom: 24 }}>SQL SELECT Executor</h2>
            <form className="search-form" onSubmit={handleSubmit}>
                <label style={{ flex: 1 }}>
                    SQL Query
                    <textarea
                        rows={4}
                        cols={60}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Enter SELECT query (e.g., SELECT * FROM Users)"
                        required
                        style={{ fontFamily: "monospace", fontSize: 15, marginTop: 6, width: "100%" }}
                    />
                </label>
                <button type="submit" className="btn" style={{ height: 40, marginTop: 18 }}>Execute</button>
            </form>
            {error && (
                <div className="message" style={{ color: "var(--danger)", marginTop: 10 }}>
                    {error}
                </div>
            )}
            {result && (
                <div style={{ marginTop: 20 }}>
                    <h4 style={{ marginBottom: 12 }}>Result</h4>
                    {renderTable(result)}
                </div>
            )}
        </div>
    );
};

export default SQLExecute;



