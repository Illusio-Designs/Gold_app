const express = require("express");
const router = express.Router();
const appVersionController = require("../controllers/appVersionController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Public routes (no authentication required)
router.get("/check-update", appVersionController.checkAppUpdate);
router.get("/latest/:platform", appVersionController.getLatestVersion);

// Protected routes (require admin authentication)
router.post("/", verifyToken, requireAdmin, appVersionController.createAppVersion);
router.get("/", verifyToken, requireAdmin, appVersionController.getAllVersions);
router.get("/platform/:platform", verifyToken, requireAdmin, appVersionController.getVersionsByPlatform);
router.put("/:id", verifyToken, requireAdmin, appVersionController.updateAppVersion);
router.delete("/:id", verifyToken, requireAdmin, appVersionController.deleteAppVersion);
router.patch("/:id/activate", verifyToken, requireAdmin, appVersionController.activateVersion);

module.exports = router; 