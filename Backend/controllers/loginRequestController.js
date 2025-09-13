const { db } = require("../config/db");
const path = require("path");
const fs = require("fs");
const {
  notifyLoginRequest,
  notifyLoginRequestStatusChange,
} = require("../services/adminNotificationService");
// const notificationModel = require("../models/notification");

// Create login request
function createLoginRequest(req, res) {
  const { phone_number, categoryIds, country_code, userId } = req.body;

  if (
    !phone_number ||
    !categoryIds ||
    !Array.isArray(categoryIds) ||
    categoryIds.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "Phone number and at least one category are required" });
  }

  // Check for existing active requests
  const checkSql = `
    SELECT * FROM login_requests 
    WHERE user_id = ? AND status IN ('pending', 'approved', 'logged_in')
  `;

  db.query(checkSql, [userId], (err, existingRequests) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (existingRequests.length > 0) {
      return res.status(409).json({
        error:
          "You already have an active request for one or more selected categories",
      });
    }

    // Store category IDs as JSON string in the category_ids field
    const categoryIdsJson = JSON.stringify(categoryIds);
    const insertSql = `
      INSERT INTO login_requests (user_id, category_ids, status) 
      VALUES (?, ?, 'pending')
    `;

    db.query(insertSql, [userId, categoryIdsJson], async (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Send notification to admin about new login request
      try {
        // Get user details for notification
        const getUserSql = "SELECT name, phone_number FROM users WHERE id = ?";
        db.query(getUserSql, [userId], async (userErr, userResults) => {
          if (userErr) {
            console.error(
              "Error getting user details for notification:",
              userErr
            );
            return;
          }

          if (userResults.length > 0) {
            const user = userResults[0];
            const loginRequestData = {
              id: result.insertId,
              userId: userId,
              userName: user.name || `User ${user.phone_number}`,
              sessionTimeMinutes: 30, // Default session time
              categoryIds: categoryIds,
            };

            await notifyLoginRequest(loginRequestData);
            console.log(
              "Admin notification sent for login request:",
              loginRequestData.userName
            );
          }
        });
      } catch (notificationError) {
        console.error(
          "Error sending admin notification for login request:",
          notificationError
        );
        // Don't fail the login request if notification fails
      }

      res.status(201).json({ message: "Login request created successfully" });
    });
  });
}

// Get all login requests (admin)
function getAllLoginRequests(req, res) {
  const sql = `
    SELECT lr.*, u.name as user_name, u.phone_number
    FROM login_requests lr
    JOIN users u ON lr.user_id = u.id
    ORDER BY lr.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ requests: results });
  });
}

// Get user's login requests
function getUserLoginRequests(req, res) {
  const userId = req.user ? req.user.id : req.params.userId;
  const sql = `
    SELECT * FROM login_requests WHERE user_id = ? ORDER BY created_at DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
}

// Update login request (approve/reject)
function updateLoginRequest(req, res) {
  const { requestId } = req.params;
  const { status, sessionTimeMinutes } = req.body;

  console.log(
    `[updateLoginRequest] Starting update for request ID: ${requestId}, status: ${status}`
  );

  if (!status || !["approved", "rejected"].includes(status)) {
    console.log(`[updateLoginRequest] Invalid status: ${status}`);
    return res
      .status(400)
      .json({ error: "Valid status (approved/rejected) is required" });
  }

  // Validate session time is provided when approving
  if (
    status === "approved" &&
    (!sessionTimeMinutes || sessionTimeMinutes <= 0)
  ) {
    console.log(
      `[updateLoginRequest] Missing or invalid session time: ${sessionTimeMinutes}`
    );
    return res.status(400).json({
      error:
        "Session time in minutes is required when approving a login request",
    });
  }

  const updateData = {
    status: status,
    session_start_time: status === "approved" ? new Date() : null,
    session_time_minutes: status === "approved" ? sessionTimeMinutes : null,
  };

  console.log(`[updateLoginRequest] Update data:`, updateData);

  const sql = `
    UPDATE login_requests 
    SET status = ?, session_start_time = ?, session_time_minutes = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      updateData.status,
      updateData.session_start_time,
      updateData.session_time_minutes,
      requestId,
    ],
    (err, result) => {
      if (err) {
        console.error(`[updateLoginRequest] Database error:`, err);
        return res.status(500).json({ error: "Error updating login request" });
      }

      if (result.affectedRows === 0) {
        console.log(
          `[updateLoginRequest] No rows affected for request ID: ${requestId}`
        );
        return res.status(404).json({ error: "Login request not found" });
      }

      console.log(
        `[updateLoginRequest] Successfully updated request ID: ${requestId}`
      );

      // Get user details from the login request
      const getUserSql = "SELECT user_id FROM login_requests WHERE id = ?";
      db.query(getUserSql, [requestId], (userErr, userResults) => {
        if (userErr) {
          console.error(`[updateLoginRequest] Error getting user ID:`, userErr);
          return;
        }

        if (userResults.length === 0) {
          console.log(
            `[updateLoginRequest] No user found for request ID: ${requestId}`
          );
          return;
        }

        const userId = userResults[0].user_id;
        console.log(`[updateLoginRequest] Found user ID: ${userId}`);

        // If status is rejected, invalidate all active sessions for this user
        if (status === "rejected") {
          console.log(
            `[updateLoginRequest] Rejection detected - invalidating active sessions for user ID: ${userId}`
          );

          // Update all active login requests to 'expired' status
          const invalidateSessionsSql = `
          UPDATE login_requests 
          SET status = 'expired', 
              session_start_time = NULL, 
              session_time_minutes = NULL 
          WHERE user_id = ? 
          AND status IN ('logged_in', 'approved')
        `;

          db.query(
            invalidateSessionsSql,
            [userId],
            (invalidateErr, invalidateResult) => {
              if (invalidateErr) {
                console.error(
                  `[updateLoginRequest] Error invalidating sessions:`,
                  invalidateErr
                );
              } else {
                console.log(
                  `[updateLoginRequest] Invalidated ${invalidateResult.affectedRows} active sessions for user ID: ${userId}`
                );
              }
            }
          );
        }

        // Get user name
        const getUserNameSql = "SELECT name FROM users WHERE id = ?";
        db.query(getUserNameSql, [userId], async (nameErr, nameResults) => {
          if (nameErr) {
            console.error(
              `[updateLoginRequest] Error getting user name:`,
              nameErr
            );
            return;
          }

          if (nameResults.length === 0) {
            console.log(
              `[updateLoginRequest] No user name found for user ID: ${userId}`
            );
            return;
          }

          const userName = nameResults[0].name;
          console.log(`[updateLoginRequest] User name: ${userName}`);

          // Create user notification based on status
          let userNotificationData;
          let fcmTitle, fcmMessage;

          if (status === "approved") {
            userNotificationData = {
              user_id: userId,
              title: "Login Approved ✅",
              message: `Welcome ${userName}! You can now access the app.`,
              type: "login_approved",
              data: {
                action: "redirect_to_home",
                sessionTimeMinutes: updateData.session_time_minutes,
                businessName: "Amrut Jewels",
                userName: userName,
              },
            };
            fcmTitle = "Login Approved ✅";
            fcmMessage = `Welcome ${userName}! You can now access the app.`;
          } else if (status === "rejected") {
            userNotificationData = {
              user_id: userId,
              title: "Login Request Rejected ❌",
              message: `Sorry ${userName}, your login request has been rejected. You will be logged out automatically.`,
              type: "login_rejected",
              data: {
                action: "force_logout",
                businessName: "Amrut Jewels",
                userName: userName,
              },
            };
            fcmTitle = "Login Request Rejected ❌";
            fcmMessage = `Sorry ${userName}, your login request has been rejected. You will be logged out automatically.`;
          }

          if (userNotificationData) {
            console.log(
              `[updateLoginRequest] Creating database notification:`,
              userNotificationData
            );

            // Send notification to user using the proper service
            console.log(
              `[updateLoginRequest] Attempting to send notification to user ID: ${userId}`
            );

            try {
              // Prepare notification data for the service
              const notificationData = {
                id: parseInt(requestId),
                userId: userId,
                status: status,
                remarks:
                  status === "approved"
                    ? "Your login request has been approved"
                    : "Your login request has been rejected",
                sessionTimeMinutes: updateData.session_time_minutes || 30,
                userName: userName, // Add user name for better notification context
                businessName: "Amrut Jewels", // Add business name for consistency
              };

              console.log(
                `[updateLoginRequest] Sending notification with data:`,
                notificationData
              );

              // Send notification using the proper service
              const notificationResult = await notifyLoginRequestStatusChange(
                notificationData
              );
              console.log(
                `[updateLoginRequest] Notification sent successfully to user ID: ${userId}:`,
                notificationResult
              );
            } catch (notificationError) {
              console.error(
                `[updateLoginRequest] Error sending notification to user ID: ${userId}:`,
                notificationError
              );
            }
          }
        });
      });

      console.log(
        `[updateLoginRequest] Sending success response for request ID: ${requestId}`
      );
      res.json({
        message: `Login request ${status} successfully`,
        sessionTimeMinutes: updateData.session_time_minutes,
      });
    }
  );
}

// Get approved and active categories for a user (only their requested categories)
function getApprovedCategoriesForUser(req, res) {
  const userId = req.params.userId;
  console.log(
    "[getApprovedCategoriesForUser] Fetching categories for userId:",
    userId
  );
  console.log("[getApprovedCategoriesForUser] Request user:", req.user);
  console.log("[getApprovedCategoriesForUser] Request headers:", req.headers);

  // Get the most recent approved request for this user
  const checkSql = `SELECT * FROM login_requests WHERE user_id = ? AND status = 'logged_in' ORDER BY created_at DESC LIMIT 1`;
  console.log(
    "[getApprovedCategoriesForUser] Checking approved login request for user:",
    userId
  );

  db.query(checkSql, [userId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error(
        "[getApprovedCategoriesForUser] Error checking login requests:",
        checkErr
      );
      return res.status(500).json({ error: checkErr.message });
    }

    if (checkResults.length === 0) {
      console.log(
        "[getApprovedCategoriesForUser] No approved login request found"
      );
      return res.status(403).json({
        error: "No approved login request found",
        message: "User login request is not approved yet",
      });
    }

    const approvedRequest = checkResults[0];
    console.log(
      "[getApprovedCategoriesForUser] Approved request found:",
      approvedRequest.id
    );

    // Parse the requested categories from the approved request
    let requestedCategories = [];
    try {
      if (approvedRequest.category_ids) {
        requestedCategories = JSON.parse(approvedRequest.category_ids);
        console.log(
          "[getApprovedCategoriesForUser] User requested categories:",
          requestedCategories
        );
      }
    } catch (parseError) {
      console.error(
        "[getApprovedCategoriesForUser] Error parsing requested categories:",
        parseError
      );
      return res
        .status(500)
        .json({ error: "Error parsing requested categories" });
    }

    if (requestedCategories.length === 0) {
      console.log("[getApprovedCategoriesForUser] No categories requested");
      return res.status(400).json({
        error: "No categories were requested",
        message: "User did not request any specific categories",
      });
    }

    // Fetch only the requested categories that are active
    const placeholders = requestedCategories.map(() => "?").join(",");
    const categorySql = `SELECT * FROM categories WHERE id IN (${placeholders}) AND status = 'active' ORDER BY name`;
    console.log(
      "[getApprovedCategoriesForUser] Fetching active categories:",
      requestedCategories
    );
    console.log("[getApprovedCategoriesForUser] SQL Query:", categorySql);
    console.log(
      "[getApprovedCategoriesForUser] SQL Parameters:",
      requestedCategories
    );

    db.query(
      categorySql,
      requestedCategories,
      (categoryErr, categoryResults) => {
        if (categoryErr) {
          console.error(
            "[getApprovedCategoriesForUser] Error fetching categories:",
            categoryErr
          );
          return res.status(500).json({ error: categoryErr.message });
        }

        console.log(
          "[getApprovedCategoriesForUser] Active categories found:",
          categoryResults.length
        );
        console.log(
          "[getApprovedCategoriesForUser] Raw category results:",
          categoryResults
        );

        // Process results to include processed image URLs
        const processedResults = categoryResults.map((category) => {
          let processedImageUrl = null;
          let originalImageUrl = null;
          let finalImageUrl = null;

          if (category.image) {
            // Original image URL
            originalImageUrl = `${
              process.env.BASE_URL || "http://10.106.29.15:3001"
            }/uploads/categories/${category.image}`;

            // Check for cleaned/watermarked image first (highest priority)
            const baseName = category.image.split(".")[0];
            const cleanedImageName = `${baseName}-cleaned.webp`;
            const cleanedImagePath = path.join(
              __dirname,
              "../uploads/categories",
              cleanedImageName
            );

            if (fs.existsSync(cleanedImagePath)) {
              processedImageUrl = `${
                process.env.BASE_URL || "http://10.106.29.15:3001"
              }/uploads/categories/${cleanedImageName}`;
              finalImageUrl = processedImageUrl;
            } else {
              // Fallback to original image
              finalImageUrl = originalImageUrl;
            }
          }

          return {
            ...category,
            processedImageUrl: processedImageUrl,
            originalImageUrl: originalImageUrl,
            imageUrl: finalImageUrl,
            hasProcessedImage: !!processedImageUrl,
          };
        });

        res.json({
          success: true,
          message: "User approved categories retrieved successfully",
          data: processedResults,
          count: processedResults.length,
          requested_categories: requestedCategories,
          approved_request_id: approvedRequest.id,
        });
      }
    );
  });
}

// Get products filtered by user's approved categories (only their requested categories)
function getApprovedProductsForUser(req, res) {
  const userId = req.params.userId;
  console.log(
    "[getApprovedProductsForUser] Fetching products for userId:",
    userId
  );
  console.log("[getApprovedProductsForUser] Request user:", req.user);
  console.log("[getApprovedProductsForUser] Request headers:", req.headers);

  // First get the user's approved categories
  const checkSql = `SELECT * FROM login_requests WHERE user_id = ? AND status = 'logged_in' ORDER BY created_at DESC LIMIT 1`;

  db.query(checkSql, [userId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error(
        "[getApprovedProductsForUser] Error checking login requests:",
        checkErr
      );
      return res.status(500).json({ error: checkErr.message });
    }

    if (checkResults.length === 0) {
      console.log(
        "[getApprovedProductsForUser] No approved login request found"
      );
      return res.status(403).json({
        error: "No approved login request found",
        message: "User login request is not approved yet",
      });
    }

    const approvedRequest = checkResults[0];
    console.log(
      "[getApprovedProductsForUser] Approved request found:",
      approvedRequest.id
    );

    // Parse the requested categories from the approved request
    let requestedCategories = [];
    try {
      if (approvedRequest.category_ids) {
        requestedCategories = JSON.parse(approvedRequest.category_ids);
        console.log(
          "[getApprovedProductsForUser] User requested categories:",
          requestedCategories
        );
      }
    } catch (parseError) {
      console.error(
        "[getApprovedProductsForUser] Error parsing requested categories:",
        parseError
      );
      return res
        .status(500)
        .json({ error: "Error parsing requested categories" });
    }

    if (requestedCategories.length === 0) {
      console.log("[getApprovedProductsForUser] No categories requested");
      return res.status(400).json({
        error: "No categories were requested",
        message: "User did not request any specific categories",
      });
    }

    // Fetch products only from the requested categories that are active and in stock
    const placeholders = requestedCategories.map(() => "?").join(",");
    const productSql = `
      SELECT DISTINCT p.*, c.name as category_name, c.image as category_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id IN (${placeholders})
        AND p.status = 'active'
        AND c.status = 'active'
        AND p.stock_status = 'available'
      ORDER BY p.created_at DESC
    `;

    console.log(
      "[getApprovedProductsForUser] Fetching products for categories:",
      requestedCategories
    );

    db.query(productSql, requestedCategories, (err, results) => {
      if (err) {
        console.error("[getApprovedProductsForUser] Database error:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log(
        "[getApprovedProductsForUser] Active products found:",
        results.length
      );

      res.json({
        success: true,
        message: "User approved products retrieved successfully",
        data: results,
        count: results.length,
        requested_categories: requestedCategories,
        approved_request_id: approvedRequest.id,
      });
    });
  });
}

module.exports = {
  createLoginRequest,
  getAllLoginRequests,
  getUserLoginRequests,
  updateLoginRequest,
  getApprovedCategoriesForUser,
  getApprovedProductsForUser,
};
