const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// POST /api/auth/signup
async function signup(req, res) {
  try {
    const { name, email, password, semester, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const sem = Number(semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
      return res.status(400).json({ message: 'Semester must be an integer between 1 and 8' });
    }
    if (phone && !/^03\d{9}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must start with 03 and be 11 digits' });
    }
    if (!/[!@#$%^&*()]/.test(password)) {
      return res.status(400).json({ message: 'Password must include at least one special character: ! @ # $ % ^ & * ( )' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, semester: sem, phone });
    await user.save();
    res.status(201).json({ message: 'Signup successful, pending admin approval' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.role === 'student' && !user.approved) return res.status(403).json({ message: 'Account not approved by admin' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, semester: user.semester, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/approve/:id (admin)
async function approveUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { approved: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User approved', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/auth/role/:id (admin)
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/auth/all (admin)
async function getAllUsers(req, res) {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/auth/:id (admin) - edit user basic fields
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, approved } = req.body; // approved optional
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (approved !== undefined) update.approved = approved;
    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/auth/:id (admin)
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/auth/me - get current user profile
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/auth/me - update current user fields; for password change, verify currentPassword
async function updateMe(req, res) {
  try {
    const { name, email, semester, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists && String(exists._id) !== String(user._id)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (name !== undefined) user.name = name;
    if (semester !== undefined) {
      const sem = Number(semester);
      if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
        return res.status(400).json({ message: 'Semester must be an integer between 1 and 8' });
      }
      user.semester = sem;
    }
    if (req.body.phone !== undefined) {
      const p = req.body.phone;
      if (p && !/^03\d{9}$/.test(p)) {
        return res.status(400).json({ message: 'Phone must start with 03 and be 11 digits' });
      }
      user.phone = p || undefined;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
      if (!/[!@#$%^&*()]/.test(newPassword)) {
        return res.status(400).json({ message: 'New password must include at least one special character: ! @ # $ % ^ & * ( )' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    const safe = { id: user._id, name: user.name, email: user.email, role: user.role, semester: user.semester, phone: user.phone };
    res.json({ message: 'Profile updated', user: safe });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  signup,
  login,
  approveUser,
  updateUserRole,
  getAllUsers,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
};

// POST /api/auth/forgot
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordToken = hash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset?token=${rawToken}`;
    // In dev, log the link. Integrate email later.
    console.log('Password reset link:', resetUrl);
    return res.json({ message: 'Reset link sent (check email). For dev, see server logs.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/reset
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and newPassword required' });
    if (!/[!@#$%^&*()]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must include at least one special character: ! @ # $ % ^ & * ( )' });
    }
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({ message: 'Password has been reset. You can now login.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/admin/reset/:id (admin only)
async function adminResetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'newPassword is required' });
    if (!/[!@#$%^&*()]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must include at least one special character: ! @ # $ % ^ & * ( )' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password updated by admin' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// Nodemailer transporter using env vars
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: !!(process.env.SMTP_SECURE === 'true'),
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  service: process.env.SMTP_SERVICE || undefined, // e.g., 'gmail' if preferred
});

// POST /api/auth/forgot-otp
async function forgotOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    // Always respond success to avoid user enumeration
    if (!user) return res.json({ message: 'If that email exists, an OTP has been sent' });
    // generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    user.otpCode = hash;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'Student Portal';
    const mail = {
      from,
      to: email,
      subject: `Your ${appName} password reset OTP`,
      text: `Your OTP code is ${code}. It expires in 10 minutes.\nIf you did not request this, you can ignore this email.`,
      html: `<p>Your OTP code is <b>${code}</b>.</p><p>It expires in 10 minutes.</p>`,
    };
    try {
      await transporter.sendMail(mail);
    } catch (e) {
      console.error('Email send error:', e);
      // Still respond 200 to avoid enumeration; users can retry
    }
    return res.json({ message: 'OTP sent to your email (if it exists)' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/reset-with-otp
async function resetWithOtp(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'email, otp, and newPassword are required' });
    if (!/[!@#$%^&*()]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must include at least one special character: ! @ # $ % ^ & * ( )' });
    }
    const user = await User.findOne({ email });
    if (!user || !user.otpCode || !user.otpExpires) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'Invalid or expired OTP' });
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    if (hash !== user.otpCode) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();
    return res.json({ message: 'Password has been reset. You can now login.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// export new handlers
module.exports.forgotPassword = forgotPassword;
module.exports.resetPassword = resetPassword;
module.exports.adminResetPassword = adminResetPassword;
module.exports.forgotOtp = forgotOtp;
module.exports.resetWithOtp = resetWithOtp;
