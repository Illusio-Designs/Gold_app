import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimerContextType {
  remainingMs: number;
  displayText: string;
  sessionDuration: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    console.warn('[useTimer] Timer context not available, returning default values');
    return {
      remainingMs: 0,
      displayText: '--',
      sessionDuration: 0
    };
  }
  return context;
};

interface TimerProviderProps {
  children: React.ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [remainingMs, setRemainingMs] = useState(0);
  const [displayText, setDisplayText] = useState('--');
  const [sessionDuration, setSessionDuration] = useState(0); // No default - should always come from backend
  const [navigationRef, setNavigationRef] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0); // Track last update to detect stuck timer
  


  const startTimer = () => {
    
    const interval = setInterval(async () => {
      try {
        const expiryStr = await AsyncStorage.getItem('sessionExpiry');
        
        if (expiryStr) {
          const expiryTime = new Date(expiryStr).getTime();
          const now = Date.now();
          const remaining = Math.max(0, expiryTime - now);
          
          // Check if timer is stuck (same value for too long)
          const currentTime = Date.now();
          if (Math.abs(remaining - remainingMs) < 1000 && currentTime - lastUpdateTime > 5000) {
            console.warn('[TimerContext] Timer appears stuck, forcing refresh');
            setLastUpdateTime(currentTime);
          }
          
          setRemainingMs(remaining);
          setLastUpdateTime(currentTime);
          
          if (remaining > 0) {
            // Calculate minutes properly without Math.ceil to avoid getting stuck
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            // Show minutes with seconds for more accurate display
            let displayText;
            if (minutes > 0) {
              displayText = `${minutes} min`;
              // Add seconds for more precise timing when less than 1 minute
              if (minutes === 1 && seconds < 60) {
                displayText = `${minutes} min ${seconds}s`;
              }
            } else if (seconds > 0) {
              displayText = `${seconds}s`;
            } else {
              displayText = 'Expired';
            }
            
            setDisplayText(displayText);
            

          } else {
            setDisplayText('Expired');
            clearInterval(interval);
            handleSessionExpiry();
          }
        } else {
          clearInterval(interval);
          handleSessionExpiry();
        }
      } catch (error) {
        console.error('[TimerContext] Error in timer update:', error);
        // Don't clear interval on error, just log it
      }
    }, 1000); // Update every 1 second
    
    return () => {
      clearInterval(interval);
    };
  };

  // Sync timer with backend session state
  const syncSessionWithBackend = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const SessionValidationService = require('../services/SessionValidationService').default;
      const result = await SessionValidationService.validateSession();
      
      if (result && result.valid) {
        // Update local session data with backend data
        if (result.sessionExpiry) {
          await AsyncStorage.setItem('sessionExpiry', result.sessionExpiry);
        }
        if (result.sessionDurationMinutes) {
          await AsyncStorage.setItem('sessionDurationMinutes', result.sessionDurationMinutes.toString());
        }
        
        // Restart timer with updated data
        const expiryTime = new Date(result.sessionExpiry).getTime();
        const now = Date.now();
        const remaining = Math.max(0, expiryTime - now);
        
        setRemainingMs(remaining);
        setSessionDuration(result.sessionDurationMinutes);
        
        if (remaining > 0) {
          // Calculate minutes properly without Math.ceil to avoid getting stuck
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          
          // Show minutes with seconds for more accurate display
          let displayText;
          if (minutes > 0) {
            displayText = `${minutes} min`;
            // Add seconds for more precise timing when less than 1 minute
            if (minutes === 1 && seconds < 60) {
              displayText = `${minutes} min ${seconds}s`;
            }
          } else if (seconds > 0) {
            displayText = `${seconds}s`;
          } else {
            displayText = 'Expired';
          }
          
          setDisplayText(displayText);
          

        } else {
          setDisplayText('Expired');
          handleSessionExpiry();
        }
      }
    } catch (error) {
      console.error('[TimerContext] Error syncing with backend:', error);
    }
  };

  const handleSessionExpiry = async () => {
    // Session expired: clear session and redirect
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('sessionExpiry');
    await AsyncStorage.removeItem('sessionDurationMinutes');
    
    // Use SessionValidationService to handle navigation
    try {
      const SessionValidationService = require('../services/SessionValidationService').default;
      SessionValidationService.forceLogout('Session expired');
    } catch (error) {
      console.error('[TimerContext] Error handling session expiry:', error);
    }
  };

  // Force refresh timer (useful for debugging stuck timers)
  const forceRefreshTimer = async () => {
    try {
      const expiryStr = await AsyncStorage.getItem('sessionExpiry');
      
      if (expiryStr) {
        const expiryTime = new Date(expiryStr).getTime();
        const now = Date.now();
        const remaining = Math.max(0, expiryTime - now);
        

        
        setRemainingMs(remaining);
        setLastUpdateTime(now);
        
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          
          let displayText;
          if (minutes > 0) {
            displayText = `${minutes} min`;
            if (minutes === 1 && seconds < 60) {
              displayText = `${minutes} min ${seconds}s`;
            }
          } else if (seconds > 0) {
            displayText = `${seconds}s`;
          } else {
            displayText = 'Expired';
          }
          
          setDisplayText(displayText);
        } else {
          setDisplayText('Expired');
          handleSessionExpiry();
        }
      }
    } catch (error) {
      console.error('[TimerContext] Error in force refresh:', error);
    }
  };

  useEffect(() => {
    let timerCleanup: (() => void) | null = null;

    const initializeTimer = async () => {
      try {
        const expiryStr = await AsyncStorage.getItem('sessionExpiry');
        const durationStr = await AsyncStorage.getItem('sessionDurationMinutes');
        
        if (expiryStr && durationStr) {
          const expiryTime = new Date(expiryStr).getTime();
          const now = Date.now();
          const remaining = Math.max(0, expiryTime - now);
          const durationMinutes = parseInt(durationStr, 10);
          

          
          setRemainingMs(remaining);
          setSessionDuration(durationMinutes);
          
          if (remaining > 0) {
            timerCleanup = startTimer();
          } else {
            handleSessionExpiry();
          }
        } else {
          // No session data found, timer not started
        }
      } catch (error) {
        console.error('[TimerContext] Error initializing timer:', error);
      }
    };

    // Delay initialization to avoid blocking app startup
    const initTimer = setTimeout(() => {
      initializeTimer();
    }, 1000);

    // Sync with backend every 30 seconds
    const syncInterval = setInterval(() => {
      syncSessionWithBackend();
    }, 30000);

    // Cleanup function
    return () => {
      clearTimeout(initTimer);
      clearInterval(syncInterval);
      if (timerCleanup && typeof timerCleanup === 'function') {
        timerCleanup();
      }
    };
  }, []);

  const contextValue = { 
    remainingMs, 
    displayText, 
    sessionDuration, 
    forceRefreshTimer 
  };

  
  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
}; 