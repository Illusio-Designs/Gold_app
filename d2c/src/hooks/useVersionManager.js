import { useState, useEffect, useCallback } from 'react';
import VersionService from '../services/VersionService';

/**
 * Hook for managing app version and updates
 * @param {Object} appInfo - App information (versionCode, versionName, buildNumber)
 * @param {boolean} autoCheck - Whether to automatically check for updates
 * @param {number} checkInterval - Update check interval in minutes
 * @returns {Object} Version management state and functions
 */
export const useVersionManager = (appInfo = {}, autoCheck = true, checkInterval = 60) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize version service
  useEffect(() => {
    const initializeVersionService = async () => {
      try {
        await VersionService.initialize(appInfo);
        setIsInitialized(true);
        
        if (autoCheck) {
          // Start periodic update checking
          VersionService.startPeriodicUpdateCheck(checkInterval);
        }
      } catch (err) {
        console.error('❌ Error initializing version service:', err);
        setError(err.message);
      }
    };

    initializeVersionService();

    // Cleanup on unmount
    return () => {
      VersionService.cleanup();
    };
  }, [appInfo, autoCheck, checkInterval]);

  // Add update listener
  useEffect(() => {
    const handleUpdateAvailable = (updateData) => {
      setUpdateInfo(updateData);
      setError(null);
    };

    VersionService.addUpdateListener(handleUpdateAvailable);

    return () => {
      VersionService.removeUpdateListener(handleUpdateAvailable);
    };
  }, []);

  // Manual check for updates
  const checkForUpdates = useCallback(async () => {
    try {
      setIsChecking(true);
      setError(null);
      
      const result = await VersionService.checkForUpdates();
      setUpdateInfo(result);
      
      return result;
    } catch (err) {
      console.error('❌ Error checking for updates:', err);
      setError(err.message);
      return { error: err.message };
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Get latest version info
  const getLatestVersionInfo = useCallback(async () => {
    try {
      setError(null);
      const latestVersion = await VersionService.getLatestVersionInfo();
      return latestVersion;
    } catch (err) {
      console.error('❌ Error getting latest version:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Check if force update is required
  const isForceUpdateRequired = useCallback(async () => {
    try {
      return await VersionService.isForceUpdateRequired();
    } catch (err) {
      console.error('❌ Error checking force update:', err);
      return false;
    }
  }, []);

  // Get stored update info
  const getStoredUpdateInfo = useCallback(async () => {
    try {
      const storedInfo = await VersionService.getStoredUpdateInfo();
      if (storedInfo) {
        setUpdateInfo(storedInfo);
      }
      return storedInfo;
    } catch (err) {
      console.error('❌ Error getting stored update info:', err);
      return null;
    }
  }, []);

  // Clear stored update info
  const clearStoredUpdateInfo = useCallback(async () => {
    try {
      await VersionService.clearStoredUpdateInfo();
      setUpdateInfo(null);
    } catch (err) {
      console.error('❌ Error clearing stored update info:', err);
    }
  }, []);

  // Start periodic update checking
  const startPeriodicCheck = useCallback((intervalMinutes = checkInterval) => {
    VersionService.startPeriodicUpdateCheck(intervalMinutes);
  }, [checkInterval]);

  // Stop periodic update checking
  const stopPeriodicCheck = useCallback(() => {
    VersionService.stopPeriodicUpdateCheck();
  }, []);

  // Get current version
  const getCurrentVersion = useCallback(() => {
    return VersionService.getCurrentVersion();
  }, []);

  // Get platform
  const getPlatform = useCallback(() => {
    return VersionService.getPlatform();
  }, []);

  return {
    // State
    updateInfo,
    isChecking,
    error,
    isInitialized,
    
    // Functions
    checkForUpdates,
    getLatestVersionInfo,
    isForceUpdateRequired,
    getStoredUpdateInfo,
    clearStoredUpdateInfo,
    startPeriodicCheck,
    stopPeriodicCheck,
    getCurrentVersion,
    getPlatform,
    
    // Computed values
    hasUpdate: updateInfo?.update_available || false,
    isForceUpdate: updateInfo?.force_update || false,
    updateType: updateInfo?.update_type || null,
    latestVersionCode: updateInfo?.version_code || null,
    latestVersionName: updateInfo?.version_name || null,
    downloadUrl: updateInfo?.download_url || null,
    releaseNotes: updateInfo?.release_notes || null
  };
};

/**
 * Hook for checking app updates on app start
 * @param {Object} appInfo - App information
 * @returns {Object} Update check state
 */
export const useAppStartUpdateCheck = (appInfo = {}) => {
  const [isUpdateCheckComplete, setIsUpdateCheckComplete] = useState(false);
  const [startupUpdateInfo, setStartupUpdateInfo] = useState(null);

  useEffect(() => {
    const checkStartupUpdate = async () => {
      try {
        await VersionService.initialize(appInfo);
        const updateInfo = await VersionService.checkForUpdates();
        setStartupUpdateInfo(updateInfo);
      } catch (error) {
        console.error('❌ Error during startup update check:', error);
      } finally {
        setIsUpdateCheckComplete(true);
      }
    };

    checkStartupUpdate();
  }, [appInfo]);

  return {
    isUpdateCheckComplete,
    startupUpdateInfo,
    hasStartupUpdate: startupUpdateInfo?.update_available || false,
    isStartupForceUpdate: startupUpdateInfo?.force_update || false
  };
}; 