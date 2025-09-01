const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user can only mark once per task
attendanceSchema.index({ user: 1, task: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
