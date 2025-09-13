const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// All dashboard routes require authentication and admin access
router.use(verifyToken);
router.use(requireAdmin);

// Get comprehensive dashboard statistics
router.get("/stats", dashboardController.getDashboardStats);

// Get today's orders with details
router.get("/today-orders", dashboardController.getTodayOrders);

// Get quick stats (lightweight version)
router.get("/quick-stats", dashboardController.getQuickStats);

module.exports = router; 