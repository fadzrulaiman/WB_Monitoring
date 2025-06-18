import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import FfbReupload from "./pages/FFBReupload/FfbReupload";
import SplitSO from "./pages/SplitSO/SplitSO";
import CPUpdate from "./pages/CPUpdate/CPUpdate";
import BargeUpdate from "./pages/Barge/BargeUpdate";
import "./App.css"; // Add this line

const App = () => (
  <Router>
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: 220, width: "100%" }}>
        <Routes>
          <Route path="/ffbreupload" element={<FfbReupload />} />
          <Route path="/splitso" element={<SplitSO />} />
          <Route path="/cpupdate" element={<CPUpdate />} />
          <Route path="/barge" element={<BargeUpdate />} />
          {/* Add more routes here */}
          <Route path="*" element={<div style={{ padding: 24 }}>Welcome to WB Monitoring</div>} />
        </Routes>
      </div>
    </div>
  </Router>
);

export default App;
