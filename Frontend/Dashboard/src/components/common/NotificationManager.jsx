import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminNotifications, getUnreadCount, markNotificationAsRead } from '../../services/adminApiService';
import notificationSoundService from '../../services/notificationSoundService';
import '../../styles/common/NotificationManager.css';

const NotificationManager = ({ isDropdown = false, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    console.log('🔔 [FRONTEND] Starting fetchNotifications...');
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.log('⚠️ [FRONTEND] No admin token found');
        return;
      }
      
      console.log('🔔 [FRONTEND] Fetching notifications with token:', token.substring(0, 20) + '...');
      const response = await getAdminNotifications(token);
      console.log('🔔 [FRONTEND] Notifications API response:', response);
      console.log('🔔 [FRONTEND] Setting notifications:', response.notifications || []);
      
      // Debug: Log each notification's data structure
      if (response.notifications && response.notifications.length > 0) {
        console.log('🔍 [FRONTEND] First notification data structure:', response.notifications[0]);
        console.log('🔍 [FRONTEND] Business name:', response.notifications[0].business_name);
        console.log('🔍 [FRONTEND] User name:', response.notifications[0].user_name);
        console.log('🔍 [FRONTEND] Data object:', response.notifications[0].data);
      }
      
      const newNotifications = response.notifications || [];
      const previousCount = notifications.length;
      
      console.log('🔔 [FRONTEND] Notification counts - Previous:', previousCount, 'New:', newNotifications.length);
      
      // Check if there are new notifications
      if (newNotifications.length > previousCount) {
        console.log('🎉 [FRONTEND] New notifications detected in NotificationManager!');
        
        // Note: Real-time service will handle sound and toast, so we don't duplicate here
        // This prevents double notifications when both services are running
      }
      
      setNotifications(newNotifications);
    } catch (error) {
      console.error('❌ [FRONTEND] Failed to fetch notifications:', error);
      console.error('❌ [FRONTEND] Error details:', error.response?.data || error.message);
    }
  };

  const fetchUnreadCount = async () => {
    console.log('🔔 [FRONTEND] Starting fetchUnreadCount...');
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.log('⚠️ [FRONTEND] No admin token found for unread count');
        return;
      }
      
      const response = await getUnreadCount(token);
      console.log('🔔 [FRONTEND] Unread count response:', response);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('❌ [FRONTEND] Failed to fetch unread count:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        const token = localStorage.getItem('admin_token');
        await markNotificationAsRead(notification.id, token);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Update parent component's unread count
        if (onNotificationUpdate) {
          onNotificationUpdate();
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    // Handle navigation based on notification type
    const notificationType = notification.type || notification.data?.notificationType;
    
    switch (notificationType) {
      case 'user_registration':
        console.log('[NotificationManager] Navigating to users page...');
        navigate('/dashboard/users');
        break;
        
      case 'login_request':
        console.log('[NotificationManager] Navigating to login requests page...');
        navigate('/dashboard/login-requests');
        break;
        
      case 'new_order':
        console.log('[NotificationManager] Navigating to orders page...');
        navigate('/dashboard/orders');
        break;
        
      default:
        console.log('No specific navigation for notification type:', notificationType);
        break;
    }
  };

  // Play notification sound using the sound service
  const playNotificationSound = (notificationType) => {
    notificationSoundService.playSound(notificationType);
  };

  // Check for new notifications and play sounds
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const notificationTime = new Date(latestNotification.created_at).getTime();
      const currentTime = Date.now();
      
      // If notification is less than 5 seconds old, play sound
      if (currentTime - notificationTime < 5000) {
        const notificationType = latestNotification.type || latestNotification.data?.notificationType;
        playNotificationSound(notificationType);
      }
    }
  }, [notifications]);

  // Test sound on first render when dropdown opens
  useEffect(() => {
    if (isDropdown && notifications.length > 0) {
      console.log('Testing sound on dropdown open...');
      notificationSoundService.testSound('default');
    }
  }, [isDropdown, notifications.length]);

  // If not dropdown, just show empty div (badge moved to profile dropdown)
  if (!isDropdown) {
    return <div className="notification-bell"></div>;
  }

  // If dropdown, show the full notification list
  console.log('Rendering notification dropdown, notifications:', notifications.length, 'unread:', unreadCount);
  
  return (
    <div className="notification-dropdown-content">
      <div className="notification-header">
        <h3>Notifications</h3>
        <span className="business-name">Amrut Jewels</span>
      </div>
      <div className="notification-list">
        {loading ? (
          <div className="loading-notifications">
            <p>Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => {
            const notificationType = notification.type || notification.data?.notificationType;
            const notificationIcon = notification.data?.icon || '🔔';
            const notificationColor = notification.data?.color || '#5D0829';
            
            return (
              <div
                key={notification.id}
                className={`notification-item${!notification.is_read ? ' unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ borderLeftColor: notificationColor }}
              >
                <div className="notification-icon" style={{ color: notificationColor }}>
                  {notificationIcon}
                </div>
                <div className="notification-content">
                  <div className="notification-header-info">
                    <span className="notification-title">{notification.title}</span>
                    {(notification.business_name || notification.data?.businessName) && (
                      <span className="business-name-small">
                        {notification.business_name || notification.data?.businessName}
                      </span>
                    )}
                  </div>
                  {(notification.user_name || notification.data?.userName) && (
                    <span className="user-name">
                      {notification.user_name || notification.data?.userName}
                    </span>
                  )}
                  {notification.message && (
                    <span className="notification-message">{notification.message}</span>
                  )}
                  <span className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
                {!notification.is_read && (
                  <div className="unread-indicator" style={{ backgroundColor: notificationColor }}></div>
                )}
              </div>
            );
          })
        )}
      </div>
      {notifications.length > 10 && (
        <div className="notification-footer">
          <button className="view-all-btn">View All Notifications</button>
        </div>
      )}
    </div>
  );
};

export default NotificationManager; 