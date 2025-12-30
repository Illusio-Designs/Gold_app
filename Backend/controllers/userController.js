const { createUser: createUserModel } = require("../models/user");
const { db } = require("../config/db");
const { executeQuery, checkConnection } = require("../utils/dbHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const fs = require("fs");
const {
  notifyUserRegistration,
} = require("../services/adminNotificationService");

// Register a new user (admin or business)
async function registerUser(req, res) {
  const user = {
    type: req.body.type, // 'admin' or 'business'
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    image: req.file ? req.file.filename : null,
    phone_number: req.body.phone_number,
    address_line1: req.body.address_line1,
    address_line2: req.body.address_line2,
    landmark: req.body.landmark,
    state: req.body.state,
    city: req.body.city,
    country: req.body.country,
    gst_number: req.body.gst_number,
    pan_number: req.body.pan_number,
    business_name: req.body.business_name,
    remarks: req.body.remarks,
  };
  if (user.type === "business") {
    }
  try {
    // Check for duplicate email or phone number
    db.query(
      "SELECT * FROM users WHERE email = ? OR phone_number = ?",
      [user.email, user.phone_number],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
          return res.status(409).json({
            error: "A user with the same email or phone number already exists.",
          });
        }
        await createUserModel(user, async (err, result) => {
          if (err) {
            return res.status(400).json({ error: err.message });
          }

          // Link unauth token by explicit device token if provided in payload
          try {
            if (req.body.device_fcm_token) {
              const linkSql = `
                INSERT INTO notification_tokens (user_id, token, device_type, active, created_at)
                VALUES (?, ?, 'mobile', true, NOW())
                ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), active = true, updated_at = NOW()
              `;
              db.query(
                linkSql,
                [result.insertId, req.body.device_fcm_token],
                (linkErr) => {
                  if (linkErr) {
                    } else {
                    }
                }
              );
            }
          } catch (e) {
            }

          // Send notification to admin for business user registration
          if (user.type === "business") {
            try {
              const userData = {
                id: result.insertId,
                name: user.name,
                email: user.email,
                business_name: user.business_name,
                phone_number: user.phone_number,
              };
              await notifyUserRegistration(userData);
              } catch (notificationError) {
              // Don't fail the registration if notification fails
            }
          }

          // Link latest unauth mobile FCM token to this newly created user so they can receive status pushes
          try {
            const newUserId = result.insertId;
            // Get the most recent unauthenticated mobile token
            const selectSql = `
              SELECT id FROM notification_tokens 
              WHERE user_id IS NULL AND device_type = 'mobile' 
              ORDER BY created_at DESC 
              LIMIT 1
            `;
            db.query(selectSql, [], (selErr, selRows) => {
              if (selErr) {
                } else if (selRows && selRows.length > 0) {
                const tokenRowId = selRows[0].id;
                const updateSql = `UPDATE notification_tokens SET user_id = ? WHERE id = ?`;
                db.query(updateSql, [newUserId, tokenRowId], (updErr) => {
                  if (updErr) {
                    } else {
                    }
                });
              } else {
                }
            });
          } catch (linkErr) {
            }

          res.status(201).json({
            message: "User registered successfully",
            userId: result.insertId,
          });
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin login (email/password)
async function adminLogin(req, res) {
  const { email, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE email = ? AND type = "admin"',
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, type: user.type },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );

      // Admin login - return token without creating session
      // Sessions should only be created from approved login requests
      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          status: user.status,
        },
      });
    }
  );
}

// Business user login (phone number based)
async function businessLogin(req, res) {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  // Special bypass for phone number 7600046416
  const BYPASS_PHONE_NUMBER = "7600046416";
  const isBypassUser = phoneNumber === BYPASS_PHONE_NUMBER;

  db.query(
    'SELECT * FROM users WHERE phone_number = ? AND type = "business"',
    [phoneNumber],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = results[0];

      // Check if user is approved (skip for bypass user)
      if (!isBypassUser && user.status !== "approved") {
        return res.status(403).json({
          error: "Account not approved",
          status: user.status,
          remarks: user.remarks,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, phone_number: user.phone_number, type: user.type },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );

      // For bypass user, auto-create an approved login request with all active categories
      if (isBypassUser) {
        // First, expire any existing login requests for this user
        db.query(
          'UPDATE login_requests SET status = "expired" WHERE user_id = ? AND status IN ("pending", "approved", "logged_in")',
          [user.id],
          (updateErr) => {
            if (updateErr) {
              }
          }
        );

        // Get all active category IDs
        db.query(
          'SELECT id FROM categories WHERE status = "active"',
          (catErr, catResults) => {
            if (catErr) {
              // Continue with empty categories if error
              createBypassLoginRequest([]);
            } else {
              const allCategoryIds = catResults.map(cat => cat.id);
              createBypassLoginRequest(allCategoryIds);
            }
          }
        );

        function createBypassLoginRequest(categoryIds) {
          const categoryIdsJson = JSON.stringify(categoryIds);
          const insertSql = `
            INSERT INTO login_requests (
              user_id,
              category_ids,
              status,
              session_start_time,
              session_time_minutes
            ) VALUES (?, ?, 'logged_in', NOW(), 999999)
          `;

          db.query(
            insertSql,
            [user.id, categoryIdsJson],
            (insertErr, insertResult) => {
              if (insertErr) {
                } else {
                to all ${categoryIds.length} active categories`);
              }
            }
          );
        }
      }

      // Business login - return token
      if (isBypassUser) {
        }

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          phone_number: user.phone_number,
          type: user.type,
          status: user.status,
        },
      });
    }
  );
}

// Update business user status and remarks
async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status, remarks } = req.body;

    // Validate required parameters
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    if (!["pending", "approved", "rejected", "denied"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Update user status in database
    db.query(
      'UPDATE users SET status = ?, remarks = ? WHERE id = ? AND type = "business"',
      [status, remarks, userId],
      async (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ error: "User not found or not a business user" });
        }

        // Send notification to user about status change
        try {
          const {
            notifyRegistrationStatusChange,
          } = require("../services/adminNotificationService");

          // Get user data for notification
          db.query(
            "SELECT id, name, email, status, remarks FROM users WHERE id = ?",
            [userId],
            async (userErr, userResults) => {
              if (userErr) {
                } else if (userResults.length > 0) {
                const userData = userResults[0];
                try {
                  const notificationResult =
                    await notifyRegistrationStatusChange(userData);
                  // Check if notification was actually sent
                  if (notificationResult && notificationResult.success) {
                    } else {
                    }
                } catch (notificationError) {
                  // Don't fail the request if notification fails
                }
              } else {
                }
            }
          );
        } catch (notificationError) {
          // Don't fail the request if notification fails
        }

        res.json({
          message: "User status updated successfully",
          result,
          notificationSent: true,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get all users
function getAllUsers(req, res) {
  db.query("SELECT * FROM users WHERE type = 'business'", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
}

// Create a new user (admin function)
async function createUser(req, res) {
  try {
    // Validate required fields
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!req.body.email || req.body.email.trim() === "") {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!req.body.password || req.body.password.trim() === "") {
      return res.status(400).json({ error: "Password is required" });
    }
    if (!req.body.type || !["admin", "business"].includes(req.body.type)) {
      return res.status(400).json({ error: "Valid user type is required" });
    }

    let imageFilename = null;

    // Process uploaded image if present
    if (req.file) {
      try {
        const imageProcessingService = require("../services/imageProcessingService");
        const path = require("path");

        // Process profile image without watermark
        const processedPath = await imageProcessingService.processImage(
          req.file.path,
          path.join(
            "uploads/profile",
            path.basename(req.file.filename, path.extname(req.file.filename)) +
              ".webp"
          ),
          { applyWatermark: false, quality: 90 }
        );
        imageFilename = path.basename(processedPath);

        // Original file is automatically deleted by the service
      } catch (imageError) {
        // Continue without image if processing fails
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = {
      type: req.body.type,
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      password: hashedPassword,
      image: imageFilename,
      phone_number: req.body.phone_number || null,
      address_line1: req.body.address_line1 || null,
      address_line2: req.body.address_line2 || null,
      landmark: req.body.landmark || null,
      state: req.body.state || null,
      city: req.body.city || null,
      country: req.body.country || null,
      gst_number: req.body.gst_number || null,
      pan_number: req.body.pan_number || null,
      business_name: req.body.business_name || null,
      status: req.body.status || "pending",
      remarks: req.body.remarks || null,
    };

    // Convert empty strings to null
    Object.keys(user).forEach((key) => {
      if (user[key] === "") {
        user[key] = null;
      }
    });

    createUserModel(user, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: "User created successfully",
        userId: result.insertId,
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Update user
async function updateUser(req, res) {
  try {
    // Only allow non-admins to update their own profile
    if (req.user.type !== "admin" && req.user.id != req.params.id) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile" });
    }
    const { id } = req.params;

    // Log incoming request for debugging
    if (!req.file) {
      );
    }

    // Validate required fields
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!req.body.email || req.body.email.trim() === "") {
      return res.status(400).json({ error: "Email is required" });
    }

    let imageFilename = req.body.image || null; // Keep existing image if no new one uploaded
    let oldImageFilename = null;
    // Fetch old image filename before updating
    const userModel = require("../models/user");
    await new Promise((resolve) => {
      userModel.getUserById(id, (err, results) => {
        if (!err && results && results.length > 0) {
          oldImageFilename = results[0].image;
        }
        resolve();
      });
    });

    // Process uploaded image if present
    if (req.file) {
      try {
        const imageProcessingService = require("../services/imageProcessingService");
        const path = require("path");

        // Process profile image without watermark
        const processedPath = await imageProcessingService.processImage(
          req.file.path,
          path.join(
            "uploads/profile",
            path.basename(req.file.filename, path.extname(req.file.filename)) +
              ".webp"
          ),
          { applyWatermark: false, quality: 90 }
        );
        imageFilename = path.basename(processedPath);

        // Original file is automatically deleted by the service
        // Delete old image if changed
        if (oldImageFilename && oldImageFilename !== imageFilename) {
          try {
            const oldImagePath = path.join("uploads/profile", oldImageFilename);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (err) {
            }
        }
      } catch (imageError) {
        // Continue without image if processing fails
      }
    }

    // Prepare update data
    const updateData = {
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      phone_number: req.body.phone_number || null,
      address_line1: req.body.address_line1 || null,
      address_line2: req.body.address_line2 || null,
      landmark: req.body.landmark || null,
      state: req.body.state || null,
      city: req.body.city || null,
      country: req.body.country || null,
      gst_number: req.body.gst_number || null,
      pan_number: req.body.pan_number || null,
      business_name: req.body.business_name || null,
      status: req.body.status || null,
      remarks: req.body.remarks || null,
    };

    // Add image if new one was uploaded
    if (imageFilename) {
      updateData.image = imageFilename;
    }

    // Add password if provided
    if (req.body.password && req.body.password.trim() !== "") {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    // Convert empty strings to null
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === "") {
        updateData[key] = null;
      }
    });

    // Log updateData for debugging
    // Build SQL query dynamically
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const sql = `UPDATE users SET ${fields} WHERE id = ?`;

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "User updated successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Delete user
function deleteUser(req, res) {
  const { id } = req.params;

  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
}

// Check if user exists by phone number or email
async function checkUserExists(req, res) {
  const { phone_number, phoneNumber, email } = req.body;
  const phone = phone_number || phoneNumber; // Support both formats

  // First check if database is connected
  const isConnected = await checkConnection();
  if (!isConnected) {
    return res.status(503).json({
      error: "Database service unavailable. Please try again.",
      retry: true,
    });
  }

  let query = "";
  let params = [];
  if (phone && !email) {
    query = "SELECT * FROM users WHERE phone_number = ?";
    params = [phone];
  } else if (email && !phone) {
    query = "SELECT * FROM users WHERE email = ?";
    params = [email];
  } else if (phone && email) {
    query = "SELECT * FROM users WHERE phone_number = ? OR email = ?";
    params = [phone, email];
  } else {
    return res.status(400).json({ error: "Phone number or email required" });
  }

  try {
    const results = await executeQuery(query, params, 10000); // 10 second timeout

    if (results.length > 0) {
      return res.json({
        exists: true,
        userId: results[0].id,
        user: {
          id: results[0].id,
          name: results[0].name,
          email: results[0].email,
          phone_number: results[0].phone_number,
          type: results[0].type,
          status: results[0].status,
        },
      });
    }
    return res.json({ exists: false });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Database connection error. Please try again.",
      retry: true,
    });
  }
}

// Get user by ID
function getUserById(req, res) {
  const { id } = req.params;
  const userModel = require("../models/user");
  userModel.getUserById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ user: results[0] });
  });
}

// Verify OTP for business user login
// Simplified - all users get unlimited access (no time limitation or approval needed)
async function verifyBusinessOTP(req, res) {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    // Find the user by phone number
    db.query(
      'SELECT * FROM users WHERE phone_number = ? AND type = "business"',
      [phoneNumber],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const user = results[0];

        // All users treated equally - no approval check, unlimited access
        // Generate JWT token with unlimited duration
        const token = jwt.sign(
          {
            id: user.id,
            phone_number: user.phone_number,
            type: user.type,
          },
          process.env.JWT_SECRET || "secretkey",
          { expiresIn: "365d" } // 1 year - essentially unlimited
        );

        return res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            phone_number: user.phone_number,
            email: user.email,
            type: user.type,
            status: user.status,
          },
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// COMMENTED OUT - No longer needed, all users now treated equally
/*
// Handle bypass user OTP verification
async function handleBypassUserOTP(user, res) {
  try {
    // Get all active categories
    db.query(
      'SELECT id FROM categories WHERE status = "active"',
      (catErr, catResults) => {
        const categoryIds = catErr ? [] : catResults.map(cat => cat.id);
        const categoryIdsJson = JSON.stringify(categoryIds);

        // Create a logged_in session directly with unlimited time
        db.query(
          `INSERT INTO login_requests (
            user_id,
            category_ids,
            status,
            session_start_time,
            session_time_minutes
          ) VALUES (?, ?, 'logged_in', NOW(), 999999)`,
          [user.id, categoryIdsJson],
          (insertErr, insertResult) => {
            if (insertErr) {
              return res.status(500).json({ error: 'Failed to create bypass session' });
            }

            const sessionDurationMinutes = 999999;
            const sessionStartTime = new Date();
            const sessionEndTime = new Date(sessionStartTime.getTime() + sessionDurationMinutes * 60 * 1000);

            // Generate JWT token
            const token = jwt.sign(
              {
                id: user.id,
                phone_number: user.phone_number,
                type: user.type,
                sessionDurationMinutes,
                loginRequestId: insertResult.insertId,
              },
              process.env.JWT_SECRET || "secretkey",
              { expiresIn: `${sessionDurationMinutes}m` }
            );

            return res.json({
              message: "Login successful (bypass)",
              token,
              sessionExpiry: sessionEndTime.toISOString(),
              sessionDurationMinutes,
              user: {
                id: user.id,
                name: user.name,
                phone_number: user.phone_number,
                type: user.type,
                status: user.status,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Handle regular user OTP verification
async function handleRegularUserOTP(user, res) {
  try {

        // First, check for existing active session
        db.query(
          `SELECT lr.* 
           FROM login_requests lr 
           WHERE lr.user_id = ? 
           AND lr.status = 'logged_in' 
           AND lr.session_time_minutes IS NOT NULL 
           AND lr.session_start_time IS NOT NULL
           AND NOW() < DATE_ADD(lr.session_start_time, INTERVAL lr.session_time_minutes MINUTE)
           ORDER BY lr.created_at DESC 
           LIMIT 1`,
          [user.id],
          (activeSessionErr, activeSessionResults) => {
            if (activeSessionErr) {
              return res.status(500).json({ error: "Database error" });
            }

            // If there's an active session, continue from where it left off
            if (activeSessionResults.length > 0) {
              const activeSession = activeSessionResults[0];
              const sessionEndTime = new Date(activeSession.session_start_time);
              sessionEndTime.setMinutes(
                sessionEndTime.getMinutes() + activeSession.session_time_minutes
              );

              // Calculate remaining time in seconds
              const now = new Date();
              const remainingTimeSeconds = Math.max(
                0,
                Math.floor((sessionEndTime - now) / 1000)
              );

              // Session resumption logic
              );
              );
              );

              // Generate JWT token with existing session info
              const token = jwt.sign(
                {
                  id: user.id,
                  phone_number: user.phone_number,
                  type: user.type,
                  sessionDurationMinutes: activeSession.session_time_minutes,
                  loginRequestId: activeSession.id,
                },
                process.env.JWT_SECRET || "secretkey",
                { expiresIn: `${Math.ceil(remainingTimeSeconds / 60)}m` }
              );

              return res.json({
                message: "Session resumed successfully",
                token,
                sessionExpiry: sessionEndTime.toISOString(),
                sessionDurationMinutes: activeSession.session_time_minutes,
                remainingTime: remainingTimeSeconds,
                user: {
                  id: user.id,
                  name: user.name,
                  phone_number: user.phone_number,
                  type: user.type,
                  status: user.status,
                },
              });
            }

            // Clean up any expired sessions before checking for approved requests
            db.query(
              `UPDATE login_requests 
               SET status = 'expired', updated_at = CURRENT_TIMESTAMP
               WHERE user_id = ? AND status = 'logged_in' AND session_time_minutes IS NOT NULL AND session_start_time IS NOT NULL
               AND NOW() > DATE_ADD(session_start_time, INTERVAL session_time_minutes MINUTE)`,
              [user.id],
              (cleanupErr, cleanupResult) => {
                if (cleanupErr) {
                  } else if (cleanupResult.affectedRows > 0) {
                  }

                // Continue with checking for approved login requests
                // If no active session, check for approved login request to create new session
                db.query(
                  `SELECT lr.* 
                   FROM login_requests lr 
                   WHERE lr.user_id = ? 
                   AND lr.status = 'approved' 
                   AND lr.session_time_minutes IS NOT NULL 
                   ORDER BY lr.created_at DESC 
                   LIMIT 1`,
                  [user.id],
                  (approvedErr, approvedResults) => {
                    if (approvedErr) {
                      return res.status(500).json({ error: "Database error" });
                    }

                    // If there's an approved login request, update it to logged_in instead of creating new entry
                    if (approvedResults.length > 0) {
                      const approvedRequest = approvedResults[0];
                      const sessionDurationMinutes =
                        approvedRequest.session_time_minutes;

                      // Validate session duration
                      if (
                        !sessionDurationMinutes ||
                        sessionDurationMinutes <= 0
                      ) {
                        return res.status(400).json({
                          error:
                            "Invalid session duration. Please contact administrator.",
                        });
                      }

                      // Update the existing approved request to logged_in instead of creating new entry
                      const sessionStartTime = new Date();
                      const sessionEndTime = new Date(
                        sessionStartTime.getTime() +
                          sessionDurationMinutes * 60 * 1000
                      );

                      db.query(
                        "UPDATE login_requests SET status = ?, session_start_time = ?, updated_at = ? WHERE id = ?",
                        [
                          "logged_in",
                          sessionStartTime,
                          new Date(),
                          approvedRequest.id,
                        ],
                        (updateErr, updateResult) => {
                          if (updateErr) {
                            return res
                              .status(500)
                              .json({ error: "Failed to update session" });
                          }

                          // Generate JWT token with session info
                          const token = jwt.sign(
                            {
                              id: user.id,
                              phone_number: user.phone_number,
                              type: user.type,
                              sessionDurationMinutes,
                              loginRequestId: approvedRequest.id,
                            },
                            process.env.JWT_SECRET || "secretkey",
                            { expiresIn: `${sessionDurationMinutes}m` }
                          );

                          return res.json({
                            message: "Login successful",
                            token,
                            sessionExpiry: sessionEndTime.toISOString(),
                            sessionDurationMinutes,
                            user: {
                              id: user.id,
                              name: user.name,
                              phone_number: user.phone_number,
                              type: user.type,
                              status: user.status,
                            },
                          });
                        }
                      );
                    } else {
                      // No approved login request found
                      return res.status(400).json({
                        error:
                          "No approved login request found. Please request login access first.",
                      });
                    }
                  }
                );
              }
            );
          }
        );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
*/

// COMMENTED OUT - Session validation removed (no sessions needed)
/*
// Validate user session
async function validateUserSession(req, res) {
  const userId = req.user.id;

  try {
    // First, verify the user exists and get their phone number for bypass check
    db.query(
      "SELECT id, name, status, phone_number FROM users WHERE id = ?",
      [userId],
      (userErr, userResults) => {
        if (userErr) {
          return res.status(500).json({ error: "Database error" });
        }

        if (userResults.length === 0) {
          return res.status(401).json({
            error: "User not found",
            action: "force_logout",
          });
        }

        const user = userResults[0];
        // Special bypass for phone number 7600046416
        const BYPASS_PHONE_NUMBER = "7600046416";
        const isBypassUser = user.phone_number === BYPASS_PHONE_NUMBER;

        // Check if user status is valid (skip for bypass user)
        if (!isBypassUser && user.status !== "approved") {
          return res.status(401).json({
            error: "User account not approved",
            action: "force_logout",
          });
        }

        if (isBypassUser) {
          }

        // For bypass user, handle session differently
        if (isBypassUser) {
          // For bypass user, just check for any logged_in session (ignore expiry)
          db.query(
            `SELECT lr.*
             FROM login_requests lr
             WHERE lr.user_id = ?
             AND lr.status = 'logged_in'
             ORDER BY lr.created_at DESC
             LIMIT 1`,
            [userId],
            (err, results) => {
              if (err) {
                return res.status(500).json({ error: "Database error" });
              }

              if (results.length === 0) {
                // Create emergency unlimited session for bypass user
                db.query(
                  'SELECT id FROM categories WHERE status = "active"',
                  (catErr, catResults) => {
                    const categoryIds = catErr ? [] : catResults.map(cat => cat.id);
                    const categoryIdsJson = JSON.stringify(categoryIds);

                    db.query(
                      `INSERT INTO login_requests (
                        user_id,
                        category_ids,
                        status,
                        session_start_time,
                        session_time_minutes
                      ) VALUES (?, ?, 'logged_in', NOW(), 999999)`,
                      [userId, categoryIdsJson],
                      (insertErr, insertResult) => {
                        if (insertErr) {
                          return res.status(500).json({ error: 'Failed to create bypass session' });
                        }

                        const sessionStartTime = new Date();
                        const sessionEndTime = new Date(sessionStartTime.getTime() + 999999 * 60 * 1000);

                        return res.json({
                          valid: true,
                          sessionExpiry: sessionEndTime.toISOString(),
                          sessionDurationMinutes: 999999,
                          loginRequestId: insertResult.insertId,
                        });
                      }
                    );
                  }
                );
              } else {
                // Found bypass session - ensure it has unlimited time
                const session = results[0];

                // If session doesn't have unlimited time, update it
                if (session.session_time_minutes !== 999999) {
                  db.query(
                    "UPDATE login_requests SET session_time_minutes = 999999, session_start_time = NOW() WHERE id = ?",
                    [session.id],
                    (updateErr) => {
                      if (updateErr) {
                        } else {
                        }
                    }
                  );
                }

                const sessionStartTime = new Date();
                const sessionEndTime = new Date(sessionStartTime.getTime() + 999999 * 60 * 1000);

                ,
                });

                res.json({
                  valid: true,
                  sessionExpiry: sessionEndTime.toISOString(),
                  sessionDurationMinutes: 999999,
                  loginRequestId: session.id,
                });
              }
            }
          );
        } else {
          // Regular user session validation with expiry check
          db.query(
            `SELECT lr.*
           FROM login_requests lr
           WHERE lr.user_id = ?
           AND lr.status = 'logged_in'
           AND lr.session_time_minutes IS NOT NULL
           AND lr.session_start_time IS NOT NULL
           AND NOW() < DATE_ADD(lr.session_start_time, INTERVAL lr.session_time_minutes MINUTE)
           ORDER BY lr.created_at DESC
           LIMIT 1`,
            [userId],
            (err, results) => {
              if (err) {
                return res.status(500).json({ error: "Database error" });
              }

              if (results.length === 0) {
                // No active session found - check if there are expired sessions and clean them up
                db.query(
                  `UPDATE login_requests
                 SET status = 'expired', updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND status = 'logged_in' AND session_time_minutes IS NOT NULL AND session_start_time IS NOT NULL
                 AND NOW() > DATE_ADD(session_start_time, INTERVAL session_time_minutes MINUTE)`,
                  [userId],
                  (cleanupErr, cleanupResult) => {
                    if (cleanupErr) {
                      } else if (cleanupResult.affectedRows > 0) {
                      }

                    // Return session expired response
                    return res.status(401).json({
                      error: "Session expired. Please login again.",
                      action: "force_logout",
                    });
                  }
                );
              } else {
                // Found an active session - return session info
                const session = results[0];

                // Check if this is a bypass user (double-check)
                const BYPASS_PHONE_NUMBER = "7600046416";
                const isBypassUserInSession = user.phone_number === BYPASS_PHONE_NUMBER;

                // If this is a bypass user but somehow ended up in regular validation,
                // override the session duration to be unlimited
                let sessionDuration = session.session_time_minutes;
                if (isBypassUserInSession && session.session_time_minutes !== 999999) {
                  sessionDuration = 999999;
                }

                const sessionEndTime = new Date(session.session_start_time);
                sessionEndTime.setMinutes(
                  sessionEndTime.getMinutes() + sessionDuration
                );

                ,
                  isBypassUserFallback: isBypassUserInSession
                });

                res.json({
                  valid: true,
                  sessionExpiry: sessionEndTime.toISOString(),
                  sessionDurationMinutes: sessionDuration,
                  loginRequestId: session.id,
                });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Logout user and update session status
async function logoutUser(req, res) {
  const userId = req.user.id;

  try {
    // Update the active session status to 'logged_out' instead of deleting it
    db.query(
      `UPDATE login_requests 
       SET status = 'logged_out', 
           session_end_time = NOW() 
       WHERE user_id = ? 
       AND status = 'logged_in' 
       AND session_start_time IS NOT NULL`,
      [userId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          message: "Logout successful",
          updatedSessions: result.affectedRows,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
*/

module.exports = {
  registerUser,
  adminLogin,
  businessLogin,
  updateUserStatus,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  checkUserExists,
  getUserById,
  verifyBusinessOTP, // Simplified - no approval or session checks
  // COMMENTED OUT - Session management removed (no sessions needed)
  // validateUserSession,
  // logoutUser,
};
