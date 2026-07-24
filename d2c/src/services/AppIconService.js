import { getCurrentAppIcon, getActiveAppIcons } from './Api';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * App Icon Service
 * Manages dynamic app icons for the mobile app
 */
class AppIconService {
  constructor() {
    this.currentIcon = null;
    this.activeIcons = [];
    this.platform = Platform.OS; // 'ios' or 'android'
    this.listeners = new Set();
    this.isInitialized = false;
  }

  /**
   * Initialize the app icon service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🎨 Initializing App Icon Service for platform:', this.platform);
      
      // Load cached icons
      await this.loadCachedIcons();
      
      // Fetch current icons from server
      await this.fetchCurrentIcons();
      
      // Set up periodic refresh
      this.startPeriodicRefresh();
      
      this.isInitialized = true;
      console.log('✅ App Icon Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize App Icon Service:', error);
    }
  }

  /**
   * Load cached icons from local storage
   */
  async loadCachedIcons() {
    try {
      const cachedCurrentIcon = await AsyncStorage.getItem(`app_icon_current_${this.platform}`);
      const cachedActiveIcons = await AsyncStorage.getItem(`app_icons_active_${this.platform}`);
      
      if (cachedCurrentIcon) {
        this.currentIcon = JSON.parse(cachedCurrentIcon);
        console.log('🎨 Loaded cached current icon:', this.currentIcon.icon_name);
      }
      
      if (cachedActiveIcons) {
        this.activeIcons = JSON.parse(cachedActiveIcons);
        console.log('🎨 Loaded cached active icons:', this.activeIcons.length);
      }
    } catch (error) {
      console.error('❌ Failed to load cached icons:', error);
    }
  }

  /**
   * Fetch current icons from server
   */
  async fetchCurrentIcons() {
    try {
      // Fetch current primary icon
      const currentIconResponse = await getCurrentAppIcon(this.platform, 'primary');
      if (currentIconResponse.success && currentIconResponse.icon) {
        this.currentIcon = currentIconResponse.icon;
        await AsyncStorage.setItem(`app_icon_current_${this.platform}`, JSON.stringify(this.currentIcon));
        console.log('🎨 Updated current icon:', this.currentIcon.icon_name);
      }

      // Fetch all active icons
      const activeIconsResponse = await getActiveAppIcons(this.platform);
      if (activeIconsResponse.success && activeIconsResponse.icons) {
        this.activeIcons = activeIconsResponse.icons;
        await AsyncStorage.setItem(`app_icons_active_${this.platform}`, JSON.stringify(this.activeIcons));
        console.log('🎨 Updated active icons:', this.activeIcons.length);
      }

      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Failed to fetch current icons:', error);
    }
  }

  /**
   * Start periodic refresh of icons
   */
  startPeriodicRefresh() {
    // Refresh every 5 minutes
    setInterval(() => {
      this.fetchCurrentIcons();
    }, 5 * 60 * 1000);
  }

  /**
   * Get current app icon
   */
  getCurrentIcon(type = 'primary') {
    if (type === 'primary') {
      return this.currentIcon;
    }
    
    // Find icon by type
    return this.activeIcons.find(icon => icon.icon_type === type);
  }

  /**
   * Get all active icons
   */
  getActiveIcons() {
    return this.activeIcons;
  }

  /**
   * Get icon URL for specific type
   */
  getIconUrl(type = 'primary') {
    const icon = this.getCurrentIcon(type);
    return icon ? (icon.icon_url || icon.icon_path) : null;
  }

  /**
   * Check if icon should be updated
   */
  shouldUpdateIcon(newIcon) {
    if (!this.currentIcon) return true;
    
    // Check if new icon has higher priority
    if (newIcon.priority > this.currentIcon.priority) return true;
    
    // Check if current icon has expired
    if (this.currentIcon.end_date && new Date() > new Date(this.currentIcon.end_date)) {
      return true;
    }
    
    return false;
  }

  /**
   * Update current icon
   */
  async updateCurrentIcon(icon) {
    if (this.shouldUpdateIcon(icon)) {
      this.currentIcon = icon;
      await AsyncStorage.setItem(`app_icon_current_${this.platform}`, JSON.stringify(icon));
      console.log('🎨 Updated current icon to:', icon.icon_name);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Handle icon update from server
   */
  async handleIconUpdate(iconData) {
    const { action, icon } = iconData;
    
    switch (action) {
      case 'created':
      case 'updated':
        if (icon.icon_type === 'primary') {
          await this.updateCurrentIcon(icon);
        }
        await this.fetchCurrentIcons(); // Refresh all icons
        break;
        
      case 'activated':
        if (icon.icon_type === 'primary') {
          await this.updateCurrentIcon(icon);
        }
        await this.fetchCurrentIcons(); // Refresh all icons
        break;
        
      case 'deleted':
        await this.fetchCurrentIcons(); // Refresh all icons
        break;
        
      default:
        console.log('🎨 Unknown icon update action:', action);
    }
  }

  /**
   * Add listener for icon updates
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          currentIcon: this.currentIcon,
          activeIcons: this.activeIcons
        });
      } catch (error) {
        console.error('❌ Error in icon listener:', error);
      }
    });
  }

  /**
   * Get icon for specific use case
   */
  getIconForUseCase(useCase) {
    switch (useCase) {
      case 'app_launcher':
        return this.getCurrentIcon('primary');
      case 'notification':
        return this.getCurrentIcon('notification');
      case 'adaptive':
        return this.getCurrentIcon('adaptive');
      case 'round':
        return this.getCurrentIcon('round');
      case 'square':
        return this.getCurrentIcon('square');
      default:
        return this.getCurrentIcon('primary');
    }
  }

  /**
   * Check if icon is scheduled
   */
  isIconScheduled(icon) {
    if (!icon.start_date && !icon.end_date) return false;
    
    const now = new Date();
    const startDate = icon.start_date ? new Date(icon.start_date) : null;
    const endDate = icon.end_date ? new Date(icon.end_date) : null;
    
    if (startDate && now < startDate) return true;
    if (endDate && now > endDate) return true;
    
    return false;
  }

  /**
   * Get scheduled icons
   */
  getScheduledIcons() {
    return this.activeIcons.filter(icon => this.isIconScheduled(icon));
  }

  /**
   * Clear cached data
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(`app_icon_current_${this.platform}`);
      await AsyncStorage.removeItem(`app_icons_active_${this.platform}`);
      console.log('🗑️ Cleared app icon cache');
    } catch (error) {
      console.error('❌ Failed to clear icon cache:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      platform: this.platform,
      currentIcon: this.currentIcon ? this.currentIcon.icon_name : null,
      activeIconsCount: this.activeIcons.length,
      listenersCount: this.listeners.size
    };
  }
}

// Create singleton instance
const appIconService = new AppIconService();

export default appIconService; 