import React, { useRef, useState } from 'react';
import '../App.css';

const LeadsManagement = ({
  fetchError,
  actionError,
  statusFilter,
  currentLeads,
  isInitialLoading,
  searchQuery,
  handleSearchChange,
  suggestions,
  highlightedIndex,
  handleSuggestionClick,
  getSuggestionIcon,
  filterOption,
  isFilterDropdownOpen,
  toggleFilterDropdown,
  handleFilterSelect,
  openAddLeadModal,
  getStatusColor,
  statusOptions,
  openStatusDropdownId,
  toggleStatusDropdown,
  handleStatusSelect,
  openDetails,
  hasMore,
  isLoading,
  filteredLeads,
  loadMoreRef,
  handleDeleteLead,
}) => {
  const searchInputRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const statusDropdownRefs = useRef({});
  const [leadToDelete, setLeadToDelete] = useState(null);

  const confirmDelete = (leadId) => {
    setLeadToDelete(leadId);
  };

  const cancelDelete = () => {
    setLeadToDelete(null);
  };

  const proceedDelete = () => {
    if (leadToDelete) {
      handleDeleteLead(leadToDelete);
      setLeadToDelete(null);
    }
  };

  return (
    <>
      <h1 className="leads-management-title">Leads Management</h1>
      {fetchError && <div className="error-shake" style={{ color: 'red', marginBottom: '10px' }}>{fetchError}</div>}
      {actionError && <div className="error-shake" style={{ color: 'red', marginBottom: '10px' }}>{actionError}</div>}
      <div className="leads-management">
        <div className="leads-header">
          <h2>{statusFilter === 'New Leads Today' ? 'New Leads Today' : statusFilter ? `${statusFilter} Leads` : 'All Leads'}</h2>
          <div className="search-and-add">
            <div className="search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchChange}
                placeholder="Search leads..."
                className="search-bar"
                ref={searchInputRef}
              />
              <span className="material-icons search-icon">search</span>
              {suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="material-icons suggestion-icon">{getSuggestionIcon(suggestion.type)}</span>
                      {suggestion.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="filter-container" ref={filterDropdownRef}>
              <button className="filter-btn" onClick={toggleFilterDropdown}>
                <span className="material-icons filter-icon">filter_list</span>
                Filter: {filterOption}
              </button>
              {isFilterDropdownOpen && (
                <div className="filter-dropdown">
                  <div
                    className={`filter-option ${filterOption === 'Latest' ? 'selected' : ''}`}
                    onClick={() => handleFilterSelect('Latest')}
                  >
                    Latest
                  </div>
                  <div
                    className={`filter-option ${filterOption === 'Top Priority' ? 'selected' : ''}`}
                    onClick={() => handleFilterSelect('Top Priority')}
                  >
                    Top Priority
                  </div>
                </div>
              )}
            </div>
            <button className="add-lead" onClick={openAddLeadModal}>
              <span className="add-icon">+</span> Add Lead
            </button>
          </div>
        </div>
        <div className="leads-table">
          {isInitialLoading ? (
            <div className="loading-indicator">
              Loading leads...
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Appointment Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(currentLeads) ? currentLeads : []).map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div className="name-container">
                          <img
                            src={lead.email ? `https://www.gravatar.com/avatar/${require('crypto-js/md5')(lead.email.trim().toLowerCase()).toString()}?d=mp&s=40&t=${Date.now()}` : 'https://www.gravatar.com/avatar/default@example.com?d=mp&s=40&t=${Date.now()}'}
                            alt="Profile"
                            className={`profile-pic ${lead.service === 'Manual Booking' ? 'manual-lead' : ''}`}
                          />
                          <div className="name-email">
                            <span className="lead-name">{lead.fullName}</span>
                            <span className="lead-email">{lead.email || 'No email'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{lead.phoneNumber}</td>
                      <td>
                        <div className="name-container">
                          <div className="name-email">
                            <span className="lead-name">
                              {(lead.status === 'Converted' || lead.status === 'Lost')
                                ? ''
                                : lead.rawAppointmentDate
                                  ? new Date(lead.rawAppointmentDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                  : 'Not set'}
                            </span>
                            <span className="lead-email">
                              {(lead.status === 'Converted' || lead.status === 'Lost') ? '' : (lead.appointmentTime || '')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="status-container" ref={el => statusDropdownRefs.current[lead.id] = el}>
                          <span
                            className={`status ${lead.status.toLowerCase().replace(' ', '-')}`}
                            style={{ backgroundColor: getStatusColor(lead.status) }}
                            onClick={() => toggleStatusDropdown(lead.id)}
                          >
                            {lead.status}
                          </span>
                          {openStatusDropdownId === lead.id && (
                            <div className="status-dropdown-panel">
                              {statusOptions.map(option => (
                                <div
                                  key={option}
                                  className={`status-option ${option.toLowerCase().replace(' ', '-')}`}
                                  style={{ backgroundColor: getStatusColor(option) }}
                                  onClick={() => handleStatusSelect(lead.id, option)}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className="details-link"
                          onClick={() => openDetails(lead)}
                        >
                          Details
                        </span>
                        <span
                          className="delete-link"
                          style={{ marginLeft: '10px', fontSize: '14px' }}
                          onClick={() => confirmDelete(lead.id)}
                        >
                          Delete
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div ref={loadMoreRef} className="loading-indicator">
                  {isLoading ? 'Loading more leads...' : ''}
                </div>
              )}
              {!hasMore && filteredLeads.length > 0 && (
                <div className="end-message">
                  No more leads to display.
                </div>
              )}
              {filteredLeads.length === 0 && !isInitialLoading && (
                <div className="end-message">
                  No leads match your search or filter criteria.
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {leadToDelete && (
        <div className="drawer">
          <div className="drawer-content" style={{ width: '300px', padding: '20px' }}>
            <div className="drawer-header">
              <h2>Confirm Delete</h2>
              <button className="close-btn" onClick={cancelDelete}>
                &times;
              </button>
            </div>
            <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={proceedDelete}
              >
                Delete
              </button>
              <button
                style={{
                  backgroundColor: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadsManagement;