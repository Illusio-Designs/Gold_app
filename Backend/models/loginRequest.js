const { db } = require('../config/db');

// Create new login request (multi-category)
function createLoginRequest(loginRequest, callback) {
  const sql = 'INSERT INTO login_requests (user_id, category_ids, remarks) VALUES (?, ?, ?)';
  const values = [loginRequest.userId, loginRequest.categoryIds, loginRequest.remarks];
  db.query(sql, values, callback);
}

// Get all login requests with user and category details
function getAllLoginRequests(callback) {
  const sql = `
    SELECT 
      lr.*,
      u.name as user_name,
      u.business_name,
      u.phone_number,
      u.email
    FROM login_requests lr
    JOIN users u ON lr.user_id = u.id
    ORDER BY lr.created_at DESC
  `;
  db.query(sql, callback);
}

// Get login requests for a specific user
function getLoginRequestsByUserId(userId, callback) {
  const sql = `
    SELECT 
      lr.*
    FROM login_requests lr
    WHERE lr.user_id = ?
    ORDER BY lr.created_at DESC
  `;
  db.query(sql, [userId], callback);
}

// Update login request status
function updateLoginRequest(requestId, updateData, callback) {
  const sql = 'UPDATE login_requests SET status = ?, remarks = ?, session_time_minutes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  const values = [updateData.status, updateData.remarks, updateData.sessionTimeMinutes, requestId];
  db.query(sql, values, callback);
}

// Get approved login request for user and category
function getApprovedLoginRequest(userId, categoryId, callback) {
  const sql = `
    SELECT 
      lr.*,
      c.name as category_name,
      c.image as category_image
    FROM login_requests lr
    JOIN categories c ON lr.category_id = c.id
    WHERE lr.user_id = ? 
    AND lr.category_id = ? 
    AND lr.status = 'approved'
    AND lr.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY lr.created_at DESC 
    LIMIT 1
  `;
  db.query(sql, [userId, categoryId], callback);
}

// Check if user has pending request for category
function checkPendingRequest(userId, categoryId, callback) {
  const sql = `
    SELECT * FROM login_requests 
    WHERE user_id = ? 
    AND category_id = ? 
    AND status = 'pending'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `;
  db.query(sql, [userId, categoryId], callback);
}

// Check if user has any active request (pending, approved, logged_in) for any of the requested categories
function hasActiveLoginRequest(userId, _categoryIds, callback) {
  // Ignore categoryIds, just check for any active request for the user
  const sql = `SELECT * FROM login_requests WHERE user_id = ? AND status IN ('pending', 'approved', 'logged_in') AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`;
  db.query(sql, [userId], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0 ? [{}] : []);
  });
}

// Expire login requests for user/category where session time is over
function expireLoginRequestsForUser(userId, callback) {
  // Expire requests where status is logged_in and session time is over
  const sql = `UPDATE login_requests SET status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND status = 'logged_in' AND session_time_minutes IS NOT NULL AND session_start_time IS NOT NULL
    AND NOW() > DATE_ADD(session_start_time, INTERVAL session_time_minutes MINUTE)`;
  db.query(sql, [userId], callback);
}

module.exports = {
  createLoginRequest,
  getAllLoginRequests,
  getLoginRequestsByUserId,
  updateLoginRequest,
  getApprovedLoginRequest,
  checkPendingRequest,
  hasActiveLoginRequest,
  expireLoginRequestsForUser,
};