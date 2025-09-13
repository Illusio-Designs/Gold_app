const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken } = require("../middlewares/auth");

// Create notification (admin only)
router.post("/", verifyToken, notificationController.createNotification);

// Get user notifications
router.get("/user/:userId", verifyToken, notificationController.getUserNotifications);

// Get unread count
router.get("/user/:userId/unread", verifyToken, notificationController.getUnreadCount);

// Mark notification as read
router.patch("/:notificationId/read", verifyToken, notificationController.markAsRead);

// Mark all notifications as read
router.patch("/user/:userId/read-all", verifyToken, notificationController.markAllAsRead);

// Delete notification
router.delete("/:notificationId", verifyToken, notificationController.deleteNotification);

// Register FCM token for admin
router.post("/register-token", verifyToken, notificationController.registerFCMToken);

// Register FCM token for unauthenticated users
router.post("/register-token-unauth", notificationController.registerFCMTokenUnauth);

// Subscribe user to topic
router.post("/subscribe-topic", verifyToken, notificationController.subscribeUserToTopic);

// Unsubscribe user from topic
router.post("/unsubscribe-topic", verifyToken, notificationController.unsubscribeUserFromTopic);

// Get VAPID key for web push notifications
router.get("/vapid-key", notificationController.getVapidKey);

// Test endpoint to check stored tokens (for debugging)
router.get("/debug/tokens", verifyToken, notificationController.getStoredTokens);

// Server-Sent Events endpoint for real-time notifications
router.get("/sse", verifyToken, notificationController.sseNotifications);

module.exports = router; 