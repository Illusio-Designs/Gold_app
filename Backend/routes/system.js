const express = require("express");
const router = express.Router();
const controller = require("../controllers/systemController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Destructive: full data reset. Admin-only, requires an exact confirm phrase.
router.post("/wipe-data", verifyToken, requireAdmin, controller.wipeAllData);

module.exports = router;
