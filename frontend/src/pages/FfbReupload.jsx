import React, { useEffect, useMemo, useState } from "react";
import axios from "../api/axios";
import { FaSearch, FaCheck, FaExclamationTriangle, FaRedo } from "react-icons/fa";
import "../App.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    axios
      .get("ffb-reupload/werks")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setWerksList(data);
        } else if (data && Array.isArray(data.werks)) {
          setWerksList(data.werks);
        } else {
          setWerksList([]);
        }
      })
      .catch(() => setWerksList([]));
  }, []);

  const sortedTickets = useMemo(() => {
    if (!sortKey) return tickets;
    const sorted = [...tickets].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [tickets, sortKey, sortAsc]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tickets, sortKey, sortAsc, rowsPerPage]);

  const pagination = useMemo(() => {
    const totalTickets = sortedTickets.length;

    if (!totalTickets) {
      return {
        paginatedTickets: [],
        totalTickets: 0,
        totalPages: 1,
        currentPage: 1,
        rangeStart: 0,
        rangeEnd: 0,
      };
    }

    const totalPages = Math.ceil(totalTickets / rowsPerPage);
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalTickets);

    return {
      paginatedTickets: sortedTickets.slice(startIndex, endIndex),
      totalTickets,
      totalPages,
      currentPage: safePage,
      rangeStart: startIndex + 1,
      rangeEnd: endIndex,
    };
  }, [sortedTickets, currentPage, rowsPerPage]);

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
    setShowMessage(false);
    setTickets([]);

    try {
      const res = await axios.post("ffb-reupload/search", { werks, dateFrom, dateTo });
      const data = Array.isArray(res.data) ? res.data : [];
      setTickets(data);
      if (!data.length) {
        setError("No tickets found for the selected criteria.");
      } else {
        setError("");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching tickets.");
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = async () => {
    if (!validateForm()) return;
    const confirmed = window.confirm("Are you sure you want to reset the selected tickets?");
    if (!confirmed) return;

    setReuploading(true);
    setError("");
    setMessage("");

    try {
      await axios.post("ffb-reupload/reupload", { werks, dateFrom, dateTo });
      setMessage("Tickets flagged for reupload successfully.");
      setShowMessage(true);
    } catch (err) {
      console.error(err);
      setError("Failed to trigger reupload.");
    } finally {
      setReuploading(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handlePageChange = (nextPage) => {
    if (
      pagination.totalTickets === 0 ||
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === pagination.currentPage
    ) {
      return;
    }
    setCurrentPage(nextPage);
  };

  const handleRowsPerPageChange = (event) => {
    const nextValue = Number(event.target.value);
    if (!Number.isNaN(nextValue)) {
      setRowsPerPage(nextValue);
      setCurrentPage(1);
    }
  };

  const renderTable = () => {
    if (!sortedTickets.length) {
      return (
        <div className="message" style={{ color: "#d32f2f" }}>
          <FaExclamationTriangle className="icon" /> No tickets available.
        </div>
      );
    }

    const {
      paginatedTickets,
      currentPage: activePage,
      totalPages,
      totalTickets,
      rangeStart,
      rangeEnd,
    } = pagination;

    const columns = Object.keys(sortedTickets[0] ?? {});

    return (
      <div className="tickets-table-wrapper">
        <div className="tickets-table-container">
          <table className="tickets-table tickets-table--ffb">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} onClick={() => handleSort(col)} style={{ cursor: "pointer" }}>
                    {col}
                    {sortKey === col && (sortAsc ? " ^" : " v")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((ticket, idx) => (
                <tr key={`${activePage}-${rangeStart + idx}`}>
                  {columns.map((col) => (
                    <td key={col}>{ticket[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tickets-pagination">
          <div className="tickets-pagination__info">
            {totalTickets
              ? `Showing ${rangeStart}-${rangeEnd} of ${totalTickets}`
              : "Showing 0 of 0"}
          </div>
          <div className="tickets-pagination__controls">
            <button
              type="button"
              className="btn btn-pagination"
              onClick={() => handlePageChange(1)}
              disabled={activePage === 1}
            >
              First
            </button>
            <button
              type="button"
              className="btn btn-pagination"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
            >
              Prev
            </button>
            <span className="tickets-pagination__page-indicator">
              Page {activePage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-pagination"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
            >
              Next
            </button>
            <button
              type="button"
              className="btn btn-pagination"
              onClick={() => handlePageChange(totalPages)}
              disabled={activePage === totalPages}
            >
              Last
            </button>
          </div>
          <label className="tickets-pagination__page-size">
            Rows per page
            <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  const safeWerksList = Array.isArray(werksList) ? werksList : [];

  return (
    <div className="page-container">
      <h2 style={{ color: "var(--primary)", marginBottom: 24 }}>
        FFB Ticket Reupload
      </h2>

      <form className="search-form" onSubmit={handleSearch}>
        <label>
          WERKS:
          <select
            value={werks}
            onChange={(e) => setWerks(e.target.value)}
            required
            className={error && !werks ? "input-error" : ""}
          >
            <option value="">Select WERKS</option>
            {safeWerksList.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date From:
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            required
            className={error && !dateFrom ? "input-error" : ""}
          />
        </label>

        <label>
          Date To:
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            required
            className={error && !dateTo ? "input-error" : ""}
          />
        </label>

        <button
          type="submit"
          className="btn btn-icon"
          disabled={loading}
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

      {(showMessage || message) && !error && (
        <div className="message">
          <FaCheck className="icon" /> {message}
        </div>
      )}

      {renderTable()}

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button
          type="button"
          className="btn btn-success btn-icon"
          disabled={reuploading || !tickets.length}
          onClick={handleReupload}
        >
          <FaRedo className="icon" />
          {reuploading ? (
            <>
              <span className="spinner" /> Reuploading...
            </>
          ) : (
            "Flag Tickets for Reupload"
          )}
        </button>
        {loading && (
          <div className="loading">
            <span className="spinner" /> Fetching tickets...
          </div>
        )}
      </div>
    </div>
  );
};

export default FfbReupload;
