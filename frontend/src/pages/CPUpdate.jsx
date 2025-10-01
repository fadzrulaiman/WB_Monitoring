import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { FaSearch, FaCheck, FaEdit, FaExclamationTriangle, FaSyncAlt } from "react-icons/fa";
import "../App.css";

const CPUpdate = () => {
  const [wbTicket, setWbTicket] = useState("");
  const [cplate, setCPlate] = useState("");
  const [viewResult, setViewResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // State for table selection and dropdowns
  const [table, setTable] = useState("");
  const [plantList, setPlantList] = useState([]);
  const [plant, setPlant] = useState("");
  const [plantLoading, setPlantLoading] = useState(false);

  // Reset on table change
  useEffect(() => {
    setWbTicket("");
    setPlantList([]);
    setPlant("");
    setViewResult(null);
    setError("");
  }, [table]);

  // Fetch plant list after WB_TICKET is entered and table is selected
  useEffect(() => {
    if (!table || !wbTicket) {
      setPlantList([]);
      setPlant("");
      return;
    }
    setPlantLoading(true);
    setPlant("");
    const url =
      table === "WB_IN"
        ? "cp-update/werks-by-ticket"
        : "cp-update/mwerks-by-ticket";
    axios
      .get(url, { params: { wb_ticket: wbTicket.trim() } })
      .then((res) => {
        setPlantList(Array.isArray(res.data) ? res.data : []);
        setPlantLoading(false);
      })
      .catch((err) => {
        setPlantList([]);
        setPlantLoading(false);
      });
  }, [table, wbTicket]);

  // View car plate info
  const handleView = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setViewResult(null);
    try {
      let res;
      if (table === "WB_OUT") {
        if (!plant) {
          setError("Please select MWERKS.");
          setLoading(false);
          return;
        }
        res = await axios.get("cp-update/view-car-plate-out", {
          params: { wb_ticket: wbTicket, mwerks: plant }
        });
      } else if (table === "WB_IN") {
        if (!plant) {
          setError("Please select WERKS.");
          setLoading(false);
          return;
        }
        res = await axios.get("cp-update/view-car-plate-in", {
          params: { wb_ticket: wbTicket, werks: plant }
        });
      } else {
        setError("Please select a table.");
        setLoading(false);
        return;
      }
      setViewResult(res.data);
      if (!res.data) {
        setError("No data found for the given WB_TICKET and selected plant.");
      }
    } catch (err) {
      setError("Error fetching car plate details.");
    }
    setLoading(false);
  };

  // Update car plate info
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to update the car plate number?")) return;
    setUpdating(true);
    setError("");
    setMessage("");
    try {
      if (table === "WB_OUT") {
        await axios.post("cp-update/update-car-plate-out", {
          wb_ticket: wbTicket,
          cplate,
          mwerks: plant,
        });
      } else if (table === "WB_IN") {
        await axios.post("cp-update/update-car-plate-in", {
          wb_ticket: wbTicket,
          cplate,
          werks: plant,
        });
      }
      setMessage("Car plate updated successfully.");
      setShowMessage(true);
      // Refresh view after update
      await handleView(new Event("submit"));
      setTimeout(() => setShowMessage(false), 3000);
    } catch (err) {
      setError("Error updating car plate.");
    }
    setUpdating(false);
  };

  return (
    <div className="page-container">
      <h2>
        <FaEdit className="icon" /> Car Plate Update
      </h2>
      <form className="search-form" onSubmit={handleView} noValidate>
        <label>
          Table:
          <select
            value={table}
            onChange={e => setTable(e.target.value)}
            required
          >
            <option value="">Select Table</option>
            <option value="WB_OUT">WB_OUT</option>
            <option value="WB_IN">WB_IN</option>
          </select>
        </label>
        <label>
          WB_TICKET:
          <input
            type="text"
            value={wbTicket}
            onChange={e => setWbTicket(e.target.value)}
            required
            maxLength={20}
            style={{ textTransform: "uppercase" }}
            disabled={!table}
          />
        </label>
        {table && wbTicket && (
          <>
            <label>
              {table === "WB_OUT" ? "MWERKS" : "WERKS"}:
              <select
                value={plant}
                onChange={e => setPlant(e.target.value)}
                required
                disabled={plantLoading || plantList.length === 0}
              >
                <option value="">
                  {plantLoading
                    ? "Loading..."
                    : plantList.length === 0
                    ? `No ${table === "WB_OUT" ? "MWERKS" : "WERKS"} found`
                    : `Select ${table === "WB_OUT" ? "MWERKS" : "WERKS"}`}
                </option>
                {(Array.isArray(plantList) ? plantList : []).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <button
          type="submit"
          className="btn btn-icon"
          disabled={
            loading ||
            !table ||
            !wbTicket ||
            !plant
          }
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
            <FaSyncAlt className="icon" /> Car Plate Info
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>CPLATE</th>
                  <th>ZSAPFLAG</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{table}</td>
                  <td>{viewResult.CPLATE || "-"}</td>
                  <td>{viewResult.ZSAPFLAG || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <form className="search-form" onSubmit={handleUpdate} style={{ marginTop: 32 }}>
        <label>
          New Car Plate Number:
          <input
            type="text"
            value={cplate}
            onChange={e => setCPlate(e.target.value.toUpperCase())}
            required
            maxLength={10}
            style={{ textTransform: "uppercase" }}
          />
        </label>
        <button
          type="submit"
          className="btn btn-success btn-icon"
          disabled={
            updating ||
            !table ||
            !wbTicket ||
            !plant ||
            !cplate
          }
        >
          <FaEdit className="icon" />
          {updating ? (
            <>
              <span className="spinner" /> Updating...
            </>
          ) : (
            "Update Car Plate"
          )}
        </button>
      </form>
    </div>
  );
};

export default CPUpdate;


