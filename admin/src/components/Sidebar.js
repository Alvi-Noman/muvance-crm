import React from 'react';
import '../App.css';

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>Muvance CRM</h2>
      </div>
      <ul className="nav-list">
        <li
          className={`nav-item ${activeSection === 'Dashboard' ? 'active' : ''}`}
          onClick={() => onSectionChange('Dashboard')}
        >
          <span className="material-icons nav-icon">dashboard</span>
          <span>Dashboard</span>
        </li>
        <li
          className={`nav-item ${activeSection === 'Leads' ? 'active' : ''}`}
          onClick={() => onSectionChange('Leads')}
        >
          <span className="material-icons nav-icon">people</span>
          <span>Leads</span>
        </li>
        <li
          className={`nav-item ${activeSection === 'Calendar' ? 'active' : ''}`}
          onClick={() => onSectionChange('Calendar')}
        >
          <span className="material-icons nav-icon">calendar_today</span>
          <span>Calendar</span>
        </li>
        <li
          className={`nav-item ${activeSection === 'Settings' ? 'active' : ''}`}
          onClick={() => onSectionChange('Settings')}
        >
          <span className="material-icons nav-icon">settings</span>
          <span>Settings</span>
        </li>
        <li className="nav-item logout-item">
          <span className="material-icons nav-icon">logout</span>
          <button
            className="logout-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                onLogout();
              }
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;