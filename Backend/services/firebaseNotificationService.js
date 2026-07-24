const admin = require('firebase-admin');

// Firebase configuration for web app (for reference)
const firebaseConfig = {
  apiKey: "AIzaSyDW0FnbA7vJrV7EsNnZK7Adu2dfBcVe3eg",
  authDomain: "amrut-9cc5e.firebaseapp.com",
  projectId: "amrut-9cc5e",
  storageBucket: "amrut-9cc5e.firebasestorage.app",
  messagingSenderId: "76051395970",
  appId: "1:76051395970:web:1d7817edf09d6b2bb4cb9b",
  measurementId: "G-C0MD37JBH6"
};

// VAPID key for web push notifications
const VAPID_KEY = "BOaREbot4mZreAvnnsmWMtEpDD5G85fbW_0EXnMZcP7rJFjoQGDEIZckigVi-YPNPp9uTC06hti_e4Zhb9HPRVw";

// Load Firebase service account credentials. Guarded so a missing/misplaced
// credentials file disables PUSH only — it must never crash the whole API.
let serviceAccount = null;
try {
  serviceAccount = require('../amrut-9cc5e-firebase-adminsdk-fbsvc-c0150a05ed.json');
} catch (e) {
  console.error(
    '[firebase] Service account file not found — push notifications disabled:',
    e.message,
  );
}

// Initialize Firebase Admin SDK (for server-side operations)
let adminApp = null;
try {
  // Reuse if already initialized
  adminApp = admin.app();
} catch (error) {
  if (serviceAccount) {
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } catch (initErr) {
      console.error('[firebase] Admin init failed — push disabled:', initErr.message);
    }
  }
}

/**
 * Send notification to a specific user by FCM token
 * @param {string} fcmToken - User's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Promise<Object>} - Firebase response
 */
async function sendNotification(fcmToken, title, body, data = {}) {
  if (!adminApp) return { success: false, disabled: true };
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter apps
      },
      android: {
        notification: {
          sound: 'default',
          channel_id: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Firebase response
 */
async function sendMulticastNotification(fcmTokens, title, body, data = {}) {
  if (!adminApp) return { success: false, disabled: true };
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        notification: {
          sound: 'default',
          channel_id: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      tokens: fcmTokens,
    };

    // firebase-admin v11+ removed sendMulticast() — use sendEachForMulticast().
    const response = await admin.messaging().sendEachForMulticast(message);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} - Firebase response
 */
async function sendTopicNotification(topic, title, body, data = {}) {
  if (!adminApp) return { success: false, disabled: true };
  try {
    const message = {
      topic: topic,
      notification: {
        title: title,
        body: body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        notification: {
          sound: 'default',
          channel_id: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe a user to a topic
 * @param {string} fcmToken - User's FCM token
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Firebase response
 */
async function subscribeToTopic(fcmToken, topic) {
  try {
    const response = await admin.messaging().subscribeToTopic(fcmToken, topic);
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe a user from a topic
 * @param {string} fcmToken - User's FCM token
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Firebase response
 */
async function unsubscribeFromTopic(fcmToken, topic) {
  try {
    const response = await admin.messaging().unsubscribeFromTopic(fcmToken, topic);
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Legacy function for backward compatibility (used in controllers)
 * @param {string} fcmToken - User's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Promise<Object>} - Firebase response
 */
async function sendAdminNotification(fcmToken, title, body) {
  return sendNotification(fcmToken, title, body);
}

module.exports = {
  sendNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendAdminNotification, // Legacy function for backward compatibility
  VAPID_KEY,
  firebaseConfig,
}; 