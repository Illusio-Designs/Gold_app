import { io } from 'socket.io-client';
import { BASE_URL } from './Api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3; // Reduced from 5 to 3
    this.reconnectDelay = 2000; // Increased from 1 second to 2 seconds
    this.isReconnecting = false; // Prevent multiple simultaneous reconnection attempts
    this.connectionTimeout = null; // Track connection timeout
    this.isInitializing = false; // Prevent multiple simultaneous initialization attempts
  }

  /**
   * Check if backend server is reachable
   */
  async checkServerHealth() {
    try {
      const serverUrl = BASE_URL.replace('/api', '');
      const response = await fetch(`${serverUrl}/api/health`, { 
        method: 'GET',
        timeout: 5000 
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Connect to Socket.IO server
   * @param {string} token - Authentication token (optional)
   */
  async connect(token = null) {
    // Check if WebSocket connections are disabled
    if (process.env.DISABLE_WEBSOCKET === 'true') {
      return;
    }

    if (this.socket && this.isConnected) {
      return;
    }

    if (this.isReconnecting) {
      return;
    }

    if (this.isInitializing) {
      return;
    }

    // Check if we've reached max reconnection attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    // Check server health before attempting connection
    const isServerHealthy = await this.checkServerHealth();
    if (!isServerHealthy) {
      return;
    }

    this.isInitializing = true;

    try {
      // Create socket connection
      const serverUrl = BASE_URL.replace('/api', '');
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000, // Reduced timeout to 10 seconds
        forceNew: true,
        reconnection: false, // Disable automatic reconnection
        reconnectionAttempts: 0,
        reconnectionDelay: 0
      });

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.cleanup();
        }
      }, 15000); // 15 second total timeout

      this.setupEventHandlers();
      
      // Authenticate if token provided
      if (token) {
        this.authenticate(token);
      }

    } catch (error) {
      console.error('[SocketService] Connection error:', error);
      this.cleanup();
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

         // Connection events
     this.socket.on('connect', () => {
       this.isConnected = true;
       this.isInitializing = false;
       this.reconnectAttempts = 0;
       this.reconnectDelay = 1000;
     });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Attempt to reconnect if not manually disconnected and not at max attempts
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.isReconnecting = false;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Only attempt reconnection if not at max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else {
        this.isReconnecting = false;
      }
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
    });

    this.socket.on('authentication_error', (error) => {
      console.error('[SocketService] Authentication failed:', error);
    });

    // Real-time data events
    this.socket.on('category-update', (data) => {
      this.emitToListeners('category-update', data);
    });

    this.socket.on('product-update', (data) => {
      this.emitToListeners('product-update', data);
    });

    this.socket.on('order-update', (data) => {
      this.emitToListeners('order-update', data);
    });

    this.socket.on('cart-update', (data) => {
      this.emitToListeners('cart-update', data);
    });

    // Specific order events
    this.socket.on('order-created', (data) => {
      this.emitToListeners('order-created', data);
    });

    this.socket.on('order-status-updated', (data) => {
      this.emitToListeners('order-status-updated', data);
    });

    this.socket.on('orders-created-from-cart', (data) => {
      this.emitToListeners('orders-created-from-cart', data);
    });

    // Specific cart events
    this.socket.on('cart-item-added', (data) => {
      this.emitToListeners('cart-item-added', data);
    });

    this.socket.on('cart-item-updated', (data) => {
      this.emitToListeners('cart-item-updated', data);
    });

    this.socket.on('cart-item-removed', (data) => {
      this.emitToListeners('cart-item-removed', data);
    });

    this.socket.on('cart-cleared', (data) => {
      this.emitToListeners('cart-cleared', data);
    });

    // User and app events
    this.socket.on('user-update', (data) => {
      this.emitToListeners('user-update', data);
    });

    this.socket.on('app-version-update', (data) => {
      this.emitToListeners('app-version-update', data);
    });

    this.socket.on('app-icon-update', (data) => {
      this.emitToListeners('app-icon-update', data);
    });

    // Slider updates
    this.socket.on('slider-update', (data) => {
      this.emitToListeners('slider-update', data);
    });

         // User notification events
     this.socket.on('registration-status-change', (data) => {
       console.log('[SocketService] Event details:', {
         action: data.action,
         user: data.user,
         type: data.type,
         timestamp: data.timestamp
       });
       this.emitToListeners('registration-status-change', data);
     });

    this.socket.on('login-request-status-change', (data) => {
      this.emitToListeners('login-request-status-change', data);
    });

         // User room events
     this.socket.on('user-room-joined', (data) => {
       console.log('[SocketService] Room details:', {
         success: data.success,
         room: data.room,
         timestamp: data.timestamp
       });
       this.emitToListeners('user-room-joined', data);
     });
  }

  /**
   * Attempt to reconnect to the server
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.isReconnecting = false;
      return;
    }

    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Authenticate with the server
   * @param {string} token - Authentication token
   */
  authenticate(token) {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', { token });
    }
  }

  /**
   * Join a room
   * @param {string} room - Room name
   */
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', room);
    }
  }

     /**
    * Join user room for receiving user-specific notifications
    * @param {Object} userData - User data (id, name, etc.)
    */
   joinUserRoom(userData) {
     if (this.socket && this.isConnected) {
       
       this.socket.emit('join-user-room', userData);
     } else {
       console.warn(`[SocketService] ⚠️ Cannot join user room - socket not ready:`, {
         hasSocket: !!this.socket,
         isConnected: this.isConnected
       });
     }
   }

  /**
   * Leave a room
   * @param {string} room - Room name
   */
  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', room);
    }
  }

  /**
   * Clean up socket connection and reset state
   */
  cleanup() {
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Disconnect socket if it exists
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Reset state
    this.isConnected = false;
    this.isReconnecting = false;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
    
  }

  /**
   * Reset the service and allow new connection attempts
   */
  reset() {
    this.cleanup();
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasSocket: !!this.socket
    };
  }

  /**
   * Check if service is healthy and can attempt connections
   */
  isHealthy() {
    return this.reconnectAttempts < this.maxReconnectAttempts && !this.isReconnecting;
  }

  /**
   * Temporarily disable WebSocket connections (useful for debugging)
   */
  disable() {
    this.cleanup();
    this.maxReconnectAttempts = 0;
  }

  /**
   * Re-enable WebSocket connections
   */
  enable() {
    this.maxReconnectAttempts = 3;
    this.reconnectAttempts = 0;
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.cleanup();
  }

  /**
   * Emit an event to the server
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[SocketService] Cannot emit event - socket not connected');
    }
  }

     /**
    * Add event listener
    * @param {string} event - Event name
    * @param {Function} callback - Callback function
    * @returns {string} - Listener ID for removal
    */
   addEventListener(event, callback) {
     const listenerId = `${event}_${Date.now()}_${Math.random()}`;
     
     if (!this.eventListeners.has(event)) {
       this.eventListeners.set(event, new Map());
     }
     
     this.eventListeners.get(event).set(listenerId, callback);
     
     return listenerId;
   }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {string} listenerId - Listener ID
   */
  removeEventListener(event, listenerId) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(listenerId);
    }
  }

     /**
    * Emit event to all listeners
    * @param {string} event - Event name
    * @param {any} data - Event data
    */
   emitToListeners(event, data) {
     
     if (this.eventListeners.has(event)) {
       this.eventListeners.get(event).forEach((callback, listenerId) => {
         try {
           callback(data);
         } catch (error) {
           console.error(`[SocketService] ❌ Error in listener ${listenerId}:`, error);
         }
       });
     } else {
       console.warn(`[SocketService] ⚠️ No listeners found for event: ${event}`);
     }
   }

  /**
   * Get socket ID
   * @returns {string|null} - Socket ID
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Export singleton instance
export default new SocketService(); 