// Firebase service for dashboard
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { registerFCMToken } from './adminApiService';

// Firebase configuration
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

// Initialize Firebase
let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  console.log('✅ [FIREBASE] Firebase initialized successfully');
} catch (error) {
  console.error('❌ [FIREBASE] Error initializing Firebase:', error);
}

/**
 * Request notification permission and get FCM token
 * @param {string} adminToken - Admin authentication token
 * @returns {Promise<string|null>} - FCM token or null
 */
export const requestNotificationPermission = async (adminToken) => {
  console.log('🔔 [FIREBASE] Requesting notification permission...');
  
  try {
    if (!messaging) {
      console.error('❌ [FIREBASE] Messaging not initialized');
      return null;
    }

    // Register service worker first
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ [FIREBASE] Service worker registered:', registration);
    } catch (error) {
      console.error('❌ [FIREBASE] Error registering service worker:', error);
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('🔔 [FIREBASE] Notification permission:', permission);

    if (permission !== 'granted') {
      console.log('⚠️ [FIREBASE] Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      // Register token with backend
      try {
        await registerFCMToken(adminToken, token);
        return token;
      } catch (error) {
        console.error('❌ [FIREBASE] Error registering FCM token:', error);
        console.error('❌ [FIREBASE] Error details:', error.response?.data || error.message);
        return token; // Return token even if registration fails
      }
    }

    return null;
  } catch (error) {
    console.error('❌ [FIREBASE] Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Set up message listener for incoming notifications
 * @param {Function} onNotificationReceived - Callback when notification is received
 */
export const setupMessageListener = (onNotificationReceived) => {
  console.log('🔔 [FIREBASE] Setting up message listener...');
  
  if (!messaging) {
    console.error('❌ [FIREBASE] Messaging not initialized');
    return;
  }

  try {
    onMessage(messaging, (payload) => {
      console.log('🔔 [FIREBASE] Message received:', payload);
      
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }
    });
    
    console.log('✅ [FIREBASE] Message listener set up successfully');
  } catch (error) {
    console.error('❌ [FIREBASE] Error setting up message listener:', error);
  }
};

/**
 * Initialize Firebase messaging for the dashboard
 * @param {string} adminToken - Admin authentication token
 * @param {Function} onNotificationReceived - Callback when notification is received
 */
export const initializeFirebaseMessaging = async (adminToken, onNotificationReceived) => {
  console.log('🔔 [FIREBASE] Initializing Firebase messaging...');
  
  try {
    // Request permission and get token
    const token = await requestNotificationPermission(adminToken);
    
    if (token) {
      // Set up message listener
      setupMessageListener(onNotificationReceived);
      console.log('✅ [FIREBASE] Firebase messaging initialized successfully');
      return true;
    } else {
      console.log('⚠️ [FIREBASE] Could not get FCM token');
      return false;
    }
  } catch (error) {
    console.error('❌ [FIREBASE] Error initializing Firebase messaging:', error);
    return false;
  }
};

/**
 * Check if Firebase is supported in this browser
 * @returns {boolean} - True if Firebase is supported
 */
export const isFirebaseSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export default {
  requestNotificationPermission,
  setupMessageListener,
  initializeFirebaseMessaging,
  isFirebaseSupported
}; 