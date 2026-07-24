const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Public: storefront apps read gold_rate + making % for price display.
router.get("/", settingsController.getPublicSettings);

// Admin only.
router.get("/all", verifyToken, requireAdmin, settingsController.getAllSettings);
router.put("/", verifyToken, requireAdmin, settingsController.updateSettings);

module.exports = router;
