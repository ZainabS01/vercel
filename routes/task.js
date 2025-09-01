const express = require('express');
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

// Admin creates a task
router.post('/create', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can create tasks' });
    const { title, description, link, attendanceStart, attendanceEnd } = req.body;
    const task = new Task({
      title,
      description,
      link,
      attendanceStart: attendanceStart ? new Date(attendanceStart) : undefined,
      attendanceEnd: attendanceEnd ? new Date(attendanceEnd) : undefined,
    });
    await task.save();
    res.json({ message: 'Task created', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Students fetch all tasks
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
