import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateUserSession } from './Api';
import Toast from 'react-native-toast-message';

class SessionValidationService {
  constructor() {
    this.validationInterval = null;
    this.isValidating = false;
    this.navigationCallback = null;
  }

  // Set navigation callback for logout
  setNavigationCallback(callback) {
    this.navigationCallback = callback;
  }

  // Start periodic session validation
  startValidation() {
    if (this.validationInterval) {
      this.stopValidation();
    }

    // Check session every 30 seconds
    this.validationInterval = setInterval(async () => {
      await this.validateSession();
    }, 30000);

    console.log('[SessionValidationService] Started periodic session validation');
  }

  // Stop periodic session validation
  stopValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
      console.log('[SessionValidationService] Stopped periodic session validation');
    }
  }

  // Validate current session
  async validateSession() {
    if (this.isValidating) {
      return; // Prevent multiple simultaneous validations
    }

    this.isValidating = true;

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('[SessionValidationService] No token found, skipping validation');
        this.isValidating = false;
        return;
      }

      console.log('[SessionValidationService] Validating session...');
      const result = await validateUserSession(token);

      console.log('[SessionValidationService] Validation result:', result);

      if (result.valid) {
        console.log('[SessionValidationService] Session is valid');
        // Update session expiry if needed
        if (result.sessionExpiry) {
          await AsyncStorage.setItem('sessionExpiry', result.sessionExpiry);
          console.log('[SessionValidationService] Updated session expiry:', result.sessionExpiry);
        }
        if (result.sessionDurationMinutes) {
          await AsyncStorage.setItem('sessionDurationMinutes', result.sessionDurationMinutes.toString());
          console.log('[SessionValidationService] Updated session duration:', result.sessionDurationMinutes);
        }
        return result;
      } else {
        console.log('[SessionValidationService] Session is invalid');
        await this.forceLogout('Session expired or invalid');
        return { valid: false };
      }
    } catch (error) {
      console.error('[SessionValidationService] Validation error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 404) {
        // User not found - force logout
        await this.forceLogout('User not found');
        return { valid: false };
      } else if (error.response?.status === 401) {
        // Unauthorized - check if it's a specific logout action
        if (error.response?.data?.action === 'force_logout') {
          await this.forceLogout(error.response.data.error || 'Session expired');
          return { valid: false };
        } else {
          // Just log the 401 but don't force logout immediately
          console.log('[SessionValidationService] 401 error but not forcing logout:', error.response?.data);
          return { valid: false };
        }
      } else if (error.action === 'force_logout' || 
                 error.error === 'Session expired or invalid' ||
                 error.error === 'User not found' ||
                 error.error === 'User account not approved') {
        await this.forceLogout(error.error || 'Session expired');
        return { valid: false };
      } else {
        // Other errors - just log them but don't force logout
        console.log('[SessionValidationService] Non-critical error, continuing:', error.message);
        return { valid: false };
      }
    } finally {
      this.isValidating = false;
    }
  }

  // Force logout and clear all data
  async forceLogout(reason = 'Session expired') {
    console.log('[SessionValidationService] Force logout triggered:', reason);
    
    try {
      // Stop validation
      this.stopValidation();

      // Clear all stored data
      await AsyncStorage.multiRemove([
        'accessToken',
        'userId',
        'sessionExpiry',
        'sessionDurationMinutes'
      ]);

      // Show notification to user
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: reason,
        position: 'top',
        visibilityTime: 4000
      });

      // Navigate to login screen using callback
      if (this.navigationCallback) {
        this.navigationCallback();
      } else {
        console.log('[SessionValidationService] No navigation callback set');
      }
      
    } catch (error) {
      console.error('[SessionValidationService] Error during force logout:', error);
    }
  }

  // Check if session is expired based on stored expiry time
  async isSessionExpired() {
    try {
      const sessionExpiry = await AsyncStorage.getItem('sessionExpiry');
      if (!sessionExpiry) {
        return true;
      }

      const expiryTime = new Date(sessionExpiry);
      const now = new Date();
      
      return now >= expiryTime;
    } catch (error) {
      console.error('[SessionValidationService] Error checking session expiry:', error);
      return true; // Assume expired if error
    }
  }

  // Initialize session validation after login
  async onUserLogin() {
    console.log('[SessionValidationService] User logged in, starting session validation');
    
    // Check if session is already expired
    const isExpired = await this.isSessionExpired();
    if (isExpired) {
      console.log('[SessionValidationService] Session already expired, forcing logout');
      await this.forceLogout('Session already expired');
      return;
    }

    // Start periodic validation
    this.startValidation();
  }

  // Clean up when user logs out
  onUserLogout() {
    console.log('[SessionValidationService] User logged out, stopping session validation');
    this.stopValidation();
  }
}

// Export singleton instance
export default new SessionValidationService(); 