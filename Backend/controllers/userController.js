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
    console.log(
      `Registering business user: Name=${user.name}, Phone=${user.phone_number}`
    );
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
                    console.warn(
                      "[REGISTER] Failed to link explicit device token to user:",
                      linkErr.message
                    );
                  } else {
                    console.log(
                      "[REGISTER] Linked explicit device token to user:",
                      result.insertId
                    );
                  }
                }
              );
            }
          } catch (e) {
            console.warn("[REGISTER] Error in explicit device token link");
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
              console.log(
                "Admin notification sent for user registration:",
                userData.name
              );
            } catch (notificationError) {
              console.error(
                "Error sending admin notification for user registration:",
                notificationError
              );
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
                console.warn(
                  "[REGISTER] Failed to select latest unauth token:",
                  selErr.message
                );
              } else if (selRows && selRows.length > 0) {
                const tokenRowId = selRows[0].id;
                const updateSql = `UPDATE notification_tokens SET user_id = ? WHERE id = ?`;
                db.query(updateSql, [newUserId, tokenRowId], (updErr) => {
                  if (updErr) {
                    console.warn(
                      "[REGISTER] Failed to link unauth token to user:",
                      updErr.message
                    );
                  } else {
                    console.log(
                      "[REGISTER] Linked latest unauth mobile token to user:",
                      newUserId
                    );
                  }
                });
              } else {
                console.log(
                  "[REGISTER] No unauth mobile token found to link at registration time"
                );
              }
            });
          } catch (linkErr) {
            console.warn(
              "[REGISTER] Error while linking unauth token to new user:",
              linkErr.message
            );
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
      console.log("[Backend] Admin login successful for user:", user.id);

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
        console.log(`[BYPASS] Creating auto-approved login request for user: ${BYPASS_PHONE_NUMBER}`);

        // First, expire any existing login requests for this user
        db.query(
          'UPDATE login_requests SET status = "expired" WHERE user_id = ? AND status IN ("pending", "approved", "logged_in")',
          [user.id],
          (updateErr) => {
            if (updateErr) {
              console.error('[BYPASS] Error expiring existing requests:', updateErr);
            }
          }
        );

        // Get all active category IDs
        db.query(
          'SELECT id FROM categories WHERE status = "active"',
          (catErr, catResults) => {
            if (catErr) {
              console.error('[BYPASS] Error fetching active categories:', catErr);
              // Continue with empty categories if error
              createBypassLoginRequest([]);
            } else {
              const allCategoryIds = catResults.map(cat => cat.id);
              console.log(`[BYPASS] Found ${allCategoryIds.length} active categories`);
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
                console.error('[BYPASS] Error creating auto-approved login request:', insertErr);
              } else {
                console.log(`[BYPASS] Created auto-approved login request with ID: ${insertResult.insertId}`);
                console.log(`[BYPASS] User has unlimited access (999999 minutes) to all ${categoryIds.length} active categories`);
              }
            }
          );
        }
      }

      // Business login - return token
      console.log("[Backend] Business login successful for user:", user.id);
      if (isBypassUser) {
        console.log("[BYPASS] Bypass user logged in with unlimited access to all categories");
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
    console.log("=== USER STATUS UPDATE DEBUG ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);

    const { userId } = req.params;
    const { status, remarks } = req.body;

    // Validate required parameters
    if (!userId) {
      console.error("❌ [USER STATUS UPDATE] Missing userId parameter");
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!status) {
      console.error("❌ [USER STATUS UPDATE] Missing status parameter");
      return res.status(400).json({ error: "Status is required" });
    }

    if (!["pending", "approved", "rejected", "denied"].includes(status)) {
      console.error("❌ [USER STATUS UPDATE] Invalid status:", status);
      return res.status(400).json({ error: "Invalid status" });
    }

    console.log(
      `🔄 [USER STATUS UPDATE] Updating user ${userId} status to: ${status}`
    );

    // Update user status in database
    console.log(
      `🔄 [USER STATUS UPDATE] Executing database query with params:`,
      [status, remarks, userId]
    );

    db.query(
      'UPDATE users SET status = ?, remarks = ? WHERE id = ? AND type = "business"',
      [status, remarks, userId],
      async (err, result) => {
        if (err) {
          console.error(`❌ [USER STATUS UPDATE] Database error:`, err);
          console.error(`❌ [USER STATUS UPDATE] Error details:`, {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage,
          });
          return res.status(500).json({ error: err.message });
        }

        console.log(
          `✅ [USER STATUS UPDATE] User status updated successfully:`,
          result
        );

        if (result.affectedRows === 0) {
          console.warn(
            `⚠️ [USER STATUS UPDATE] No rows affected. User might not exist or not be a business user.`
          );
          return res
            .status(404)
            .json({ error: "User not found or not a business user" });
        }

        // Send notification to user about status change
        try {
          console.log(
            `🔔 [USER STATUS UPDATE] Attempting to send notification...`
          );
          const {
            notifyRegistrationStatusChange,
          } = require("../services/adminNotificationService");

          // Get user data for notification
          db.query(
            "SELECT id, name, email, status, remarks FROM users WHERE id = ?",
            [userId],
            async (userErr, userResults) => {
              if (userErr) {
                console.error(
                  `❌ [USER STATUS UPDATE] Error fetching user data:`,
                  userErr
                );
              } else if (userResults.length > 0) {
                const userData = userResults[0];
                console.log(
                  `🔔 [USER STATUS UPDATE] Sending notification to user:`,
                  userData
                );

                try {
                  console.log(
                    `🔔 [USER STATUS UPDATE] Calling notifyRegistrationStatusChange with userData:`,
                    userData
                  );
                  const notificationResult =
                    await notifyRegistrationStatusChange(userData);
                  console.log(
                    `✅ [USER STATUS UPDATE] Notification sent successfully:`,
                    notificationResult
                  );

                  // Check if notification was actually sent
                  if (notificationResult && notificationResult.success) {
                    console.log(
                      `✅ [USER STATUS UPDATE] Notification confirmed sent to user ${userId}`
                    );
                  } else {
                    console.error(
                      `❌ [USER STATUS UPDATE] Notification failed for user ${userId}:`,
                      notificationResult
                    );
                  }
                } catch (notificationError) {
                  console.error(
                    `❌ [USER STATUS UPDATE] Error sending notification:`,
                    notificationError
                  );
                  console.error(
                    `❌ [USER STATUS UPDATE] Notification error details:`,
                    {
                      message: notificationError.message,
                      stack: notificationError.stack,
                      name: notificationError.name,
                    }
                  );
                  // Don't fail the request if notification fails
                }
              } else {
                console.error(
                  `❌ [USER STATUS UPDATE] No user data found for ID: ${userId}`
                );
              }
            }
          );
        } catch (notificationError) {
          console.error(
            `❌ [USER STATUS UPDATE] Error in notification process:`,
            notificationError
          );
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
    console.error(`❌ [USER STATUS UPDATE] Unexpected error:`, error);
    console.error(`❌ [USER STATUS UPDATE] Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get all users
function getAllUsers(req, res) {
  console.log("=== GET ALL USERS DEBUG ===");
  console.log("Request headers:", req.headers);
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);

  db.query("SELECT * FROM users WHERE type = 'business'", (err, results) => {
    if (err) {
      console.error("❌ [GET ALL USERS] Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("✅ [GET ALL USERS] Found", results.length, "business users");
    console.log("✅ [GET ALL USERS] Users data:", results);
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
        console.error("Image processing error:", imageError);
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
        console.error("Database error in createUser:", err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: "User created successfully",
        userId: result.insertId,
      });
    });
  } catch (error) {
    console.error("Unexpected error in createUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Update user
async function updateUser(req, res) {
  try {
    console.log("Request headers:", req.headers);
    // Only allow non-admins to update their own profile
    if (req.user.type !== "admin" && req.user.id != req.params.id) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile" });
    }
    const { id } = req.params;

    // Log incoming request for debugging
    console.log("--- Profile Update Request ---");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("Files:", req.files);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    if (!req.file) {
      console.warn(
        'No file received in updateUser. Check if the image field is named "image" and sent as multipart/form-data.'
      );
      console.warn("Available body fields:", Object.keys(req.body));
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
            console.warn("Failed to delete old image:", err);
          }
        }
      } catch (imageError) {
        console.error("Image processing error:", imageError);
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
    console.log("Update Data:", updateData);

    // Build SQL query dynamically
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const sql = `UPDATE users SET ${fields} WHERE id = ?`;

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Database error in updateUser:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log("✅ [UPDATE USER] Database update result:", result);
      console.log("✅ [UPDATE USER] Affected rows:", result.affectedRows);
      console.log("✅ [UPDATE USER] Changed rows:", result.changedRows);
      res.json({ message: "User updated successfully" });
    });
  } catch (error) {
    console.error("Unexpected error in updateUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Delete user
function deleteUser(req, res) {
  const { id } = req.params;

  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Database error in deleteUser:", err);
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

  console.log("[checkUserExists] Request received:", {
    phone_number,
    phoneNumber,
    email,
    phone,
  });

  // First check if database is connected
  const isConnected = await checkConnection();
  if (!isConnected) {
    console.error("[checkUserExists] Database not connected");
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

  console.log(
    "[checkUserExists] Executing query:",
    query,
    "with params:",
    params
  );

  try {
    const results = await executeQuery(query, params, 10000); // 10 second timeout

    console.log("[checkUserExists] Query results:", results);

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
    console.error("[checkUserExists] Database error:", error);
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
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const user = results[0];

        // Check if user is approved
        if (user.status !== "approved") {
          return res.status(403).json({
            error: "Account not approved",
            status: user.status,
            remarks: user.remarks,
          });
        }

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
              console.error("Active session query error:", activeSessionErr);
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
              console.log(
                "  - Session start time:",
                activeSession.session_start_time
              );
              console.log(
                "  - Session duration minutes:",
                activeSession.session_time_minutes
              );
              console.log(
                "  - Calculated end time:",
                sessionEndTime.toISOString()
              );
              console.log("  - Current time:", now.toISOString());
              console.log("  - Remaining seconds:", remainingTimeSeconds);
              console.log(
                "  - Remaining minutes:",
                Math.ceil(remainingTimeSeconds / 60)
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
                  console.error("Session cleanup error:", cleanupErr);
                } else if (cleanupResult.affectedRows > 0) {
                  console.log(
                    "[Backend] Cleaned up",
                    cleanupResult.affectedRows,
                    "expired sessions for user:",
                    user.id
                  );
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
                      console.error(
                        "Approved login request query error:",
                        approvedErr
                      );
                      return res.status(500).json({ error: "Database error" });
                    }

                    // If there's an approved login request, update it to logged_in instead of creating new entry
                    if (approvedResults.length > 0) {
                      const approvedRequest = approvedResults[0];
                      const sessionDurationMinutes =
                        approvedRequest.session_time_minutes;

                      console.log(
                        "[Backend] Updating approved request to logged_in:"
                      );
                      console.log(
                        "  - Approved request ID:",
                        approvedRequest.id
                      );
                      console.log(
                        "  - Session duration minutes:",
                        sessionDurationMinutes
                      );

                      // Validate session duration
                      if (
                        !sessionDurationMinutes ||
                        sessionDurationMinutes <= 0
                      ) {
                        console.error(
                          "[Backend] Invalid session duration:",
                          sessionDurationMinutes
                        );
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
                            console.error(
                              "Failed to update request to logged_in:",
                              updateErr
                            );
                            return res
                              .status(500)
                              .json({ error: "Failed to update session" });
                          }

                          console.log(
                            "[Backend] Updated request to logged_in with ID:",
                            approvedRequest.id
                          );

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
                      console.error(
                        "[Backend] No approved login request found for user:",
                        user.id
                      );
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
      }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Validate user session
async function validateUserSession(req, res) {
  const userId = req.user.id;

  console.log("[Backend] validateUserSession called with userId:", userId);
  console.log("[Backend] req.user:", req.user);

  try {
    // First, verify the user exists
    db.query(
      "SELECT id, name, status FROM users WHERE id = ?",
      [userId],
      (userErr, userResults) => {
        if (userErr) {
          console.error("User verification error:", userErr);
          return res.status(500).json({ error: "Database error" });
        }

        if (userResults.length === 0) {
          console.error("[Backend] User not found in database for ID:", userId);
          return res.status(401).json({
            error: "User not found",
            action: "force_logout",
          });
        }

        const user = userResults[0];
        console.log("[Backend] User found:", user);

        // Check if user status is valid
        if (user.status !== "approved") {
          console.error("[Backend] User status is not approved:", user.status);
          return res.status(401).json({
            error: "User account not approved",
            action: "force_logout",
          });
        }

        // Check for active session with proper expiry validation
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
              console.error("Session validation error:", err);
              return res.status(500).json({ error: "Database error" });
            }

            console.log("[Backend] Session query results:", results);

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
                    console.error("Session cleanup error:", cleanupErr);
                  } else if (cleanupResult.affectedRows > 0) {
                    console.log(
                      "[Backend] Cleaned up",
                      cleanupResult.affectedRows,
                      "expired sessions for user:",
                      userId
                    );
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
              const sessionEndTime = new Date(session.session_start_time);
              sessionEndTime.setMinutes(
                sessionEndTime.getMinutes() + session.session_time_minutes
              );

              console.log("[Backend] Valid session found:", {
                sessionId: session.id,
                sessionStartTime: session.session_start_time,
                sessionDuration: session.session_time_minutes,
                sessionEndTime: sessionEndTime.toISOString(),
              });

              res.json({
                valid: true,
                sessionExpiry: sessionEndTime.toISOString(),
                sessionDurationMinutes: session.session_time_minutes,
                loginRequestId: session.id,
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error("Session validation error:", error);
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
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        console.log("[Backend] User logged out, session status updated");
        res.json({
          message: "Logout successful",
          updatedSessions: result.affectedRows,
        });
      }
    );
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

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
  verifyBusinessOTP,
  validateUserSession,
  logoutUser,
};
