const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  signup,
  login,
  logout,
  getProfile,
  updateProfile
} = require('../controllers/authController');

// Input validation middleware
const validateSignup = (req, res, next) => {
  const { username, email, password } = req.body;
  
  if (!username || username.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters long'
    });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;
  
  if (!identifier || identifier.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Email or username is required'
    });
  }
  
  if (!password || password.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  next();
};

// Public routes (no authentication required)
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

// Protected routes (authentication required)
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Check auth status route (useful for frontend)
router.get('/check', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User is authenticated',
    user: {
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;