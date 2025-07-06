import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import md5 from 'crypto-js/md5';
import jwt from 'jsonwebtoken';
import { Sidebar, Dashboard, LeadsManagement, Calendar, Settings, LeadDetailsModal, AddLeadModal } from './components';
import './App.css';
import Login from './Login';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const getGravatarUrl = (email) => {
  const safeEmail = email && email.trim() ? email.trim().toLowerCase() : 'default@example.com';
  const hash = md5(safeEmail).toString();
  const timestamp = Date.now();
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=40&t=${timestamp}`;
};

const generateDateOptions = () => {
  const today = new Date('2025-05-21T15:23:00+06:00');
  const dates = [];
  const numDays = 365;
  for (let i = 0; i < numDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const formatted = date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    dates.push({ value: formatted, label: formatted });
  }
  return dates;
};

const generateTimeOptions = (bookedTimes = [], selectedDate, currentTime) => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = String(hour).padStart(2, '0');
      const minuteStr = String(minute).padStart(2, '0');
      const time24 = `${hourStr}:${minuteStr}`;
      const date = new Date(`2000-01-01 ${time24}`);
      const hours = date.getHours() % 12 || 12;
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const period = date.getHours() >= 12 ? 'PM' : 'AM';
      const time12 = `${hours}:${minutes} ${period}`;

      let isPast = false;
      if (selectedDate && currentTime) {
        const [selHours, selMinutes] = time24.split(':').map(Number);
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(selHours, selMinutes, 0, 0);
        isPast = selectedDateTime < currentTime;
      }

      const isBooked = bookedTimes.includes(time12);
      const isDisabled = isPast || isBooked;

      times.push({ value: time12, label: time12, booked: isBooked, disabled: isDisabled });
    }
  }
  return times;
};

const reorderTimeOptions = (options, selectedTime) => {
  if (!selectedTime) return options;
  const selectedIndex = options.findIndex(option => option.value === selectedTime);
  if (selectedIndex === -1) return options;

  const totalOptions = options.length;
  const half = Math.floor(totalOptions / 2);
  const offset = half - selectedIndex;

  const reordered = [];
  for (let i = 0; i < totalOptions; i++) {
    const newIndex = (i + offset + totalOptions) % totalOptions;
    reordered[i] = options[newIndex];
  }
  return reordered;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return !!localStorage.getItem('token');
    } catch (e) {
      console.error('localStorage access error:', e);
      return false;
    }
  });
  const [leads, setLeads] = useState([]);
  const [lastLeadReceived, setLastLeadReceived] = useState('');
  const [displayedLeadsCount, setDisplayedLeadsCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filterOption, setFilterOption] = useState('Latest');
  const [statusFilter, setStatusFilter] = useState(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [dateBookedTimes, setDateBookedTimes] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date('2025-05-21T15:23:00+06:00'));
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '' });
  const currentTime = new Date('2025-05-21T15:23:00+06:00');
  const leadsPerPage = 15;
  const modalRef = useRef(null);
  const addLeadModalRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const dateOptions = generateDateOptions();
  const currentDateFormatted = selectedDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeOptions = generateTimeOptions(dateBookedTimes[currentDateFormatted] || [], selectedDate, currentTime);

  const filteredLeads = leads
    .filter(lead =>
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.websiteLink && lead.websiteLink.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(lead => {
      if (statusFilter) {
        if (statusFilter === 'New Leads Today') {
          const submissionDate = new Date(lead.submissionDate);
          return submissionDate.toLocaleDateString('en-US') === currentTime.toLocaleDateString('en-US');
        }
        return lead.status === statusFilter;
      }
      if (filterOption === 'Top Priority') {
        const currentDate = new Date('2025-05-21T15:23:00+06:00');
        const appointmentDate = new Date(lead.rawAppointmentDate);
        return appointmentDate >= currentDate;
      }
      return true;
    })
    .sort((a, b) => {
      if (statusFilter === 'New Leads Today') {
        const dateA = new Date(a.submissionDate);
        const dateB = new Date(b.submissionDate);
        return dateB.getTime() - dateA.getTime();
      }
      if (statusFilter || filterOption === 'Top Priority') {
        const [timeA, periodA] = a.appointmentTime.split(' ');
        let [hoursA, minutesA] = timeA.split(':').map(Number);
        if (periodA === 'PM' && hoursA !== 12) hoursA += 12;
        if (periodA === 'AM' && hoursA === 12) hoursA = 0;
        const dateA = new Date(a.rawAppointmentDate);
        dateA.setHours(hoursA, minutesA);

        const [timeB, periodB] = b.appointmentTime.split(' ');
        let [hoursB, minutesB] = timeB.split(':').map(Number);
        if (periodB === 'PM' && hoursB !== 12) hoursB += 12;
        if (periodB === 'AM' && hoursB === 12) hoursB = 0;
        const dateB = new Date(b.rawAppointmentDate);
        dateB.setHours(hoursB, minutesB);

        return dateA.getTime() - dateB.getTime();
      }
      if (filterOption === 'Latest') {
        const dateA = new Date(a.submissionDate);
        const dateB = new Date(b.submissionDate);
        return dateB.getTime() - dateA.getTime();
      }
      return 0;
    });

  const currentLeads = filteredLeads.slice(0, displayedLeadsCount);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Meeting 1': return '#E0F2FE';
      case 'Need to Call': return '#FEF3C7';
      case 'Meeting 2': return '#DDD6FE';
      case 'Meeting 3': return '#FFE4F0';
      case 'Converted': return '#F8F8F8';
      case 'Lost': return '#FEE2E2';
      default: return 'transparent';
    }
  };

  const statusOptions = ['Meeting 1', 'Meeting 2', 'Meeting 3', 'Need to Call', 'Converted', 'Lost'];

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setLeads([]);
    setSelectedLead(null);
    setIsAddLeadOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    setFilterOption('Latest');
    setStatusFilter(null);
    setOpenStatusDropdownId(null);
    setFetchError(null);
    setActionError(null);
    setDateBookedTimes({});
    setSelectedDate(new Date('2025-05-21T15:23:00+06:00'));
    setIsSettingsOpen(false);
    console.log('Logout triggered');
  };

  const handleSectionChange = (section, status = null) => {
    setActiveSection(section);
    setStatusFilter(status);
    setSearchQuery('');
    setFilterOption('Latest');
    setIsSettingsOpen(false);
  };

  const handleDashboardBlockClick = (block) => {
    switch (block) {
      case 'New Leads Today':
        handleSectionChange('Leads', 'New Leads Today');
        break;
      case 'Calls to Attend':
        handleSectionChange('Leads', 'Need to Call');
        break;
      case 'Meeting 1 to Attend':
        handleSectionChange('Leads', 'Meeting 1');
        break;
      case 'Meeting 2 to Attend':
        handleSectionChange('Leads', 'Meeting 2');
        break;
      case 'Meeting 3 to Attend':
        handleSectionChange('Leads', 'Meeting 3');
        break;
      default:
        handleSectionChange('Leads');
    }
  };

  const today = new Date('2025-05-21T15:23:00+06:00');
  const newLeadsToday = leads.filter(lead => {
    const submissionDate = new Date(lead.submissionDate);
    return submissionDate.toLocaleDateString('en-US') === today.toLocaleDateString('en-US');
  }).length;

  const statusCounts = {
    'New Leads Today': newLeadsToday,
    'Calls to Attend': leads.filter(lead => lead.status === 'Need to Call').length,
    'Meeting 1 to Attend': leads.filter(lead => lead.status === 'Meeting 1' && lead.appointmentTime).length,
    'Meeting 2 to Attend': leads.filter(lead => lead.status === 'Meeting 2').length,
    'Meeting 3 to Attend': leads.filter(lead => lead.status === 'Meeting 3').length,
    'Converted': leads.filter(lead => lead.status === 'Converted').length,
    'Lost': leads.filter(lead => lead.status === 'Lost').length
  };

  const getDailyLeadData = () => {
    const dailyCounts = {};
    const today = new Date('2025-05-21T15:23:00+06:00');
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' });
      dailyCounts[dateStr] = 0;
    }
    leads.forEach(lead => {
      const leadDate = new Date(lead.submissionDate);
      const adjustedDate = new Date(leadDate.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
      const dateStr = adjustedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' });
      if (dailyCounts.hasOwnProperty(dateStr)) {
        dailyCounts[dateStr]++;
      }
    });
    return {
      labels: Object.keys(dailyCounts),
      data: Object.values(dailyCounts)
    };
  };

  const dailyLeadData = getDailyLeadData();

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAppointments = async (retries = 3, delay = 1000) => {
      setIsInitialLoading(true);
      const token = localStorage.getItem('token');
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const appointments = response.data.map(appointment => {
            let mappedStatus = appointment.status || 'Meeting 1';
            if (mappedStatus === 'New') {
              mappedStatus = 'Meeting 1';
            }
            if (mappedStatus === 'Contacted' || mappedStatus === 'Pitched') {
              mappedStatus = 'Need to Call';
            }
            return {
              id: appointment._id,
              fullName: appointment.fullName || 'Unknown Name',
              phoneNumber: appointment.phoneNumber || 'No Phone',
              email: appointment.email || '',
              websiteLink: appointment.websiteLink || '',
              submissionDate: appointment.submissionDate,
              rawAppointmentDate: appointment.date,
              appointmentTime: appointment.time,
              status: mappedStatus,
              service: appointment.activity?.some(a => a.text?.includes('Manually booked')) ? 'Manual Booking' : 'Appointment',
              message: appointment.activity?.some(a => a.text?.includes('Manually booked')) ? 'Manually booked appointment.' : 'Booked via appointment system',
              activity: appointment.activity || [],
              latestNote: appointment.latestNote || ''
            };
          });
          setLeads(appointments);
          setDisplayedLeadsCount(Math.min(leadsPerPage, appointments.length));
          setHasMore(appointments.length > leadsPerPage);
          if (appointments.length > 0) {
            const latest = appointments.reduce((latest, current) => {
              const latestDate = new Date(latest.submissionDate);
              const currentDate = new Date(current.submissionDate);
              return currentDate > latestDate ? current : latest;
            }, appointments[0]);
            setLastLeadReceived(`Last Lead Received: ${new Date(latest.submissionDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`);
          } else {
            setLastLeadReceived('No leads received yet');
          }
          setFetchError(null);
          setIsInitialLoading(false);
          return;
        } catch (err) {
          console.error(`Fetch attempt ${attempt} failed:`, {
            message: err.message,
            response: err.response ? {
              status: err.response.status,
              data: err.response.data
            } : null
          });
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            handleLogout();
            return;
          }
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          let errorMessage = 'Failed to fetch appointments. Please ensure the backend server is running and try again.';
          if (err.response) {
            if (err.response.status === 404) {
              errorMessage = 'Appointments endpoint not found. Check if the backend is correctly set up.';
            } else if (err.response.status === 500) {
              errorMessage = 'Server error. Please check the backend logs for details.';
            }
          } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to backend. Please ensure the server is running.';
          }
          setFetchError(errorMessage);
          setLastLeadReceived('No leads received yet');
          setIsInitialLoading(false);
        }
      }
    };
    fetchAppointments();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchBookedTimes = async () => {
      if (!selectedDate) {
        console.log('No selected date, skipping fetchBookedTimes');
        return;
      }
      const token = localStorage.getItem('token');
      try {
        const formattedDate = selectedDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        console.log('Fetching booked times for date:', formattedDate);
        const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const appointments = Array.isArray(response.data) ? response.data : [];
        const times = appointments
          .filter(appointment => {
            const appointmentDate = new Date(appointment.date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            return appointmentDate === formattedDate;
          })
          .map(appointment => appointment.time)
          .filter(time => time && typeof time === 'string');
        console.log('Extracted booked times:', times);
        setDateBookedTimes(prev => ({
          ...prev,
          [formattedDate]: times
        }));
        setFetchError(null);
      } catch (err) {
        console.error('Error fetching booked times:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            data: err.response.data
          } : null
        });
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          handleLogout();
          return;
        }
        setFetchError('Failed to fetch booked times. Please ensure the backend server is running and try again.');
        setDateBookedTimes(prev => ({
          ...prev,
          [selectedDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]: []
        }));
      }
    };
    fetchBookedTimes();
  }, [selectedDate, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedLead(null);
      }
      if (addLeadModalRef.current && !addLeadModalRef.current.contains(event.target)) {
        setIsAddLeadOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayedLeadsCount(prev => {
              const newCount = prev + leadsPerPage;
              setHasMore(newCount < filteredLeads.length);
              return Math.min(newCount, filteredLeads.length);
            });
            setIsLoading(false);
          }, 500);
        }
      },
      { threshold: 1.0 }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current && observerRef.current) {
        observerRef.current.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoading, filteredLeads.length, isAuthenticated]);

  const toggleStatusDropdown = (id) => {
    setOpenStatusDropdownId(openStatusDropdownId === id ? null : id);
  };

  const handleStatusSelect = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const timestamp = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      const lead = leads.find(lead => lead.id === id);
      if (!lead) {
        throw new Error('Lead not found');
      }
      const updatedActivity = [{ status: newStatus, timestamp }, ...lead.activity];
      await axios.patch(`${API_BASE_URL}/api/appointments/${id}`, {
        status: newStatus,
        activity: updatedActivity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedLead = {
        ...lead,
        status: newStatus,
        activity: updatedActivity
      };
      setLeads(leads.map(l => l.id === id ? updatedLead : l));
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead({ ...selectedLead, status: newStatus, activity: updatedActivity });
      }
      setOpenStatusDropdownId(null);
      setActionError(null);
    } catch (error) {
      console.error('Error updating status:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
      if (error.response && (error.response.status === 401 || err.response.status === 403)) {
        handleLogout();
        return;
      }
      setActionError('Failed to update status. Please check your connection and try again.');
    }
  };

  const handleDeleteLead = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE_URL}/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(leads.filter((lead) => lead.id !== id));
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(null);
      }
      setActionError(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
        return;
      }
      setActionError('Failed to delete lead. Please try again.');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (searchQuery) {
      const suggestionsList = leads
        .filter(lead =>
          lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lead.websiteLink && lead.websiteLink.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .map(lead => ({
          value: lead.fullName,
          type: 'Name',
          lead
        }))
        .concat(
          leads
            .filter(lead => lead.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(lead => ({ value: lead.phoneNumber, type: 'Phone', lead }))
        )
        .concat(
          leads
            .filter(lead => lead.websiteLink && lead.websiteLink.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(lead => ({ value: lead.websiteLink, type: 'Website', lead }))
        )
        .sort((a, b) => a.value.localeCompare(b.value))
        .slice(0, 5);
      setSuggestions(suggestionsList);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
    setDisplayedLeadsCount(Math.min(leadsPerPage, filteredLeads.length));
    setHasMore(filteredLeads.length > leadsPerPage);
  }, [searchQuery, leads, filterOption, statusFilter, leadsPerPage, isAuthenticated]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (e.key) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            setSearchQuery(suggestions[highlightedIndex].value);
            setSuggestions([]);
            setHighlightedIndex(-1);
          }
          break;
        default:
          break;
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.value);
    setSuggestions([]);
    setHighlightedIndex(-1);
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'Name': return 'person';
      case 'Phone': return 'phone';
      case 'Website': return 'language';
      default: return '';
    }
  };

  const toggleFilterDropdown = () => {
    setIsFilterDropdownOpen(prev => !prev);
  };

  const handleFilterSelect = (option) => {
    setFilterOption(option);
    setStatusFilter(null);
    setIsFilterDropdownOpen(false);
  };

  const openDetails = (lead) => {
    let time24 = lead.appointmentTime || '12:00 AM';
    if (lead.appointmentTime) {
      const [time, period] = lead.appointmentTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      const hourStr = String(hours).padStart(2, '0');
      const minuteStr = String(minutes).padStart(2, '0');
      time24 = `${hourStr}:${minuteStr}`;
    }
    setSelectedLead({
      ...lead,
      currentNote: '',
      newAppointmentDate: new Date(lead.rawAppointmentDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || dateOptions[0].value,
      newAppointmentTime: lead.appointmentTime || timeOptions.find(opt => !opt.disabled)?.value || timeOptions[0].value
    });
    setSelectedDate(new Date(lead.rawAppointmentDate));
  };

  const closeDetails = () => {
    setSelectedLead(null);
    setSelectedDate(new Date('2025-05-21T15:23:00+06:00'));
    setDateBookedTimes(prev => {
      const { [selectedDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]: omit, ...rest } = prev;
      return rest;
    });
  };

  const handleNoteChange = (e) => {
    setSelectedLead(prev => ({ ...prev, currentNote: e.target.value }));
  };

  const addNote = async (e) => {
    if (e.type === 'keypress' && e.key !== 'Enter') return;
    if (!selectedLead?.currentNote?.trim()) {
      setActionError('Please enter a note before adding.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const newNote = selectedLead.currentNote.trim();
      const timestamp = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      const updatedActivity = [{ text: newNote, timestamp }, ...selectedLead.activity];
      await axios.patch(`${API_BASE_URL}/api/appointments/${selectedLead.id}`, {
        latestNote: newNote,
        activity: updatedActivity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedLead = {
        ...selectedLead,
        latestNote: newNote,
        activity: updatedActivity,
        currentNote: ''
      };
      setLeads(leads.map(lead =>
        lead.id === selectedLead.id ? updatedLead : lead
      ));
      setSelectedLead(updatedLead);
      setActionError(null);
    } catch (error) {
      console.error('Error adding note:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
        return;
      }
      setActionError('Failed to add note. Please try again.');
    }
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setSelectedLead(prev => ({ ...prev, [name]: value }));
  };

  const handleNewLeadChange = (e) => {
    const { name, value } = e.target;
    setNewLead(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    if (!date) {
      console.log('No date selected in handleDateChange');
      return;
    }
    console.log('Selected date in handleDateChange:', date);
    setSelectedDate(date);
    const formatted = date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (selectedLead) {
      setSelectedLead(prev => ({ ...prev, newAppointmentDate: formatted }));
    } else if (isAddLeadOpen) {
      setNewLead(prev => ({ ...prev, appointmentDate: formatted }));
    }
  };

  const updateAppointment = async () => {
    if (selectedLead && selectedLead.newAppointmentDate && selectedLead.newAppointmentTime) {
      const token = localStorage.getItem('token');
      try {
        const formattedAppointmentDate = new Date(selectedLead.newAppointmentDate).toISOString();
        const formattedAppointmentTime = selectedLead.newAppointmentTime;
        const timestamp = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        const updatedActivity = [{ text: `Appointment booked for ${selectedLead.newAppointmentDate} at ${formattedAppointmentTime}`, timestamp }, ...selectedLead.activity];
        await axios.patch(`${API_BASE_URL}/api/appointments/${selectedLead.id}`, {
          date: formattedAppointmentDate,
          time: formattedAppointmentTime,
          activity: updatedActivity
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedLead = {
          ...selectedLead,
          rawAppointmentDate: formattedAppointmentDate,
          appointmentTime: formattedAppointmentTime,
          activity: updatedActivity
        };
        setLeads(leads.map(lead =>
          lead.id === selectedLead.id ? updatedLead : lead
        ));

        const formattedDate = selectedLead.newAppointmentDate;
        setDateBookedTimes(prev => {
          const currentTimes = prev[formattedDate] || [];
          const updatedTimes = currentTimes.includes(formattedAppointmentTime)
            ? currentTimes
            : [...currentTimes, formattedAppointmentTime];
          return {
            ...prev,
            [formattedDate]: updatedTimes
          };
        });

        setSelectedLead(null);
        setSelectedDate(new Date('2025-05-21T15:23:00+06:00'));
        setDateBookedTimes(prev => {
          const { [selectedLead.newAppointmentDate]: omit, ...rest } = prev;
          return rest;
        });
        setActionError(null);
      } catch (error) {
        console.error('Error updating appointment:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
          return;
        }
        setActionError('Failed to update appointment. Please try again.');
      }
    } else {
      setActionError('Please select both date and time for the appointment.');
    }
  };

  const updateStatus = async (newStatus) => {
    if (!selectedLead) return;
    const token = localStorage.getItem('token');
    try {
      const timestamp = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      const updatedActivity = [{ status: newStatus, timestamp }, ...selectedLead.activity];
      await axios.patch(`${API_BASE_URL}/api/appointments/${selectedLead.id}`, {
        status: newStatus,
        activity: updatedActivity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedLead = {
        ...selectedLead,
        status: newStatus,
        activity: updatedActivity
      };
      setLeads(leads.map(lead =>
        lead.id === selectedLead.id ? updatedLead : lead
      ));
      setSelectedLead(updatedLead);
      setActionError(null);
    } catch (error) {
      console.error('Error updating status:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
        return;
      }
      setActionError('Failed to update status. Please check your connection and try again.');
    }
  };

  const openAddLeadModal = () => {
    setIsAddLeadOpen(true);
    setNewLead({
      name: '',
      phone: '',
      email: '',
      website: '',
      appointmentDate: dateOptions[0].value,
      appointmentTime: timeOptions.find(opt => !opt.disabled)?.value || timeOptions[0].value
    });
    setSelectedDate(new Date('2025-05-21T15:23:00+06:00'));
  };

  const closeAddLeadModal = () => {
    setIsAddLeadOpen(false);
    setSelectedDate(new Date('2025-05-21T15:23:00+06:00'));
    setDateBookedTimes(prev => {
      const { [selectedDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]: omit, ...rest } = prev;
      return rest;
    });
  };

  const addNewLead = async () => {
    if (
      newLead.name.trim() &&
      newLead.phone.trim() &&
      newLead.appointmentDate.trim() &&
      newLead.appointmentTime.trim()
    ) {
      const token = localStorage.getItem('token');
      const now = new Date();
      const submissionDate = now.toISOString();
      const submissionTimestamp = now.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      const formattedAppointmentDate = new Date(newLead.appointmentDate).toISOString();
      const formattedAppointmentTime = newLead.appointmentTime;
      const cleanedEmail = newLead.email ? newLead.email.trim().toLowerCase() : '';
      const newLeadData = {
        fullName: newLead.name.trim(),
        phoneNumber: newLead.phone.trim(),
        email: cleanedEmail,
        websiteLink: newLead.website ? newLead.website.trim() : '',
        date: formattedAppointmentDate,
        time: formattedAppointmentTime,
        submissionDate,
        status: 'Meeting 1',
        activity: [{ text: `Manually booked on ${submissionTimestamp}`, timestamp: submissionTimestamp }],
        latestNote: ''
      };

      console.log('Submitting New Lead:', newLeadData);

      try {
        const response = await axios.post(`${API_BASE_URL}/api/appointments`, newLeadData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const newAppointment = response.data.appointment;
        const newLeadEntry = {
          id: newAppointment._id,
          fullName: newAppointment.fullName,
          phoneNumber: newAppointment.phoneNumber,
          email: newAppointment.email,
          websiteLink: newAppointment.websiteLink,
          submissionDate: newAppointment.submissionDate,
          rawAppointmentDate: newAppointment.date,
          appointmentTime: newAppointment.time,
          status: newAppointment.status,
          service: 'Manual Booking',
          message: 'Manually booked appointment.',
          activity: newAppointment.activity,
          latestNote: newAppointment.latestNote
        };
        setLeads([...leads, newLeadEntry]);
        setDisplayedLeadsCount(prev => Math.min(prev + 1, filteredLeads.length + 1));
        setHasMore(filteredLeads.length + 1 > leadsPerPage);

        const formattedDate = newLead.appointmentDate;
        setDateBookedTimes(prev => {
          const currentTimes = prev[formattedDate] || [];
          const updatedTimes = currentTimes.includes(formattedAppointmentTime)
            ? currentTimes
            : [...currentTimes, formattedAppointmentTime];
          return {
            ...prev,
            [formattedDate]: updatedTimes
          };
        });

        setIsAddLeadOpen(false);
        setNewLead({
          name: '',
          phone: '',
          email: '',
          website: '',
          appointmentDate: '',
          appointmentTime: ''
        });
        setSelectedDate(new Date('2025-05-21T15:23:00+06:00'));
        setActionError(null);
      } catch (error) {
        console.error('Error adding new lead:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
          return;
        }
        setActionError('Failed to add new lead. Please try again.');
      }
    } else {
      setActionError('Please fill in all required fields (Name, Phone, Appointment Date, and Time).');
    }
  };

  const handleAddUser = async () => {
    if (newUser.username.trim() && newUser.email.trim() && newUser.password.trim()) {
      const token = localStorage.getItem('token');
      try {
        await axios.post(`${API_BASE_URL}/api/settings/add-user`, {
          username: newUser.username.trim(),
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNewUser({ username: '', email: '', password: '' });
        setActionError(null);
        alert('User added successfully!');
      } catch (error) {
        console.error('Error adding user:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
          return;
        }
        setActionError(error.response?.data?.message || 'Failed to add user. Please try again.');
      }
    } else {
      setActionError('Please fill in all fields (Username, Email, Password).');
    }
  };

  const handleSettingsToggle = () => {
    setIsSettingsOpen(true);
    setActiveSection('Settings');
  };

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Sidebar
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        onSettingsToggle={handleSettingsToggle}
        activeSection={activeSection}
      />
      <div className="main-section">
        {activeSection === 'Dashboard' && (
          <Dashboard
            statusCounts={statusCounts}
            onBlockClick={handleDashboardBlockClick}
            lastLeadReceived={lastLeadReceived}
            dailyLeadData={dailyLeadData}
          />
        )}
        {activeSection === 'Leads' && (
          <LeadsManagement
            leads={currentLeads}
            statusOptions={statusOptions}
            openStatusDropdownId={openStatusDropdownId}
            toggleStatusDropdown={toggleStatusDropdown}
            handleStatusSelect={handleStatusSelect}
            openDetails={openDetails}
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            suggestions={suggestions}
            handleSuggestionClick={handleSuggestionClick}
            getSuggestionIcon={getSuggestionIcon}
            highlightedIndex={highlightedIndex}
            filterOption={filterOption}
            toggleFilterDropdown={toggleFilterDropdown}
            handleFilterSelect={handleFilterSelect}
            isFilterDropdownOpen={isFilterDropdownOpen}
            openAddLeadModal={openAddLeadModal}
            loadMoreRef={loadMoreRef}
            isLoading={isLoading}
            hasMore={hasMore}
            isInitialLoading={isInitialLoading}
            fetchError={fetchError}
            actionError={actionError}
            getStatusColor={getStatusColor}
            handleDeleteLead={handleDeleteLead}
          />
        )}
        {activeSection === 'Calendar' && (
          <Calendar
            leads={leads}
            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
            openDetails={openDetails}
          />
        )}
        {activeSection === 'Settings' && isSettingsOpen && (
          <Settings
            newUser={newUser}
            setNewUser={setNewUser}
            handleAddUser={handleAddUser}
            actionError={actionError}
          />
        )}
        {selectedLead && (
          <LeadDetailsModal
            lead={selectedLead}
            modalRef={modalRef}
            closeDetails={closeDetails}
            statusOptions={statusOptions}
            updateStatus={updateStatus}
            handleNoteChange={handleNoteChange}
            addNote={addNote}
            dateOptions={dateOptions}
            timeOptions={reorderTimeOptions(timeOptions, selectedLead.newAppointmentTime)}
            handleAppointmentChange={handleAppointmentChange}
            updateAppointment={updateAppointment}
            handleDeleteLead={handleDeleteLead}
            getGravatarUrl={getGravatarUrl}
            actionError={actionError}
          />
        )}
        {isAddLeadOpen && (
          <AddLeadModal
            newLead={newLead}
            handleNewLeadChange={handleNewLeadChange}
            addNewLead={addNewLead}
            closeAddLeadModal={closeAddLeadModal}
            addLeadModalRef={addLeadModalRef}
            dateOptions={dateOptions}
            timeOptions={timeOptions}
            actionError={actionError}
          />
        )}
      </div>
    </div>
  );
}

export default App;