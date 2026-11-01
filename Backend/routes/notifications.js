const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken, requireAdmin, requireSelfOrAdmin } = require("../middlewares/auth");

// Create notification (admin only — broadcasts to users)
router.post("/", verifyToken, requireAdmin, notificationController.createNotification);

// Send a REAL FCM test push and report the exact outcome/errors (admin only).
router.post("/test", verifyToken, requireAdmin, notificationController.sendTestNotification);

// Get user notifications
router.get("/user/:userId", verifyToken, requireSelfOrAdmin("userId"), notificationController.getUserNotifications);

// Get unread count
router.get("/user/:userId/unread", verifyToken, requireSelfOrAdmin("userId"), notificationController.getUnreadCount);

// Mark notification as read
router.patch("/:notificationId/read", verifyToken, notificationController.markAsRead);

// Mark all notifications as read
router.patch("/user/:userId/read-all", verifyToken, requireSelfOrAdmin("userId"), notificationController.markAllAsRead);

// Delete notification (admin only)
router.delete("/:notificationId", verifyToken, requireAdmin, notificationController.deleteNotification);

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