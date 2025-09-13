const appIconModel = require("../models/appIcon");
const { uploadToCloudinary } = require("../services/cloudinaryService");
const socketService = require("../services/socketService");

/**
 * App Icon Controller
 * Handles dynamic app icon management
 */

// Create new app icon
const createAppIcon = async (req, res) => {
  try {
    const {
      icon_name,
      icon_type,
      platform,
      icon_url,
      is_active,
      priority,
      start_date,
      end_date
    } = req.body;

    // Validate required fields
    if (!icon_name || !icon_type || !platform) {
      return res.status(400).json({
        success: false,
        error: "Icon name, type, and platform are required"
      });
    }

    // Validate icon type
    const validTypes = ['primary', 'notification', 'adaptive', 'round', 'square'];
    if (!validTypes.includes(icon_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid icon type. Must be one of: " + validTypes.join(', ')
      });
    }

    // Validate platform
    const validPlatforms = ['android', 'ios', 'both'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: "Invalid platform. Must be one of: " + validPlatforms.join(', ')
      });
    }

    // Handle file upload if provided
    let icon_path = icon_url;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.path, 'app-icons');
        icon_path = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Icon upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload icon file"
        });
      }
    }

    const iconData = {
      icon_name,
      icon_type,
      platform,
      icon_path,
      icon_url,
      is_active: is_active || false,
      priority: priority || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: req.user.id
    };

    appIconModel.createAppIcon(iconData, (err, result) => {
      if (err) {
        console.error('Create app icon error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to create app icon"
        });
      }

      // Get the created icon
      appIconModel.getAppIconById(result.insertId, (err, icons) => {
        if (err || icons.length === 0) {
          return res.status(500).json({
            success: false,
            error: "Failed to retrieve created icon"
          });
        }

        const icon = icons[0];

        // Notify clients about icon update
        socketService.notifyAppIconUpdate(icon, 'created');

        res.status(201).json({
          success: true,
          message: "App icon created successfully",
          icon
        });
      });
    });
  } catch (error) {
    console.error('Create app icon error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get all app icons (admin)
const getAllAppIcons = async (req, res) => {
  try {
    appIconModel.getAllAppIcons((err, icons) => {
      if (err) {
        console.error('Get all app icons error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve app icons"
        });
      }

      res.json({
        success: true,
        icons
      });
    });
  } catch (error) {
    console.error('Get all app icons error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get app icon by ID
const getAppIconById = async (req, res) => {
  try {
    const { id } = req.params;

    appIconModel.getAppIconById(id, (err, icons) => {
      if (err) {
        console.error('Get app icon error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve app icon"
        });
      }

      if (icons.length === 0) {
        return res.status(404).json({
          success: false,
          error: "App icon not found"
        });
      }

      res.json({
        success: true,
        icon: icons[0]
      });
    });
  } catch (error) {
    console.error('Get app icon error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Update app icon
const updateAppIcon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      icon_name,
      icon_type,
      platform,
      icon_url,
      is_active,
      priority,
      start_date,
      end_date
    } = req.body;

    // Validate required fields
    if (!icon_name || !icon_type || !platform) {
      return res.status(400).json({
        success: false,
        error: "Icon name, type, and platform are required"
      });
    }

    // Handle file upload if provided
    let icon_path = icon_url;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.path, 'app-icons');
        icon_path = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Icon upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload icon file"
        });
      }
    }

    const iconData = {
      icon_name,
      icon_type,
      platform,
      icon_path,
      icon_url,
      is_active,
      priority: priority || 0,
      start_date: start_date || null,
      end_date: end_date || null
    };

    appIconModel.updateAppIcon(id, iconData, (err, result) => {
      if (err) {
        console.error('Update app icon error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to update app icon"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "App icon not found"
        });
      }

      // Get the updated icon
      appIconModel.getAppIconById(id, (err, icons) => {
        if (err || icons.length === 0) {
          return res.status(500).json({
            success: false,
            error: "Failed to retrieve updated icon"
          });
        }

        const icon = icons[0];

        // Notify clients about icon update
        socketService.notifyAppIconUpdate(icon, 'updated');

        res.json({
          success: true,
          message: "App icon updated successfully",
          icon
        });
      });
    });
  } catch (error) {
    console.error('Update app icon error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Delete app icon
const deleteAppIcon = async (req, res) => {
  try {
    const { id } = req.params;

    appIconModel.deleteAppIcon(id, (err, result) => {
      if (err) {
        console.error('Delete app icon error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to delete app icon"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "App icon not found"
        });
      }

      // Notify clients about icon deletion
      socketService.notifyAppIconUpdate({ id }, 'deleted');

      res.json({
        success: true,
        message: "App icon deleted successfully"
      });
    });
  } catch (error) {
    console.error('Delete app icon error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Activate app icon
const activateAppIcon = async (req, res) => {
  try {
    const { id } = req.params;

    appIconModel.activateAppIcon(id, (err, result) => {
      if (err) {
        console.error('Activate app icon error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to activate app icon"
        });
      }

      // Get the activated icon
      appIconModel.getAppIconById(id, (err, icons) => {
        if (err || icons.length === 0) {
          return res.status(500).json({
            success: false,
            error: "Failed to retrieve activated icon"
          });
        }

        const icon = icons[0];

        // Notify clients about icon activation
        socketService.notifyAppIconUpdate(icon, 'activated');

        res.json({
          success: true,
          message: "App icon activated successfully",
          icon
        });
      });
    });
  } catch (error) {
    console.error('Activate app icon error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get current app icon (public endpoint)
const getCurrentAppIcon = async (req, res) => {
  try {
    const { platform, type = 'primary' } = req.params;

    // Validate platform
    const validPlatforms = ['android', 'ios'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: "Invalid platform. Must be 'android' or 'ios'"
      });
    }

    appIconModel.getCurrentAppIcon(platform, type, (err, icons) => {
      if (err) {
        console.error('Get current app icon error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve current app icon"
        });
      }

      if (icons.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No active app icon found"
        });
      }

      res.json({
        success: true,
        icon: icons[0]
      });
    });
  } catch (error) {
    console.error('Get current app icon error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get all active app icons for platform (public endpoint)
const getActiveAppIcons = async (req, res) => {
  try {
    const { platform } = req.params;

    // Validate platform
    const validPlatforms = ['android', 'ios'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: "Invalid platform. Must be 'android' or 'ios'"
      });
    }

    appIconModel.getActiveAppIcons(platform, (err, icons) => {
      if (err) {
        console.error('Get active app icons error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve active app icons"
        });
      }

      res.json({
        success: true,
        icons
      });
    });
  } catch (error) {
    console.error('Get active app icons error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get icon statistics
const getIconStats = async (req, res) => {
  try {
    appIconModel.getIconStats((err, stats) => {
      if (err) {
        console.error('Get icon stats error:', err);
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve icon statistics"
        });
      }

      res.json({
        success: true,
        stats
      });
    });
  } catch (error) {
    console.error('Get icon stats error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

module.exports = {
  createAppIcon,
  getAllAppIcons,
  getAppIconById,
  updateAppIcon,
  deleteAppIcon,
  activateAppIcon,
  getCurrentAppIcon,
  getActiveAppIcons,
  getIconStats
}; 