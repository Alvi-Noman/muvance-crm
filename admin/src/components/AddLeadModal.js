import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../App.css';

const AddLeadModal = ({
  isAddLeadOpen,
  closeAddLeadModal,
  addLeadModalRef,
  newLead,
  handleNewLeadChange,
  selectedDate,
  handleDateChange,
  timeOptions,
  addNewLead,
  actionError,
}) => {
  if (!isAddLeadOpen) return null;

  return (
    <div className="drawer" ref={addLeadModalRef} onClick={(e) => { if (e.target === addLeadModalRef.current) closeAddLeadModal(); }}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Add New Lead</h2>
          <button className="close-btn" onClick={closeAddLeadModal}>×</button>
        </div>
        <hr className="modal-divider" />
        <div className="new-lead-form">
          <label>
            Client Name:
            <input
              type="text"
              name="name"
              value={newLead.name}
              onChange={handleNewLeadChange}
              placeholder="Enter client name"
              className="new-lead-input"
              required
            />
          </label>
          <label>
            Client Phone Number:
            <input
              type="text"
              name="phone"
              value={newLead.phone}
              onChange={handleNewLeadChange}
              placeholder="Enter phone number"
              className="new-lead-input"
              required
            />
          </label>
          <label>
            Client Email Address:
            <input
              type="email"
              name="email"
              value={newLead.email}
              onChange={handleNewLeadChange}
              placeholder="Enter email address (optional)"
              className="new-lead-input"
            />
          </label>
          <label>
            Client Website:
            <input
              type="url"
              name="website"
              value={newLead.website}
              onChange={handleNewLeadChange}
              placeholder="Enter website URL (optional)"
              className="new-lead-input"
            />
          </label>
          <label>
            Select Date:
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              className="new-lead-select"
              minDate={new Date('2025-05-20')}
              maxDate={new Date('2026-05-19')}
            />
          </label>
          <label>
            Select Time:
            <select
              name="appointmentTime"
              value={newLead.appointmentTime}
              onChange={handleNewLeadChange}
              className="new-lead-select"
            >
              {timeOptions.map((option, index) => (
                <option
                  key={index}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label} {option.disabled ? '(Unavailable)' : ''}
                </option>
              ))}
            </select>
          </label>
          <button className="new-lead-submit" onClick={addNewLead}>Submit</button>
          {actionError && <div className="error-shake" style={{ color: 'red', marginBottom: '10px' }}>{actionError}</div>}
        </div>
      </div>
    </div>
  );
};

export default AddLeadModal;