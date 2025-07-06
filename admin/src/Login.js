import React, { useState, useEffect } from 'react';
import './Login.css';
import axios from 'axios';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);

  // Load saved credentials from localStorage on component mount
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('savedIdentifier');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedIdentifier && savedPassword) {
      setCredentials({ identifier: savedIdentifier, password: savedPassword });
      setSavePassword(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleSavePasswordChange = (e) => {
    setSavePassword(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://muvance-crm.onrender.com';
      console.log('API Base URL:', API_BASE_URL); // Debug log to confirm URL
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        identifier: credentials.identifier.trim(),
        password: credentials.password,
      });
      
      console.log('Login response:', response.data); // Debug log

      if (response.status === 200) {
        const { token } = response.data;
        localStorage.setItem('token', token); // Store the JWT token
        console.log('Token stored in localStorage:', token); // Debug log

        // Save credentials to localStorage if "Save Password" is checked
        if (savePassword) {
          localStorage.setItem('savedIdentifier', credentials.identifier.trim());
          localStorage.setItem('savedPassword', credentials.password);
        } else {
          // Clear saved credentials if the checkbox is unchecked
          localStorage.removeItem('savedIdentifier');
          localStorage.removeItem('savedPassword');
        }

        setCredentials({ identifier: '', password: '' }); // Clear form
        setShowPassword(false); // Reset password visibility
        if (onLogin) {
          onLogin(); // Notify parent component of successful login
        } else {
          window.location.reload(); // Fallback to reload the app
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials or ensure the backend server is running.';
      console.error('Login error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        } : null,
        requestUrl: err.config?.url || 'Unknown URL'
      }); // Enhanced debug log
      setError(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <img src="/muvance-logo.png" alt="Muvance Logo" className="login-logo" />
      <div className="login-box">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="input-container">
            Username or Email:
            <div className="input-wrapper">
              <input
                type="text"
                name="identifier"
                value={credentials.identifier}
                onChange={handleChange}
                placeholder="Enter username or email"
                required
              />
            </div>
          </label>
          <label className="password-container">
            Password:
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
              <span className="password-toggle-icon" onClick={toggleShowPassword}>
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </span>
            </div>
          </label>
          <div className="save-password-container">
            <input
              type="checkbox"
              id="save-password"
              checked={savePassword}
              onChange={handleSavePasswordChange}
            />
            <label htmlFor="save-password" className="save-password-label">
              Save Password
            </label>
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;