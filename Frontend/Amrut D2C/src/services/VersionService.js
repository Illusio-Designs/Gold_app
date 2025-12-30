import { checkAppUpdate, getLatestVersion } from './Api';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class VersionService {
  constructor() {
    this.currentVersion = null;
    this.platform = Platform.OS;
    this.updateCheckInterval = null;
    this.updateListeners = new Set();
  }

  /**
   * Initialize version service
   * @param {Object} appInfo - App information from package.json or app config
   */
  async initialize(appInfo) {
    this.currentVersion = {
      versionCode: appInfo.versionCode || 1,
      versionName: appInfo.versionName || '1.0.0',
      buildNumber: appInfo.buildNumber || 1
    };

    console.log('📱 VersionService initialized:', {
      platform: this.platform,
      currentVersion: this.currentVersion
    });

    // Check for updates on initialization
    await this.checkForUpdates();
  }

  /**
   * Check for app updates
   * @returns {Object} Update information
   */
  async checkForUpdates() {
    try {
      console.log('🔍 Checking for app updates...');
      
      const updateInfo = await checkAppUpdate(
        this.platform, 
        this.currentVersion.versionCode
      );

      console.log('📱 Update check result:', updateInfo);

      if (updateInfo.update_available) {
        this.notifyUpdateAvailable(updateInfo);
        
        // Store update info for later use
        await AsyncStorage.setItem('app_update_info', JSON.stringify(updateInfo));
        
        return updateInfo;
      } else {
        // Clear any stored update info
        await AsyncStorage.removeItem('app_update_info');
        return updateInfo;
      }
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      return {
        update_available: false,
        force_update: false,
        error: error.message
      };
    }
  }

  /**
   * Get latest version information
   * @returns {Object} Latest version info
   */
  async getLatestVersionInfo() {
    try {
      const latestVersion = await getLatestVersion(this.platform);
      return latestVersion;
    } catch (error) {
      console.error('❌ Error getting latest version:', error);
      throw error;
    }
  }

  /**
   * Start periodic update checking
   * @param {number} intervalMinutes - Check interval in minutes (default: 60)
   */
  startPeriodicUpdateCheck(intervalMinutes = 60) {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);

    console.log(`⏰ Started periodic update check every ${intervalMinutes} minutes`);
  }

  /**
   * Stop periodic update checking
   */
  stopPeriodicUpdateCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      console.log('⏰ Stopped periodic update check');
    }
  }

  /**
   * Add update listener
   * @param {Function} listener - Callback function for update notifications
   */
  addUpdateListener(listener) {
    this.updateListeners.add(listener);
  }

  /**
   * Remove update listener
   * @param {Function} listener - Callback function to remove
   */
  removeUpdateListener(listener) {
    this.updateListeners.delete(listener);
  }

  /**
   * Notify all listeners about available update
   * @param {Object} updateInfo - Update information
   */
  notifyUpdateAvailable(updateInfo) {
    this.updateListeners.forEach(listener => {
      try {
        listener(updateInfo);
      } catch (error) {
        console.error('❌ Error in update listener:', error);
      }
    });
  }

  /**
   * Get stored update information
   * @returns {Object|null} Stored update info
   */
  async getStoredUpdateInfo() {
    try {
      const storedInfo = await AsyncStorage.getItem('app_update_info');
      return storedInfo ? JSON.parse(storedInfo) : null;
    } catch (error) {
      console.error('❌ Error getting stored update info:', error);
      return null;
    }
  }

  /**
   * Clear stored update information
   */
  async clearStoredUpdateInfo() {
    try {
      await AsyncStorage.removeItem('app_update_info');
    } catch (error) {
      console.error('❌ Error clearing stored update info:', error);
    }
  }

  /**
   * Check if force update is required
   * @returns {boolean} True if force update is required
   */
  async isForceUpdateRequired() {
    const updateInfo = await this.getStoredUpdateInfo();
    return updateInfo && updateInfo.force_update;
  }

  /**
   * Get current version information
   * @returns {Object} Current version info
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * Get platform information
   * @returns {string} Platform (ios/android)
   */
  getPlatform() {
    return this.platform;
  }

  /**
   * Compare versions
   * @param {number} version1 - First version code
   * @param {number} version2 - Second version code
   * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  compareVersions(version1, version2) {
    if (version1 < version2) return -1;
    if (version1 > version2) return 1;
    return 0;
  }

  /**
   * Check if version is outdated
   * @param {number} currentVersion - Current version code
   * @param {number} latestVersion - Latest version code
   * @returns {boolean} True if current version is outdated
   */
  isVersionOutdated(currentVersion, latestVersion) {
    return this.compareVersions(currentVersion, latestVersion) < 0;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopPeriodicUpdateCheck();
    this.updateListeners.clear();
  }
}

// Export singleton instance
export default new VersionService(); 