const { db } = require("../config/db");
const {
  sendNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  VAPID_KEY,
} = require("../services/firebaseNotificationService");
const {
  sendAdminNotification,
  notifyUserRegistration,
  notifyNewOrder,
  notifyNewCustomOrder,
  notifyRegistrationStatusChange,
  notifyOrderStatusChange,
  sendUserNotification,
  getAdminNotificationStats,
  NOTIFICATION_TYPES,
} = require("../services/adminNotificationService");

// Create a notification and send push notification
async function createNotification(req, res) {
  try {
    const { title, body, type, targetUsers, topic, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    // Create notification record in database
    const notificationData = {
      title,
      body,
      type: type || "general",
      data: data ? JSON.stringify(data) : null,
      created_at: new Date(),
    };

    const insertNotificationSql = `
      INSERT INTO notifications (title, body, type, data, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertNotificationSql,
      [
        notificationData.title,
        notificationData.body,
        notificationData.type,
        notificationData.data,
        notificationData.created_at,
      ],
      async (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to create notification" });
        }

        const notificationId = result.insertId;

        // Send push notification based on target type
        let pushResult = null;

        if (topic) {
          // Send to topic
          pushResult = await sendTopicNotification(topic, title, body, data);
        } else if (
          targetUsers &&
          Array.isArray(targetUsers) &&
          targetUsers.length > 0
        ) {
          // Send to specific users
          const getUserTokensSql = `
          SELECT token FROM notification_tokens 
          WHERE user_id IN (${targetUsers.map(() => "?").join(",")}) 
          AND active = true
        `;

          db.query(
            getUserTokensSql,
            targetUsers,
            async (tokenErr, tokenResults) => {
              if (tokenErr) {
                return res
                  .status(500)
                  .json({ error: "Failed to get user tokens" });
              }

              const tokens = tokenResults.map((row) => row.token);
              if (tokens.length > 0) {
                pushResult = await sendMulticastNotification(
                  tokens,
                  title,
                  body,
                  data
                );
              }
            }
          );
        } else {
          // Send to all users
          const getAllTokensSql =
            "SELECT token FROM notification_tokens WHERE active = true";
          db.query(getAllTokensSql, async (tokenErr, tokenResults) => {
            if (tokenErr) {
              return res
                .status(500)
                .json({ error: "Failed to get user tokens" });
            }

            const tokens = tokenResults.map((row) => row.token);
            if (tokens.length > 0) {
              pushResult = await sendMulticastNotification(
                tokens,
                title,
                body,
                data
              );
            }
          });
        }

        res.json({
          message: "Notification created successfully",
          notificationId,
          pushResult,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get user notifications
function getUserNotifications(req, res) {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Show this user's own notifications plus global broadcasts (user_id IS NULL).
  const sql = `
    SELECT n.*,
           CASE WHEN un.user_id IS NOT NULL THEN 1 ELSE 0 END as is_read
    FROM notifications n
    LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
    WHERE (n.user_id = ? OR n.user_id IS NULL)
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [userId, userId, parseInt(limit), offset], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to get notifications" });
    }

    res.json({
      notifications: results,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  });
}

// Get unread count for a user
function getUnreadCount(req, res) {
  const { userId } = req.params;

  const sql = `
    SELECT COUNT(*) as unread_count
    FROM notifications n
    LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
    WHERE un.user_id IS NULL
      AND (n.user_id = ? OR n.user_id IS NULL)
  `;

  db.query(sql, [userId, userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to get unread count" });
    }

    const unreadCount = results[0].unread_count;
    res.json({ unreadCount });
  });
}

// Mark a notification as read
function markAsRead(req, res) {
  const { userId, notificationId } = req.params;

  const sql = `
    INSERT INTO user_notifications (user_id, notification_id, read_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE read_at = NOW()
  `;

  db.query(sql, [userId, notificationId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to mark notification as read" });
    }

    res.json({ message: "Notification marked as read" });
  });
}

// Mark all notifications as read for a user
function markAllAsRead(req, res) {
  const { userId } = req.params;

  const sql = `
    INSERT INTO user_notifications (user_id, notification_id, read_at)
    SELECT ?, n.id, NOW()
    FROM notifications n
    LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
    WHERE un.user_id IS NULL
    ON DUPLICATE KEY UPDATE read_at = NOW()
  `;

  db.query(sql, [userId, userId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to mark notifications as read" });
    }

    res.json({ message: "All notifications marked as read" });
  });
}

// Delete a notification
function deleteNotification(req, res) {
  const { notificationId } = req.params;

  const sql = "DELETE FROM notifications WHERE id = ?";

  db.query(sql, [notificationId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to delete notification" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  });
}

// Register FCM token for authenticated user
function registerFCMToken(req, res) {
  const { token, deviceType = "web" } = req.body;
  const userId = req.user.id; // From auth middleware

  if (!token) {
    return res.status(400).json({ error: "FCM token is required" });
  }

  const sql = `
    INSERT INTO notification_tokens (user_id, token, device_type, active, created_at)
    VALUES (?, ?, ?, true, NOW())
    ON DUPLICATE KEY UPDATE 
      user_id = VALUES(user_id),
      device_type = VALUES(device_type),
      active = true,
      updated_at = NOW()
  `;

  db.query(sql, [userId, token, deviceType], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to register FCM token" });
    }

    res.json({ message: "FCM token registered successfully" });
  });
}

// Report whether the logged-in user has an active push token registered.
function getTokenStatus(req, res) {
  const userId = req.user.id;
  const sql = `
    SELECT COUNT(*) AS count, MAX(updated_at) AS last_updated,
           MAX(device_type) AS device_type
    FROM notification_tokens
    WHERE user_id = ? AND active = true
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to get token status" });
    }
    const row = results[0] || {};
    res.json({
      registered: (row.count || 0) > 0,
      count: row.count || 0,
      deviceType: row.device_type || null,
      lastUpdated: row.last_updated || null,
    });
  });
}
function subscribeUserToTopic(req, res) {
  const { userId, topic } = req.body;

  if (!userId || !topic) {
    return res.status(400).json({ error: "User ID and topic are required" });
  }

  // Get user's FCM token
  const getTokenSql =
    "SELECT token FROM notification_tokens WHERE user_id = ? AND active = true";

  db.query(getTokenSql, [userId], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to get user token" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No active FCM token found for user" });
    }

    const token = results[0].token;
    const result = await subscribeToTopic(token, topic);

    if (result.success) {
      res.json({ message: "Successfully subscribed to topic" });
    } else {
      res
        .status(500)
        .json({ error: "Failed to subscribe to topic", details: result.error });
    }
  });
}

// Unsubscribe user from topic
function unsubscribeUserFromTopic(req, res) {
  const { userId, topic } = req.body;

  if (!userId || !topic) {
    return res.status(400).json({ error: "User ID and topic are required" });
  }

  // Get user's FCM token
  const getTokenSql =
    "SELECT token FROM notification_tokens WHERE user_id = ? AND active = true";

  db.query(getTokenSql, [userId], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to get user token" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No active FCM token found for user" });
    }

    const token = results[0].token;
    const result = await unsubscribeFromTopic(token, topic);

    if (result.success) {
      res.json({ message: "Successfully unsubscribed from topic" });
    } else {
      res
        .status(500)
        .json({
          error: "Failed to unsubscribe from topic",
          details: result.error,
        });
    }
  });
}

// Get VAPID key for web push notifications
function getVapidKey(req, res) {
  res.json({ vapidKey: VAPID_KEY });
}

// Server-sent events for real-time notifications (placeholder)
function sseNotifications(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Send initial connection message
  res.write(
    'data: {"type": "connection", "message": "Connected to notification stream"}\n\n'
  );

  // Keep connection alive
  const interval = setInterval(() => {
    res.write(
      'data: {"type": "ping", "timestamp": "' +
        new Date().toISOString() +
        '"}\n\n'
    );
  }, 30000);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(interval);
  });
}

// Admin: send a REAL FCM test push and report the exact outcome so failures
// are visible (missing service account, no tokens, FCM errors, etc.).
async function sendTestNotification(req, res) {
  try {
    const target = (req.body && req.body.target) || "self";
    const title = (req.body && req.body.title) || "Test notification";
    const body =
      (req.body && req.body.body) || "This is a test push from the dashboard.";

    // Which devices to send to. business = B2B users, consumer = D2C users,
    // self = the logged-in admin's own devices, all = everyone.
    let sql;
    let params = [];
    if (target === "self") {
      sql = "SELECT token FROM notification_tokens WHERE active = true AND user_id = ?";
      params = [req.user && req.user.id];
    } else if (target === "business" || target === "consumer") {
      sql =
        "SELECT t.token FROM notification_tokens t JOIN users u ON t.user_id = u.id " +
        "WHERE t.active = true AND u.type = ?";
      params = [target];
    } else {
      sql = "SELECT token FROM notification_tokens WHERE active = true";
    }

    const tokens = await new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map((r) => r.token).filter(Boolean));
      });
    });

    if (tokens.length === 0) {
      return res.status(200).json({
        success: false,
        error: `No active device tokens for "${target}". Open the app (logged in) so it registers a token, then retry.`,
        tokenCount: 0,
      });
    }

    const result = await sendMulticastNotification(tokens, title, body, { type: "test" });

    if (result && result.disabled) {
      return res.status(200).json({
        success: false,
        disabled: true,
        error:
          "Firebase is not configured on the server (no service account key). " +
          "Upload Backend/firebase-service-account.json (amrut-jewels key) and restart the backend.",
        tokenCount: tokens.length,
      });
    }
    if (result && result.success === false) {
      return res.status(200).json({
        success: false,
        error: result.error || "FCM send failed.",
        tokenCount: tokens.length,
      });
    }

    return res.status(200).json({
      success: true,
      tokenCount: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      message: `Test push delivered to ${result.successCount}/${tokens.length} device(s) for "${target}".`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createNotification,
  sendTestNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerFCMToken,
  getTokenStatus,
  subscribeUserToTopic,
  unsubscribeUserFromTopic,
  getVapidKey,
  sseNotifications,
  sendAdminNotification,
  notifyUserRegistration,
  notifyNewOrder,
  notifyNewCustomOrder,
  notifyRegistrationStatusChange,
  notifyOrderStatusChange,
  sendUserNotification,
  getAdminNotificationStats,
  NOTIFICATION_TYPES,
};
