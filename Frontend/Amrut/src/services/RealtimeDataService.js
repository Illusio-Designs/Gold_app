import { getCategories, getProductsByCategory, getUserOrders } from './Api';
import SocketService from './SocketService';

class RealtimeDataService {
  constructor() {
    this.pollingIntervals = new Map();
    this.isConnected = false;
    this.lastDataHashes = new Map();
    this.subscribers = new Map();
    this.pollingIntervalMs = 10000; // Poll every 10 seconds
    this.socketListeners = new Map();
    
    // Initialize Socket.IO connection
    this.initializeSocket();
  }

  /**
   * Initialize Socket.IO connection and listeners
   */
  initializeSocket() {
    // Connect to Socket.IO server
    SocketService.connect();
    
    // Listen for real-time updates
    this.setupSocketListeners();
  }

  /**
   * Setup Socket.IO event listeners
   */
  setupSocketListeners() {
    // Category updates
    const categoryListenerId = SocketService.addEventListener('category-update', (data) => {
      console.log('[RealtimeDataService] Socket category update:', data);
      this.handleSocketUpdate('categories', data);
    });
    this.socketListeners.set('category-update', categoryListenerId);

    // Product updates
    const productListenerId = SocketService.addEventListener('product-update', (data) => {
      console.log('[RealtimeDataService] Socket product update:', data);
      this.handleSocketUpdate('products', data);
    });
    this.socketListeners.set('product-update', productListenerId);

    // Order updates
    const orderListenerId = SocketService.addEventListener('order-update', (data) => {
      console.log('[RealtimeDataService] Socket order update:', data);
      this.handleSocketUpdate('orders', data);
    });
    this.socketListeners.set('order-update', orderListenerId);

    // Note: Cart updates are now user-specific and handled by CartContext

    // Specific order events
    const orderCreatedListenerId = SocketService.addEventListener('order-created', (data) => {
      console.log('[RealtimeDataService] Socket order created:', data);
      this.handleSocketUpdate('orders', data);
    });
    this.socketListeners.set('order-created', orderCreatedListenerId);

    const orderStatusUpdatedListenerId = SocketService.addEventListener('order-status-updated', (data) => {
      console.log('[RealtimeDataService] Socket order status updated:', data);
      this.handleSocketUpdate('orders', data);
    });
    this.socketListeners.set('order-status-updated', orderStatusUpdatedListenerId);

    const ordersFromCartListenerId = SocketService.addEventListener('orders-created-from-cart', (data) => {
      console.log('[RealtimeDataService] Socket orders created from cart:', data);
      this.handleSocketUpdate('orders', data);
    });
    this.socketListeners.set('orders-created-from-cart', ordersFromCartListenerId);

    // Specific cart events
    const cartItemAddedListenerId = SocketService.addEventListener('cart-item-added', (data) => {
      console.log('[RealtimeDataService] Socket cart item added:', data);
      this.handleSocketUpdate('cart', data);
    });
    this.socketListeners.set('cart-item-added', cartItemAddedListenerId);

    const cartItemUpdatedListenerId = SocketService.addEventListener('cart-item-updated', (data) => {
      console.log('[RealtimeDataService] Socket cart item updated:', data);
      this.handleSocketUpdate('cart', data);
    });
    this.socketListeners.set('cart-item-updated', cartItemUpdatedListenerId);

    const cartItemRemovedListenerId = SocketService.addEventListener('cart-item-removed', (data) => {
      console.log('[RealtimeDataService] Socket cart item removed:', data);
      this.handleSocketUpdate('cart', data);
    });
    this.socketListeners.set('cart-item-removed', cartItemRemovedListenerId);

    const cartClearedListenerId = SocketService.addEventListener('cart-cleared', (data) => {
      console.log('[RealtimeDataService] Socket cart cleared:', data);
      this.handleSocketUpdate('cart', data);
    });
    this.socketListeners.set('cart-cleared', cartClearedListenerId);

    // User updates
    const userUpdateListenerId = SocketService.addEventListener('user-update', (data) => {
      console.log('[RealtimeDataService] Socket user update:', data);
      this.handleSocketUpdate('users', data);
    });
    this.socketListeners.set('user-update', userUpdateListenerId);

    // App updates
    const appVersionUpdateListenerId = SocketService.addEventListener('app-version-update', (data) => {
      console.log('[RealtimeDataService] Socket app version update:', data);
      this.handleSocketUpdate('app-versions', data);
    });
    this.socketListeners.set('app-version-update', appVersionUpdateListenerId);

    const appIconUpdateListenerId = SocketService.addEventListener('app-icon-update', (data) => {
      console.log('[RealtimeDataService] Socket app icon update:', data);
      this.handleSocketUpdate('app-icons', data);
    });
    this.socketListeners.set('app-icon-update', appIconUpdateListenerId);

    // Slider updates
    const sliderUpdateListenerId = SocketService.addEventListener('slider-update', (data) => {
      console.log('[RealtimeDataService] Socket slider update:', data);
      this.handleSocketUpdate('sliders', data);
    });
    this.socketListeners.set('slider-update', sliderUpdateListenerId);
  }

  /**
   * Handle Socket.IO updates
   * @param {string} dataType - Type of data
   * @param {Object} data - Update data
   */
  handleSocketUpdate(dataType, data) {
    const { action, category, product, order, cartItem, user, version, icon, timestamp } = data;
    
    console.log(`[RealtimeDataService] Handling ${dataType} update:`, { action, dataType, timestamp });
    
    // Trigger a refresh of the specific data type
    this.refreshData(dataType);
    
    // Notify subscribers immediately with enhanced context
    this.notifySubscribers(dataType, null, { 
      action, 
      data: category || product || order || cartItem || user || version || icon, 
      timestamp,
      source: 'socket',
      eventType: dataType
    });
  }

  /**
   * Subscribe to real-time updates for a specific data type
   * @param {string} dataType - Type of data to subscribe to (categories, products, etc.)
   * @param {Function} callback - Callback function to execute when data changes
   * @param {Object} options - Additional options (categoryId for products, etc.)
   */
  subscribe(dataType, callback, options = {}) {
    const subscriptionId = `${dataType}_${Date.now()}_${Math.random()}`;
    
    if (!this.subscribers.has(dataType)) {
      this.subscribers.set(dataType, new Map());
    }
    
    this.subscribers.get(dataType).set(subscriptionId, { callback, options });
    
    // Start polling if not already started
    this.startPolling(dataType);
    
    console.log(`[RealtimeDataService] Subscribed to ${dataType} with ID: ${subscriptionId}`);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   * @param {string} dataType - Type of data
   * @param {string} subscriptionId - Subscription ID returned from subscribe
   */
  unsubscribe(dataType, subscriptionId) {
    if (this.subscribers.has(dataType)) {
      this.subscribers.get(dataType).delete(subscriptionId);
      
      // Stop polling if no more subscribers
      if (this.subscribers.get(dataType).size === 0) {
        this.stopPolling(dataType);
      }
    }
    
    console.log(`[RealtimeDataService] Unsubscribed from ${dataType} with ID: ${subscriptionId}`);
  }

  /**
   * Start polling for a specific data type
   * @param {string} dataType - Type of data to poll
   */
  startPolling(dataType) {
    if (this.pollingIntervals.has(dataType)) {
      return; // Already polling
    }

    console.log(`[RealtimeDataService] Starting polling for ${dataType}`);
    
    // Start polling immediately
    this.pollData(dataType);
    
    // Set up continuous polling
    const interval = setInterval(() => {
      this.pollData(dataType);
    }, this.pollingIntervalMs);
    
    this.pollingIntervals.set(dataType, interval);
  }

  /**
   * Stop polling for a specific data type
   * @param {string} dataType - Type of data to stop polling
   */
  stopPolling(dataType) {
    if (this.pollingIntervals.has(dataType)) {
      clearInterval(this.pollingIntervals.get(dataType));
      this.pollingIntervals.delete(dataType);
      console.log(`[RealtimeDataService] Stopped polling for ${dataType}`);
    }
  }

  /**
   * Poll for data updates
   * @param {string} dataType - Type of data to poll
   */
  async pollData(dataType) {
    try {
      let newData = null;
      
      // Fetch data based on type
      switch (dataType) {
        case 'categories':
          newData = await getCategories();
          break;
        case 'products':
          // For products, we need to check all categories or specific category
          const subscribers = this.subscribers.get(dataType);
          if (subscribers) {
            for (const [id, { options }] of subscribers) {
              if (options.categoryId) {
                const products = await getProductsByCategory(options.categoryId);
                this.checkForUpdates(dataType, products, options);
              }
            }
          }
          return;
        case 'orders':
          // For orders, we need to get the current user's token
          // This will be handled by the hook that provides the token
          return;
        case 'cart':
          // For cart, we need to get the current user's token
          // This will be handled by the hook that provides the token
          return;
        case 'search':
          // For search, we need specific search parameters
          // This will be handled by the hook that provides the search function
          return;
        case 'sliders':
          // For sliders, we need to import and call getSliders
          const { getSliders } = await import('./Api');
          newData = await getSliders();
          break;
        default:
          console.warn(`[RealtimeDataService] Unknown data type: ${dataType}`);
          return;
      }
      
      // Check for updates and notify subscribers
      this.checkForUpdates(dataType, newData);
      
    } catch (error) {
      console.error(`[RealtimeDataService] Error polling ${dataType}:`, error);
    }
  }

  /**
   * Check if data has changed and notify subscribers
   * @param {string} dataType - Type of data
   * @param {any} newData - New data received
   * @param {Object} options - Additional options
   */
  checkForUpdates(dataType, newData, options = {}) {
    if (!newData) return;
    
    // Create a hash of the data to detect changes
    const dataHash = this.createDataHash(newData);
    const lastHash = this.lastDataHashes.get(`${dataType}_${JSON.stringify(options)}`);
    
    // Check if data has changed
    if (dataHash !== lastHash) {
      console.log(`[RealtimeDataService] Data changed for ${dataType}`, { options });
      
      // Update the last hash
      this.lastDataHashes.set(`${dataType}_${JSON.stringify(options)}`, dataHash);
      
      // Notify all subscribers
      this.notifySubscribers(dataType, newData, options);
    }
  }

  /**
   * Notify all subscribers of data changes
   * @param {string} dataType - Type of data
   * @param {any} data - Updated data
   * @param {Object} options - Additional options
   */
  notifySubscribers(dataType, data, options = {}) {
    if (!this.subscribers.has(dataType)) return;
    
    const subscribers = this.subscribers.get(dataType);
    
    subscribers.forEach(({ callback, options: subscriberOptions }, subscriptionId) => {
      // Check if subscriber should receive this update
      if (this.shouldNotifySubscriber(subscriberOptions, options)) {
        try {
          callback(data, options);
          console.log(`[RealtimeDataService] Notified subscriber ${subscriptionId} for ${dataType}`);
        } catch (error) {
          console.error(`[RealtimeDataService] Error in subscriber callback:`, error);
        }
      }
    });
  }

  /**
   * Check if a subscriber should be notified based on options
   * @param {Object} subscriberOptions - Subscriber's options
   * @param {Object} updateOptions - Update options
   * @returns {boolean} - Whether to notify the subscriber
   */
  shouldNotifySubscriber(subscriberOptions, updateOptions) {
    // If subscriber has specific options, check if they match
    if (subscriberOptions.categoryId && updateOptions.categoryId) {
      return subscriberOptions.categoryId === updateOptions.categoryId;
    }
    
    // If no specific options, notify all
    return true;
  }

  /**
   * Create a hash of data to detect changes
   * @param {any} data - Data to hash
   * @returns {string} - Hash string
   */
  createDataHash(data) {
    try {
      // Simple hash based on JSON string
      const jsonString = JSON.stringify(data);
      let hash = 0;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return hash.toString();
    } catch (error) {
      console.error('[RealtimeDataService] Error creating data hash:', error);
      return Date.now().toString(); // Fallback to timestamp
    }
  }

  /**
   * Manually trigger a data refresh
   * @param {string} dataType - Type of data to refresh
   * @param {Object} options - Additional options
   */
  async refreshData(dataType, options = {}) {
    console.log(`[RealtimeDataService] Manually refreshing ${dataType}`);
    await this.pollData(dataType);
  }

  /**
   * Set polling interval
   * @param {number} intervalMs - Polling interval in milliseconds
   */
  setPollingInterval(intervalMs) {
    this.pollingIntervalMs = intervalMs;
    console.log(`[RealtimeDataService] Polling interval set to ${intervalMs}ms`);
  }

  /**
   * Get current polling status
   * @returns {Object} - Status of all polling intervals
   */
  getStatus() {
    const status = {};
    
    for (const [dataType, interval] of this.pollingIntervals) {
      status[dataType] = {
        isPolling: !!interval,
        subscribers: this.subscribers.get(dataType)?.size || 0
      };
    }
    
    return status;
  }

  /**
   * Disconnect all polling and clear subscribers
   */
  disconnect() {
    console.log('[RealtimeDataService] Disconnecting all real-time services');
    
    // Stop all polling intervals
    for (const [dataType, interval] of this.pollingIntervals) {
      clearInterval(interval);
    }
    
    // Remove Socket.IO listeners
    for (const [event, listenerId] of this.socketListeners) {
      SocketService.removeEventListener(event, listenerId);
    }
    
    this.pollingIntervals.clear();
    this.subscribers.clear();
    this.lastDataHashes.clear();
    this.socketListeners.clear();
    this.isConnected = false;
    
    // Disconnect Socket.IO
    SocketService.disconnect();
  }
}

// Export singleton instance
export default new RealtimeDataService(); 