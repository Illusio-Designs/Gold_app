const express = require("express");
const router = express.Router();
const controller = require("../controllers/accountDeletionController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Public route — website deletion form submits here (no authentication).
router.post("/request", controller.submitRequest);

// Protected routes — admin dashboard.
router.get("/", verifyToken, requireAdmin, controller.getAllRequests);
router.get("/stats", verifyToken, requireAdmin, controller.getStats);
router.patch("/:id/status", verifyToken, requireAdmin, controller.updateRequestStatus);

module.exports = router;
