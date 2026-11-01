const { createUser: createUserModel } = require("../models/user");
const { db } = require("../config/db");
const { executeQuery, checkConnection } = require("../utils/dbHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");
const axios = require("axios");
const fs = require("fs");
const {
  notifyUserRegistration,
} = require("../services/adminNotificationService");

// Build the user record for public registration. The account type is forced to
// business/consumer and never taken as "admin" from untrusted input.
function buildRegistrationUser(req) {
  const safeType = req.body.type === "consumer" ? "consumer" : "business";
  return {
    type: safeType,
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
}

// Attach an explicitly-supplied device FCM token to the new user (best-effort).
function linkExplicitDeviceToken(userId, deviceToken) {
  if (!deviceToken) return;
  try {
    const linkSql = `
      INSERT INTO notification_tokens (user_id, token, device_type, active, created_at)
      VALUES (?, ?, 'mobile', true, NOW())
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), active = true, updated_at = NOW()
    `;
    db.query(linkSql, [userId, deviceToken], (linkErr) => {
      if (linkErr) console.error("FCM token link failed:", linkErr.message);
    });
  } catch (e) {
    console.error("FCM token link error:", e.message);
  }
}

// Attach the most recent unauthenticated mobile FCM token to the new user, so
// they receive status pushes on the device they just registered from.
function linkLatestUnauthToken(userId) {
  try {
    const selectSql = `
      SELECT id FROM notification_tokens
      WHERE user_id IS NULL AND device_type = 'mobile'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    db.query(selectSql, [], (selErr, selRows) => {
      if (selErr) {
        console.error("FCM token lookup failed:", selErr.message);
        return;
      }
      if (!selRows || selRows.length === 0) return;
      const updateSql = `UPDATE notification_tokens SET user_id = ? WHERE id = ?`;
      db.query(updateSql, [userId, selRows[0].id], (updErr) => {
        if (updErr) console.error("FCM token attach failed:", updErr.message);
      });
    });
  } catch (linkErr) {
    console.error("FCM token linking error:", linkErr.message);
  }
}

// Notify the admin that a new business user registered (best-effort; never
// blocks or fails the registration).
async function notifyAdminOfBusinessRegistration(user, userId) {
  try {
    await notifyUserRegistration({
      id: userId,
      name: user.name,
      email: user.email,
      business_name: user.business_name,
      phone_number: user.phone_number,
    });
  } catch (notificationError) {
    console.error(
      "notifyUserRegistration failed:",
      notificationError && notificationError.message
    );
  }
}

// Public self-registration — may ONLY create business or consumer accounts.
// The account type is NEVER taken from untrusted input as "admin": doing so
// would let anyone self-mint an admin and take over the dashboard. Admins are
// created only via the authenticated admin-only path (createAdmin).
async function registerUser(req, res) {
  const user = buildRegistrationUser(req);
  try {
    // Reject duplicate email or phone number before creating the account.
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

          // Best-effort device/notification wiring — never blocks registration.
          linkExplicitDeviceToken(result.insertId, req.body.device_fcm_token);
          if (user.type === "business") {
            await notifyAdminOfBusinessRegistration(user, result.insertId);
          }
          linkLatestUnauthToken(result.insertId);

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
        JWT_SECRET,
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
        JWT_SECRET,
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

// Get all users (B2B businesses — the wholesale accounts)
// Explicit, non-sensitive column list for user lists. Never includes
// password, otp or reset_token, which must never leave the database.
const USER_LIST_COLUMNS =
  "id, type, name, email, phone_number, image, address_line1, address_line2, landmark, state, city, country, gst_number, pan_number, business_name, status, remarks, created_at, updated_at";

function getAllUsers(req, res) {
  db.query(
    `SELECT ${USER_LIST_COLUMNS} FROM users WHERE type = 'business' ORDER BY created_at DESC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    }
  );
}

// Get all system/admin accounts (for the dashboard System Users page).
// Never returns password/otp/reset_token.
function getAllAdmins(req, res) {
  db.query(
    "SELECT id, name, email, phone_number, status, created_at FROM users WHERE type = 'admin' ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results || []);
    }
  );
}

// Get all D2C consumer accounts (for the dashboard Consumers page)
function getAllConsumers(req, res) {
  db.query(
    `SELECT ${USER_LIST_COLUMNS} FROM users WHERE type = 'consumer' ORDER BY created_at DESC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    }
  );
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

    const user = {
      type: req.body.type,
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      // Pass the PLAINTEXT password. The user model (insertUser) hashes it
      // exactly once with bcrypt. Pre-hashing here caused a double hash, so
      // the stored value never matched at login and the account was locked out.
      password: req.body.password,
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

// Create a new system/admin account (for the dashboard System Users page).
// Never logs or returns the password or its bcrypt hash.
async function createAdmin(req, res) {
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

    const name = req.body.name.trim();
    const email = req.body.email.trim();
    const phone_number = req.body.phone_number
      ? String(req.body.phone_number).trim() || null
      : null;

    // Reject if the email already exists
    db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
          return res
            .status(409)
            .json({ error: "A user with the same email already exists." });
        }

        // Hash the password the same way the signup/login path does (bcrypt, 10 rounds)
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Admins use status 'approved' (the users.status ENUM has no 'active';
        // this matches how existing admin accounts are stored).
        const insertSql = `INSERT INTO users (type, name, email, password, phone_number, status) VALUES ('admin', ?, ?, ?, ?, 'approved')`;

        db.query(
          insertSql,
          [name, email, hashedPassword, phone_number],
          (insertErr, result) => {
            if (insertErr) {
              return res.status(500).json({ error: insertErr.message });
            }

            // Return the created account without the password/hash
            db.query(
              "SELECT id, name, email, phone_number, type, status, created_at FROM users WHERE id = ?",
              [result.insertId],
              (selErr, rows) => {
                if (selErr) {
                  return res.status(500).json({ error: selErr.message });
                }
                res.status(201).json({
                  message: "System user created successfully",
                  user: rows && rows[0] ? rows[0] : null,
                });
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
    let existingStatus = null;
    // Fetch old image filename (and current status) before updating
    const userModel = require("../models/user");
    await new Promise((resolve) => {
      userModel.getUserById(id, (err, results) => {
        if (!err && results && results.length > 0) {
          oldImageFilename = results[0].image;
          existingStatus = results[0].status;
        }
        resolve();
      });
    });

    // Only admins may change approval status — a user editing their own profile
    // can never approve/alter their own status.
    const isAdmin = req.user.type === "admin";
    const resolvedStatus = isAdmin ? (req.body.status || existingStatus) : existingStatus;

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
      pin: req.body.pin || null,
      gst_number: req.body.gst_number || null,
      pan_number: req.body.pan_number || null,
      business_name: req.body.business_name || null,
      status: resolvedStatus || null,
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

  // A user is referenced by their cart items and orders (foreign keys), so a
  // plain DELETE fails with a constraint error. Remove the dependent rows
  // first, then the user. Missing tables are ignored.
  const childSteps = [
    "DELETE FROM cart_items WHERE user_id = ?",
    "DELETE FROM orders WHERE user_id = ?",
  ];
  let i = 0;
  const runChildren = (done) => {
    if (i >= childSteps.length) return done(null);
    db.query(childSteps[i++], [id], (err) => {
      if (err && err.code !== "ER_NO_SUCH_TABLE") return done(err);
      runChildren(done);
    });
  };

  runChildren((childErr) => {
    if (childErr) {
      return res.status(500).json({ error: childErr.message });
    }
    db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    });
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
    // Never expose secret fields. Route is self-or-admin, so the user's own
    // GST/PAN/address stay available, but the bcrypt hash must never leave the DB.
    const user = { ...results[0] };
    delete user.password;
    delete user.otp;
    delete user.reset_token;
    res.json({ user });
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
    // Find the user by phone number. Storefront accounts are either wholesale
    // 'business' (B2B) or 'consumer' (D2C); both log in with a phone OTP, so
    // match any non-admin account (admins sign in with email/password).
    db.query(
      'SELECT * FROM users WHERE phone_number = ? AND type != "admin"',
      [phoneNumber],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const user = results[0];

        // Approval gate: B2B 'business' accounts must be approved by an admin
        // before they can log in. D2C 'consumer' accounts are not approval-gated
        // (they register with status = null). The Play Store / App Store
        // reviewer test account bypasses the gate so store review can sign in.
        const BYPASS_PHONE_NUMBER = "7600046416";
        const isBypassUser = phoneNumber === BYPASS_PHONE_NUMBER;
        if (
          !isBypassUser &&
          user.type === "business" &&
          user.status !== "approved"
        ) {
          return res.status(403).json({
            error: "Account not approved",
            status: user.status,
            remarks: user.remarks,
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            id: user.id,
            phone_number: user.phone_number,
            type: user.type,
          },
          JWT_SECRET,
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

module.exports = {
  registerUser,
  adminLogin,
  businessLogin,
  updateUserStatus,
  getAllUsers,
  getAllConsumers,
  getAllAdmins,
  createUser,
  createAdmin,
  updateUser,
  deleteUser,
  checkUserExists,
  getUserById,
  verifyBusinessOTP,
};
