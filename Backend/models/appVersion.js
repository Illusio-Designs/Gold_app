const { db } = require("../config/db");

// Create new app version
function createAppVersion(versionData, callback) {
  const sql = `INSERT INTO app_versions (
    version, build_number, platform, is_forced, 
    download_url, release_notes, is_active, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    versionData.version_name,
    versionData.version_code,
    versionData.platform,
    versionData.force_update,
    versionData.download_url,
    versionData.release_notes,
    versionData.is_active,
    versionData.created_by,
  ];

  db.query(sql, values, callback);
}

// Get latest version for platform
function getLatestVersion(platform, callback) {
  const sql = `SELECT * FROM app_versions 
               WHERE platform = ? AND is_active = 1 
               ORDER BY build_number DESC 
               LIMIT 1`;
  db.query(sql, [platform], callback);
}

// Get version by ID
function getVersionById(id, callback) {
  const sql = "SELECT * FROM app_versions WHERE id = ?";
  db.query(sql, [id], callback);
}

// Get all versions
function getAllVersions(callback) {
  const sql = "SELECT * FROM app_versions ORDER BY created_at DESC";
  db.query(sql, callback);
}

// Get versions by platform
function getVersionsByPlatform(platform, callback) {
  const sql =
    "SELECT * FROM app_versions WHERE platform = ? ORDER BY build_number DESC";
  db.query(sql, [platform], callback);
}

// Update app version
function updateAppVersion(id, versionData, callback) {
  const sql = `UPDATE app_versions SET 
    version = ?, build_number = ?, platform = ?, 
    is_forced = ?, download_url = ?, 
    release_notes = ?, is_active = ?, updated_at = NOW()
    WHERE id = ?`;

  const values = [
    versionData.version_name,
    versionData.version_code,
    versionData.platform,
    versionData.force_update,
    versionData.download_url,
    versionData.release_notes,
    versionData.is_active,
    id,
  ];

  db.query(sql, values, callback);
}

// Delete app version
function deleteAppVersion(id, callback) {
  const sql = "DELETE FROM app_versions WHERE id = ?";
  db.query(sql, [id], callback);
}

// Check if update is required
function checkUpdateRequired(platform, currentVersionCode, callback) {
  const sql = `SELECT * FROM app_versions 
               WHERE platform = ? AND is_active = 1 
               AND build_number > ? 
               ORDER BY build_number DESC 
               LIMIT 1`;
  db.query(sql, [platform, currentVersionCode], callback);
}

// Get force update info
function getForceUpdateInfo(platform, currentVersionCode, callback) {
  const sql = `SELECT * FROM app_versions 
               WHERE platform = ? AND is_active = 1 
               AND is_forced = 1 
               AND build_number > ? 
               ORDER BY build_number DESC 
               LIMIT 1`;
  db.query(sql, [platform, currentVersionCode], callback);
}

// Deactivate other versions when activating a new one
function deactivateOtherVersions(platform, activeVersionId, callback) {
  const sql = `UPDATE app_versions 
               SET is_active = 0, updated_at = NOW() 
               WHERE platform = ? AND id != ?`;
  db.query(sql, [platform, activeVersionId], callback);
}

module.exports = {
  createAppVersion,
  getLatestVersion,
  getVersionById,
  getAllVersions,
  getVersionsByPlatform,
  updateAppVersion,
  deleteAppVersion,
  checkUpdateRequired,
  getForceUpdateInfo,
  deactivateOtherVersions,
};
