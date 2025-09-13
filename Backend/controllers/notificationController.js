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
  notifyLoginRequest,
  notifyNewOrder,
  notifyRegistrationStatusChange,
  notifyLoginRequestStatusChange,
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
          console.error("Error creating notification:", err);
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
                console.error("Error getting user tokens:", tokenErr);
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
              console.error("Error getting all tokens:", tokenErr);
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
    console.error("Error in createNotification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get user notifications
function getUserNotifications(req, res) {
  console.log("🔔 [CONTROLLER] getUserNotifications called:", {
    userId: req.params.userId,
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT n.*, 
           CASE WHEN un.user_id IS NOT NULL THEN 1 ELSE 0 END as is_read
    FROM notifications n
    LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `;

  console.log("🔔 [CONTROLLER] Querying notifications with params:", {
    userId,
    limit: parseInt(limit),
    offset,
  });
  db.query(sql, [userId, parseInt(limit), offset], (err, results) => {
    if (err) {
      console.error("❌ [CONTROLLER] Error getting user notifications:", err);
      return res.status(500).json({ error: "Failed to get notifications" });
    }

    console.log("🔔 [CONTROLLER] Found notifications:", results.length);
    console.log(
      "🔔 [CONTROLLER] First notification:",
      results[0]
        ? {
            id: results[0].id,
            title: results[0].title,
            type: results[0].type,
          }
        : "No notifications"
    );

    res.json({
      notifications: results,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  });
}

// Get unread count for a user
function getUnreadCount(req, res) {
  console.log("🔔 [CONTROLLER] getUnreadCount called:", {
    userId: req.params.userId,
    timestamp: new Date().toISOString(),
  });

  const { userId } = req.params;

  const sql = `
    SELECT COUNT(*) as unread_count
    FROM notifications n
    LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
    WHERE un.user_id IS NULL
  `;

  console.log("🔔 [CONTROLLER] Querying unread count for user:", userId);
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ [CONTROLLER] Error getting unread count:", err);
      return res.status(500).json({ error: "Failed to get unread count" });
    }

    const unreadCount = results[0].unread_count;
    console.log(
      "🔔 [CONTROLLER] Unread count for user:",
      userId,
      "=",
      unreadCount
    );

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
      console.error("Error marking notification as read:", err);
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
      console.error("Error marking all notifications as read:", err);
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
      console.error("Error deleting notification:", err);
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
  console.log("🔔 [FCM REGISTRATION] Starting FCM token registration...");
  console.log("🔔 [FCM REGISTRATION] Request body:", req.body);
  console.log("🔔 [FCM REGISTRATION] User from auth:", req.user);

  const { token, deviceType = "web" } = req.body;
  const userId = req.user.id; // From auth middleware

  if (!token) {
    console.error("❌ [FCM REGISTRATION] No FCM token provided");
    return res.status(400).json({ error: "FCM token is required" });
  }

  console.log("🔔 [FCM REGISTRATION] Registering token for user:", userId);
  console.log(
    "🔔 [FCM REGISTRATION] Token preview:",
    token.substring(0, 20) + "..."
  );
  console.log("🔔 [FCM REGISTRATION] Device type:", deviceType);

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
      console.error("❌ [FCM REGISTRATION] Error registering FCM token:", err);
      return res.status(500).json({ error: "Failed to register FCM token" });
    }

    console.log(
      "✅ [FCM REGISTRATION] FCM token registered successfully for user:",
      userId
    );
    console.log("✅ [FCM REGISTRATION] Database result:", result);

    res.json({ message: "FCM token registered successfully" });
  });
}

// Register FCM token for unauthenticated user
function registerFCMTokenUnauth(req, res) {
  try {
    console.log("🔔 [CONTROLLER] registerFCMTokenUnauth called");
    console.log("🔔 [CONTROLLER] Request body:", req.body);

    const { token, deviceType = "mobile", userId = null } = req.body;

    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    console.log("🔔 [CONTROLLER] Registering unauthenticated token:", {
      userId: userId || "NULL",
      token: token.substring(0, 20) + "...",
      deviceType,
    });

    const sql = `
      INSERT INTO notification_tokens (user_id, token, device_type, active, created_at)
      VALUES (?, ?, ?, true, NOW())
      ON DUPLICATE KEY UPDATE 
        user_id = COALESCE(notification_tokens.user_id, VALUES(user_id)),
        device_type = VALUES(device_type),
        active = true,
        updated_at = NOW()
    `;

    db.query(sql, [userId, token, deviceType], (err, result) => {
      if (err) {
        console.error("❌ [CONTROLLER] Error registering FCM token:", err);
        return res.status(500).json({ error: "Failed to register FCM token" });
      }

      console.log(
        "✅ [CONTROLLER] Unauthenticated FCM token registered successfully"
      );
      res.json({
        success: true,
        message: "FCM token registered successfully",
        userId: userId || null,
      });
    });
  } catch (error) {
    console.error("❌ [CONTROLLER] Error in registerFCMTokenUnauth:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

// Get stored tokens (admin only)
function getStoredTokens(req, res) {
  // Get stored tokens for debugging

  const { userId } = req.query;

  let sql = "SELECT * FROM notification_tokens WHERE active = true";
  let params = [];

  if (userId) {
    sql += " AND user_id = ?";
    params.push(userId);
  }

  sql += " ORDER BY created_at DESC";

  console.log("🔍 [DEBUG] Querying tokens with SQL:", sql);
  console.log("🔍 [DEBUG] Query parameters:", params);

  // Execute query
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ [DEBUG] Error getting stored tokens:", err);
      return res.status(500).json({ error: "Failed to get stored tokens" });
    }

    console.log("🔍 [DEBUG] Found tokens:", results.length);
    if (results.length > 0) {
      console.log("🔍 [DEBUG] First token:", {
        id: results[0].id,
        user_id: results[0].user_id,
        device_type: results[0].device_type,
        active: results[0].active,
      });
    }

    // If userId is provided, also check user info
    if (userId) {
      const userSql =
        "SELECT id, name, email, status, created_at FROM users WHERE id = ?";
      db.query(userSql, [userId], (userErr, userResults) => {
        if (userErr) {
          console.error("❌ [DEBUG] Error getting user info:", userErr);
        } else if (userResults.length > 0) {
          const user = userResults[0];
          console.log("🔍 [DEBUG] User info:", {
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status,
            created_at: user.created_at,
          });
        }

        // Return token details with user info
        const formattedResults = results.map((t) => ({
          id: t.id,
          user_id: t.user_id,
          token_preview: t.token ? t.token.substring(0, 20) + "..." : "null",
          device_type: t.device_type,
          active: t.active,
          created_at: t.created_at,
        }));

        res.json({
          tokens: formattedResults,
          totalCount: results.length,
          hasTokens: results.length > 0,
          user: userResults.length > 0 ? userResults[0] : null,
          notificationStatus: {
            hasFCMToken: results.length > 0,
            tokenCount: results.length,
            canReceiveNotifications: results.length > 0,
          },
        });
      });
    } else {
      // Return token details without user info
      const formattedResults = results.map((t) => ({
        id: t.id,
        user_id: t.user_id,
        token_preview: t.token ? t.token.substring(0, 20) + "..." : "null",
        device_type: t.device_type,
        active: t.active,
        created_at: t.created_at,
      }));

      res.json({
        tokens: formattedResults,
        totalCount: results.length,
        hasTokens: results.length > 0,
      });
    }
  });
}

// Subscribe user to topic
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
      console.error("Error getting user token:", err);
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
      console.error("Error getting user token:", err);
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

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerFCMToken,
  registerFCMTokenUnauth,
  getStoredTokens,
  subscribeUserToTopic,
  unsubscribeUserFromTopic,
  getVapidKey,
  sseNotifications,
  sendAdminNotification,
  notifyUserRegistration,
  notifyLoginRequest,
  notifyNewOrder,
  notifyRegistrationStatusChange,
  notifyLoginRequestStatusChange,
  notifyOrderStatusChange,
  sendUserNotification,
  getAdminNotificationStats,
  NOTIFICATION_TYPES,
};
