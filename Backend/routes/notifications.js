const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Create notification (admin only)
router.post("/", verifyToken, notificationController.createNotification);

// Send a REAL FCM test push and report the exact outcome/errors (admin only).
router.post("/test", verifyToken, requireAdmin, notificationController.sendTestNotification);

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

// Check whether the logged-in user has a push token registered
router.get("/token-status", verifyToken, notificationController.getTokenStatus);


// Subscribe user to topic
router.post("/subscribe-topic", verifyToken, notificationController.subscribeUserToTopic);

// Unsubscribe user from topic
router.post("/unsubscribe-topic", verifyToken, notificationController.unsubscribeUserFromTopic);

// Get VAPID key for web push notifications
router.get("/vapid-key", notificationController.getVapidKey);


// Server-Sent Events endpoint for real-time notifications
router.get("/sse", verifyToken, notificationController.sseNotifications);

module.exports = router; 