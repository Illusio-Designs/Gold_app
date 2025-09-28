const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

// Verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Check if user is business user
function requireBusiness(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.type !== 'business') {
    return res.status(403).json({ error: 'Business user access required' });
  }

  next();
}

// Check if business user is approved
function requireApprovedBusiness(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.type !== 'business') {
    return res.status(403).json({ error: 'Business user access required' });
  }

  // Check if user is approved (with bypass logic)
  db.query('SELECT status, phone_number FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Special bypass for phone number 7600046416
    const BYPASS_PHONE_NUMBER = "7600046416";
    const isBypassUser = results[0].phone_number === BYPASS_PHONE_NUMBER;

    if (!isBypassUser && results[0].status !== 'approved') {
      return res.status(403).json({ error: 'Account not approved' });
    }

    if (isBypassUser) {
      console.log('[Auth] Bypass user detected in requireApprovedBusiness - allowing access');
    }

    next();
  });
}

// Optional authentication (doesn't fail if no token)
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Invalid token in optional auth:', error.message);
    }
  }

  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireBusiness,
  requireApprovedBusiness,
  optionalAuth
}; 