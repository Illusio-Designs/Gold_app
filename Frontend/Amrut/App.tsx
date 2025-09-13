/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StackNavigation from './src/navigation/StackNavigation';
import NotificationManager from './src/components/NotificationManager';
import UserNotificationManager from './src/components/UserNotificationManager';

import firebaseService from './src/services/firebaseService';

const App = () => {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionButton, setShowPermissionButton] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('checking');

  useEffect(() => {
    console.log('🔔 [APP] Initializing app...');
    
    // Initialize Firebase immediately when app starts
    initializeFirebaseOnStartup();
    
    // Check for stored user token and get user ID
    checkUserAuth();
    
    // Show permission button after 3 seconds if no user
    const timer = setTimeout(() => {
      if (!userId) {
        setShowPermissionButton(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [userId]);

  // Re-register token on app resume to ensure auth/unauth flows are in sync
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          console.log('🔔 [APP] App resumed - ensuring notification registration is up to date');
          // Always initialize silently (ensures FCM token exists and unauth token is registered)
          await firebaseService.initialize();
          const accessToken = await AsyncStorage.getItem('accessToken');
          const storedUserId = await AsyncStorage.getItem('userId');
          if (accessToken && storedUserId) {
            await firebaseService.updateUserId(parseInt(storedUserId));
            console.log('🔔 [APP] Re-registered token for user on resume:', storedUserId);
          }
        } catch (e) {
          console.log('⚠️ [APP] Notification re-registration on resume failed silently');
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const initializeFirebaseOnStartup = async () => {
    try {
      console.log('🔔 [APP] Initializing Firebase on startup...');
      
      // Configure push notifications
      firebaseService.configurePushNotifications();
      
      // Initialize Firebase (no user ID required)
      const success = await firebaseService.initialize();
      
      if (success) {
        console.log('✅ [APP] Firebase initialized successfully on startup');
        setNotificationStatus('initialized');
        
        // Check notification settings after initialization
        checkNotificationSettings();
      } else {
        console.log('❌ [APP] Firebase initialization failed on startup');
        setNotificationStatus('failed');
      }
    } catch (error) {
      console.error('❌ [APP] Error initializing Firebase on startup:', error);
      console.log('⚠️ [APP] Firebase service not available, but app will continue');
      setNotificationStatus('error');
      // Don't fail the app if Firebase fails
    }
  };

  const checkUserAuth = async () => {
    try {
      console.log('🔔 [APP] Checking user authentication...');
      
      const accessToken = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (accessToken && userId) {
        console.log('🔔 [APP] User found:', userId);
        setUserId(parseInt(userId));
        
        // Update Firebase service with user ID for targeted notifications
        try {
          await firebaseService.updateUserId(parseInt(userId));
          console.log('🔔 [APP] Firebase service updated with user ID:', userId);
        } catch (error) {
          console.error('❌ [APP] Error updating Firebase service with user ID:', error);
          // Don't fail the app if Firebase update fails
        }
      } else {
        console.log('🔔 [APP] No user found');
        setUserId(null);
      }
    } catch (error) {
      console.error('❌ [APP] Error checking user auth:', error);
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('🔔 [APP] Manually requesting notification permission...');
      
      const granted = await firebaseService.requestPermission();
      
      if (granted) {
        console.log('✅ [APP] Notification permission granted!');
        setNotificationStatus('granted');
        setShowPermissionButton(false);
        
        // Check notification settings after permission
        checkNotificationSettings();
      } else {
        console.log('❌ [APP] Notification permission denied!');
        setNotificationStatus('denied');
        Alert.alert('Permission Denied', 'Please enable notifications in device settings');
      }
    } catch (error) {
      console.error('❌ [APP] Error requesting notification permission:', error);
      setNotificationStatus('error');
    }
  };

  const checkNotificationSettings = async () => {
    try {
      console.log('🔍 [APP] Checking notification settings...');
      
      // Check if notifications are enabled
      const enabled = await firebaseService.checkNotificationEnabled();
      console.log('🔍 [APP] Notifications enabled:', enabled);
      
      if (!enabled) {
        console.log('⚠️ [APP] Notifications are disabled in device settings');
        setNotificationStatus('disabled');
        Alert.alert(
          'Notifications Disabled', 
          'Please enable notifications for this app in your device settings:\n\nSettings > Apps > Amrut > Notifications > Show notifications = ON'
        );
      } else {
        console.log('✅ [APP] Notifications are enabled in device settings');
        setNotificationStatus('enabled');
      }
    } catch (error) {
      console.error('❌ [APP] Error checking notification settings:', error);
    }
  };

  if (isLoading) {
    console.log('🔔 [APP] Still loading...');
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log('🔔 [APP] App loaded, userId:', userId);

  return (
    <>
      <StackNavigation />
      <NotificationManager userId={userId} />
      <UserNotificationManager 
        userData={userId ? { 
          id: userId, 
          name: 'User', // Will be updated from storage in UserNotificationManager
          type: 'business' 
        } : null} 
      />
      
      {/* Manual permission request button - temporarily disabled */}
      {/* {showPermissionButton && (
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Enable Notifications</Text>
            <Text style={styles.permissionText}>
              To receive push notifications like WhatsApp messages, please grant notification permissions.
            </Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={requestNotificationPermission}
            >
              <Text style={styles.permissionButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => {
                setShowPermissionButton(false);
                setNotificationStatus('skipped');
              }}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )} */}


    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  permissionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },

});

export default App;

