const admin = require('firebase-admin');

// Firebase project config (amrut-jewels — the single project every app + this
// backend must share). Used only as reference + to serve the web-push VAPID key
// to browser clients; server-side sends authenticate with the service account.
const firebaseConfig = {
  apiKey: "AIzaSyDmFrIU-XgXIZgMnkgaN4z05u9c4T83IKQ",
  authDomain: "amrut-jewels.firebaseapp.com",
  projectId: "amrut-jewels",
  storageBucket: "amrut-jewels.firebasestorage.app",
  messagingSenderId: "1071847770226",
  // Android app id from google-services.json. If web push is enabled later,
  // register a Web app in the amrut-jewels console and swap in its web appId.
  appId: "1:1071847770226:android:3d2700e00d45bb7df79aeb",
};

// VAPID key for WEB push only. NOTE: the value below belongs to the OLD project.
// Mobile (Android/iOS) push does NOT use this. If/when web push is enabled on
// amrut-jewels, regenerate it (Cloud Messaging → Web Push certificates) and
// paste the amrut-jewels key here.
const VAPID_KEY = "BOaREbot4mZreAvnnsmWMtEpDD5G85fbW_0EXnMZcP7rJFjoQGDEIZckigVi-YPNPp9uTC06hti_e4Zhb9HPRVw";

// Load Firebase service account credentials. Tried in order:
//   1) FIREBASE_SERVICE_ACCOUNT env var (path, absolute or relative to Backend/)
//   2) Backend/firebase-service-account.json  <-- put the new key here
//   3) the legacy amrut-9cc5e filename (backward compatibility)
// Guarded so a missing/misplaced file disables PUSH only — never crashes the API.
const path = require('path');
const fs = require('fs');

// The Firebase project every app + this backend MUST share. A token minted by an
// app on a DIFFERENT project is rejected by FCM with "SenderId mismatch", so if
// the loaded key isn't this project, push silently fails — we warn loudly below.
const EXPECTED_PROJECT = 'amrut-jewels';

let serviceAccount = null;
const candidatePaths = [];
// 1) explicit path via env (absolute, or relative to Backend/)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  candidatePaths.push(path.isAbsolute(envPath) ? envPath : path.join(__dirname, '..', envPath));
}
// 2) canonical drop-in name — rename the console download to this on the server
candidatePaths.push(path.join(__dirname, '..', 'firebase-service-account.json'));
// 3) any *firebase-adminsdk*.json the console generated, dropped into Backend/.
//    Prefer a filename matching EXPECTED_PROJECT so a stale key can't win.
try {
  const backendDir = path.join(__dirname, '..');
  const adminKeys = fs
    .readdirSync(backendDir)
    .filter((f) => /firebase-adminsdk.*\.json$/i.test(f))
    .sort(
      (a, b) =>
        (b.includes(EXPECTED_PROJECT) ? 1 : 0) - (a.includes(EXPECTED_PROJECT) ? 1 : 0)
    );
  for (const f of adminKeys) candidatePaths.push(path.join(backendDir, f));
} catch (e) {
  /* Backend dir unreadable — nothing to auto-discover */
}
for (const p of candidatePaths) {
  try {
    serviceAccount = require(p);
    if (serviceAccount) {
      console.log(`[firebase] Loaded service account (project: ${serviceAccount.project_id})`);
      break;
    }
  } catch (e) {
    // try next candidate
  }
}
if (!serviceAccount) {
  console.error('[firebase] No service account file found — push notifications disabled.');
} else if (serviceAccount.project_id !== EXPECTED_PROJECT) {
  console.warn(
    `[firebase] WARNING: loaded service account project "${serviceAccount.project_id}" ` +
      `!= expected "${EXPECTED_PROJECT}". Push to ${EXPECTED_PROJECT} app tokens will ` +
      `fail with "SenderId mismatch". Upload the ${EXPECTED_PROJECT} key ` +
      `(Project settings → Service accounts → Generate new private key).`
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
        // Use the project from the key itself so it always matches the key,
        // regardless of which Firebase project it belongs to.
        projectId: serviceAccount.project_id,
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