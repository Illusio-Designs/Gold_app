import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import firebaseService, { NOTIFICATION_TYPES } from '../services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationManager = ({ navigation, userId }) => {
  const notificationRef = useRef(null);

  useEffect(() => {
    // console.log('🔔 [NOTIFICATION MANAGER] Initializing notification manager...');
    // console.log('🔔 [NOTIFICATION MANAGER] User ID:', userId);
    
    // // Initialize Firebase service - always initialize for testing
    // initializeNotifications();
    
    // // Setup notification callbacks
    // setupNotificationCallbacks();
    
    // return () => {
    //   console.log('🔔 [NOTIFICATION MANAGER] Cleaning up notification manager...');
    //   firebaseService.cleanup();
    // };
  }, [userId]);

  /**
   * Initialize Firebase notifications
   */
  const initializeNotifications = async () => {
    // try {
    //   console.log('🔔 [NOTIFICATION MANAGER] Initializing notifications...');
      
    //   // Configure push notifications
    //   firebaseService.configurePushNotifications();
      
    //   // Initialize Firebase messaging - use userId if available, otherwise use 1 for testing
    //   const testUserId = userId || 1;
    //   console.log('🔔 [NOTIFICATION MANAGER] Using test user ID:', testUserId);
      
    //   const success = await firebaseService.initialize(testUserId);
      
    //   if (success) {
    //     console.log('✅ [NOTIFICATION MANAGER] Notifications initialized successfully');
    //   } else {
    //     console.log('⚠️ [NOTIFICATION MANAGER] Failed to initialize notifications');
    //   }
    // } catch (error) {
    //   console.error('❌ [NOTIFICATION MANAGER] Error initializing notifications:', error);
    // }
  };

  /**
   * Setup notification callbacks
   */
  const setupNotificationCallbacks = () => {
    
    // Handle notification received (foreground)
    const handleNotificationReceived = (remoteMessage) => {
      
      const { notification, data } = remoteMessage;
      const notificationType = data?.notificationType;
      
      
      // Native notification banner will be shown automatically by firebaseService
      // No need to show Alert - the native banner will appear
    };

    // Handle notification opened (background/quit)
    const handleNotificationOpened = (remoteMessage) => {
      handleNotificationTap(remoteMessage);
    };

    // Set callbacks
    // firebaseService.setNotificationCallbacks(handleNotificationReceived, handleNotificationOpened);
  };

  /**
   * Handle notification tap
   */
  const handleNotificationTap = (remoteMessage) => {
    try {
      
      const { notification, data } = remoteMessage;
      const notificationType = data?.notificationType;
      
      
      // Navigate based on notification type
      switch (notificationType) {
        case 'registration_status':
          navigation.navigate('Profile', { 
            refresh: true,
            statusUpdate: data?.status,
            message: notification?.body 
          });
          break;
          
        case 'login_request_status':
          navigation.navigate('Login', { 
            refresh: true,
            requestId: data?.requestId,
            status: data?.status 
          });
          break;
          
        case 'order_status':
          navigation.navigate('Orders', { 
            refresh: true,
            orderId: data?.orderId,
            status: data?.status 
          });
          break;
          
        default:
          // Show general notification
          Alert.alert(
            notification?.title || 'Notification',
            notification?.body || 'You have a new notification'
          );
          break;
      }
    } catch (error) {
      console.error('❌ [NOTIFICATION MANAGER] Error handling notification tap:', error);
    }
  };

  /**
   * Update user ID when user logs in/out
   */
  const updateUserId = async (newUserId) => {
    // try {
    //   console.log('🔔 [NOTIFICATION MANAGER] Updating user ID:', newUserId);
    //   await firebaseService.updateUserId(newUserId);
    // } catch (error) {
    //   console.error('❌ [NOTIFICATION MANAGER] Error updating user ID:', error);
    // }
  };

  // Expose updateUserId method for parent components
  React.useImperativeHandle(notificationRef, () => ({
    updateUserId
  }));

  return null; // This component doesn't render anything visible
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  }
});

export default NotificationManager; 