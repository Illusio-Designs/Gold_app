const { db } = require('../config/db');
const { sendNotification } = require('./firebaseNotificationService');
const socketService = require('./socketService');

// Notification types and their corresponding sounds
const NOTIFICATION_TYPES = {
  USER_REGISTRATION: {
    sound: 'user_registration.mp3',
    icon: '👤',
    color: '#2196F3'
  },
  LOGIN_REQUEST: {
    sound: 'login_request.mp3',
    icon: '🔐',
    color: '#FF9800'
  },
  LOGIN_APPROVED: {
    sound: 'login_approved.mp3',
    icon: '✅',
    color: '#4CAF50'
  },
  LOGIN_REJECTED: {
    sound: 'login_rejected.mp3',
    icon: '❌',
    color: '#F44336'
  },
  NEW_ORDER: {
    sound: 'new_order.mp3',
    icon: '🛒',
    color: '#FF9800'
  }
};

/**
 * Send notification to admin
 * @param {string} type - Notification type (user_registration, login_request, new_order)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Result of notification sending
 */
async function sendAdminNotification(type, title, body, data = {}) {
  ,
    timestamp: new Date().toISOString()
  });

  try {
    // Get admin user ID (assuming admin has ID 1)
    const adminUserId = 1;
    // Get admin's FCM token
    const getAdminTokenSql = 'SELECT token FROM notification_tokens WHERE user_id = ? AND active = true LIMIT 1';
    return new Promise((resolve, reject) => {
      db.query(getAdminTokenSql, [adminUserId], async (tokenErr, tokenResults) => {
        if (tokenErr) {
          reject({ success: false, error: 'Failed to get admin token' });
          return;
        }

        if (tokenResults.length === 0) {
          // Debug: Check all tokens in the database
          db.query('SELECT user_id, token, active, created_at FROM notification_tokens', (debugErr, debugResults) => {
            if (debugErr) {
              }
          });
          
          resolve({ success: false, error: 'No admin token found' });
          return;
        }

        const adminToken = tokenResults[0].token;
        + '...',
          fullToken: adminToken
        });
        
        // Add notification type and sound to data (all values must be strings for Firebase)
        const typeKey = (type || '').toString().toUpperCase();
        const notificationData = {
          ...Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, String(value)])
          ),
          notificationType: type,
          sound: NOTIFICATION_TYPES[typeKey]?.sound || 'default.mp3',
          icon: NOTIFICATION_TYPES[typeKey]?.icon || '🔔',
          color: NOTIFICATION_TYPES[typeKey]?.color || '#5D0829',
          timestamp: new Date().toISOString()
        };

        });

        // Create notification record in database
        const insertNotificationSql = `
          INSERT INTO notifications (user_id, title, body, type, data, created_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Check for duplicate notifications to prevent spam (within last 1 minute)
        const checkDuplicateSql = `
          SELECT id FROM notifications 
          WHERE user_id = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
          LIMIT 1
        `;

        db.query(checkDuplicateSql, [adminUserId, type], (duplicateErr, duplicateResults) => {
          if (duplicateErr) {
            // Continue anyway
          } else if (duplicateResults.length > 0) {
            resolve({ success: false, error: 'Duplicate notification prevented' });
            return;
          }

          ,
            created_at: new Date()
          });
          
          db.query(insertNotificationSql, [
            adminUserId,
            title,
            body,
            type,
            JSON.stringify(notificationData),
            new Date()
          ], async (insertErr, insertResult) => {
            if (insertErr) {
              reject({ success: false, error: 'Failed to create notification record' });
              return;
            }

            const notificationId = insertResult.insertId;
            // Send push notification to admin
            try {
              const pushResult = await sendNotification(adminToken, title, body, notificationData);
              + '...'
              });
              
              // Mark notification as unread for admin in user_notifications table
              const markUnreadSql = `
                INSERT INTO user_notifications (user_id, notification_id, read_at)
                VALUES (?, ?, NULL)
                ON DUPLICATE KEY UPDATE read_at = NULL
              `;
              
              db.query(markUnreadSql, [adminUserId, notificationId], (markErr) => {
                if (markErr) {
                  } else {
                  }
              });

              + '...'
              });

              resolve({
                success: true,
                notificationId,
                pushResult,
                type,
                sound: notificationData.sound
              });
            } catch (pushError) {
              reject({ success: false, error: 'Failed to send push notification' });
            }
          });
        });
      });
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Send user registration notification to admin
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Result of notification sending
 */
async function notifyUserRegistration(userData) {
  const title = 'New User Registration';
  const body = `${userData.name} (${userData.email}) has registered for an account.`;
  
  const data = {
    action: 'view_user',
    userId: userData.id,
    userName: userData.name,
    userEmail: userData.email,
    businessName: userData.business_name || 'N/A',
    phoneNumber: userData.phone_number || 'N/A'
  };

  // Send push notification
  const pushResult = await sendAdminNotification('user_registration', title, body, data);
  
  // Send real-time WebSocket notification to admin dashboard
  try {
    socketService.notifyNewUserRegistration({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      business_name: userData.business_name || 'N/A',
      phone_number: userData.phone_number || 'N/A',
      type: 'business',
      created_at: new Date().toISOString()
    });
    } catch (socketError) {
    // Don't fail the main notification if socket fails
  }

  return pushResult;
}

/**
 * Send login request notification to admin
 * @param {Object} loginRequestData - Login request data
 * @returns {Promise<Object>} - Result of notification sending
 */
async function notifyLoginRequest(loginRequestData) {
  const title = 'New Login Request';
  const body = `${loginRequestData.userName} has requested login access for ${loginRequestData.sessionTimeMinutes} minutes.`;
  
  const data = {
    action: 'view_login_request',
    requestId: loginRequestData.id,
    userId: loginRequestData.userId,
    userName: loginRequestData.userName,
    phoneNumber: loginRequestData.userName, // Add phone number for frontend compatibility
    sessionTimeMinutes: loginRequestData.sessionTimeMinutes,
    categoryIds: loginRequestData.categoryIds,
    notificationType: 'login_request' // Ensure this is set for frontend compatibility
  };

  return sendAdminNotification('login_request', title, body, data);
}

/**
 * Send new order notification to admin
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} - Result of notification sending
 */
async function notifyNewOrder(orderData) {
  const title = 'New Order Received';
  const body = `Order #${orderData.id} from ${orderData.userName} for ${orderData.productName} - ${orderData.totalAmount}`;
  
  const data = {
    action: 'view_order',
    orderId: orderData.id,
    userId: orderData.userId,
    userName: orderData.userName,
    productName: orderData.productName,
    productSku: orderData.productSku,
    quantity: orderData.quantity,
    totalAmount: orderData.totalAmount,
    status: orderData.status
  };

  return sendAdminNotification('new_order', title, body, data);
}

/**
 * Send registration status change notification to user
 * @param {Object} userData - User data with status change
 * @returns {Promise<Object>} - Result of notification sending
 */
async function notifyRegistrationStatusChange(userData) {
  const title = 'Registration Status Updated';
  const body = `Your registration has been ${userData.status}. ${userData.remarks ? `Remarks: ${userData.remarks}` : ''}`;
  
  const data = {
    action: 'view_profile',
    userId: userData.id,
    status: userData.status,
    remarks: userData.remarks || '',
    timestamp: new Date().toISOString()
  };

  // Send FCM push notification first
  const pushResult = await sendUserNotification(userData.id, 'user_registration', title, body, data);
  
  // Send real-time WebSocket notification to mobile app
  try {
    socketService.notifyUserRegistrationStatusChange({
      id: userData.id,
      name: userData.name || 'User',
      status: userData.status,
      remarks: userData.remarks || '',
      timestamp: new Date().toISOString()
    });
    } catch (socketError) {
    // Don't fail the main notification if socket fails
  }

  return pushResult;
}

/**
 * Send login request status change notification to user
 * @param {Object} requestData - Login request data with status change
 * @returns {Promise<Object>} - Result of notification sending
 */
async function notifyLoginRequestStatusChange(requestData) {
  const title = 'Login Request Status Updated';
  const body = `Your login request has been ${requestData.status}. ${requestData.remarks ? `Remarks: ${requestData.remarks}` : ''}`;
  
  const data = {
    action: 'view_login_request',
    requestId: requestData.id,
    userId: requestData.userId,
    status: requestData.status,
    remarks: requestData.remarks || '',
    sessionTimeMinutes: requestData.sessionTimeMinutes,
    timestamp: new Date().toISOString()
  };

  // Use a more specific notification type for status changes
  const notificationType = requestData.status === 'approved' ? 'login_approved' : 'login_rejected';
  
  });
  
  // Send FCM push notification first
  const pushResult = await sendUserNotification(requestData.userId, notificationType, title, body, data);
  
  // Send real-time WebSocket notification to mobile app
  try {
    socketService.notifyLoginRequestStatusChange({
      userId: requestData.userId,
      status: requestData.status,
      remarks: requestData.remarks || '',
      sessionTimeMinutes: requestData.sessionTimeMinutes,
      userName: requestData.userName || 'User',
      timestamp: new Date().toISOString()
    });
    } catch (socketError) {
    // Don't fail the main notification if socket fails
  }

  return pushResult;
}

/**
 * Send order status change notification to user
 * @param {Object} orderData - Order data with status change
 * @returns {Promise<Object>} - Result of notification sending
 */
async function notifyOrderStatusChange(orderData) {
  const title = 'Order Status Updated';
  const body = `Your order #${orderData.id} has been ${orderData.status}. ${orderData.remarks ? `Remarks: ${orderData.remarks}` : ''}`;
  
  const data = {
    action: 'view_order',
    orderId: orderData.id,
    userId: orderData.userId,
    status: orderData.status,
    remarks: orderData.remarks || '',
    productName: orderData.productName,
    totalAmount: orderData.totalAmount,
    timestamp: new Date().toISOString()
  };

  return sendUserNotification(orderData.userId, 'new_order', title, body, data);
}

/**
 * Send notification to specific user
 * @param {number} userId - User ID to send notification to
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Result of notification sending
 */
async function sendUserNotification(userId, type, title, body, data = {}) {
  ,
    timestamp: new Date().toISOString()
  });

  try {
    // For login approval notifications, also check for unauthenticated tokens
    // This handles the case where user hasn't logged in yet but has the app installed
    let getTokensSql;
    if (type === 'login_approved' || type === 'login_rejected') {
      getTokensSql = `
        SELECT token FROM notification_tokens 
        WHERE (user_id = ? OR user_id IS NULL) AND active = true
        ORDER BY user_id DESC, created_at DESC
        LIMIT 1
      `;
      ...');
    } else {
      getTokensSql = `
        SELECT token FROM notification_tokens 
        WHERE user_id = ? AND active = true
      `;
      ...');
    }

    return new Promise((resolve, reject) => {
      db.query(getTokensSql, [userId], async (tokenErr, tokenResults) => {
        if (tokenErr) {
          reject({ success: false, error: 'Failed to get tokens' });
          return;
        }

                         + '...' : 'null'
          }))
        });

        if (tokenResults.length === 0) {
          // For login notifications, try to find any unauthenticated token as fallback
          if (type === 'login_approved' || type === 'login_rejected') {
            const fallbackSql = 'SELECT token FROM notification_tokens WHERE user_id IS NULL AND active = true ORDER BY created_at DESC LIMIT 1';
            
            db.query(fallbackSql, [], async (fallbackErr, fallbackResults) => {
              if (fallbackErr) {
                resolve({ 
                  success: false, 
                  error: 'No user token found',
                  message: 'User has not registered FCM token yet. They need to open the mobile app.',
                  requiresAppAction: true
                });
                return;
              }
              
              if (fallbackResults.length === 0) {
                resolve({ 
                  success: false, 
                  error: 'No user token found',
                  message: 'User has not registered FCM token yet. They need to open the mobile app.',
                  requiresAppAction: true
                });
                return;
              }
              
              // Use fallback token
              const fallbackToken = fallbackResults[0].token;
              + '...');
              
              // Continue with notification sending using fallback token
              const typeKey = (type || '').toString().toUpperCase();
              const notificationData = {
                ...Object.fromEntries(
                  Object.entries(data).map(([key, value]) => [key, String(value)])
                ),
                notificationType: type,
                sound: NOTIFICATION_TYPES[typeKey]?.sound || 'default.mp3',
                icon: NOTIFICATION_TYPES[typeKey]?.icon || '🔔',
                color: NOTIFICATION_TYPES[typeKey]?.color || '#5D0829',
                timestamp: new Date().toISOString()
              };
              
              try {
                const pushResult = await sendNotification(fallbackToken, title, body, notificationData);
                resolve({ success: true, pushResult, usedFallback: true });
              } catch (pushError) {
                resolve({ success: false, error: 'Failed to send fallback notification' });
              }
            });
            return;
          }
          
          resolve({ 
            success: false, 
            error: 'No user token found',
            message: 'User has not registered FCM token yet. They need to open the mobile app.',
            requiresAppAction: true
          });
          return;
        }

         // Get user's token (authenticated only)
         const userToken = tokenResults[0].token;
         :', {
           tokenLength: userToken.length,
           tokenPreview: userToken.substring(0, 20) + '...',
           totalTokensFound: tokenResults.length
         });

        // Add notification type and sound to data (all values must be strings for Firebase)
        const typeKey = (type || '').toString().toUpperCase();
        const notificationData = {
          ...Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, String(value)])
          ),
          notificationType: type,
          sound: NOTIFICATION_TYPES[typeKey]?.sound || 'default.mp3',
          icon: NOTIFICATION_TYPES[typeKey]?.icon || '🔔',
          color: NOTIFICATION_TYPES[typeKey]?.color || '#5D0829',
          timestamp: new Date().toISOString()
        };

        });

        // Create notification record in database
        const insertNotificationSql = `
          INSERT INTO notifications (user_id, title, body, type, data, created_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Check for duplicate notifications to prevent spam (within last 1 minute)
        const checkDuplicateSql = `
          SELECT id FROM notifications 
          WHERE user_id = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
          LIMIT 1
        `;

        db.query(checkDuplicateSql, [userId, type], (duplicateErr, duplicateResults) => {
          if (duplicateErr) {
            // Continue anyway
          } else if (duplicateResults.length > 0) {
            resolve({ success: false, error: 'Duplicate notification prevented' });
            return;
          }

          ,
            created_at: new Date()
          });
          
          db.query(insertNotificationSql, [
            userId,
            title,
            body,
            type,
            JSON.stringify(notificationData),
            new Date()
          ], async (insertErr, insertResult) => {
            if (insertErr) {
              reject({ success: false, error: 'Failed to create notification record' });
              return;
            }

            const notificationId = insertResult.insertId;
            // Send push notification to user
            try {
              const pushResult = await sendNotification(userToken, title, body, notificationData);
              + '...'
              });

              // Mark notification as unread for user
              const markUnreadSql = `
                INSERT INTO user_notifications (user_id, notification_id, read_at)
                VALUES (?, ?, NULL)
                ON DUPLICATE KEY UPDATE read_at = NULL
              `;

              db.query(markUnreadSql, [userId, notificationId], (markErr) => {
                if (markErr) {
                  } else {
                  }
              });

              + '...'
              });
              resolve({ success: true, notificationId, pushResult });
            } catch (pushError) {
              reject({ success: false, error: 'Failed to send push notification' });
            }
          });
        });
      });
    });
  } catch (error) {
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get notification statistics for admin
 * @returns {Promise<Object>} - Notification statistics
 */
async function getAdminNotificationStats() {
  return new Promise((resolve, reject) => {
    const adminUserId = 1;
    
    const statsSql = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN un.read_at IS NULL THEN 1 END) as unread_count,
        COUNT(CASE WHEN n.type = 'user_registration' THEN 1 END) as registration_count,
        COUNT(CASE WHEN n.type = 'login_request' THEN 1 END) as login_request_count,
        COUNT(CASE WHEN n.type = 'new_order' THEN 1 END) as order_count
      FROM notifications n
      LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
    `;

    db.query(statsSql, [adminUserId], (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(results[0] || {
        total_notifications: 0,
        unread_count: 0,
        registration_count: 0,
        login_request_count: 0,
        order_count: 0
      });
    });
  });
}

module.exports = {
  sendAdminNotification,
  notifyUserRegistration,
  notifyLoginRequest,
  notifyNewOrder,
  notifyRegistrationStatusChange,
  notifyLoginRequestStatusChange,
  notifyOrderStatusChange,
  sendUserNotification,
  getAdminNotificationStats,
  NOTIFICATION_TYPES
}; 