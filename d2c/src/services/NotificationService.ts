import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from './Api';
import Toast from 'react-native-toast-message';

class NotificationService {
  private static instance: NotificationService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private isAuthenticated = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    console.log('[NotificationService] Initializing...');

    await this.checkAuthenticationStatus();
  }

  private async checkAuthenticationStatus() {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');

      // Check if user is authenticated
      if (userId && token) {
        this.isAuthenticated = true;
        console.log('[NotificationService] User authenticated, starting polling...');
        await this.startPolling();
      } else {
        console.log('[NotificationService] User not authenticated, skipping notification service');
        this.isAuthenticated = false;
        await this.stopPolling();
      }
    } catch (error: any) {
      console.error('[NotificationService] Error checking authentication:', error);
      this.isAuthenticated = false;
      await this.stopPolling();
    }
  }

  async startPolling() {
    if (this.isPolling || !this.isAuthenticated) {
      console.log('[NotificationService] Already polling or not authenticated, skipping...');
      return;
    }

    this.isPolling = true;
    console.log('[NotificationService] Starting notification polling...');

    // Poll immediately
    await this.checkForNotifications();

    // Then poll every 30 seconds
    this.pollingInterval = setInterval(async () => {
      await this.checkForNotifications();
    }, 30000);
  }

  async stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('[NotificationService] Stopped polling');
  }

  // Method to start notification service when user logs in
  async onUserLogin() {
    console.log('[NotificationService] User logged in, starting notification service...');
    await this.checkAuthenticationStatus();
  }

  // Method to stop notification service when user logs out
  async onUserLogout() {
    console.log('[NotificationService] User logged out, stopping notification service...');
    this.isAuthenticated = false;
    await this.stopPolling();
    // Clear notification count
    await AsyncStorage.removeItem('unreadNotificationCount');
  }

  private async checkForNotifications() {
    try {
      // Re-check authentication before each poll
      await this.checkAuthenticationStatus();
      
      if (!this.isAuthenticated) {
        console.log('[NotificationService] User not authenticated, skipping notification check');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');

      if (!userId || !token) {
        console.log('[NotificationService] Missing userId or token, stopping polling');
        this.isAuthenticated = false;
        await this.stopPolling();
        return;
      }

      console.log(`[NotificationService] Checking notifications for user ID: ${userId}`);

      // Get unread count
      const unreadResponse = await getUnreadCount(userId, token);
      const currentUnreadCount = unreadResponse.unreadCount || 0;
      console.log(`[NotificationService] Current unread count: ${currentUnreadCount}`);

      // Get previous unread count from storage
      const previousUnreadCount = await AsyncStorage.getItem('unreadNotificationCount');
      const previousCount = previousUnreadCount ? parseInt(previousUnreadCount) : 0;
      console.log(`[NotificationService] Previous unread count: ${previousCount}`);

      // If there are new notifications, get them and show
      if (currentUnreadCount > previousCount) {
        console.log(`[NotificationService] New notifications detected: ${currentUnreadCount - previousCount}`);
        console.log(`[NotificationService] Previous count: ${previousCount}, Current count: ${currentUnreadCount}`);
        
        const notificationsResponse = await getUserNotifications(userId, token);
        const notifications = notificationsResponse.notifications || [];
        console.log(`[NotificationService] Total notifications received: ${notifications.length}`);

        // Get only unread notifications
        const unreadNotifications = notifications.filter((n: any) => !n.is_read);
        console.log(`[NotificationService] Unread notifications: ${unreadNotifications.length}`);
        
        // Log all unread notifications for debugging
        unreadNotifications.forEach((n: any, index: number) => {
          console.log(`[NotificationService] Unread notification ${index + 1}:`, {
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            is_read: n.is_read,
            created_at: n.created_at
          });
        });

        // Show the most recent unread notification
        if (unreadNotifications.length > 0) {
          const latestNotification = unreadNotifications[0];
          console.log('[NotificationService] Showing latest notification:', latestNotification);
          console.log('[NotificationService] Notification type:', latestNotification.type);
          console.log('[NotificationService] Notification title:', latestNotification.title);
          console.log('[NotificationService] Notification body:', latestNotification.body);
          console.log('[NotificationService] Notification data:', latestNotification.data);
          await this.showNotification(latestNotification);
        }

        // Update stored count
        await AsyncStorage.setItem('unreadNotificationCount', currentUnreadCount.toString());
        console.log(`[NotificationService] Updated stored unread count to: ${currentUnreadCount}`);
      } else {
        console.log(`[NotificationService] No new notifications (current: ${currentUnreadCount}, previous: ${previousCount})`);
        console.log(`[NotificationService] Checking if there are any unread notifications to show...`);
        
        // Even if count hasn't changed, check if there are unread notifications to show
        const notificationsResponse = await getUserNotifications(userId, token);
        const notifications = notificationsResponse.notifications || [];
        const unreadNotifications = notifications.filter((n: any) => !n.is_read);
        
        if (unreadNotifications.length > 0) {
          console.log(`[NotificationService] Found ${unreadNotifications.length} unread notifications, showing latest...`);
          const latestNotification = unreadNotifications[0];
          await this.showNotification(latestNotification);
        }
      }
    } catch (error: any) {
      console.error('[NotificationService] Error checking notifications:', error);
      
      // If we get an authentication error, stop polling
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[NotificationService] Authentication error, stopping polling');
        this.isAuthenticated = false;
        await this.stopPolling();
      }
    }
  }

  private async showNotification(notification: any) {
    try {
      console.log('[NotificationService] Showing notification:', {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        data: notification.data,
        is_read: notification.is_read,
        created_at: notification.created_at
      });

      // Determine toast type based on notification type
      let toastType = 'info'; // default
      
      console.log('[NotificationService] Processing notification type:', notification.type);
      console.log('[NotificationService] Available types: login_approved, login_rejected, login_request');
      
      if (notification.type === 'login_approved') {
        toastType = 'success';
        console.log('[NotificationService] Matched login_approved -> success toast');
      } else if (notification.type === 'login_rejected') {
        toastType = 'error';
        console.log('[NotificationService] Matched login_rejected -> error toast');
      } else if (notification.type === 'login_request') {
        toastType = 'info';
        console.log('[NotificationService] Matched login_request -> info toast');
      } else {
        console.log('[NotificationService] Unknown notification type, using default info toast');
      }

      // Show a custom toast notification
      Toast.show({
        type: toastType,
        text1: notification.title,
        text2: notification.body,
        position: 'top',
        autoHide: true,
        visibilityTime: 5000, // Increased time for important notifications
      });
      
      console.log(`[NotificationService] Toast notification triggered successfully with type: ${toastType}`);
    } catch (error: any) {
      console.error('[NotificationService] Error showing notification:', error);
    }
  }

  private async handleNotificationTap(notification: any) {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');

      if (!userId || !token) {
        console.log('[NotificationService] No user ID or token for notification tap');
        return;
      }

      // Mark notification as read
      await markNotificationAsRead(notification.id, token);

      // Handle navigation based on notification data
      if (notification.data && notification.data.action) {
        switch (notification.data.action) {
          case 'redirect_to_home':
            // Navigate to home screen
            console.log('[NotificationService] Redirecting to home screen');
            // You would typically use navigation here
            // navigation.navigate('Home');
            break;
          case 'redirect_to_login':
            // Navigate to login screen
            console.log('[NotificationService] Redirecting to login screen');
            // You would typically use navigation here
            // navigation.navigate('Login');
            break;
          default:
            console.log('[NotificationService] Unknown action:', notification.data.action);
        }
      }
    } catch (error: any) {
      console.error('[NotificationService] Error handling notification tap:', error);
    }
  }

  async markAllAsRead() {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');

      if (!userId || !token) {
        console.log('[NotificationService] No user ID or token for mark all as read');
        return;
      }

      await markAllNotificationsAsRead(userId, token);
      await AsyncStorage.setItem('unreadNotificationCount', '0');
      console.log('[NotificationService] All notifications marked as read');
    } catch (error: any) {
      console.error('[NotificationService] Error marking all as read:', error);
    }
  }

  async getNotifications() {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');

      if (!userId || !token) {
        console.log('[NotificationService] No user ID or token for get notifications');
        return [];
      }

      const response = await getUserNotifications(userId, token);
      return response.notifications || [];
    } catch (error: any) {
      console.error('[NotificationService] Error getting notifications:', error);
      return [];
    }
  }
}

export default NotificationService; 