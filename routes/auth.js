const express = require('express');
const jwt = require('jsonwebtoken');
const {
  signup,
  login,
  approveUser,
  updateUserRole,
  getAllUsers,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  adminResetPassword,
  forgotOtp,
  resetWithOtp,
} = require('../controllers/authController');

const router = express.Router();

// Auth middlewares
function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token provided' });
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Only admin allowed' });
  next();
}

// Public
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);
router.post('/forgot-otp', forgotOtp);
router.post('/reset-with-otp', resetWithOtp);

// Admin-only
router.get('/all', verifyToken, adminOnly, getAllUsers);
router.post('/approve/:id', verifyToken, adminOnly, approveUser);
router.put('/role/:id', verifyToken, adminOnly, updateUserRole);
router.put('/:id', verifyToken, adminOnly, updateUser); // edit user
router.delete('/:id', verifyToken, adminOnly, deleteUser); // delete user
router.post('/admin/reset/:id', verifyToken, adminOnly, adminResetPassword);

// Self-profile
router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, updateMe);

module.exports = router;
