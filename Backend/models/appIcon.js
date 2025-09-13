const { db } = require("../config/db");

/**
 * App Icon Model
 * Manages dynamic app icons for different platforms and states
 */

// Create app_icons table
function createAppIconsTable(callback) {
  const sql = `
    CREATE TABLE IF NOT EXISTS app_icons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      icon_name VARCHAR(100) NOT NULL,
      icon_type ENUM('primary', 'notification', 'adaptive', 'round', 'square') NOT NULL,
      platform ENUM('android', 'ios', 'both') NOT NULL,
      icon_path VARCHAR(255) NOT NULL,
      icon_url TEXT,
      is_active BOOLEAN DEFAULT FALSE,
      priority INT DEFAULT 0,
      start_date DATETIME,
      end_date DATETIME,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_platform_type (platform, icon_type),
      INDEX idx_active_priority (is_active, priority),
      INDEX idx_date_range (start_date, end_date)
    )
  `;
  db.query(sql, callback);
}

// Create new app icon
function createAppIcon(iconData, callback) {
  const sql = `
    INSERT INTO app_icons (
      icon_name, icon_type, platform, icon_path, icon_url, 
      is_active, priority, start_date, end_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    iconData.icon_name,
    iconData.icon_type,
    iconData.platform,
    iconData.icon_path,
    iconData.icon_url || null,
    iconData.is_active || false,
    iconData.priority || 0,
    iconData.start_date || null,
    iconData.end_date || null,
    iconData.created_by,
  ];

  db.query(sql, values, callback);
}

// Get all app icons
function getAllAppIcons(callback) {
  const sql = `
    SELECT ai.*, u.name as created_by_name 
    FROM app_icons ai 
    LEFT JOIN users u ON ai.created_by = u.id 
    ORDER BY ai.priority DESC, ai.created_at DESC
  `;
  db.query(sql, callback);
}

// Get app icon by ID
function getAppIconById(id, callback) {
  const sql = `
    SELECT ai.*, u.name as created_by_name 
    FROM app_icons ai 
    LEFT JOIN users u ON ai.created_by = u.id 
    WHERE ai.id = ?
  `;
  db.query(sql, [id], callback);
}

// Get active app icons for platform
function getActiveAppIcons(platform, callback) {
  const sql = `
    SELECT * FROM app_icons 
    WHERE (platform = ? OR platform = 'both')
    AND is_active = TRUE
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    ORDER BY priority DESC, created_at DESC
  `;
  db.query(sql, [platform], callback);
}

// Get current app icon for platform and type
function getCurrentAppIcon(platform, iconType = "primary", callback) {
  const sql = `
    SELECT * FROM app_icons 
    WHERE (platform = ? OR platform = 'both')
    AND icon_type = ?
    AND is_active = TRUE
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    ORDER BY priority DESC, created_at DESC
    LIMIT 1
  `;
  db.query(sql, [platform, iconType], callback);
}

// Update app icon
function updateAppIcon(id, iconData, callback) {
  const sql = `
    UPDATE app_icons 
    SET icon_name = ?, icon_type = ?, platform = ?, icon_path = ?, 
        icon_url = ?, is_active = ?, priority = ?, start_date = ?, 
        end_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    iconData.icon_name,
    iconData.icon_type,
    iconData.platform,
    iconData.icon_path,
    iconData.icon_url || null,
    iconData.is_active,
    iconData.priority || 0,
    iconData.start_date || null,
    iconData.end_date || null,
    id,
  ];

  db.query(sql, values, callback);
}

// Delete app icon
function deleteAppIcon(id, callback) {
  const sql = "DELETE FROM app_icons WHERE id = ?";
  db.query(sql, [id], callback);
}

// Activate app icon (deactivate others of same type/platform)
function activateAppIcon(id, callback) {
  db.beginTransaction((err) => {
    if (err) return callback(err);

    // First, get the icon details
    getAppIconById(id, (err, icons) => {
      if (err) return db.rollback(() => callback(err));
      if (icons.length === 0)
        return db.rollback(() => callback(new Error("Icon not found")));

      const icon = icons[0];

      // Deactivate other icons of the same type and platform
      const deactivateSql = `
        UPDATE app_icons 
        SET is_active = FALSE 
        WHERE icon_type = ? 
        AND (platform = ? OR platform = 'both')
        AND id != ?
      `;

      db.query(deactivateSql, [icon.icon_type, icon.platform, id], (err) => {
        if (err) return db.rollback(() => callback(err));

        // Activate the selected icon
        const activateSql =
          "UPDATE app_icons SET is_active = TRUE WHERE id = ?";
        db.query(activateSql, [id], (err) => {
          if (err) return db.rollback(() => callback(err));

          db.commit((err) => {
            if (err) return db.rollback(() => callback(err));
            callback(null, { success: true });
          });
        });
      });
    });
  });
}

// Get icon statistics
function getIconStats(callback) {
  const sql = `
    SELECT 
      platform,
      icon_type,
      COUNT(*) as total_icons,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_icons
    FROM app_icons 
    GROUP BY platform, icon_type
    ORDER BY platform, icon_type
  `;
  db.query(sql, callback);
}

// Check for scheduled icon changes
function checkScheduledIconChanges(callback) {
  const sql = `
    SELECT * FROM app_icons 
    WHERE is_active = TRUE
    AND (
      (start_date IS NOT NULL AND start_date <= NOW() AND start_date > DATE_SUB(NOW(), INTERVAL 1 HOUR))
      OR 
      (end_date IS NOT NULL AND end_date <= NOW() AND end_date > DATE_SUB(NOW(), INTERVAL 1 HOUR))
    )
    ORDER BY priority DESC, created_at DESC
  `;
  db.query(sql, callback);
}

module.exports = {
  createAppIconsTable,
  createAppIcon,
  getAllAppIcons,
  getAppIconById,
  getActiveAppIcons,
  getCurrentAppIcon,
  updateAppIcon,
  deleteAppIcon,
  activateAppIcon,
  getIconStats,
  checkScheduledIconChanges,
};
