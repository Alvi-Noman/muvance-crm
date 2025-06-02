const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/appointments';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-api-key';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const appointmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  websiteLink: { type: String },
  submissionDate: { type: String, required: true },
  status: { type: String, default: 'New' },
  activity: [{
    text: { type: String },
    status: { type: String },
    timestamp: { type: String }
  }],
  latestNote: { type: String, default: '' }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

const initializeDefaultUser = async () => {
  try {
    const existingUser = await User.findOne({ username: 'AlviNoman' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('Killyourtv123_', 10);
      console.log('Hashed password for default user:', hashedPassword);
      const user = new User({
        username: 'AlviNoman',
        email: 'alvinoman80@gmail.com',
        password: hashedPassword,
        isAdmin: true
      });
      await user.save();
      console.log('Default admin user created with hashed password');
    } else {
      console.log('Default user already exists:', {
        username: existingUser.username,
        email: existingUser.email,
        password: existingUser.password,
        isAdmin: existingUser.isAdmin
      });
    }
  } catch (err) {
    console.error('Error initializing default user:', err);
  }
};

initializeDefaultUser();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    const user = User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

app.post('/api/login', [
  body('identifier').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { identifier, password } = req.body;
  console.log('Login attempt:', { identifier, password });

  try {
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });
    console.log('Found user:', user ? {
      username: user.username,
      email: user.email,
      password: user.password,
      isAdmin: user.isAdmin
    } : null);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful, token generated:', token);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/settings/add-user', authenticateAdmin, [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: false
    });
    await user.save();
    console.log('New user created:', { username, email, isAdmin: false });
    res.status(201).json({ message: 'User created successfully', user: { username, email } });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/appointments', [
  body('phoneNumber').isLength({ min: 11, max: 11 }).withMessage('Phone number must be exactly 11 digits'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, time, fullName, phoneNumber, email, websiteLink, submissionDate, status, activity } = req.body;

  try {
    const newAppointment = new Appointment({
      date,
      time,
      fullName,
      phoneNumber,
      email,
      websiteLink,
      submissionDate,
      status: status || 'New',
      activity: activity || [{
        text: `Booked on ${new Date(submissionDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`,
        timestamp: new Date(submissionDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      }],
      latestNote: ''
    });
    await newAppointment.save();
    console.log('New Appointment Saved:', newAppointment);
    res.status(201).json({ message: 'Appointment booked successfully', appointment: newAppointment });
  } catch (error) {
    console.error('Error saving appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    console.log('Appointments Fetched:', appointments);
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { status, activity, latestNote, date, time } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (activity) updateData.activity = activity;
    if (latestNote !== undefined) updateData.latestNote = latestNote;
    if (date) updateData.date = date;
    if (time) updateData.time = time;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log('Updated Appointment:', appointment);
    res.status(200).json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    console.log('Deleted Appointment:', appointment);
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});