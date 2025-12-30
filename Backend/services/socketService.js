const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  /**
   * Initialize Socket.IO with the HTTP server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // In production, specify your frontend URL
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Store client information
      this.connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        rooms: new Set()
      });

      // Handle client joining rooms
      socket.on('join-room', (room) => {
        socket.join(room);
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.add(room);
        }
        });

      // Handle client leaving rooms
      socket.on('leave-room', (room) => {
        socket.leave(room);
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.delete(room);
        }
        });

      // Handle client disconnection
      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
      });

      // Handle authentication
      socket.on('authenticate', (data) => {
        // You can add authentication logic here
        socket.emit('authenticated', { success: true });
      });

      // Handle admin joining admin room
      socket.on('join-admin-room', (adminData) => {
        socket.join('admin');
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.add('admin');
          client.isAdmin = true;
          client.adminData = adminData;
        }
        socket.emit('admin-room-joined', { success: true, room: 'admin' });
      });

      // Handle user joining user room
      socket.on('join-user-room', (userData) => {
        const userRoom = `user_${userData.id}`;
        socket.join(userRoom);
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.add(userRoom);
          client.userId = userData.id;
          client.userData = userData;
        }
        socket.emit('user-room-joined', { success: true, room: userRoom });
      });
    });
  }

  /**
   * Emit data to all connected clients
   * @param {string} event - Event name
   * @param {any} data - Data to emit
   */
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      }
  }

  /**
   * Emit data to a specific room
   * @param {string} room - Room name
   * @param {string} event - Event name
   * @param {any} data - Data to emit
   */
  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
      }
  }

  /**
   * Emit data to a specific client
   * @param {string} socketId - Socket ID
   * @param {string} event - Event name
   * @param {any} data - Data to emit
   */
  emitToClient(socketId, event, data) {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
      }
  }

  /**
   * Broadcast data to all clients except the sender
   * @param {string} socketId - Sender's socket ID
   * @param {string} event - Event name
   * @param {any} data - Data to emit
   */
  broadcastToOthers(socketId, event, data) {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
      `);
    }
  }

  /**
   * Notify about category updates
   * @param {Object} category - Category data
   * @param {string} action - Action performed (created, updated, deleted)
   */
  notifyCategoryUpdate(category, action) {
    this.emitToAll('category-update', {
      action,
      category,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about product updates
   * @param {Object} product - Product data
   * @param {string} action - Action performed (created, updated, deleted)
   */
  notifyProductUpdate(product, action) {
    this.emitToAll('product-update', {
      action,
      product,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about order updates
   * @param {Object} order - Order data
   * @param {string} action - Action performed (created, updated, deleted)
   */
  notifyOrderUpdate(order, action) {
    this.emitToAll('order-update', {
      action,
      order,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about user updates
   * @param {Object} user - User data
   * @param {string} action - Action performed (created, updated, deleted)
   */
  notifyUserUpdate(user, action) {
    this.emitToAll('user-update', {
      action,
      user,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about new user registration (specifically for admin dashboard)
   * @param {Object} user - User registration data
   */
  notifyNewUserRegistration(user) {
    // Emit to admin room specifically
    this.emitToRoom('admin', 'new-user-registration', {
      action: 'created',
      user,
      timestamp: new Date().toISOString(),
      type: 'user_registration'
    });
    
    // Also emit to all clients for general updates
    this.emitToAll('user-registration', {
      action: 'created',
      user,
      timestamp: new Date().toISOString(),
      type: 'user_registration'
    });
    
    }

  /**
   * Notify about user registration status change (approved/rejected)
   * @param {Object} userData - User data with status change
   */
  notifyUserRegistrationStatusChange(userData) {
    // Emit to specific user room if they're connected
    this.emitToRoom(`user_${userData.id}`, 'registration-status-change', {
      action: 'status_updated',
      user: userData,
      timestamp: new Date().toISOString(),
      type: 'registration_status_change'
    });
    
    // Also emit to all clients for general updates
    this.emitToAll('user-registration-status-change', {
      action: 'status_updated',
      user: userData,
      timestamp: new Date().toISOString(),
      type: 'registration_status_change'
    });
    
    `);
  }

  /**
   * Notify about login request status change (approved/rejected)
   * @param {Object} requestData - Login request data with status change
   */
  notifyLoginRequestStatusChange(requestData) {
    // Emit to specific user room if they're connected
    this.emitToRoom(`user_${requestData.userId}`, 'login-request-status-change', {
      action: 'status_updated',
      request: requestData,
      timestamp: new Date().toISOString(),
      type: 'login_request_status_change'
    });
    
    // Also emit to all clients for general updates
    this.emitToAll('login-request-status-change', {
      action: 'status_updated',
      request: requestData,
      timestamp: new Date().toISOString(),
      type: 'login_request_status_change'
    });
    
    `);
  }

  /**
   * Notify about app version updates
   * @param {Object} version - Version data
   * @param {string} action - Action performed (created, updated, deleted, activated)
   */
  notifyAppVersionUpdate(version, action) {
    this.emitToAll('app-version-update', {
      action,
      version,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about app icon updates
   * @param {Object} icon - Icon data
   * @param {string} action - Action performed (created, updated, deleted, activated)
   */
  notifyAppIconUpdate(icon, action) {
    this.emitToAll('app-icon-update', {
      action,
      icon,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about slider updates
   * @param {Object} slider - Slider data
   * @param {string} action - Action performed (created, updated, deleted)
   */
  notifySliderUpdate(slider, action) {
    this.emitToAll('slider-update', {
      action,
      slider,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected clients count
   * @returns {number} - Number of connected clients
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients info
   * @returns {Array} - Array of client information
   */
  getConnectedClients() {
    return Array.from(this.connectedClients.values());
  }

  /**
   * Get clients in a specific room
   * @param {string} room - Room name
   * @returns {Array} - Array of socket IDs in the room
   */
  getClientsInRoom(room) {
    if (this.io && this.io.sockets.adapter.rooms.has(room)) {
      return Array.from(this.io.sockets.adapter.rooms.get(room));
    }
    return [];
  }

  /**
   * Get admin clients count
   * @returns {number} - Number of admin clients
   */
  getAdminClientsCount() {
    let adminCount = 0;
    for (const client of this.connectedClients.values()) {
      if (client.isAdmin) {
        adminCount++;
      }
    }
    return adminCount;
  }

  /**
   * Get admin clients info
   * @returns {Array} - Array of admin client information
   */
  getAdminClients() {
    const adminClients = [];
    for (const client of this.connectedClients.values()) {
      if (client.isAdmin) {
        adminClients.push({
          id: client.id,
          isAdmin: client.isAdmin,
          adminData: client.adminData,
          connectedAt: client.connectedAt
        });
      }
    }
    return adminClients;
  }
}

// Export singleton instance
module.exports = new SocketService(); 