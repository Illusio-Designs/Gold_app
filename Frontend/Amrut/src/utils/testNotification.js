import PushNotification from 'react-native-push-notification';

/**
 * Test native notification banner locally
 * This can be called from your app to test notifications
 */
export const testNativeNotification = (type = 'LOGIN_REQUEST_STATUS') => {
  console.log('🧪 [TEST] Testing native notification:', type);
  
  const notificationConfig = {
    LOGIN_REQUEST_STATUS: {
      title: 'Login Approved ✅',
      message: 'Welcome! You can now access the app.',
      sound: 'login_request_status.mp3',
      icon: '🔐',
      color: '#2196F3'
    },
    REGISTRATION_STATUS: {
      title: 'Registration Approved ✅',
      message: 'Your account has been approved!',
      sound: 'registration_status.mp3',
      icon: '👤',
      color: '#4CAF50'
    },
    ORDER_STATUS: {
      title: 'Order Status Updated 📦',
      message: 'Your order status has been updated.',
      sound: 'order_status.mp3',
      icon: '🛒',
      color: '#FF9800'
    }
  };
  
  const config = notificationConfig[type] || notificationConfig.LOGIN_REQUEST_STATUS;
  
  PushNotification.localNotification({
    channelId: 'default',
    title: config.title,
    message: config.message,
    playSound: true,
    soundName: config.sound,
    importance: 'high',
    priority: 'high',
    vibrate: true,
    vibration: 300,
    largeIcon: 'ic_launcher',
    smallIcon: 'ic_notification',
    bigText: config.message,
    subText: config.icon,
    color: config.color,
    data: {
      notificationType: type,
      test: true
    },
    // iOS specific
    alertAction: 'view',
    category: type,
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
  
  console.log('✅ [TEST] Native notification test sent');
};

/**
 * Test all notification types
 */
export const testAllNotifications = () => {
  console.log('🧪 [TEST] Testing all notification types...');
  
  const types = ['LOGIN_REQUEST_STATUS', 'REGISTRATION_STATUS', 'ORDER_STATUS'];
  
  types.forEach((type, index) => {
    setTimeout(() => {
      testNativeNotification(type);
    }, index * 2000); // Send each notification 2 seconds apart
  });
};

export default {
  testNativeNotification,
  testAllNotifications
}; 