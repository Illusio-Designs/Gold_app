import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to check if user is logged in and show login prompt if needed
 * @returns {object} - { isLoggedIn, showLoginPrompt, checkAndPromptLogin }
 */
export const useLoginPrompt = () => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  /**
   * Check if user is logged in
   * @returns {Promise<boolean>} - true if logged in, false otherwise
   */
  const checkLoginStatus = async (): Promise<boolean> => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const accessToken = await AsyncStorage.getItem('accessToken');
      const loggedIn = !!(userId && accessToken);
      setIsLoggedIn(loggedIn);
      return loggedIn;
    } catch (error) {
      console.error('[useLoginPrompt] Error checking login status:', error);
      setIsLoggedIn(false);
      return false;
    }
  };

  /**
   * Check if user is logged in, if not show login prompt
   * @param {Function} onSuccess - Callback to execute if user is logged in
   * @returns {Promise<boolean>} - true if logged in, false if prompt shown
   */
  const checkAndPromptLogin = async (onSuccess?: () => void): Promise<boolean> => {
    const loggedIn = await checkLoginStatus();
    
    if (loggedIn) {
      if (onSuccess) {
        onSuccess();
      }
      return true;
    } else {
      setShowLoginPrompt(true);
      return false;
    }
  };

  /**
   * Close the login prompt modal
   */
  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  return {
    isLoggedIn,
    showLoginPrompt,
    checkAndPromptLogin,
    closeLoginPrompt,
    checkLoginStatus,
  };
};
