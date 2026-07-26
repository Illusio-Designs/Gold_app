/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, AppState, Platform } from 'react-native';
import RNScreenshotPrevent from 'react-native-screenshot-prevent';
import './src/utils/globalFont'; // apply Glorify as the default font app-wide
import AsyncStorage from '@react-native-async-storage/async-storage';
import StackNavigation from './src/navigation/StackNavigation';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/common/ToastConfig';
// import NotificationManager from './src/components/NotificationManager';
// import UserNotificationManager from './src/components/UserNotificationManager';

// import firebaseService from './src/services/firebaseService';

const App = () => {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionButton, setShowPermissionButton] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('checking');

  useEffect(() => {
    console.log('🔔 [APP] Initializing app...');
    
    // Initialize Firebase immediately when app starts
    // initializeFirebaseOnStartup();
    
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

  // iOS screenshot / screen-recording protection (Android already has this
  // natively via FLAG_SECURE in MainActivity.kt). This runs AFTER the app has
  // mounted — never during launch — because doing the secure-layer work at
  // launch crashed a previous build on open. The library re-parents the ROOT
  // VIEW's layer (not the window), from JS, so it's safe here:
  //   • enableSecureView() -> still screenshots come out blank
  //   • enabled(true)      -> app-switcher / inactive snapshot is blurred
  // Wrapped so a failure can never take the app down.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    try {
      RNScreenshotPrevent.enableSecureView();
      RNScreenshotPrevent.enabled(true);
    } catch (e) {
      console.log('⚠️ [APP] iOS screenshot prevention setup skipped:', e);
    }
  }, []);

  // Re-register token on app resume to ensure auth/unauth flows are in sync
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          console.log('🔔 [APP] App resumed - Firebase disabled');
          // console.log('🔔 [APP] App resumed - ensuring notification registration is up to date');
          // // Always initialize silently (ensures FCM token exists and unauth token is registered)
          // await firebaseService.initialize();
          // const accessToken = await AsyncStorage.getItem('accessToken');
          // const storedUserId = await AsyncStorage.getItem('userId');
          // if (accessToken && storedUserId) {
          //   await firebaseService.updateUserId(parseInt(storedUserId));
          //   console.log('🔔 [APP] Re-registered token for user on resume:', storedUserId);
          // }
        } catch (e) {
          console.log('⚠️ [APP] Notification re-registration on resume failed silently');
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const initializeFirebaseOnStartup = async () => {
    try {
      console.log('🔔 [APP] Firebase disabled - skipping initialization...');
      // console.log('🔔 [APP] Initializing Firebase on startup...');
      
      // // Configure push notifications
      // firebaseService.configurePushNotifications();
      
      // // Initialize Firebase (no user ID required)
      // const success = await firebaseService.initialize();
      
      // if (success) {
      //   console.log('✅ [APP] Firebase initialized successfully on startup');
      //   setNotificationStatus('initialized');
        
      //   // Check notification settings after initialization
      //   checkNotificationSettings();
      // } else {
      //   console.log('❌ [APP] Firebase initialization failed on startup');
      //   setNotificationStatus('failed');
      // }
      setNotificationStatus('disabled');
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
        // try {
        //   await firebaseService.updateUserId(parseInt(userId));
        //   console.log('🔔 [APP] Firebase service updated with user ID:', userId);
        // } catch (error) {
        //   console.error('❌ [APP] Error updating Firebase service with user ID:', error);
        //   // Don't fail the app if Firebase update fails
        // }
        console.log('🔔 [APP] Firebase disabled - user ID not updated');
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
      console.log('🔔 [APP] Firebase disabled - notification permission not available...');
      // console.log('🔔 [APP] Manually requesting notification permission...');
      
      // const granted = await firebaseService.requestPermission();
      
      // if (granted) {
      //   console.log('✅ [APP] Notification permission granted!');
      //   setNotificationStatus('granted');
      //   setShowPermissionButton(false);
        
      //   // Check notification settings after permission
      //   checkNotificationSettings();
      // } else {
      //   console.log('❌ [APP] Notification permission denied!');
      //   setNotificationStatus('denied');
      //   Alert.alert('Permission Denied', 'Please enable notifications in device settings');
      // }
      setNotificationStatus('disabled');
    } catch (error) {
      console.error('❌ [APP] Error requesting notification permission:', error);
      setNotificationStatus('error');
    }
  };

  const checkNotificationSettings = async () => {
    try {
      console.log('🔍 [APP] Firebase disabled - notification settings not available...');
      // console.log('🔍 [APP] Checking notification settings...');
      
      // // Check if notifications are enabled
      // const enabled = await firebaseService.checkNotificationEnabled();
      // console.log('🔍 [APP] Notifications enabled:', enabled);
      
      // if (!enabled) {
      //   console.log('⚠️ [APP] Notifications are disabled in device settings');
      //   setNotificationStatus('disabled');
      //   Alert.alert(
      //     'Notifications Disabled', 
      //     'Please enable notifications for this app in your device settings:\n\nSettings > Apps > Amrut > Notifications > Show notifications = ON'
      //   );
      // } else {
      //   console.log('✅ [APP] Notifications are enabled in device settings');
      //   setNotificationStatus('enabled');
      // }
      setNotificationStatus('disabled');
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
    <SafeAreaProvider>
    {/* edges left/right only — each screen's header/topBar handles the top inset,
        and the bottom nav handles the bottom, so we don't double-pad here. */}
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>

      {/* App-wide crash guard: a render error shows a friendly retry instead of
          a white screen. */}
      <ErrorBoundary>
        <StackNavigation />
      </ErrorBoundary>
    </SafeAreaView>

      {/* Firebase disabled - NotificationManager and UserNotificationManager commented out */}
      {/* <NotificationManager userId={userId} /> */}
      {/* <UserNotificationManager 
        userData={userId ? { 
          id: userId, 
          name: 'User', // Will be updated from storage in UserNotificationManager
          type: 'business' 
        } : null} 
      /> */}
      
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

      {/* App-wide toast host (Amrut-branded). Mounted last so it overlays every
          screen. Without this, every Toast.show(...) call across the app was a
          no-op — e.g. checkout errors were silently swallowed. */}
      <Toast config={toastConfig} topOffset={60} />
    </SafeAreaProvider>
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

