import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../App.css';

const LeadDetailsModal = ({
  selectedLead,
  closeDetails,
  modalRef,
  getStatusColor,
  statusOptions,
  updateStatus,
  handleNoteChange,
  addNote,
  handleAppointmentChange,
  selectedDate,
  handleDateChange,
  timeOptions,
  updateAppointment,
  actionError,
}) => {
  if (!selectedLead) return null;

  const handleBackdropClick = (e) => {
    if (modalRef?.current && e.target === modalRef.current) {
      closeDetails();
    }
  };

  const safeText = (value, fallback = '') =>
    typeof value === 'string' || typeof value === 'number' ? value : fallback;

  return (
    <div className="drawer" ref={modalRef} onClick={handleBackdropClick}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Lead Details</h2>
          <button className="close-btn" onClick={closeDetails}>×</button>
        </div>
        <hr className="modal-divider" />
        <div className="modal-body">
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">
                {safeText(selectedLead.fullName, 'Unknown Name')}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone Number:</span>
              <span className="info-value">
                {safeText(selectedLead.phoneNumber, 'No Phone')}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Email Address:</span>
              <span className="info-value">
                {safeText(selectedLead.email, 'Not provided')}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Website Link:</span>
              <span className="info-value">
                {selectedLead.websiteLink ? (
                  <a
                    href={
                      selectedLead.websiteLink.startsWith('http')
                        ? selectedLead.websiteLink
                        : `https://${selectedLead.websiteLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {safeText(selectedLead.websiteLink)}
                  </a>
                ) : (
                  'Not provided'
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Appointment Date:</span>
              <span className="info-value">
                {(selectedLead.status === 'Converted' || selectedLead.status === 'Lost')
                  ? ''
                  : selectedLead.rawAppointmentDate
                    ? `${new Date(selectedLead.rawAppointmentDate).toLocaleString(
                        'en-US',
                        { month: 'long', day: 'numeric', year: 'numeric' }
                      )} at ${safeText(selectedLead.appointmentTime, '')}`
                    : 'Not set'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Submission Date:</span>
              <span className="info-value">
                {selectedLead.submissionDate
                  ? new Date(selectedLead.submissionDate).toLocaleString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      }
                    )
                  : 'Not set'}
              </span>
            </div>
          </div>

          <div className="detail-row update-status-container">
            <div>
              <strong>Update Status</strong><br />
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`status-btn ${selectedLead.status === status ? 'active' : ''}`}
                  style={{
                    backgroundColor: getStatusColor(status),
                    border: selectedLead.status === status ? '2px solid #007BFF' : 'none',
                    borderRadius: '15px',
                  }}
                  onClick={() => updateStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-row appointment-section">
            <div className="appointment-inputs">
              <label className="appointment-label">
                Date:
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="MMMM d, yyyy"
                  className="new-lead-select appointment-input"
                  minDate={new Date()}
                  maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                />
              </label>
              <label className="appointment-label">
                Time:
                <select
                  name="newAppointmentTime"
                  value={
                    selectedLead.newAppointmentTime ||
                    (timeOptions.find((opt) => !opt.disabled)?.value ||
                      (timeOptions[0] && timeOptions[0].value) ||
                      '')
                  }
                  onChange={handleAppointmentChange}
                  className="new-lead-select appointment-input"
                >
                  {timeOptions.map((option, index) => (
                    <option
                      key={index}
                      value={option.value}
                      disabled={option.disabled && option.value !== selectedLead.appointmentTime}
                    >
                      {option.label}{' '}
                      {option.disabled && option.value !== selectedLead.appointmentTime
                        ? '(Unavailable)'
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="new-lead-submit appointment-book-btn"
                onClick={updateAppointment}
              >
                Schedule Again
              </button>
            </div>
          </div>

          {selectedLead.latestNote && (
            <div className="detail-row">
              <div className="latest-note">
                <strong>Latest Note</strong><br />
                <span>{safeText(selectedLead.latestNote)}</span>
              </div>
            </div>
          )}

          <div className="detail-row note-section">
            <div className="note-input-container">
              <strong>Add Note</strong><br />
              <textarea
                value={selectedLead.currentNote || ''}
                onChange={handleNoteChange}
                onKeyPress={addNote}
                placeholder="Add a new note about this lead..."
              ></textarea>
              <button className="new-lead-submit" onClick={addNote}>
                Add Note
              </button>
            </div>
          </div>

          <div className="detail-row">
            <div className="activity-timeline">
              <strong>Activity Timeline</strong><br />
              {Array.isArray(selectedLead.activity) && selectedLead.activity.length > 0 ? (
                selectedLead.activity.map((entry, index) => {
                  const text =
                    typeof entry?.text === 'string'
                      ? entry.text
                      : entry?.status
                      ? `Status changed to '${entry.status}'`
                      : '';

                  const ts =
                    typeof entry?.timestamp === 'string' ? entry.timestamp : '';

                  return (
                    <div key={index} className="activity-item">
                      {safeText(text)}
                      {ts && (text ? ` on ${ts}` : ts)}
                    </div>
                  );
                })
              ) : (
                <div className="activity-item">No activity yet.</div>
              )}
            </div>
          </div>

          {actionError && (
            <div className="error-shake" style={{ color: 'red', marginBottom: '10px' }}>
              {safeText(actionError)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;