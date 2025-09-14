const appVersionModel = require("../models/appVersion");
const socketService = require("../services/socketService");

// Check for app updates (public endpoint)
function checkAppUpdate(req, res) {
  const { platform, version_code } = req.query;

  if (!platform || !version_code) {
    return res.status(400).json({
      error: "Platform and version_code are required",
    });
  }

  // Convert version_code to number for comparison
  const currentVersionCode = parseInt(version_code);

  if (isNaN(currentVersionCode)) {
    return res.status(400).json({
      error: "Invalid version_code format",
    });
  }

  appVersionModel.checkUpdateRequired(
    platform,
    currentVersionCode,
    (err, results) => {
      if (err) {
        console.error("Error checking app update:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 0) {
        // No update available
        return res.json({
          update_available: false,
          force_update: false,
          message: "App is up to date",
        });
      }

      const latestVersion = results[0];
      const forceUpdate = latestVersion.is_forced === 1;
      const updateType = "minor"; // Default since we don't have update_type in current schema

      // Check if force update is required
      if (forceUpdate) {
        return res.json({
          update_available: true,
          force_update: true,
          update_type: updateType,
          version_code: latestVersion.build_number,
          version_name: latestVersion.version,
          download_url: latestVersion.download_url,
          release_notes: latestVersion.release_notes,
          message: "Force update required",
        });
      }

      // Optional update available
      return res.json({
        update_available: true,
        force_update: false,
        update_type: updateType,
        version_code: latestVersion.build_number,
        version_name: latestVersion.version,
        download_url: latestVersion.download_url,
        release_notes: latestVersion.release_notes,
        message: "Update available",
      });
    }
  );
}

// Get latest version info (public endpoint)
function getLatestVersion(req, res) {
  const { platform } = req.params;

  if (!platform) {
    return res.status(400).json({ error: "Platform is required" });
  }

  appVersionModel.getLatestVersion(platform, (err, results) => {
    if (err) {
      console.error("Error getting latest version:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No version found for platform" });
    }

    res.json(results[0]);
  });
}

// Create new app version (admin only)
function createAppVersion(req, res) {
  const {
    version_code,
    version_name,
    platform,
    update_type,
    force_update,
    min_version_code,
    download_url,
    release_notes,
  } = req.body;

  // Validation
  if (!version_code || !version_name || !platform || !update_type) {
    return res.status(400).json({
      error:
        "version_code, version_name, platform, and update_type are required",
    });
  }

  if (!["android", "ios"].includes(platform.toLowerCase())) {
    return res.status(400).json({
      error: "Platform must be 'android' or 'ios'",
    });
  }

  if (
    !["major", "minor", "patch", "force"].includes(update_type.toLowerCase())
  ) {
    return res.status(400).json({
      error: "Update type must be 'major', 'minor', 'patch', or 'force'",
    });
  }

  const versionData = {
    version_code: parseInt(version_code),
    version_name,
    platform: platform.toLowerCase(),
    update_type: update_type.toLowerCase(),
    force_update: force_update ? 1 : 0,
    min_version_code: min_version_code ? parseInt(min_version_code) : null,
    download_url: download_url || null,
    release_notes: release_notes || null,
    is_active: 1,
    created_by: req.user.id,
  };

  appVersionModel.createAppVersion(versionData, (err, result) => {
    if (err) {
      console.error("Error creating app version:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Get the created version for real-time update
    appVersionModel.getVersionById(
      result.insertId,
      (getErr, versionResults) => {
        if (!getErr && versionResults.length > 0) {
          // Emit real-time update
          socketService.notifyAppVersionUpdate(versionResults[0], "created");
        }
      }
    );

    res.status(201).json({
      message: "App version created successfully",
      version_id: result.insertId,
    });
  });
}

// Get all app versions (admin only)
function getAllVersions(req, res) {
  appVersionModel.getAllVersions((err, results) => {
    if (err) {
      console.error("Error getting all versions:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.json(results);
  });
}

// Get versions by platform (admin only)
function getVersionsByPlatform(req, res) {
  const { platform } = req.params;

  if (!platform) {
    return res.status(400).json({ error: "Platform is required" });
  }

  appVersionModel.getVersionsByPlatform(platform, (err, results) => {
    if (err) {
      console.error("Error getting versions by platform:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.json(results);
  });
}

// Update app version (admin only)
function updateAppVersion(req, res) {
  const { id } = req.params;
  const {
    version_code,
    version_name,
    platform,
    update_type,
    force_update,
    min_version_code,
    download_url,
    release_notes,
    is_active,
  } = req.body;

  // Validation
  if (!version_code || !version_name || !platform || !update_type) {
    return res.status(400).json({
      error:
        "version_code, version_name, platform, and update_type are required",
    });
  }

  const versionData = {
    version_code: parseInt(version_code),
    version_name,
    platform: platform.toLowerCase(),
    update_type: update_type.toLowerCase(),
    force_update: force_update ? 1 : 0,
    min_version_code: min_version_code ? parseInt(min_version_code) : null,
    download_url: download_url || null,
    release_notes: release_notes || null,
    is_active: is_active ? 1 : 0,
  };

  appVersionModel.updateAppVersion(id, versionData, (err, result) => {
    if (err) {
      console.error("Error updating app version:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Get the updated version for real-time update
    appVersionModel.getVersionById(id, (getErr, versionResults) => {
      if (!getErr && versionResults.length > 0) {
        // Emit real-time update
        socketService.notifyAppVersionUpdate(versionResults[0], "updated");
      }
    });

    res.json({ message: "App version updated successfully" });
  });
}

// Delete app version (admin only)
function deleteAppVersion(req, res) {
  const { id } = req.params;

  // Get version info before deletion for real-time update
  appVersionModel.getVersionById(id, (getErr, versionResults) => {
    const versionToDelete = getErr ? null : versionResults[0];

    appVersionModel.deleteAppVersion(id, (err, result) => {
      if (err) {
        console.error("Error deleting app version:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Version not found" });
      }

      // Emit real-time update
      if (versionToDelete) {
        socketService.notifyAppVersionUpdate(versionToDelete, "deleted");
      }

      res.json({ message: "App version deleted successfully" });
    });
  });
}

// Activate version and deactivate others (admin only)
function activateVersion(req, res) {
  const { id } = req.params;

  // First get the version to activate
  appVersionModel.getVersionById(id, (getErr, versionResults) => {
    if (getErr || versionResults.length === 0) {
      return res.status(404).json({ error: "Version not found" });
    }

    const version = versionResults[0];

    // Deactivate other versions for the same platform
    appVersionModel.deactivateOtherVersions(
      version.platform,
      id,
      (deactivateErr) => {
        if (deactivateErr) {
          console.error("Error deactivating other versions:", deactivateErr);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Activate the selected version
        const versionData = { ...version, is_active: 1 };
        appVersionModel.updateAppVersion(
          id,
          versionData,
          (updateErr, result) => {
            if (updateErr) {
              console.error("Error activating version:", updateErr);
              return res.status(500).json({ error: "Internal server error" });
            }

            // Get the activated version for real-time update
            appVersionModel.getVersionById(
              id,
              (finalGetErr, finalVersionResults) => {
                if (!finalGetErr && finalVersionResults.length > 0) {
                  // Emit real-time update
                  socketService.notifyAppVersionUpdate(
                    finalVersionResults[0],
                    "activated"
                  );
                }
              }
            );

            res.json({ message: "Version activated successfully" });
          }
        );
      }
    );
  });
}

module.exports = {
  checkAppUpdate,
  getLatestVersion,
  createAppVersion,
  getAllVersions,
  getVersionsByPlatform,
  updateAppVersion,
  deleteAppVersion,
  activateVersion,
};
