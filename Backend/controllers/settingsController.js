const settingsModel = require("../models/settings");

// Keys the storefront apps are allowed to read without auth (for price display).
const PUBLIC_KEYS = ["gold_rate", "making_charge_percent"];

// GET /settings  — public: returns only the storefront-safe keys, as numbers.
function getPublicSettings(req, res) {
  settingsModel.getAllSettings((err, all) => {
    if (err) return res.status(500).json({ error: err.message });
    const out = {};
    PUBLIC_KEYS.forEach((k) => {
      out[k] = Number(all[k] || 0);
    });
    res.json(out);
  });
}

// GET /settings/all — admin: returns every setting.
function getAllSettings(req, res) {
  settingsModel.getAllSettings((err, all) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(all);
  });
}

// PUT /settings — admin: update one or more settings. Body is a flat object,
// e.g. { gold_rate: 6250, making_charge_percent: 12 }.
function updateSettings(req, res) {
  const entries = Object.entries(req.body || {});
  if (entries.length === 0) {
    return res.status(400).json({ error: "No settings provided" });
  }

  let done = 0;
  let failed = null;
  entries.forEach(([key, value]) => {
    settingsModel.setSetting(key, value, (err) => {
      if (err && !failed) failed = err;
      done += 1;
      if (done === entries.length) {
        if (failed) return res.status(500).json({ error: failed.message });
        settingsModel.getAllSettings((e, all) => {
          if (e) return res.status(500).json({ error: e.message });
          res.json({ message: "Settings updated", settings: all });
        });
      }
    });
  });
}

module.exports = { getPublicSettings, getAllSettings, updateSettings };
