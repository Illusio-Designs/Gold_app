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
  console.log('🔔 [ADMIN NOTIFICATION] Starting sendAdminNotification:', {
    type,
    title,
    body,
    dataKeys: Object.keys(data),
    timestamp: new Date().toISOString()
  });

  try {
    // Get admin user ID (assuming admin has ID 1)
    const adminUserId = 1;
    console.log('🔔 [ADMIN NOTIFICATION] Admin user ID:', adminUserId);
    
    // Get admin's FCM token
    const getAdminTokenSql = 'SELECT token FROM notification_tokens WHERE user_id = ? AND active = true LIMIT 1';
    console.log('🔔 [ADMIN NOTIFICATION] Querying for admin FCM token...');
    
    return new Promise((resolve, reject) => {
      db.query(getAdminTokenSql, [adminUserId], async (tokenErr, tokenResults) => {
        if (tokenErr) {
          console.error('❌ [ADMIN NOTIFICATION] Error getting admin token:', tokenErr);
          reject({ success: false, error: 'Failed to get admin token' });
          return;
        }

        console.log('🔔 [ADMIN NOTIFICATION] Token query results:', {
          count: tokenResults.length,
          hasResults: tokenResults.length > 0
        });

        if (tokenResults.length === 0) {
          console.log('⚠️ [ADMIN NOTIFICATION] No active FCM token found for admin');
          console.log('🔍 [ADMIN NOTIFICATION] Checking all tokens in database...');
          
          // Debug: Check all tokens in the database
          db.query('SELECT user_id, token, active, created_at FROM notification_tokens', (debugErr, debugResults) => {
            if (debugErr) {
              console.error('❌ [ADMIN NOTIFICATION] Error checking all tokens:', debugErr);
            }
          });
          
          resolve({ success: false, error: 'No admin token found' });
          return;
        }

        const adminToken = tokenResults[0].token;
        console.log('✅ [ADMIN NOTIFICATION] Found admin FCM token:', {
          tokenLength: adminToken.length,
          tokenPreview: adminToken.substring(0, 20) + '...',
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

        console.log('🔔 [ADMIN NOTIFICATION] Prepared notification data:', {
          type,
          sound: notificationData.sound,
          icon: notificationData.icon,
          color: notificationData.color,
          dataKeys: Object.keys(notificationData)
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

        console.log('🔔 [ADMIN NOTIFICATION] Checking for duplicate notifications...');
        db.query(checkDuplicateSql, [adminUserId, type], (duplicateErr, duplicateResults) => {
          if (duplicateErr) {
            console.error('❌ [ADMIN NOTIFICATION] Error checking duplicates:', duplicateErr);
            // Continue anyway
          } else if (duplicateResults.length > 0) {
            console.log('⚠️ [ADMIN NOTIFICATION] Duplicate notification detected, skipping...');
            resolve({ success: false, error: 'Duplicate notification prevented' });
            return;
          }

          console.log('🔔 [ADMIN NOTIFICATION] Creating notification record in database...');
          console.log('🔔 [ADMIN NOTIFICATION] Insert values:', {
            user_id: adminUserId,
            title,
            body,
            type,
            data: JSON.stringify(notificationData),
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
              console.error('❌ [ADMIN NOTIFICATION] Error creating notification record:', insertErr);
              reject({ success: false, error: 'Failed to create notification record' });
              return;
            }

            const notificationId = insertResult.insertId;
            console.log('✅ [ADMIN NOTIFICATION] Notification record created with ID:', notificationId);

            // Send push notification to admin
            console.log('🔔 [ADMIN NOTIFICATION] Sending push notification via Firebase...');
            try {
              const pushResult = await sendNotification(adminToken, title, body, notificationData);
              console.log('✅ [ADMIN NOTIFICATION] Push notification sent successfully:', {
                pushResult,
                adminToken: adminToken.substring(0, 20) + '...'
              });
              
              // Mark notification as unread for admin in user_notifications table
              const markUnreadSql = `
                INSERT INTO user_notifications (user_id, notification_id, read_at)
                VALUES (?, ?, NULL)
                ON DUPLICATE KEY UPDATE read_at = NULL
              `;
              
              console.log('🔔 [ADMIN NOTIFICATION] Marking notification as unread for admin...');
              db.query(markUnreadSql, [adminUserId, notificationId], (markErr) => {
                if (markErr) {
                  console.error('❌ [ADMIN NOTIFICATION] Error marking notification as unread:', markErr);
                } else {
                  console.log('✅ [ADMIN NOTIFICATION] Notification marked as unread successfully for admin');
                }
              });

              console.log(`🎉 [ADMIN NOTIFICATION] Admin notification sent successfully: ${type}`, {
                notificationId,
                pushResult,
                adminToken: adminToken.substring(0, 20) + '...'
              });

              resolve({
                success: true,
                notificationId,
                pushResult,
                type,
                sound: notificationData.sound
              });
            } catch (pushError) {
              console.error('❌ [ADMIN NOTIFICATION] Error sending push notification:', pushError);
              reject({ success: false, error: 'Failed to send push notification' });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
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
    console.log('🔌 [SOCKET] Real-time notification sent for new user registration:', userData.name);
  } catch (socketError) {
    console.error('❌ [SOCKET] Error sending real-time notification:', socketError);
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
  console.log('🔔 [ADMIN NOTIFICATION] notifyLoginRequest called with data:', loginRequestData);
  
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

  console.log('🔔 [ADMIN NOTIFICATION] Prepared notification data:', data);
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
    console.log('🔌 [SOCKET] Real-time registration status notification sent for user:', userData.name || userData.id);
  } catch (socketError) {
    console.error('❌ [SOCKET] Error sending real-time registration status notification:', socketError);
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
  console.log('🔔 [LOGIN STATUS CHANGE] Starting notification for status change:', {
    requestId: requestData.id,
    userId: requestData.userId,
    status: requestData.status,
    remarks: requestData.remarks,
    sessionTimeMinutes: requestData.sessionTimeMinutes
  });
  
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
  
  console.log('🔔 [LOGIN STATUS CHANGE] Prepared notification data:', {
    title,
    body,
    notificationType,
    dataKeys: Object.keys(data)
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
    console.log('🔌 [SOCKET] Real-time login request status notification sent for user:', requestData.userId);
  } catch (socketError) {
    console.error('❌ [SOCKET] Error sending real-time login request status notification:', socketError);
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
  console.log('🔔 [USER NOTIFICATION] Starting sendUserNotification:', {
    userId,
    type,
    title,
    body,
    dataKeys: Object.keys(data),
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
      console.log('🔔 [USER NOTIFICATION] Querying for user FCM token (including unauthenticated for login notifications)...');
    } else {
      getTokensSql = `
        SELECT token FROM notification_tokens 
        WHERE user_id = ? AND active = true
      `;
      console.log('🔔 [USER NOTIFICATION] Querying for user FCM token (authenticated only)...');
    }

    return new Promise((resolve, reject) => {
      db.query(getTokensSql, [userId], async (tokenErr, tokenResults) => {
        if (tokenErr) {
          console.error('❌ [USER NOTIFICATION] Error getting tokens:', tokenErr);
          reject({ success: false, error: 'Failed to get tokens' });
          return;
        }

                         console.log('🔔 [USER NOTIFICATION] Token query results:', {
          count: tokenResults.length,
          hasResults: tokenResults.length > 0,
          results: tokenResults.map(t => ({
            id: t.id,
            user_id: t.user_id,
            device_type: t.device_type,
            active: t.active,
            token_preview: t.token ? t.token.substring(0, 20) + '...' : 'null'
          }))
        });

        if (tokenResults.length === 0) {
          console.log('⚠️ [USER NOTIFICATION] No active FCM token found for user:', userId);
          console.log('⚠️ [USER NOTIFICATION] This means the user has not registered their FCM token yet');
          console.log('⚠️ [USER NOTIFICATION] User needs to open the mobile app to register their FCM token');
          
          // For login notifications, try to find any unauthenticated token as fallback
          if (type === 'login_approved' || type === 'login_rejected') {
            console.log('🔔 [USER NOTIFICATION] Trying to find unauthenticated token as fallback...');
            const fallbackSql = 'SELECT token FROM notification_tokens WHERE user_id IS NULL AND active = true ORDER BY created_at DESC LIMIT 1';
            
            db.query(fallbackSql, [], async (fallbackErr, fallbackResults) => {
              if (fallbackErr) {
                console.error('❌ [USER NOTIFICATION] Error getting fallback token:', fallbackErr);
                resolve({ 
                  success: false, 
                  error: 'No user token found',
                  message: 'User has not registered FCM token yet. They need to open the mobile app.',
                  requiresAppAction: true
                });
                return;
              }
              
              if (fallbackResults.length === 0) {
                console.log('⚠️ [USER NOTIFICATION] No fallback token found either');
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
              console.log('✅ [USER NOTIFICATION] Using fallback unauthenticated token:', fallbackToken.substring(0, 20) + '...');
              
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
                console.log('✅ [USER NOTIFICATION] Fallback notification sent successfully');
                resolve({ success: true, pushResult, usedFallback: true });
              } catch (pushError) {
                console.error('❌ [USER NOTIFICATION] Error sending fallback notification:', pushError);
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
         console.log('✅ [USER NOTIFICATION] Found FCM token (authenticated):', {
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

        console.log('🔔 [USER NOTIFICATION] Prepared notification data:', {
          type,
          sound: notificationData.sound,
          icon: notificationData.icon,
          color: notificationData.color,
          dataKeys: Object.keys(notificationData)
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

        console.log('🔔 [USER NOTIFICATION] Checking for duplicate notifications...');
        db.query(checkDuplicateSql, [userId, type], (duplicateErr, duplicateResults) => {
          if (duplicateErr) {
            console.error('❌ [USER NOTIFICATION] Error checking duplicates:', duplicateErr);
            // Continue anyway
          } else if (duplicateResults.length > 0) {
            console.log('⚠️ [USER NOTIFICATION] Duplicate notification detected, skipping...');
            resolve({ success: false, error: 'Duplicate notification prevented' });
            return;
          }

          console.log('🔔 [USER NOTIFICATION] Creating notification record in database...');
          console.log('🔔 [USER NOTIFICATION] Insert values:', {
            user_id: userId,
            title,
            body,
            type,
            data: JSON.stringify(notificationData),
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
              console.error('❌ [USER NOTIFICATION] Error creating notification record:', insertErr);
              reject({ success: false, error: 'Failed to create notification record' });
              return;
            }

            const notificationId = insertResult.insertId;
            console.log('✅ [USER NOTIFICATION] Notification record created with ID:', notificationId);
            console.log('✅ [USER NOTIFICATION] Database record details:', {
              id: notificationId,
              title,
              body,
              type,
              data: notificationData
            });

            // Send push notification to user
            console.log('🔔 [USER NOTIFICATION] Sending push notification via Firebase...');
            try {
              const pushResult = await sendNotification(userToken, title, body, notificationData);
              console.log('✅ [USER NOTIFICATION] Push notification sent successfully:', {
                pushResult,
                userToken: userToken.substring(0, 20) + '...'
              });

              // Mark notification as unread for user
              const markUnreadSql = `
                INSERT INTO user_notifications (user_id, notification_id, read_at)
                VALUES (?, ?, NULL)
                ON DUPLICATE KEY UPDATE read_at = NULL
              `;

              console.log('🔔 [USER NOTIFICATION] Marking notification as unread...');
              db.query(markUnreadSql, [userId, notificationId], (markErr) => {
                if (markErr) {
                  console.error('❌ [USER NOTIFICATION] Error marking notification as unread:', markErr);
                } else {
                  console.log('✅ [USER NOTIFICATION] Notification marked as unread successfully');
                }
              });

              console.log(`🎉 [USER NOTIFICATION] User notification sent successfully: ${type}`, {
                notificationId,
                pushResult,
                userToken: userToken.substring(0, 20) + '...'
              });
              resolve({ success: true, notificationId, pushResult });
            } catch (pushError) {
              console.error('❌ [USER NOTIFICATION] Error sending push notification:', pushError);
              reject({ success: false, error: 'Failed to send push notification' });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ [USER NOTIFICATION] Unexpected error in sendUserNotification:', error);
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
        console.error('Error getting notification stats:', err);
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