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
      console.log('[SocketService] Server health check failed:', error.message);
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
      console.log('[SocketService] WebSocket connections are disabled via environment variable');
      return;
    }

    if (this.socket && this.isConnected) {
      console.log('[SocketService] Already connected');
      return;
    }

    if (this.isReconnecting) {
      console.log('[SocketService] Already attempting to reconnect, skipping...');
      return;
    }

    if (this.isInitializing) {
      console.log('[SocketService] Already initializing connection, skipping...');
      return;
    }

    // Check if we've reached max reconnection attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[SocketService] Max reconnection attempts reached, use reset() to try again');
      return;
    }

    // Check server health before attempting connection
    const isServerHealthy = await this.checkServerHealth();
    if (!isServerHealthy) {
      console.log('[SocketService] Server is not reachable, skipping connection attempt');
      return;
    }

    this.isInitializing = true;

    try {
      // Create socket connection
      const serverUrl = BASE_URL.replace('/api', '');
      console.log('[SocketService] Attempting to connect to:', serverUrl);
      
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
          console.log('[SocketService] Connection timeout, cleaning up...');
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
       console.log('[SocketService] ✅ Connected to server');
       console.log('[SocketService] Socket ID:', this.socket.id);
       console.log('[SocketService] Server URL:', this.socket.io.uri);
       this.isConnected = true;
       this.isInitializing = false;
       this.reconnectAttempts = 0;
       this.reconnectDelay = 1000;
     });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
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
        console.log('[SocketService] Max reconnection attempts reached, not attempting to reconnect');
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
        console.log('[SocketService] Max reconnection attempts reached, not attempting to reconnect');
        this.isReconnecting = false;
      }
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('[SocketService] Authentication successful:', data);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('[SocketService] Authentication failed:', error);
    });

    // Real-time data events
    this.socket.on('category-update', (data) => {
      console.log('[SocketService] Category update received:', data);
      this.emitToListeners('category-update', data);
    });

    this.socket.on('product-update', (data) => {
      console.log('[SocketService] Product update received:', data);
      this.emitToListeners('product-update', data);
    });

    this.socket.on('order-update', (data) => {
      console.log('[SocketService] Order update received:', data);
      this.emitToListeners('order-update', data);
    });

    this.socket.on('cart-update', (data) => {
      console.log('[SocketService] Cart update received:', data);
      this.emitToListeners('cart-update', data);
    });

    // Specific order events
    this.socket.on('order-created', (data) => {
      console.log('[SocketService] Order created received:', data);
      this.emitToListeners('order-created', data);
    });

    this.socket.on('order-status-updated', (data) => {
      console.log('[SocketService] Order status updated received:', data);
      this.emitToListeners('order-status-updated', data);
    });

    this.socket.on('orders-created-from-cart', (data) => {
      console.log('[SocketService] Orders created from cart received:', data);
      this.emitToListeners('orders-created-from-cart', data);
    });

    // Specific cart events
    this.socket.on('cart-item-added', (data) => {
      console.log('[SocketService] Cart item added received:', data);
      this.emitToListeners('cart-item-added', data);
    });

    this.socket.on('cart-item-updated', (data) => {
      console.log('[SocketService] Cart item updated received:', data);
      this.emitToListeners('cart-item-updated', data);
    });

    this.socket.on('cart-item-removed', (data) => {
      console.log('[SocketService] Cart item removed received:', data);
      this.emitToListeners('cart-item-removed', data);
    });

    this.socket.on('cart-cleared', (data) => {
      console.log('[SocketService] Cart cleared received:', data);
      this.emitToListeners('cart-cleared', data);
    });

    // User and app events
    this.socket.on('user-update', (data) => {
      console.log('[SocketService] User update received:', data);
      this.emitToListeners('user-update', data);
    });

    this.socket.on('app-version-update', (data) => {
      console.log('[SocketService] App version update received:', data);
      this.emitToListeners('app-version-update', data);
    });

    this.socket.on('app-icon-update', (data) => {
      console.log('[SocketService] App icon update received:', data);
      this.emitToListeners('app-icon-update', data);
    });

    // Slider updates
    this.socket.on('slider-update', (data) => {
      console.log('[SocketService] Slider update received:', data);
      this.emitToListeners('slider-update', data);
    });

         // User notification events
     this.socket.on('registration-status-change', (data) => {
       console.log('[SocketService] 🔔 Registration status change received:', data);
       console.log('[SocketService] Event details:', {
         action: data.action,
         user: data.user,
         type: data.type,
         timestamp: data.timestamp
       });
       this.emitToListeners('registration-status-change', data);
     });

    this.socket.on('login-request-status-change', (data) => {
      console.log('[SocketService] Login request status change received:', data);
      this.emitToListeners('login-request-status-change', data);
    });

         // User room events
     this.socket.on('user-room-joined', (data) => {
       console.log('[SocketService] ✅ User room joined:', data);
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
      console.log('[SocketService] Max reconnection attempts reached, stopping reconnection attempts');
      this.isReconnecting = false;
      return;
    }

    if (this.isReconnecting) {
      console.log('[SocketService] Already attempting to reconnect, skipping...');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[SocketService] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
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
      console.log(`[SocketService] Joined room: ${room}`);
    }
  }

     /**
    * Join user room for receiving user-specific notifications
    * @param {Object} userData - User data (id, name, etc.)
    */
   joinUserRoom(userData) {
     if (this.socket && this.isConnected) {
       console.log(`[SocketService] 🔌 Joining user room for user: ${userData.name || userData.id}`);
       console.log(`[SocketService] User data:`, userData);
       console.log(`[SocketService] Socket connected: ${this.isConnected}, Socket ID: ${this.socket.id}`);
       
       this.socket.emit('join-user-room', userData);
       console.log(`[SocketService] ✅ Join user room event emitted`);
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
      console.log(`[SocketService] Left room: ${room}`);
    }
  }

  /**
   * Clean up socket connection and reset state
   */
  cleanup() {
    console.log('[SocketService] Cleaning up socket connection...');
    
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
    
    console.log('[SocketService] Cleanup completed');
  }

  /**
   * Reset the service and allow new connection attempts
   */
  reset() {
    console.log('[SocketService] Resetting service...');
    this.cleanup();
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    console.log('[SocketService] Service reset completed');
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
    console.log('[SocketService] WebSocket connections disabled');
    this.cleanup();
    this.maxReconnectAttempts = 0;
  }

  /**
   * Re-enable WebSocket connections
   */
  enable() {
    console.log('[SocketService] WebSocket connections re-enabled');
    this.maxReconnectAttempts = 3;
    this.reconnectAttempts = 0;
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    console.log('[SocketService] Disconnecting socket...');
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
       console.log(`[SocketService] 📝 Created new event listener map for: ${event}`);
     }
     
     this.eventListeners.get(event).set(listenerId, callback);
     console.log(`[SocketService] ✅ Added listener for ${event}: ${listenerId}`);
     console.log(`[SocketService] Total listeners for ${event}: ${this.eventListeners.get(event).size}`);
     
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
      console.log(`[SocketService] Removed listener for ${event}: ${listenerId}`);
    }
  }

     /**
    * Emit event to all listeners
    * @param {string} event - Event name
    * @param {any} data - Event data
    */
   emitToListeners(event, data) {
     console.log(`[SocketService] 📡 Emitting to listeners: ${event}`);
     console.log(`[SocketService] Listeners count: ${this.eventListeners.has(event) ? this.eventListeners.get(event).size : 0}`);
     
     if (this.eventListeners.has(event)) {
       this.eventListeners.get(event).forEach((callback, listenerId) => {
         try {
           console.log(`[SocketService] 📡 Calling listener: ${listenerId}`);
           callback(data);
           console.log(`[SocketService] ✅ Listener called successfully: ${listenerId}`);
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