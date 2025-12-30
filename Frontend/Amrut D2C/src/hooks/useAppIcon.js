import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import appIconService from '../services/AppIconService';
import socketService from '../services/SocketService';

/**
 * Hook for managing dynamic app icons
 * @param {Object} options - Configuration options
 * @param {string} options.type - Icon type (primary, notification, adaptive, round, square)
 * @param {string} options.useCase - Use case (app_launcher, notification, etc.)
 * @param {boolean} options.autoInitialize - Whether to auto-initialize the service
 * @param {boolean} options.enableRealTime - Whether to enable real-time updates
 * @returns {Object} Icon data and methods
 */
export const useAppIcon = (options = {}) => {
  const {
    type = 'primary',
    useCase = 'app_launcher',
    autoInitialize = true,
    enableRealTime = true
  } = options;

  const [currentIcon, setCurrentIcon] = useState(null);
  const [activeIcons, setActiveIcons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the service
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await appIconService.initialize();
      setIsInitialized(true);
      
      // Get initial data
      const icon = appIconService.getCurrentIcon(type);
      const icons = appIconService.getActiveIcons();
      
      setCurrentIcon(icon);
      setActiveIcons(icons);
      
      console.log('🎨 App Icon Hook initialized for type:', type);
    } catch (err) {
      console.error('❌ Failed to initialize app icon hook:', err);
      setError(err.message || 'Failed to initialize app icon service');
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  // Handle icon updates
  const handleIconUpdate = useCallback((iconData) => {
    const { currentIcon: newCurrentIcon, activeIcons: newActiveIcons } = iconData;
    
    setCurrentIcon(newCurrentIcon);
    setActiveIcons(newActiveIcons);
  }, []);

  // Handle real-time updates from socket
  const handleSocketUpdate = useCallback(async (data) => {
    if (data.event === 'app-icon-update') {
      console.log('🎨 Received real-time icon update:', data);
      await appIconService.handleIconUpdate(data.data);
    }
  }, []);

  // Get icon for specific use case
  const getIconForUseCase = useCallback((specificUseCase = useCase) => {
    return appIconService.getIconForUseCase(specificUseCase);
  }, [useCase]);

  // Get icon URL
  const getIconUrl = useCallback((iconType = type) => {
    return appIconService.getIconUrl(iconType);
  }, [type]);

  // Refresh icons from server
  const refreshIcons = useCallback(async () => {
    try {
      setIsLoading(true);
      await appIconService.fetchCurrentIcons();
    } catch (err) {
      console.error('❌ Failed to refresh icons:', err);
      setError(err.message || 'Failed to refresh icons');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await appIconService.clearCache();
      console.log('🗑️ App icon cache cleared');
    } catch (err) {
      console.error('❌ Failed to clear icon cache:', err);
    }
  }, []);

  // Get service status
  const getStatus = useCallback(() => {
    return appIconService.getStatus();
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize, initialize]);

  // Set up real-time updates
  useEffect(() => {
    if (!isInitialized || !enableRealTime) return;

    // Add listener for icon updates
    const removeListener = appIconService.addListener(handleIconUpdate);
    
    // Add socket listener for real-time updates
    const removeSocketListener = socketService.addListener(handleSocketUpdate);

    return () => {
      removeListener();
      removeSocketListener();
    };
  }, [isInitialized, enableRealTime, handleIconUpdate, handleSocketUpdate]);

  return {
    // State
    currentIcon,
    activeIcons,
    isLoading,
    error,
    isInitialized,
    
    // Methods
    initialize,
    refreshIcons,
    clearCache,
    getStatus,
    getIconForUseCase,
    getIconUrl,
    
    // Computed values
    iconUrl: getIconUrl(),
    platform: Platform.OS,
    hasIcon: !!currentIcon,
    iconName: currentIcon?.icon_name || null,
    iconPath: currentIcon?.icon_path || null,
    iconUrl: currentIcon?.icon_url || null,
    isActive: currentIcon?.is_active || false,
    priority: currentIcon?.priority || 0,
    startDate: currentIcon?.start_date || null,
    endDate: currentIcon?.end_date || null,
    
    // Utility methods
    isScheduled: currentIcon ? appIconService.isIconScheduled(currentIcon) : false,
    getScheduledIcons: () => appIconService.getScheduledIcons(),
    shouldUpdate: (newIcon) => appIconService.shouldUpdateIcon(newIcon)
  };
};

/**
 * Hook for app launcher icon specifically
 */
export const useAppLauncherIcon = () => {
  return useAppIcon({ type: 'primary', useCase: 'app_launcher' });
};

/**
 * Hook for notification icon specifically
 */
export const useNotificationIcon = () => {
  return useAppIcon({ type: 'notification', useCase: 'notification' });
};

/**
 * Hook for adaptive icon specifically (Android)
 */
export const useAdaptiveIcon = () => {
  return useAppIcon({ type: 'adaptive', useCase: 'adaptive' });
};

/**
 * Hook for round icon specifically
 */
export const useRoundIcon = () => {
  return useAppIcon({ type: 'round', useCase: 'round' });
};

/**
 * Hook for square icon specifically
 */
export const useSquareIcon = () => {
  return useAppIcon({ type: 'square', useCase: 'square' });
};

/**
 * Hook for all app icons
 */
export const useAllAppIcons = () => {
  const [allIcons, setAllIcons] = useState({
    primary: null,
    notification: null,
    adaptive: null,
    round: null,
    square: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllIcons = async () => {
      try {
        setIsLoading(true);
        await appIconService.initialize();
        
        const icons = {
          primary: appIconService.getCurrentIcon('primary'),
          notification: appIconService.getCurrentIcon('notification'),
          adaptive: appIconService.getCurrentIcon('adaptive'),
          round: appIconService.getCurrentIcon('round'),
          square: appIconService.getCurrentIcon('square')
        };
        
        setAllIcons(icons);
      } catch (err) {
        console.error('❌ Failed to load all icons:', err);
        setError(err.message || 'Failed to load icons');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllIcons();
  }, []);

  return {
    icons: allIcons,
    isLoading,
    error,
    refresh: () => appIconService.fetchCurrentIcons()
  };
}; 