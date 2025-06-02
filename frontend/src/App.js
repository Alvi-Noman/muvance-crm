//balsal

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const AppointmentBooking = () => {
  const today = new Date(); // Use current date and time dynamically
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState("date");
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    websiteLink: "",
  });
  const [errors, setErrors] = useState({
    fullName: false,
    phoneNumber: false,
    email: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  const timeSlots = ["11:00 AM", "1:00 PM", "4:00 PM", "7:00 PM", "9:00 PM"];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const fetchBookedTimes = async (selectedDate) => {
    try {
      const response = await axios.get('http://localhost:5000/api/appointments');
      console.log('API Response (fetchBookedTimes):', response.data);
      const selectedDateStr = new Date(currentYear, currentMonth, selectedDate).toISOString().split('T')[0];
      const booked = response.data
        .filter(appointment => {
          const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
          return appointmentDate === selectedDateStr;
        })
        .map(appointment => appointment.time);
      console.log('Booked Times:', booked);
      setBookedTimes(booked);
    } catch (error) {
      console.error('Error fetching booked times:', error.response?.data || error.message);
      setBookedTimes([]);
    }
  };

  const fetchFullyBookedDates = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/appointments');
      console.log('API Response (fetchFullyBookedDates):', response.data);
      const appointments = response.data;
      const fullyBooked = [];
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      for (const day of days) {
        const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
        const bookedForDay = appointments
          .filter(appointment => {
            const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
            return appointmentDate === dateStr;
          })
          .map(appointment => appointment.time);
        if (bookedForDay.length >= timeSlots.length) {
          fullyBooked.push(day);
        }
      }
      console.log('Fully Booked Dates:', fullyBooked);
      setFullyBookedDates(fullyBooked);
    } catch (error) {
      console.error('Error fetching fully booked dates:', error.response?.data || error.message);
      setFullyBookedDates([]);
    }
  };

  useEffect(() => {
    fetchFullyBookedDates();
  }, [currentMonth, currentYear]);

  const handleDateClick = (day) => {
    const selected = new Date(currentYear, currentMonth, day);
    if (selected < today.setHours(0, 0, 0, 0) || fullyBookedDates.includes(day)) return;
    setSelectedDate(day);
    setSelectedTime(null);
    setStep("time");
    fetchBookedTimes(day);
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    setStep("details");
  };

  const handleBackToTime = () => {
    setStep("time");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: false,
    }));
  };

  const handleConfirmBooking = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{11}$/;
    const newErrors = {
      fullName: !formData.fullName,
      phoneNumber: !formData.phoneNumber || !phoneRegex.test(formData.phoneNumber),
      email: !formData.email || !emailRegex.test(formData.email),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      console.log('Form validation errors:', newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const appointmentDate = new Date(currentYear, currentMonth, selectedDate).toISOString();
      const submissionDate = new Date().toISOString();
      console.log('Sending appointment data:', {
        date: appointmentDate,
        time: selectedTime,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        websiteLink: formData.websiteLink,
        submissionDate,
      });
      const response = await axios.post('http://localhost:5000/api/appointments', {
        date: appointmentDate,
        time: selectedTime,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        websiteLink: formData.websiteLink,
        submissionDate,
      });
      console.log('Booking Response:', response.data);
      setIsLoading(false);
      setStep("confirmed");
    } catch (error) {
      setIsLoading(false);
      console.error('Error booking appointment:', error.response?.data || error.message);
      alert(`Failed to book appointment: ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  const handlePrevMonth = () => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    if (new Date(prevYear, prevMonth + 1, 0) < today.setHours(0, 0, 0, 0)) return;
    setCurrentMonth(prevMonth);
    setCurrentYear(prevYear);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep("date");
    setBookedTimes([]);
  };

  const handleNextMonth = () => {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep("date");
    setBookedTimes([]);
  };

  const isTimeSlotPast = (time, selectedDate) => {
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const selectedDateTime = new Date(currentYear, currentMonth, selectedDate, hours, minutes, 0, 0);
    return selectedDateTime < today;
  };

  const isTimeSlotBooked = (time) => {
    return bookedTimes.includes(time);
  };

  const hasBookingThirtyMinutesLater = (time) => {
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const currentTime = new Date(2025, 0, 1, hours, minutes, 0, 0); // Use a dummy date for time comparison
    const thirtyMinutesLater = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes

    let laterHours = thirtyMinutesLater.getHours();
    const laterMinutes = thirtyMinutesLater.getMinutes();
    const laterPeriod = laterHours >= 12 ? "PM" : "AM";
    laterHours = laterHours % 12 || 12; // Convert to 12-hour format
    const laterTime = `${laterHours}:${laterMinutes.toString().padStart(2, "0")} ${laterPeriod}`;

    return bookedTimes.includes(laterTime);
  };

  const formattedDate = selectedDate
    ? new Date(currentYear, currentMonth, selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }) + " (Bangladesh Time)"
    : "";

  const appointmentDetailsDate = selectedDate
    ? new Date(currentYear, currentMonth, selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="appointment-box">
        <div className={`bg-white rounded-xl shadow-md overflow-hidden ${isLoading ? "blurred" : ""}`}>
          <div className="bg-indigo-600 text-white text-lg font-semibold px-6 py-4">
            Book an Appointment
            <div className="text-sm font-normal">
              Select a date and time that works for you
            </div>
          </div>
          <div className="flex justify-around border-b md:hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                step === "date" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"
              }`}
              onClick={() => setStep("date")}
            >
              Date
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                step === "time" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"
              }`}
              onClick={() => selectedDate && setStep("time")}
              disabled={!selectedDate}
            >
              Time
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                step === "details" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"
              }`}
              onClick={() => selectedTime && setStep("details")}
              disabled={!selectedTime}
            >
              Details
            </button>
          </div>
          <div className="flex flex-col md:flex-row relative">
            <div
              className={`p-6 w-full md:w-1/2 ${
                step !== "date" ? "hidden md:block" : ""
              } ${step === "confirmed" ? "hidden" : ""}`}
            >
              <div className="text-md font-medium mb-4 text-black text-left">Select Date</div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="text-gray-600 hover:text-indigo-600 disabled:opacity-50"
                  disabled={new Date(currentYear, currentMonth, 1) <= today.setHours(0, 0, 0, 0)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-5-5 5-5" />
                  </svg>
                </button>
                <div className="text-center text-black font-medium">
                  {monthNames[currentMonth]} {currentYear}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="text-gray-600 hover:text-indigo-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l5 5-5 5" />
                  </svg>
                </button>
              </div>
              <div className="calendar-grid">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <div key={`weekday-${index}`} className="weekday">
                    {day}
                  </div>
                ))}
                {[...Array(firstDayOfMonth)].map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const currentDate = new Date(currentYear, currentMonth, day);
                  const isPast = currentDate < today.setHours(0, 0, 0, 0);
                  const isFullyBooked = fullyBookedDates.includes(day);
                  const isToday =
                    currentDate.getDate() === today.getDate() &&
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear();
                  const isSelected = selectedDate === day;
                  const className = `date ${isPast || isFullyBooked ? "past" : ""} ${isSelected ? "selected" : ""} ${
                    isToday && !isSelected && !isPast && !isFullyBooked ? "today" : ""
                  }`;

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => handleDateClick(day)}
                      className={className}
                      style={isPast || isFullyBooked ? { pointerEvents: "none" } : {}}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className={`border-t md:border-t-0 md:border-l p-6 w-full md:w-1/2 ${
                step !== "time" && step !== "details" && step !== "confirmed" ? "hidden md:block" : ""
              } ${step === "confirmed" ? "md:w-full" : ""}`}
            >
              {step === "date" || (step === "time" && !selectedDate) ? (
                <div className="flex items-center justify-center min-h-[300px] text-gray-500 flex-col gap-2">
                  <div className="calendar-icon-container">
                    <svg className="w-16 h-16 text-blue-600 calendar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-md font-medium text-black text-left">Select a Date</div>
                  <div className="text-sm">Available time slots will appear here</div>
                </div>
              ) : step === "time" ? (
                <div>
                  <div className="text-md font-medium mb-2 text-left">Select Time</div>
                  <div className="text-sm text-gray-600 mb-4 text-left">{formattedDate}</div>
                  <div className="space-y-2 mt-4">
                    {timeSlots.map((time) => {
                      const isPastTime = isTimeSlotPast(time, selectedDate);
                      const isBooked = isTimeSlotBooked(time);
                      const isBlocked = hasBookingThirtyMinutesLater(time);
                      const isDisabled = isPastTime || isBooked || isBlocked;
                      return (
                        <button
                          key={`time-${time}`}
                          onClick={() => !isDisabled && handleTimeClick(time)}
                          className={`w-full border rounded-md py-3 px-4 text-center md:text-left transition-all duration-200 bg-[#f9fafb]
                            ${isDisabled ? "border-gray-300 text-gray-400 cursor-not-allowed" : ""}
                            ${selectedTime === time && !isDisabled
                              ? "border-indigo-600 text-black font-semibold"
                              : isDisabled ? "" : "border-gray-300 text-black"}
                            ${!isDisabled ? "hover:bg-[#f9fafb] hover:border-indigo-600 hover:text-black hover:transform hover:-translate-y-px" : ""}
                          `}
                          disabled={isDisabled}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : step === "details" ? (
                <div>
                  <div className="text-md font-medium mb-4 text-black text-left">Enter Your Details</div>
                  <div className="appointment-details mb-4">
                    <div className="flex items-center text-black text-left">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Appointment Details
                    </div>
                    <div className="ml-6 text-gray-600 text-left">
                      Date: {appointmentDetailsDate}
                      <br />
                      Time: {selectedTime}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`mt-1 w-full border rounded-lg py-2 px-3 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 ${errors.fullName ? "error-shake border-red-500" : "border-[#d1a8a8]"}`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">
                        Phone Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`mt-1 w-full border rounded-lg py-2 px-3 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 ${errors.phoneNumber ? "error-shake border-red-500" : "border-[#d1a8a8]"}`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`mt-1 w-full border rounded-lg py-2 px-3 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? "error-shake border-red-500" : "border-[#d1a8a8]"}`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">
                        Your eCommerce Website Link (If any)
                      </label>
                      <input
                        type="url"
                        name="websiteLink"
                        value={formData.websiteLink}
                        onChange={handleInputChange}
                        className="mt-1 w-full border border-[#d1a8a8] rounded-lg py-2 px-3 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleConfirmBooking}
                      className="bg-indigo-600 text-white w-full py-3 px-6 rounded-lg hover:bg-indigo-700 mb-4"
                      disabled={isLoading}
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={handleBackToTime}
                      className="bg-white text-black w-full py-3 px-6 rounded-lg flex items-center justify-center hover:bg-gray-100"
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Time Selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center relative">
                  {step === "confirmed" && (
                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                      <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                      <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                  )}
                  <h2 className="text-2xl font-semibold text-gray-800">Booking Confirmed!</h2>
                  <p className="text-gray-600 mt-2">Your appointment has been successfully scheduled.</p>
                  <div className="mt-4 info-box">
                    <div className="flex items-center text-gray-700 mb-2">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-md font-medium">Appointment Details</h3>
                    </div>
                    <div className="ml-7 text-gray-600">
                      <p>Date: {appointmentDetailsDate}</p>
                      <p>Time: {selectedTime}</p>
                    </div>
                    <div className="flex items-center text-gray-700 mt-4 mb-2">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h3 className="text-md font-medium">Your Information</h3>
                    </div>
                    <div className="ml-7 text-gray-600">
                      <p>Name: {formData.fullName}</p>
                      <p>Phone Number: {formData.phoneNumber}</p>
                      <p>Email: {formData.email}</p>
                      {formData.websiteLink && <p>Website Link: {formData.websiteLink}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {isLoading && (
          <div className="modern-loading">
            <div className="modern-spinner"></div>
            <span className="ml-4 text-lg font-medium text-gray-700">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;