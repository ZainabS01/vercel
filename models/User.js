const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  approved: { type: Boolean, default: false },
  phone: { type: String, match: /^03\d{9}$/ },
  semester: { type: Number, min: 1, max: 8 },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  otpCode: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
