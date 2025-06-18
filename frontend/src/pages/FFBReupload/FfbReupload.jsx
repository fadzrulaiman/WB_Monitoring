import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaCheck, FaSyncAlt, FaExclamationTriangle, FaRedo } from "react-icons/fa";
import "../../App.css";

const FfbReupload = () => {
  const [werksList, setWerksList] = useState([]);
  const [werks, setWerks] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [reuploading, setReuploading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    axios.get("/api/ffb-reupload/werks")
      .then(res => setWerksList(res.data))
      .catch(() => setWerksList([]));
  }, []);

  // Table sorting
  const sortedTickets = React.useMemo(() => {
    if (!sortKey) return tickets;
    const sorted = [...tickets].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [tickets, sortKey, sortAsc]);

  // Form validation
  const validateForm = () => {
    if (!werks) {
      setError("WERKS is required.");
      return false;
    }
    if (!dateFrom) {
      setError("Date From is required.");
      return false;
    }
    if (!dateTo) {
      setError("Date To is required.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await axios.post("/api/ffb-reupload/search", { werks, dateFrom, dateTo });
      setTickets(res.data);
      if (!res.data || res.data.length === 0) {
        setError("No tickets found for the selected criteria.");
      }
    } catch {
      setTickets([]);
      setError("Error fetching tickets.");
    }
    setLoading(false);
  };

  const handleReupload = async () => {
    if (!window.confirm("Are you sure you want to reupload these tickets?")) return;
    setReuploading(true);
    setMessage("");
    setError("");
    try {
      await axios.post("/api/ffb-reupload/reupload", { werks, dateFrom, dateTo });
      setMessage("FFB tickets reuploaded successfully.");
      setShowMessage(true);
      // Refresh the data
      await handleSearch(new Event("submit"));
      setTimeout(() => setShowMessage(false), 3000);
    } catch {
      setError("Error reuploading tickets.");
    }
    setReuploading(false);
  };

  const handleSort = (key) => {
    setSortKey(key);
    setSortAsc((asc) => (sortKey === key ? !asc : true));
  };

  return (
    <div className="page-container">
      <h2>
        <FaSyncAlt className="icon" /> FFB Reupload
      </h2>
      <form onSubmit={handleSearch} className="search-form" noValidate>
        <label>
          WERKS:
          <select
            value={werks}
            onChange={e => setWerks(e.target.value)}
            required
            className={error && !werks ? "input-error" : ""}
          >
            <option value="">Select WERKS</option>
            {werksList.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
        <label>
          Date From:
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            required
            className={error && !dateFrom ? "input-error" : ""}
          />
        </label>
        <label>
          Date To:
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            required
            className={error && !dateTo ? "input-error" : ""}
          />
        </label>
        <button
          type="submit"
          className="btn btn-icon"
          disabled={loading || !werks || !dateFrom || !dateTo}
        >
          <FaSearch className="icon" />
          {loading ? (
            <>
              <span className="spinner" /> Searching...
            </>
          ) : (
            "Search"
          )}
        </button>
      </form>
      {error && (
        <div className="message" style={{ color: "#d32f2f" }}>
          <FaExclamationTriangle className="icon" /> {error}
        </div>
      )}
      {(showMessage || message) && (
        <div className="message">
          <FaCheck className="icon" /> {message}
        </div>
      )}
      {loading && (
        <div className="loading">
          <span className="spinner" /> Processing...
        </div>
      )}
      {tickets.length > 0 && (
        <>
          <button
            className="btn btn-success btn-icon"
            onClick={handleReupload}
            disabled={loading || reuploading}
            type="button"
            style={{ marginBottom: 8 }}
          >
            <FaRedo className="icon" />
            {reuploading ? (
              <>
                <span className="spinner" /> Reuploading...
              </>
            ) : (
              "Reupload"
            )}
          </button>
          <div style={{ overflowX: "auto" }}>
            <table className="tickets-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("WB_TICKET")} style={{ cursor: "pointer" }}>
                    Ticket No {sortKey === "WB_TICKET" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("WERKS")} style={{ cursor: "pointer" }}>
                    WERKS {sortKey === "WERKS" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("WB_DATE_IN")} style={{ cursor: "pointer" }}>
                    WB_DATE_IN {sortKey === "WB_DATE_IN" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("ZSAPFLAG")} style={{ cursor: "pointer" }}>
                    ZSAPFLAG {sortKey === "ZSAPFLAG" && (sortAsc ? "▲" : "▼")}
                  </th>
                  {/* Add more columns as needed */}
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.WB_TICKET}</td>
                    <td>{t.WERKS}</td>
                    <td>{t.WB_DATE_IN?.slice(0, 10)}</td>
                    <td>{t.ZSAPFLAG}</td>
                    {/* Add more columns as needed */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FfbReupload;
