import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserSocket from '../hooks/useUserSocket';

/**
 * Component for managing user real-time notifications
 * This component should be included in the main app component
 */
const UserNotificationManager = ({ userData, navigation }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [storedUserData, setStoredUserData] = useState(null);
  const { isConnected, connectionStatus, joinUserRoom } = useUserSocket(userData);

  console.log('[UserNotificationManager] 🔌 Component rendered with:', {
    userData,
    isConnected,
    connectionStatus
  });

  // Get user data from storage if not provided
  useEffect(() => {
    const initializeUserData = async () => {
      if (!userData && !isInitialized) {
        try {
          const userId = await AsyncStorage.getItem('userId');
          const userType = await AsyncStorage.getItem('userType');
          const userName = await AsyncStorage.getItem('userName');
          
          if (userId && userType) {
            const userInfo = {
              id: parseInt(userId),
              name: userName || 'User',
              type: userType
            };
            
            setStoredUserData(userInfo);
            // Don't call joinUserRoom here, wait for socket connection
          }
          
          setIsInitialized(true);
        } catch (error) {
          console.error('[UserNotificationManager] Error retrieving user data:', error);
          setIsInitialized(true);
        }
      } else if (userData) {
        // Ensure userData has the correct structure
        if (userData.id && userData.type) {
          // Don't call joinUserRoom here, wait for socket connection
        }
        setIsInitialized(true);
      }
    };

    initializeUserData();
  }, [userData, isInitialized]);

  // Join user room when socket is connected and user data is available
  useEffect(() => {
    console.log('[UserNotificationManager] 🔌 Socket connection check:', {
      isConnected,
      hasUserData: !!userData,
      hasStoredData: !!storedUserData,
      isInitialized
    });
    
    if (isConnected && (userData || storedUserData)) {
      let userInfo = userData || storedUserData;
      
      if (userInfo) {
        console.log('[UserNotificationManager] 🎯 Attempting to join user room for:', {
          id: userInfo.id,
          name: userInfo.name,
          type: userInfo.type
        });
        
        // Ensure we have all required fields
        if (userInfo.id && userInfo.type) {
          joinUserRoom(userInfo);
        } else {
          console.warn('[UserNotificationManager] ⚠️ User data incomplete:', userInfo);
        }
      } else {
      }
    } else {
      console.log('[UserNotificationManager] ⏳ Cannot join room yet:', {
        hasUserData: !!userData,
        hasStoredData: !!storedUserData,
        isConnected,
        isInitialized
      });
    }
  }, [connectionStatus, isConnected, userData, storedUserData, isInitialized, joinUserRoom]);

  // Log connection status for debugging
  useEffect(() => {
    
    // Add more detailed logging
    if (isConnected) {
      if (userData) {
      }
      if (storedUserData) {
      }
    } else {
    }
  }, [connectionStatus, isConnected, userData, storedUserData]);

  // Handle navigation for approved login
  useEffect(() => {
    if (!isConnected) return;

    // You can add more sophisticated navigation handling here
    // For example, navigate to specific screens based on notification type
    
  }, [isConnected, navigation]);

  // This component doesn't render anything visible
  return null;
};

export default UserNotificationManager;
