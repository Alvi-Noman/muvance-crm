import React, { useRef, useState } from 'react';
import md5 from 'crypto-js/md5';
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
  filteredLeads,
  handleDeleteLead,
  currentPage,
  totalPages,
  onPageChange,
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

  const formatCurrency = (value) => {
    if (!value) return '-';
    const num = parseInt(value);
    if (isNaN(num)) return '-';
    return `৳${num.toLocaleString('en-US')}`;
  };

  const isSearchOrFilterApplied =
    Boolean(searchQuery) || Boolean(statusFilter) || filterOption !== 'Latest';

  const totalFiltered = Array.isArray(filteredLeads) ? filteredLeads.length : 0;

  return (
    <>
      <h1 className="leads-management-title">Leads Management</h1>

      {fetchError && (
        <div className="error-shake" style={{ color: 'red', marginBottom: '10px' }}>
          {fetchError}
        </div>
      )}

      {actionError && (
        <div className="error-shake" style={{ color: 'red', marginBottom: '10px' }}>
          {actionError}
        </div>
      )}

      <div className="leads-management">
        <div className="leads-header">
          <h2>
            {statusFilter === 'New Leads Today'
              ? 'New Leads Today'
              : statusFilter
              ? `${statusFilter} Leads`
              : 'All Leads'}
          </h2>

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
                      className={`suggestion-item ${
                        index === highlightedIndex ? 'highlighted' : ''
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="material-icons suggestion-icon">
                        {getSuggestionIcon(suggestion.type)}
                      </span>
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
                    className={`filter-option ${
                      filterOption === 'Latest' ? 'selected' : ''
                    }`}
                    onClick={() => handleFilterSelect('Latest')}
                  >
                    Latest
                  </div>
                  <div
                    className={`filter-option ${
                      filterOption === 'Top Priority' ? 'selected' : ''
                    }`}
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
            <div className="loading-indicator">Loading leads...</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Website Link</th>
                    <th>Avg. Monthly Sales</th>
                    <th>Appointment Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {(Array.isArray(currentLeads) ? currentLeads : []).map((lead) => {
                    const email =
                      lead.email && lead.email.trim()
                        ? lead.email.trim().toLowerCase()
                        : 'default@example.com';

                    const hash = md5(email).toString();
                    const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=mp&s=40`;

                    return (
                      <tr key={lead.id}>
                        <td>
                          <div className="name-container">
                            <img
                              src={gravatarUrl}
                              alt="Profile"
                              className={`profile-img ${
                                lead.service === 'Manual Booking'
                                  ? 'manual-lead'
                                  : ''
                              }`}
                            />
                            <div className="name-email">
                              <span className="lead-name">{lead.fullName}</span>
                              <span className="lead-email">
                                {lead.email || ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>{lead.phoneNumber}</td>

                        {/* ✅ ONLY FIX IS HERE */}
                        <td>
                          {lead.websiteLink ? (
                            <a
                              href={
                                lead.websiteLink.startsWith('http')
                                  ? lead.websiteLink
                                  : `https://${lead.websiteLink}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="website-link"
                            >
                              {lead.websiteLink}
                            </a>
                          ) : (
                            <span className="no-website">-</span>
                          )}
                        </td>

                        <td>
                          <span className="avg-monthly-sales">
                            {formatCurrency(lead.avgMonthlySales)}
                          </span>
                        </td>

                        <td>
                          <div className="name-container">
                            <div className="name-email">
                              <span className="lead-name">
                                {lead.status === 'Converted' ||
                                lead.status === 'Lost'
                                  ? ''
                                  : lead.rawAppointmentDate
                                  ? new Date(
                                      lead.rawAppointmentDate
                                    ).toLocaleString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : ''}
                              </span>
                              <span className="lead-email">
                                {lead.status === 'Converted' ||
                                lead.status === 'Lost'
                                  ? ''
                                  : lead.appointmentTime || ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div
                            className="status-container"
                            ref={(el) =>
                              (statusDropdownRefs.current[lead.id] = el)
                            }
                          >
                            <span
                              className={`status ${lead.status
                                .toLowerCase()
                                .replace(' ', '-')}`}
                              style={{
                                backgroundColor: getStatusColor(lead.status),
                              }}
                              onClick={() =>
                                toggleStatusDropdown(lead.id)
                              }
                            >
                              {lead.status}
                            </span>

                            {openStatusDropdownId === lead.id && (
                              <div className="status-dropdown-panel">
                                {statusOptions.map((option) => (
                                  <div
                                    key={option}
                                    className={`status-option ${option
                                      .toLowerCase()
                                      .replace(' ', '-')}`}
                                    style={{
                                      backgroundColor:
                                        getStatusColor(option),
                                    }}
                                    onClick={() =>
                                      handleStatusSelect(
                                        lead.id,
                                        option
                                      )
                                    }
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
                    );
                  })}
                </tbody>
              </table>

              {!isInitialLoading && totalFiltered > 0 && (
                <div className="pagination">
                  <button
                    className="pagination-button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                  >
                    Prev
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      className={`pagination-button ${
                        page === currentPage ? 'active' : ''
                      }`}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="pagination-button"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}

              {totalFiltered === 0 &&
                !isInitialLoading &&
                isSearchOrFilterApplied && (
                  <div className="end-message">
                    No leads match your search or filter criteria.
                  </div>
                )}

              {totalFiltered === 0 &&
                !isInitialLoading &&
                !isSearchOrFilterApplied && (
                  <div className="end-message">
                    No leads available. Add a new lead to get started.
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {leadToDelete && (
        <div className="drawer">
          <div
            className="drawer-content"
            style={{ width: '300px', padding: '20px' }}
          >
            <div className="drawer-header">
              <h2>Confirm Delete</h2>
              <button className="close-btn" onClick={cancelDelete}>
                ×
              </button>
            </div>

            <p>
              Are you sure you want to delete this lead? This action cannot be
              be undone.
            </p>

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
