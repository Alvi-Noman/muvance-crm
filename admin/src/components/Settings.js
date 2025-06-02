import React from 'react';
import jwt from 'jsonwebtoken';
import '../App.css';

const Settings = ({ isSettingsOpen, setIsSettingsOpen, newUser, setNewUser, handleAddUser, actionError }) => {
  const token = localStorage.getItem('token');
  const decoded = jwt.decode(token);

  if (!decoded?.isAdmin) {
    return (
      <div className="settings-section">
        <h1 className="leads-management-title">Settings</h1>
        <p>You do not have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h1 className="leads-management-title">Settings</h1>
      {isSettingsOpen ? (
        <div className="settings-form">
          <h2>Add New User</h2>
          {actionError && <div className="error-shake" style={{ color: 'red', marginBottom: '10px' }}>{actionError}</div>}
          <div className="settings-form-inner">
            <label>
              Username:
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
                className="new-lead-input"
                required
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email"
                className="new-lead-input"
                required
              />
            </label>
            <label>
              Password:
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
                className="new-lead-input"
                required
              />
            </label>
            <button type="button" className="new-lead-submit" onClick={handleAddUser}>Add User</button>
            <button type="button" className="new-lead-submit" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="add-lead" onClick={() => setIsSettingsOpen(true)}>
          <span className="add-icon">+</span> Add User
        </button>
      )}
    </div>
  );
};

export default Settings;