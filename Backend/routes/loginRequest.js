const express = require("express");
const router = express.Router();
const loginRequestController = require("../controllers/loginRequestController");
const {
  verifyToken,
  requireAdmin,
  requireBusiness,
} = require("../middlewares/auth");

// Business user routes
router.post("/", loginRequestController.createLoginRequest);
router.get(
  "/user",
  verifyToken,
  requireBusiness,
  loginRequestController.getUserLoginRequests
);

// Admin only routes
router.get(
  "/",
  verifyToken,
  requireAdmin,
  loginRequestController.getAllLoginRequests
);
router.patch(
  "/:requestId",
  verifyToken,
  requireAdmin,
  loginRequestController.updateLoginRequest
);

// Get approved and active categories for a user
router.get(
  "/approved-categories/:userId",
  verifyToken,
  requireBusiness,
  loginRequestController.getApprovedCategoriesForUser
);

// Get products filtered by user's approved categories
router.get(
  "/approved-products/:userId",
  verifyToken,
  requireBusiness,
  loginRequestController.getApprovedProductsForUser
);

module.exports = router;
