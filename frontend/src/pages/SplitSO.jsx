import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { FaSearch, FaCheck, FaSyncAlt, FaExclamationTriangle } from "react-icons/fa";
import "../App.css";

const SplitSO = () => {
  const [mwerksList, setMWerksList] = useState([]);
  const [mwerks, setMWerks] = useState("");
  const [date, setDate] = useState("");
  const [wbTickets, setWbTickets] = useState([]);
  const [wbTicket, setWbTicket] = useState("");
  const [ticketDetail, setTicketDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [amending, setAmending] = useState(false);
  const [vbeln1, setVbeln1] = useState(""); // Add state for vbeln_1

  // Converts 'MM/DD/YYYY' or 'DD/MM/YYYY' to 'YYYY-MM-DD'
  function toISODate(str) {
    if (!str) return "";
    const parts = str.split("-");
    if (parts.length === 3 && parts[0].length === 4) return str; // already ISO
    // If input is 'YYYY-MM-DD', return as is
    // If input is 'MM/DD/YYYY' or 'DD/MM/YYYY', convert
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toISOString().slice(0, 10);
  }

  // Fetch MWERKS on mount
  useEffect(() => {
    axios
      .get("split-so/mwerks")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setMWerksList(res.data);
        } else if (res.data && Array.isArray(res.data.mwerks)) {
          setMWerksList(res.data.mwerks);
        } else {
          setMWerksList([]);
        }
      })
      .catch(() => setMWerksList([]));
  }, []);

  // Fetch WB_TICKETs when MWERKS and date are selected
  useEffect(() => {
    setWbTicket("");
    setWbTickets([]);
    setTicketDetail(null);
    setMessage("");
    setError("");
    if (mwerks && date) {
      const isoDate = toISODate(date);
      axios
        .get("split-so/wb-tickets", {
          params: { mwerks, WBDATE_IN: isoDate },
        })
        .then((res) => {
          setWbTickets(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setWbTickets([]));
    }
  }, [mwerks, date]);

  // Clear ticket detail and message when ticket changes
  useEffect(() => {
    setTicketDetail(null);
    setMessage("");
    setError("");
  }, [wbTicket]);

  // Table sorting
  const sortedTicketDetail = React.useMemo(() => {
    if (!ticketDetail || !sortKey) return ticketDetail;
    const sorted = { ...ticketDetail };
    // For a single row, sorting is not needed, but if you display multiple rows, implement sorting here.
    return sorted;
  }, [ticketDetail, sortKey, sortAsc]);

  // Validation for search
  const validateSearchForm = () => {
    if (!mwerks) {
      setError("MWERKS is required.");
      return false;
    }
    if (!date) {
      setError("WBDATE_IN is required.");
      return false;
    }
    if (!wbTicket) {
      setError("WB_TICKET is required.");
      return false;
    }
    setError("");
    return true;
  };

  // Validation for amend
  const validateAmendForm = () => {
    if (!mwerks) {
      setError("MWERKS is required.");
      return false;
    }
    if (!date) {
      setError("WBDATE_IN is required.");
      return false;
    }
    if (!wbTicket) {
      setError("WB_TICKET is required.");
      return false;
    }
    if (!vbeln1 || isNaN(Number(vbeln1))) {
      setError("VBELN_1 is required and must be a number.");
      return false;
    }
    setError("");
    return true;
  };

  // Confirmation dialog
  const handleAmend = async () => {
    if (!validateAmendForm()) return;
    const confirmed = window.confirm("Are you sure you want to amend to Single SO?");
    if (!confirmed) return;

    setAmending(true);
    setMessage("");
    setError("");

    try {
      await axios.post("split-so/amend-single-so", {
        mwerks,
        wb_ticket: wbTicket,
        vbeln_1: vbeln1, // Pass vbeln_1
      });

      setMessage("Splitting amended to single SO successfully.");
      setShowMessage(true);

      // Refresh the data
      await handleSearch(new Event("submit"));

      // Hide message after 3 seconds
      setTimeout(() => setShowMessage(false), 3000);
    } catch (err) {
      console.error("Amend error:", err);
      setError("Error amending splitting: " + (err?.response?.data?.message || err.message));
    } finally {
      setAmending(false);
    }
  };

  // Search for ticket detail
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!validateSearchForm()) return;
    setLoading(true);
    setMessage("");
    setError("");
    setTicketDetail(null);
    try {
      const res = await axios.post("split-so/search", {
        mwerks,
        dateFrom: date,
        dateTo: date,
        wb_ticket: wbTicket,
      });
      setTicketDetail(res.data && res.data.length > 0 ? res.data[0] : null);
      if (!res.data || res.data.length === 0) {
        setError("No ticket found for the selected criteria.");
      }
    } catch {
      setError("Error searching ticket.");
    }
    setLoading(false);
  };

  // Table header click for sorting (future-proof for multiple rows)
  const handleSort = (key) => {
    setSortKey(key);
    setSortAsc((asc) => (sortKey === key ? !asc : true));
  };

  return (
    <div className="page-container">
      <h2>
        <FaSyncAlt className="icon" /> Split SO - Amend to Single SO
      </h2>
      <form className="search-form" onSubmit={handleSearch} noValidate>
        <label>
          MWERKS:
          <select
            value={mwerks}
            onChange={(e) => setMWerks(e.target.value)}
            required
            className={error && !mwerks ? "input-error" : ""}
          >
            <option value="">Select MWERKS</option>
            {mwerksList.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label>
          WBDATE_IN:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={error && !date ? "input-error" : ""}
          />
        </label>
        <label>
          WB_TICKET:
          <select
            value={wbTicket}
            onChange={(e) => setWbTicket(e.target.value)}
            required
            disabled={!mwerks || !date}
            className={error && !wbTicket ? "input-error" : ""}
          >
            <option value="">Select WB_TICKET</option>
            {wbTickets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {mwerks && date && wbTickets.length === 0 && (
            <span style={{ color: "red", fontSize: 12 }}>
              <FaExclamationTriangle className="icon" /> No tickets found.
            </span>
          )}
        </label>
        <button
          type="submit"
          className="btn btn-icon"
          disabled={loading || !mwerks || !date || !wbTicket}
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
      {ticketDetail && (
        <div style={{ marginTop: 24 }}>
          <h4>
            <FaSearch className="icon" /> Ticket Detail
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table className="tickets-table">
              <thead>
                <tr>
                  {Object.keys(ticketDetail).map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      style={{ cursor: "pointer" }}
                    >
                      {key}
                      {sortKey === key && (sortAsc ? " ▲" : " ▼")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="selected">
                  {Object.values(ticketDetail).map((val, idx) => (
                    <td key={idx}>{val}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <form className="search-form" onSubmit={e => { e.preventDefault(); handleAmend(); }} style={{ marginTop: 16 }}>
            <label>
              VBELN_1:
              <input
                type="number"
                value={vbeln1}
                onChange={e => setVbeln1(e.target.value)}
                required
                min={1}
                step={1}
                placeholder="Enter VBELN_1"
                style={{ width: 180 }}
              />
            </label>
            <button
              className="btn btn-success btn-icon"
              style={{ marginTop: 0 }}
              disabled={loading || amending || !vbeln1 || isNaN(Number(vbeln1))}
              type="submit"
            >
              <FaCheck className="icon" />
              {amending ? (
                <>
                  <span className="spinner" /> Amending...
                </>
              ) : (
                "Amend to Single SO"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SplitSO;



