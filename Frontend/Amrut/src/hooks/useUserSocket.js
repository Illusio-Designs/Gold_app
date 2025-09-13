import { useState, useEffect, useRef } from 'react';
import SocketService from '../services/SocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

/**
 * Hook for managing user socket connections and real-time notifications
 * @param {Object} userData - User data (id, name, etc.)
 * @returns {Object} - { isConnected, connectionStatus, joinUserRoom, on, off, emit }
 */
export const useUserSocket = (userData = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const userDataRef = useRef(userData);
  const hasJoinedRoomRef = useRef(false);

  console.log('[useUserSocket] 🔌 Hook initialized with userData:', userData);
  console.log('[useUserSocket] 🔌 Hook instance ID:', Math.random().toString(36).substr(2, 9));

  // Update user data ref when it changes
  useEffect(() => {
    userDataRef.current = userData;
    console.log('[useUserSocket] 🔄 User data ref updated:', userData);
  }, [userData]);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Get access token for authentication
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        console.log('[useUserSocket] Initializing socket connection...');
        setConnectionStatus('connecting');
        
        // Connect to socket with authentication
        await SocketService.connect(accessToken);
        
        // Setup connection status listeners
        const connectListener = SocketService.addEventListener('connect', () => {
          console.log('[useUserSocket] Socket connected');
          setIsConnected(true);
          setConnectionStatus('connected');
          
          // Join user room if user data is available and we haven't joined yet
          if (userDataRef.current && !hasJoinedRoomRef.current) {
            SocketService.joinUserRoom(userDataRef.current);
            hasJoinedRoomRef.current = true;
          }
        });

        const disconnectListener = SocketService.addEventListener('disconnect', () => {
          console.log('[useUserSocket] Socket disconnected');
          setIsConnected(false);
          setConnectionStatus('disconnected');
          hasJoinedRoomRef.current = false;
        });

        const connectErrorListener = SocketService.addEventListener('connect_error', (error) => {
          console.error('[useUserSocket] Socket connection error:', error);
          setConnectionStatus('error');
        });

        // Listen for user room joined confirmation
        const userRoomJoinedListener = SocketService.addEventListener('user-room-joined', (data) => {
          console.log('[useUserSocket] ✅ User room joined successfully:', data);
          console.log('[useUserSocket] Room details:', {
            room: data.room,
            success: data.success,
            userData: userDataRef.current
          });
        });

        // Cleanup function
        return () => {
          SocketService.removeEventListener('connect', connectListener);
          SocketService.removeEventListener('disconnect', disconnectListener);
          SocketService.removeEventListener('connect_error', connectErrorListener);
          SocketService.removeEventListener('user-room-joined', userRoomJoinedListener);
        };
      } catch (error) {
        console.error('[useUserSocket] Error initializing socket:', error);
        setConnectionStatus('error');
      }
    };

    initializeSocket();
  }, []);

  // Join user room when user data becomes available
  useEffect(() => {
    if (userData && isConnected && !hasJoinedRoomRef.current) {
      console.log('[useUserSocket] 🔌 Joining user room for:', userData.name || userData.id);
      console.log('[useUserSocket] User data:', userData);
      console.log('[useUserSocket] Socket connected:', isConnected);
      
      try {
        SocketService.joinUserRoom(userData);
        hasJoinedRoomRef.current = true;
        console.log('[useUserSocket] ✅ Room join request sent');
      } catch (error) {
        console.error('[useUserSocket] ❌ Error joining room:', error);
      }
    } else {
      console.log('[useUserSocket] ⏳ Cannot join room yet:', {
        hasUserData: !!userData,
        isConnected,
        alreadyJoined: hasJoinedRoomRef.current
      });
    }
  }, [userData, isConnected]);

  // Setup notification listeners
  useEffect(() => {
    console.log('[useUserSocket] 🔔 Setting up notification listeners. Connected:', isConnected);
    
    if (!isConnected) {
      console.log('[useUserSocket] ⏳ Cannot setup listeners - not connected');
      return;
    }
    
    console.log('[useUserSocket] ✅ Setting up notification listeners...');

    // Listen for registration status changes
    const registrationStatusListener = SocketService.addEventListener('registration-status-change', (data) => {
      console.log('[useUserSocket] 🔔 Registration status change received:', data);
      console.log('[useUserSocket] Event data:', {
        action: data.action,
        user: data.user,
        type: data.type,
        timestamp: data.timestamp
      });
      
      if (data.user && data.user.status) {
        const status = data.user.status;
        const title = status === 'approved' ? 'Registration Approved ✅' : 
                     status === 'rejected' ? 'Registration Rejected ❌' : 
                     'Registration Status Updated';
        
        const message = status === 'approved' ? 'Your account has been approved! You can now access all features.' :
                       status === 'rejected' ? 'Your registration has been rejected. Please contact support.' :
                       `Your registration status has been updated to: ${status}`;
        
        Toast.show({
          type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
          text1: title,
          text2: message,
          position: 'top',
          autoHide: true,
          visibilityTime: 6000,
        });
      }
    });

    // Listen for login request status changes
    const loginRequestStatusListener = SocketService.addEventListener('login-request-status-change', (data) => {
      console.log('[useUserSocket] 🔔 Login request status change received:', data);
      console.log('[useUserSocket] Event data:', {
        action: data.action,
        request: data.request,
        type: data.type,
        timestamp: data.timestamp
      });
      
      if (data.request && data.request.status) {
        const status = data.request.status;
        const userName = data.request.userName || 'User';
        
        const title = status === 'approved' ? 'Login Approved ✅' : 
                     status === 'rejected' ? 'Login Request Rejected ❌' : 
                     'Login Request Updated';
        
        const message = status === 'approved' ? `Welcome ${userName}! You can now access the app.` :
                       status === 'rejected' ? `Sorry ${userName}, your login request has been rejected.` :
                       `Your login request status has been updated to: ${status}`;
        
        Toast.show({
          type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
          text1: title,
          text2: message,
          position: 'top',
          autoHide: true,
          visibilityTime: 6000,
        });

        // Handle logout if rejected
        if (status === 'rejected') {
          setTimeout(async () => {
            try {
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId', 'userType']);
              // You might want to navigate to login screen here
              console.log('[useUserSocket] User logged out due to login request rejection');
            } catch (error) {
              console.error('[useUserSocket] Error logging out user:', error);
            }
          }, 3000); // Give user time to read the message
        }
      }
    });

    console.log('[useUserSocket] 🔔 Event listeners set up successfully');
    console.log('[useUserSocket] Registration status listener ID:', registrationStatusListener);
    console.log('[useUserSocket] Login request status listener ID:', loginRequestStatusListener);

    // Cleanup listeners
    return () => {
      console.log('[useUserSocket] 🧹 Cleaning up event listeners...');
      SocketService.removeEventListener('registration-status-change', registrationStatusListener);
      SocketService.removeEventListener('login-request-status-change', loginRequestStatusListener);
      console.log('[useUserSocket] 🧹 Event listeners cleaned up');
    };
  }, [isConnected]);

  // Join user room manually
  const joinUserRoom = (userData) => {
    if (userData) {
      SocketService.joinUserRoom(userData);
      hasJoinedRoomRef.current = true;
      console.log('[useUserSocket] Manually joined user room for:', userData.name || userData.id);
    }
  };

  // Add event listener
  const on = (event, callback) => {
    return SocketService.addEventListener(event, callback);
  };

  // Remove event listener
  const off = (event, listenerId) => {
    SocketService.removeEventListener(event, listenerId);
  };

  // Emit event
  const emit = (event, data) => {
    SocketService.emit(event, data);
  };

  // Disconnect socket
  const disconnect = () => {
    SocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    hasJoinedRoomRef.current = false;
  };

  return {
    isConnected,
    connectionStatus,
    joinUserRoom,
    on,
    off,
    emit,
    disconnect
  };
};

export default useUserSocket;
