const { db } = require("../config/db");

// Simple key/value settings store (gold_rate, making_charge_percent, ...).

function getAllSettings(callback) {
  db.query("SELECT setting_key, setting_value FROM app_settings", (err, rows) => {
    if (err) return callback(err);
    const out = {};
    (rows || []).forEach((r) => {
      out[r.setting_key] = r.setting_value;
    });
    callback(null, out);
  });
}

// Upsert one key. Uses the UNIQUE(setting_key) constraint.
function setSetting(key, value, callback) {
  const sql =
    "INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) " +
    "ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()";
  db.query(sql, [key, String(value)], callback);
}

module.exports = { getAllSettings, setSetting };
