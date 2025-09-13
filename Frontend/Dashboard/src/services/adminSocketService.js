import { io } from 'socket.io-client';

class AdminSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.adminData = null;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Initialize connection to the WebSocket server
   * @param {string} serverUrl - WebSocket server URL
   * @param {Object} adminData - Admin user data
   */
  connect(serverUrl = 'http://10.106.29.15:3001', adminData = null) {
    if (this.socket && this.isConnected) {
      console.log('🔌 [ADMIN SOCKET] Already connected');
      return;
    }

    try {
      console.log('🔌 [ADMIN SOCKET] Connecting to:', serverUrl);
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.adminData = adminData;
      this.setupEventHandlers();
      
      console.log('🔌 [ADMIN SOCKET] Connection initiated');
    } catch (error) {
      console.error('❌ [ADMIN SOCKET] Connection error:', error);
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ [ADMIN SOCKET] Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join admin room if admin data is available
      if (this.adminData) {
        this.joinAdminRoom();
      }
      
      this.emit('admin-connection', {
        adminId: this.adminData?.id,
        adminName: this.adminData?.name,
        timestamp: new Date().toISOString()
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ [ADMIN SOCKET] Disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [ADMIN SOCKET] Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [ADMIN SOCKET] Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      
      // Rejoin admin room after reconnection
      if (this.adminData) {
        this.joinAdminRoom();
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ [ADMIN SOCKET] Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ [ADMIN SOCKET] Reconnection failed after', this.maxReconnectAttempts, 'attempts');
    });

    // Admin room events
    this.socket.on('admin-room-joined', (data) => {
      console.log('✅ [ADMIN SOCKET] Joined admin room:', data);
      this.triggerEvent('admin-room-joined', data);
    });

    // Notification events
    this.socket.on('new-user-registration', (data) => {
      console.log('🔔 [ADMIN SOCKET] New user registration notification:', data);
      this.triggerEvent('new-user-registration', data);
      this.showNotification(data);
    });

    this.socket.on('user-registration', (data) => {
      console.log('🔔 [ADMIN SOCKET] User registration update:', data);
      this.triggerEvent('user-registration', data);
    });

    this.socket.on('test-notification', (data) => {
      console.log('🧪 [ADMIN SOCKET] Test notification:', data);
      this.triggerEvent('test-notification', data);
      this.showNotification(data);
    });

    // General user updates
    this.socket.on('user-update', (data) => {
      console.log('👤 [ADMIN SOCKET] User update:', data);
      this.triggerEvent('user-update', data);
    });

    // Order updates
    this.socket.on('order-update', (data) => {
      console.log('🛒 [ADMIN SOCKET] Order update:', data);
      this.triggerEvent('order-update', data);
    });

    // Product updates
    this.socket.on('product-update', (data) => {
      console.log('📦 [ADMIN SOCKET] Product update:', data);
      this.triggerEvent('product-update', data);
    });

    // Category updates
    this.socket.on('category-update', (data) => {
      console.log('📂 [ADMIN SOCKET] Category update:', data);
      this.triggerEvent('category-update', data);
    });
  }

  /**
   * Join admin room
   */
  joinAdminRoom() {
    if (!this.socket || !this.isConnected || !this.adminData) {
      console.log('⚠️ [ADMIN SOCKET] Cannot join admin room - not ready');
      return;
    }

    console.log('🔌 [ADMIN SOCKET] Joining admin room with data:', this.adminData);
    this.socket.emit('join-admin-room', this.adminData);
  }

  /**
   * Set admin data and join admin room
   * @param {Object} adminData - Admin user data
   */
  setAdminData(adminData) {
    this.adminData = adminData;
    if (this.isConnected) {
      this.joinAdminRoom();
    }
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {any} data - Data to emit
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      console.log('📤 [ADMIN SOCKET] Emitted:', event, data);
    } else {
      console.warn('⚠️ [ADMIN SOCKET] Cannot emit - not connected');
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Trigger event for all listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  triggerEvent(event, data) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ [ADMIN SOCKET] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Show browser notification
   * @param {Object} data - Notification data
   */
  showNotification(data) {
    if (!('Notification' in window)) {
      console.log('⚠️ [ADMIN SOCKET] Browser notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(data.title || 'New Notification', {
        body: data.message || data.body || 'You have a new notification',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data.type || 'notification',
        data: data
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Trigger custom click event
        this.triggerEvent('notification-clicked', { notification, data });
      };
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification(data);
        }
      });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 [ADMIN SOCKET] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  /**
   * Get connection status
   * @returns {boolean} - Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get admin data
   * @returns {Object|null} - Admin data
   */
  getAdminData() {
    return this.adminData;
  }
}

// Export singleton instance
export default new AdminSocketService();
