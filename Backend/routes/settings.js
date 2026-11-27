const express = require("express");
const router = express.Router();
const { getErpSettings, saveErpSettings } = require("../services/erpSettingsService");
const { syncStock } = require("../services/erpStockImport");
const settingsController = require("../controllers/settingsController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Public: storefront apps read gold_rate + making % for price display.
router.get("/", settingsController.getPublicSettings);

// Admin only.
router.get("/all", verifyToken, requireAdmin, settingsController.getAllSettings);
router.put("/", verifyToken, requireAdmin, settingsController.updateSettings);

router.get("/erp", verifyToken, requireAdmin, async (_req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await getErpSettings());
  } catch {
    res.status(500).json({ error: "Could not load ERP settings." });
  }
});

router.put("/erp", verifyToken, requireAdmin, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await saveErpSettings(req.body || {}));
  } catch (error) {
    res.status(error.status === 400 ? 400 : 500).json({
      error: error.status === 400 ? error.message : "Could not save ERP settings.",
    });
  }
});

router.post("/erp/sync", verifyToken, requireAdmin, async (_req, res) => {
  try {
    res.json(await syncStock());
  } catch (error) {
    console.error("ERP stock import failed:", error.code || error.message);
    res.status(502).json({ error: "ERP stock sync failed. Check the connection settings and backend logs." });
  }
});

module.exports = router;
