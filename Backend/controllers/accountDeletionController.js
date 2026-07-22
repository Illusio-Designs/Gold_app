const model = require("../models/accountDeletionRequest");

const VALID_STATUSES = ["pending", "processed", "rejected"];

// Public — submit an account deletion request from the website form.
function submitRequest(req, res) {
  const { user_name, business_name, mobile_number } = req.body;

  if (!user_name || !mobile_number) {
    return res
      .status(400)
      .json({ error: "User name and mobile number are required" });
  }

  // Accept 10-13 digit mobile numbers (ignoring spaces / +, -).
  const digits = String(mobile_number).replace(/[\s+-]/g, "");
  if (!/^\d{10,13}$/.test(digits)) {
    return res.status(400).json({ error: "Invalid mobile number" });
  }

  model.createRequest(
    { user_name, business_name, mobile_number },
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to submit request" });
      }
      return res.status(201).json({
        success: true,
        message:
          "Your account deletion request has been submitted. Our team will review and process it shortly.",
      });
    }
  );
}

// Admin — list all deletion requests.
function getAllRequests(req, res) {
  model.getAllRequests((err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to load requests" });
    }
    return res.json({ requests: results || [] });
  });
}

// Admin — summary counts.
function getStats(req, res) {
  model.getStats((err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to load statistics" });
    }
    const row = (results && results[0]) || {};
    return res.json({
      total: Number(row.total) || 0,
      pending: Number(row.pending) || 0,
      processed: Number(row.processed) || 0,
      rejected: Number(row.rejected) || 0,
    });
  });
}

// Admin — update a request's status.
function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  model.getRequestById(id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    model.updateStatus(id, status, notes, (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: "Failed to update request" });
      }
      return res.json({ success: true, message: "Request updated" });
    });
  });
}

module.exports = {
  submitRequest,
  getAllRequests,
  getStats,
  updateRequestStatus,
};
