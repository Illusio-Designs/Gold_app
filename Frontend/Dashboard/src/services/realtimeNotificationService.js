import { getAdminNotifications } from './adminApiService';

class RealtimeNotificationService {
  constructor() {
    this.pollingInterval = null;
    this.isConnected = false;
    this.lastNotificationCount = 0;
    this.lastNotificationId = 0;
    this.lastNotificationTimestamp = 0; // Add missing timestamp property
    this.pollingIntervalMs = 5000; // Poll every 5 seconds for real-time feel
    this.processedNotifications = new Set(); // To prevent duplicate notifications
    this.notificationCache = new Map(); // To cache notifications
  }

  connect() {
    if (this.pollingInterval) {
      this.disconnect();
    }

    const token = localStorage.getItem('admin_token');
    if (!token) {
      console.log('[RealtimeNotificationService] No admin token found, cannot connect');
      return;
    }

    console.log('[RealtimeNotificationService] Starting real-time polling...');
    this.isConnected = true;
    
    // Start polling immediately
    this.pollForNotifications();
    
    // Set up continuous polling
    this.pollingInterval = setInterval(() => {
      this.pollForNotifications();
    }, this.pollingIntervalMs);
  }

  async pollForNotifications() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await getAdminNotifications(token);
      const notifications = response.notifications || [];
      
      console.log('[RealtimeNotificationService] Polled notifications:', notifications.length);
      console.log('[RealtimeNotificationService] Current notifications:', notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        is_read: n.is_read
      })));
      
      // Check for new notifications
      if (notifications.length > this.lastNotificationCount) {
        const newNotifications = notifications.slice(0, notifications.length - this.lastNotificationCount);
        
        console.log('[RealtimeNotificationService] Found new notifications:', newNotifications.length);
        console.log('[RealtimeNotificationService] New notifications:', newNotifications);
        
        // Process each new notification
        newNotifications.forEach(notification => {
          if (notification.id > this.lastNotificationId) {
            console.log('[RealtimeNotificationService] Processing new notification:', notification);
            this.handleNewNotification(notification);
            this.lastNotificationId = Math.max(this.lastNotificationId, notification.id);
          }
        });
      } else if (notifications.length === this.lastNotificationCount) {
        // Check for unread notifications that might be new
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length > 0) {
          const latestUnread = unreadNotifications[0];
          if (latestUnread.id > this.lastNotificationId) {
            console.log('[RealtimeNotificationService] Found new unread notification:', latestUnread);
            this.handleNewNotification(latestUnread);
            this.lastNotificationId = Math.max(this.lastNotificationId, latestUnread.id);
          }
        }
      }
      
      this.lastNotificationCount = notifications.length;
      
    } catch (error) {
      console.error('[RealtimeNotificationService] Polling error:', error);
    }
  }

  handleNewNotification(notification) {
    console.log('[RealtimeNotificationService] Processing new notification:', notification);
    
    // Filter out mobile-only notifications for dashboard
    if (this.shouldSkipNotification(notification)) {
      console.log('[RealtimeNotificationService] Skipping mobile-only notification:', notification.type);
      return;
    }
    
    // Check if we've already processed this notification to prevent duplicates
    if (this.processedNotifications.has(notification.id)) {
      console.log('[RealtimeNotificationService] Skipping duplicate notification:', notification.id);
      return;
    }
    
    // Mark as processed
    this.processedNotifications.add(notification.id);
    
    // Keep only last 100 processed notifications to prevent memory leaks
    if (this.processedNotifications.size > 100) {
      const firstItem = this.processedNotifications.values().next().value;
      this.processedNotifications.delete(firstItem);
    }
    
    // Play notification sound
    this.playNotificationSound();
    
    // Show toast notification immediately
    console.log('[RealtimeNotificationService] Dispatching show-toast event');
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { notification: notification }
    }));
    
    // Update notification count (trigger refresh)
    window.dispatchEvent(new CustomEvent('notification-updated'));
    
    // Also trigger a custom event for login requests specifically
    if (notification.type === 'login_request' || notification.data?.notificationType === 'login_request') {
      console.log('[RealtimeNotificationService] Dispatching login-request event');
      window.dispatchEvent(new CustomEvent('login-request', {
        detail: { 
          phoneNumber: notification.data?.phoneNumber || notification.data?.userName || notification.user_name,
          categoryIds: notification.data?.categoryIds || notification.data?.categoryIds || []
        }
      }));
    }
  }

  // Filter out mobile-only notifications for dashboard
  shouldSkipNotification(notification) {
    // Skip mobile app specific notifications
    const mobileOnlyTypes = [
      'login_approved',
      'login_rejected', 
      'new_order',
      'order_status_updated',
      'cart_updated',
      'product_added_to_cart'
    ];
    
    // Skip notifications meant for business users (mobile app)
    if (mobileOnlyTypes.includes(notification.type)) {
      return true;
    }
    
    // Skip notifications with mobile-specific actions
    if (notification.data?.action) {
      const mobileActions = [
        'redirect_to_home',
        'force_logout',
        'view_order',
        'view_cart'
      ];
      
      if (mobileActions.includes(notification.data.action)) {
        return true;
      }
    }
    
    // Only show admin-relevant notifications
    const adminRelevantTypes = [
      'login_request',
      'admin_notification',
      'system_alert',
      'user_registered'
    ];
    
    return !adminRelevantTypes.includes(notification.type);
  }

  playNotificationSound() {
    try {
      // Create audio context for beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      oscillator.type = 'sine';
      
      // Configure volume
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('[RealtimeNotificationService] Notification sound played successfully');
    } catch (error) {
      console.log('[RealtimeNotificationService] Could not play notification sound:', error);
    }
  }

  disconnect() {
    if (this.pollingInterval) {
      console.log('[RealtimeNotificationService] Stopping real-time polling');
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isConnected = false;
      
      // Clear processed notifications and cache to prevent stale state
      this.processedNotifications.clear();
      this.notificationCache.clear();
      this.lastNotificationTimestamp = 0;
      this.lastNotificationId = 0;
      this.lastNotificationCount = 0;
    }
  }

  // Method to clear notification cache manually
  clearCache() {
    this.processedNotifications.clear();
    this.notificationCache.clear();
    this.lastNotificationTimestamp = 0;
    this.lastNotificationId = 0;
    this.lastNotificationCount = 0;
    console.log('[RealtimeNotificationService] Notification cache cleared manually');
  }

  // Method to reset the service state
  reset() {
    this.disconnect();
    this.connect();
  }

  isConnected() {
    return this.isConnected;
  }


}

export default new RealtimeNotificationService(); 