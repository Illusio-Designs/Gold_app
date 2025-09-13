import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { BASE_URL } from './Api';

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

// Notification types and their navigation screens
export const NOTIFICATION_TYPES = {
  REGISTRATION_STATUS: {
    type: 'registration_status',
    sound: 'registration_status.mp3',
    icon: '👤',
    color: '#4CAF50',
    screen: 'Profile'
  },
  LOGIN_REQUEST_STATUS: {
    type: 'login_request_status',
    sound: 'login_request_status.mp3',
    icon: '🔐',
    color: '#2196F3',
    screen: 'LoginRequests'
  },
  ORDER_STATUS: {
    type: 'order_status',
    sound: 'order_status.mp3',
    icon: '🛒',
    color: '#FF9800',
    screen: 'Orders'
  }
};

class FirebaseService {
  constructor() {
    this.isInitialized = false;
    this.fcmToken = null;
    this.userId = null;
    this.onNotificationReceived = null;
    this.onNotificationOpened = null;
  }

  /**
   * Initialize Firebase messaging (without user ID - for app startup)
   */
  async initialize() {
    try {
      console.log('🔔 [FIREBASE] Initializing Firebase messaging for app startup...');
      
      // Request permission
      console.log('🔔 [FIREBASE] Requesting notification permission...');
      const authStatus = await messaging().requestPermission();
      console.log('🔔 [FIREBASE] Authorization status:', authStatus);
      console.log('🔔 [FIREBASE] Authorization status code:', authStatus);
      
      if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        
        console.log('🔔 [FIREBASE] Permission granted');
        
        // Get FCM token
        await this.getFCMToken();
        
        // Setup message handlers
        this.setupMessageHandlers();
        
        // Setup notification handlers
        this.setupNotificationHandlers();
        
        this.isInitialized = true;
        console.log('✅ [FIREBASE] Firebase messaging initialized successfully');
        
        return true;
      } else {
        console.log('❌ [FIREBASE] Permission denied');
        console.log('❌ [FIREBASE] Status:', authStatus);
        return false;
      }
    } catch (error) {
      console.error('❌ [FIREBASE] Error initializing Firebase:', error);
      console.error('❌ [FIREBASE] Error details:', error.message);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async checkNotificationEnabled() {
    try {
      console.log('🔍 [FIREBASE] Checking if notifications are enabled...');
      
      const authStatus = await messaging().hasPermission();
      console.log('🔍 [FIREBASE] Current authorization status:', authStatus);
      
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('❌ [FIREBASE] Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    try {
      console.log('🔔 [FIREBASE] Requesting notification permission...');
      
      const authStatus = await messaging().requestPermission();
      console.log('🔔 [FIREBASE] Authorization status:', authStatus);
      
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('❌ [FIREBASE] Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token and register with backend
   */
  async getFCMToken() {
    try {
      console.log('🔔 [FIREBASE] Getting FCM token...');
      
      const token = await messaging().getToken();
      console.log('🔔 [FIREBASE] FCM token received:', token.substring(0, 20) + '...');
      
      this.fcmToken = token;
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);
      
      // Always register token with backend (no user ID required)
      console.log('🔔 [FIREBASE] Registering token with backend (no user ID)...');
      await this.registerTokenWithBackend(token);
      
      return token;
    } catch (error) {
      console.error('❌ [FIREBASE] Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend (no user ID required)
   */
  async registerTokenWithBackend(token) {
    try {
      console.log('🔔 [FIREBASE] Registering token with backend...');
      console.log('🔔 [FIREBASE] Token preview:', token.substring(0, 20) + '...');
      
      // Always use unauthenticated endpoint for app startup
      const endpoint = `${BASE_URL}/notifications/register-token-unauth`;
      console.log('🔔 [FIREBASE] Using unauthenticated endpoint:', endpoint);
      
      // Prepare request body (no user ID)
      const requestBody = {
        token: token,
        deviceType: 'mobile'
      };
      
      console.log('🔔 [FIREBASE] Request body:', requestBody);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('🔔 [FIREBASE] Backend response status:', response.status);
      console.log('🔔 [FIREBASE] Backend response:', result);
      
      if (response.ok) {
        console.log('✅ [FIREBASE] Token registered with backend successfully');
        return true;
      } else {
        console.error('❌ [FIREBASE] Failed to register token with backend:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ [FIREBASE] Error registering token with backend:', error);
      console.error('❌ [FIREBASE] Error details:', error.message);
      return false;
    }
  }

  /**
   * Setup message handlers for foreground messages
   */
  setupMessageHandlers() {
    console.log('🔔 [FIREBASE] Setting up message handlers...');
    
    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('🔔 [FIREBASE] Received foreground message:', remoteMessage);
      
      // Show local notification
      this.showLocalNotification(remoteMessage);
      
      // Call callback if provided
      if (this.onNotificationReceived) {
        this.onNotificationReceived(remoteMessage);
      }
    });

    return unsubscribe;
  }

  /**
   * Setup notification handlers for background/quit state
   */
  setupNotificationHandlers() {
    console.log('🔔 [FIREBASE] Setting up notification handlers...');
    
    // Handle notification opened when app is in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('🔔 [FIREBASE] Notification opened from background:', remoteMessage);
      
      if (this.onNotificationOpened) {
        this.onNotificationOpened(remoteMessage);
      }
    });

    // Handle notification opened when app is quit
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🔔 [FIREBASE] Notification opened from quit state:', remoteMessage);
          
          if (this.onNotificationOpened) {
            this.onNotificationOpened(remoteMessage);
          }
        }
      });
  }

  /**
   * Show local notification with native banner and custom sound
   */
  showLocalNotification(remoteMessage) {
    try {
      console.log('🔔 [FIREBASE] Showing native notification banner...');
      
      const { notification, data } = remoteMessage;
      const notificationType = data?.notificationType || 'default';
      
      // Handle login approval notifications - update token with user ID if available
      if (notificationType === 'login_approved' && data?.userId) {
        console.log('🔔 [FIREBASE] Login approved notification received, updating token with user ID:', data.userId);
        this.updateUserId(parseInt(data.userId));
      }
      
      // Determine the correct channel ID based on notification type
      let channelId = 'default';
      if (notificationType === 'login_approved') {
        channelId = 'login_approved';
      } else if (notificationType === 'login_rejected') {
        channelId = 'login_rejected';
      } else if (notificationType === 'login_request') {
        channelId = 'login_request';
      } else if (notificationType === 'user_registration' || notificationType === 'registration_status') {
        // Use a dedicated channel if needed, else default
        channelId = 'registration_status';
      }
      
      const notificationConfig = NOTIFICATION_TYPES[notificationType];
      
      // Get notification details
      const title = notification?.title || data?.title || 'New Notification';
      const body = notification?.body || data?.body || 'You have a new notification';
      const soundName = notificationConfig?.sound || 'default';
      
      console.log('🔔 [FIREBASE] Notification details:', {
        type: notificationType,
        title,
        body,
        soundName,
        channelId,
        dataKeys: Object.keys(data || {})
      });
      
      // Show native notification banner (not alert)
      PushNotification.localNotification({
        channelId: channelId,
        title: title,
        message: body,
        playSound: true,
        soundName: soundName, // Custom sound file name
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        largeIcon: 'ic_launcher', // App icon
        smallIcon: 'ic_notification', // Small notification icon
        bigText: body, // Expandable text
        subText: notificationConfig?.icon || '🔔', // Small icon text
        color: notificationConfig?.color || '#5D0829', // Notification color
        data: data || {},
        userInfo: {
          notificationType: notificationType,
          ...data
        },
        // iOS specific
        alertAction: 'view',
        category: notificationType,
        // Android specific
        autoCancel: true,
        ongoing: false,
        showWhen: true,
        when: Date.now(),
        usesChronometer: false,
        chronometerDirection: 'up',
        showTimestamp: true,
        timestamp: Date.now()
      });
      
      console.log('✅ [FIREBASE] Native notification banner shown successfully');
    } catch (error) {
      console.error('❌ [FIREBASE] Error showing native notification:', error);
      console.error('❌ [FIREBASE] Error details:', error.message);
    }
  }

  /**
   * Configure push notification channels (Android)
   */
  configurePushNotifications() {
    console.log('🔔 [FIREBASE] Configuring push notifications...');
    
    // Create main notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'default',
        channelName: 'Default Channel',
        channelDescription: 'Default notification channel',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`🔔 [FIREBASE] Default channel created: ${created}`)
    );
    
    // Create specific channels for login and registration notifications
    const loginChannels = [
      {
        id: 'login_approved',
        name: '✅ Login Approved',
        description: 'Notifications for approved login requests'
      },
      {
        id: 'login_rejected', 
        name: '❌ Login Rejected',
        description: 'Notifications for rejected login requests'
      },
      {
        id: 'login_request',
        name: '🔐 Login Request',
        description: 'Notifications for new login requests'
      },
      {
        id: 'registration_status',
        name: '👤 Registration Status',
        description: 'Notifications for registration approvals and updates'
      }
    ];
    
    loginChannels.forEach(channel => {
      PushNotification.createChannel(
        {
          channelId: channel.id,
          channelName: channel.name,
          channelDescription: channel.description,
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`🔔 [FIREBASE] Channel ${channel.id} created: ${created}`)
      );
    });
    
    // Configure notification handlers
    this.configureNotificationHandlers();
  }

  /**
   * Configure push notification handlers
   */
  configureNotificationHandlers() {
    console.log('🔔 [FIREBASE] Configuring notification handlers...');
    
    // Configure notification handlers
    PushNotification.configure({
      onRegister: function (token) {
        console.log('🔔 [FIREBASE] Push notification token:', token);
      },
      
      onNotification: function (notification) {
        console.log('🔔 [FIREBASE] Push notification received:', notification);
        
        // Handle notification tap
        if (notification.userInteraction) {
          console.log('🔔 [FIREBASE] Notification tapped:', notification);
          
          // Navigate based on notification type
          const notificationType = notification.data?.notificationType;
          if (notificationType && this.onNotificationOpened) {
            this.onNotificationOpened({
              notification: {
                title: notification.title,
                body: notification.message
              },
              data: notification.data
            });
          }
        }
        
        // Required for iOS
        notification.finish();
      },
      
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      
      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  /**
   * Set notification callbacks
   */
  setNotificationCallbacks(onReceived, onOpened) {
    this.onNotificationReceived = onReceived;
    this.onNotificationOpened = onOpened;
    console.log('🔔 [FIREBASE] Notification callbacks set');
  }

  /**
   * Get stored FCM token
   */
  async getStoredToken() {
    try {
      const token = await AsyncStorage.getItem('fcm_token');
      return token;
    } catch (error) {
      console.error('❌ [FIREBASE] Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Update user ID and re-register token for the specific user
   */
  async updateUserId(userId) {
    console.log('🔔 [FIREBASE] Updating user ID:', userId);
    this.userId = userId;
    
    if (this.fcmToken) {
      await this.registerTokenForUser(userId, this.fcmToken);
    }
  }

  /**
   * Register FCM token for a specific user (after login)
   */
  async registerTokenForUser(userId, token = null) {
    console.log('🔔 [FIREBASE] Registering token for user:', userId);
    
    const tokenToUse = token || this.fcmToken;
    if (!tokenToUse) {
      console.log('❌ [FIREBASE] No token available for user registration');
      return false;
    }
    
    // Check if user has access token before registering
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('⚠️ [FIREBASE] No access token found, skipping token registration for user');
        return false;
      }
      
      console.log('🔔 [FIREBASE] Registering token with backend for user:', userId);
      console.log('🔔 [FIREBASE] Token preview:', tokenToUse.substring(0, 20) + '...');
      
      // Use authenticated endpoint to register token for specific user
      const endpoint = `${BASE_URL}/notifications/register-token`;
      console.log('🔔 [FIREBASE] Using authenticated endpoint:', endpoint);
      
      const requestBody = {
        token: tokenToUse,
        deviceType: 'mobile',
        userId: userId
      };
      
      console.log('🔔 [FIREBASE] Request body:', requestBody);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('🔔 [FIREBASE] Backend response status:', response.status);
      console.log('🔔 [FIREBASE] Backend response:', result);
      
      if (response.ok) {
        console.log('✅ [FIREBASE] Token registered with backend for user successfully');
        return true;
      } else {
        console.error('❌ [FIREBASE] Failed to register token with backend for user:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ [FIREBASE] Error registering token with backend for user:', error);
      console.error('❌ [FIREBASE] Error details:', error.message);
      return false;
    }
  }

  /**
   * Clean up Firebase service
   */
  cleanup() {
    console.log('🔔 [FIREBASE] Cleaning up Firebase service...');
    this.isInitialized = false;
    this.fcmToken = null;
    this.userId = null;
    this.onNotificationReceived = null;
    this.onNotificationOpened = null;
  }
}

// Export singleton instance
export default new FirebaseService(); 