import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { FaSearch, FaEdit, FaCheck, FaExclamationTriangle, FaSyncAlt } from "react-icons/fa";
import "../App.css";

const BargeUpdate = () => {
  const [mwerksList, setMWerksList] = useState([]);
  const [mwerks, setMWerks] = useState("");
  const [wbTicketList, setWbTicketList] = useState([]);
  const [wbTicket, setWbTicket] = useState("");
  const [viewResult, setViewResult] = useState(null);
  const [grossQty, setGrossQty] = useState("");
  const [netQty, setNetQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Fetch MWERKS on mount
  useEffect(() => {
    axios.get("barge-update/mwerks")
      .then(res => setMWerksList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMWerksList([]));
  }, []);

  // Fetch WB_TICKETs when MWERKS changes
  useEffect(() => {
    if (mwerks) {
      axios.get("barge-update/wb-ticket", { params: { mwerks } })
        .then(res => setWbTicketList(Array.isArray(res.data) ? res.data : []))
        .catch(() => setWbTicketList([]));
      setWbTicket("");
      setViewResult(null);
      setGrossQty("");
      setNetQty("");
    } else {
      setWbTicketList([]);
      setWbTicket("");
      setViewResult(null);
      setGrossQty("");
      setNetQty("");
    }
  }, [mwerks]);

  // View barge quantity
  const handleView = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setViewResult(null);
    setGrossQty("");
    setNetQty("");
    try {
      const res = await axios.get("barge-update/view-quantity", {
        params: { wb_ticket: wbTicket, mwerks }
      });
      setViewResult(res.data);
      if (res.data) {
        setGrossQty(res.data?.GROSS_QTY ?? "");
        setNetQty((res.data?.NETBG_QTY ?? res.data?.NETGB_QTY) ?? "");
      } else {
        setError("No data found for the selected MWERKS and WB_TICKET.");
      }
    } catch (err) {
      setError("Error fetching barge quantity.");
    }
    setLoading(false);
  };

  // Update barge quantity
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to update the quantities?")) return;
    setUpdating(true);
    setError("");
    setMessage("");
    try {
      await axios.post("barge-update/update-quantity", {
        wb_ticket: wbTicket,
        grossqty: grossQty,
        netqty: netQty,
        mwerks,
      });
      setMessage("Barge quantity updated successfully.");
      setShowMessage(true);
      // Refresh view after update
      await handleView(new Event("submit"));
      setTimeout(() => setShowMessage(false), 3000);
    } catch (err) {
      setError("Error updating barge quantity.");
    }
    setUpdating(false);
  };

  return (
    <div className="page-container">
      <h2>
        <FaEdit className="icon" /> Barge Quantity Update
      </h2>
      <form className="search-form" onSubmit={handleView} noValidate>
        <label>
          MWERKS:
          <select value={mwerks} onChange={e => setMWerks(e.target.value)} required>
            <option value="">Select MWERKS</option>
            {mwerksList.map(mw => (
              <option key={mw} value={mw}>{mw}</option>
            ))}
          </select>
        </label>
        <label>
          WB_TICKET:
          <select
            value={wbTicket}
            onChange={e => setWbTicket(e.target.value)}
            required
            disabled={!mwerks || wbTicketList.length === 0}
          >
            <option value="">
              {mwerks
                ? wbTicketList.length === 0
                  ? "No WB_TICKET found"
                  : "Select WB_TICKET"
                : "Select MWERKS first"}
            </option>
            {wbTicketList.map(wb => (
              <option key={wb} value={wb}>{wb}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="btn btn-icon"
          disabled={loading || !mwerks || !wbTicket}
        >
          <FaSearch className="icon" />
          {loading ? (
            <>
              <span className="spinner" /> Searching...
            </>
          ) : (
            "View"
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
      {viewResult && (
        <div style={{ marginTop: 24 }}>
          <h4>
            <FaSyncAlt className="icon" /> Barge Quantity Info
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>GROSS_QTY</th>
                  <th>NETGB_QTY</th>
                  <th>ZSAPFLAG</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{viewResult?.GROSS_QTY ?? "-"}</td>
                  <td>{(viewResult?.NETBG_QTY ?? viewResult?.NETGB_QTY) ?? "-"}</td>
                  <td>{viewResult?.ZSAPFLAG ?? "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <form className="search-form" onSubmit={handleUpdate} style={{ marginTop: 32 }}>
        <label>
          GROSS_QTY:
          <input
            type="number"
            value={grossQty}
            onChange={e => setGrossQty(e.target.value)}
            required
            min="0"
            step="any"
          />
        </label>
        <label>
          NETGB_QTY:
          <input
            type="number"
            value={netQty}
            onChange={e => setNetQty(e.target.value)}
            required
            min="0"
            step="any"
          />
        </label>
        <button
          type="submit"
          className="btn btn-success btn-icon"
          disabled={
            updating ||
            !mwerks ||
            !wbTicket ||
            !grossQty ||
            !netQty
          }
        >
          <FaEdit className="icon" />
          {updating ? (
            <>
              <span className="spinner" /> Updating...
            </>
          ) : (
            "Update Quantity"
          )}
        </button>
      </form>
    </div>
  );
};

export default BargeUpdate;


