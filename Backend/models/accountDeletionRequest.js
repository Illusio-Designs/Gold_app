const { db } = require("../config/db");

// Create a new account deletion request (from the public website form).
function createRequest(data, callback) {
  const sql = `INSERT INTO account_deletion_requests
    (user_name, business_name, mobile_number, status)
    VALUES (?, ?, ?, 'pending')`;
  const values = [
    data.user_name,
    data.business_name || null,
    data.mobile_number,
  ];
  db.query(sql, values, callback);
}

// List all requests, newest first.
function getAllRequests(callback) {
  const sql = `SELECT * FROM account_deletion_requests ORDER BY created_at DESC`;
  db.query(sql, callback);
}

// Get a single request by id.
function getRequestById(id, callback) {
  const sql = `SELECT * FROM account_deletion_requests WHERE id = ?`;
  db.query(sql, [id], callback);
}

// Update a request's status (and optional notes). Stamps processed_at when
// the request leaves the pending state.
function updateStatus(id, status, notes, callback) {
  const sql = `UPDATE account_deletion_requests
    SET status = ?, notes = ?, processed_at = CASE WHEN ? = 'pending' THEN NULL ELSE NOW() END
    WHERE id = ?`;
  db.query(sql, [status, notes || null, status, id], callback);
}

// Summary counts for the dashboard stat cards.
function getStats(callback) {
  const sql = `SELECT
      COUNT(*) AS total,
      SUM(status = 'pending')   AS pending,
      SUM(status = 'processed') AS processed,
      SUM(status = 'rejected')  AS rejected
    FROM account_deletion_requests`;
  db.query(sql, callback);
}

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateStatus,
  getStats,
};
