import React from "react";
import { Link } from "react-router-dom";
import './Sidebar.css';

const Sidebar = () => (
  <div className="sidebar">
    <h3 className="sidebar-title">WB Monitoring</h3>
    <nav>
      <ul className="sidebar-list">
        <li>
          <Link className="sidebar-link" to="/ffbreupload">FFB Reupload</Link>
        </li>
        <li>
          <Link className="sidebar-link" to="/splitso">Split SO</Link>
        </li>
        {/* Add more links here */}
      </ul>
    </nav>
  </div>
);

export default Sidebar;
