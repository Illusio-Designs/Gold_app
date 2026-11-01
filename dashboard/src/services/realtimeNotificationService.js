import { getAdminNotifications } from './adminApiService';
import notificationSoundService from './notificationSoundService';

class RealtimeNotificationService {
  constructor() {
    this.pollingInterval = null;
    this.isConnected = false;
    this.lastNotificationCount = 0;
    this.lastNotificationId = 0;
    this.lastNotificationTimestamp = 0; // Add missing timestamp property
    this.pollingIntervalMs = 30000; // Poll every 30s (5s hammered the API 12x/min)
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
    
    // Play notification sound — the order sound for any order notification,
    // otherwise the type's sound (falls back to a beep if the file is missing).
    notificationSoundService.playSound(notification.type);
    
    // Show toast notification immediately
    console.log('[RealtimeNotificationService] Dispatching show-toast event');
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { notification: notification }
    }));
    
    // Update notification count (trigger refresh)
    window.dispatchEvent(new CustomEvent('notification-updated'));
  }

  // Decide whether a notification is relevant to the admin dashboard.
  // Orders (any order-* type) are always surfaced — the admin needs to hear
  // every new order. Registrations and admin/system alerts are shown too;
  // mobile-app-only chatter (login/cart) is skipped.
  shouldSkipNotification(notification) {
    const type = String(notification?.type || '').toLowerCase();

    // Always surface orders (new order, status change, etc.).
    if (type.includes('order')) return false;

    const adminRelevantTypes = [
      'user_registered',
      'user_registration',
      'admin_notification',
      'system_alert',
    ];
    if (adminRelevantTypes.includes(type)) return false;

    // Everything else (login_approved/rejected, cart_updated, etc.) is
    // mobile-app chatter and is skipped on the dashboard.
    return true;
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

  getConnectionStatus() {
    return this.isConnected;
  }


}

export default new RealtimeNotificationService(); 