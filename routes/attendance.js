const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT and set req.user
function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Student marks attendance
router.post('/mark', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can mark attendance' });
    const today = new Date();
    today.setHours(0,0,0,0);
    const existing = await Attendance.findOne({ user: req.user.id, date: today });
    if (existing) return res.status(400).json({ message: 'Attendance already marked for today' });
    const attendance = new Attendance({ user: req.user.id, date: today, status: 'present' });
    await attendance.save();
    res.json({ message: 'Attendance marked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Student marks attendance for a specific task within its time window
router.post('/mark-by-task/:taskId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can mark attendance' });
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Window check (if provided)
    const now = new Date();
    if (task.attendanceStart && now < task.attendanceStart) {
      return res.status(400).json({ message: 'Attendance window has not started yet' });
    }
    if (task.attendanceEnd && now > task.attendanceEnd) {
      return res.status(400).json({ message: 'Attendance window has ended' });
    }

    // Only once per task per user
    const existing = await Attendance.findOne({ user: req.user.id, task: task._id });
    if (existing) return res.status(400).json({ message: 'Attendance already marked for this task' });

    const date = new Date();
    date.setHours(0,0,0,0);
    const attendance = new Attendance({ user: req.user.id, task: task._id, date, status: 'present' });
    await attendance.save();
    res.json({ message: 'Attendance marked for task', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin gets all attendance
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can view all attendance' });
    const records = await Attendance.find().populate('user', 'name email');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Student gets own attendance
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user.id });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
