/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the main component first
AppRegistry.registerComponent(appName, () => App);

// Set up Firebase messaging after app registration
try {
  const messaging = require('@react-native-firebase/messaging').default;
  
  // Background message handler for FCM
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('🔔 [BACKGROUND] Received background message:', remoteMessage);
    
    // Handle background notification here
    // This will be called when the app is in the background or closed
    const { notification, data } = remoteMessage;
    
    console.log('🔔 [BACKGROUND] Notification data:', {
      title: notification?.title,
      body: notification?.body,
      data: data
    });
    
    // Return a promise to indicate the background task is complete
    return Promise.resolve();
  });
} catch (error) {
  console.warn('🔔 Firebase messaging not available:', error.message);
}
