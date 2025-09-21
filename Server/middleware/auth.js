const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();


// JWT Secret key - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.authToken;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Middleware to generate JWT token
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '7d' // Token expires in 7 days
    });
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

// Middleware to set secure cookie options
const getCookieOptions = () => {
  return {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/' // Cookie available for all routes
  };
};

// Optional middleware for routes that work with or without auth
const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.authToken;
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Token invalid but continue without user info
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  getCookieOptions,
  optionalAuth,
  JWT_SECRET
};