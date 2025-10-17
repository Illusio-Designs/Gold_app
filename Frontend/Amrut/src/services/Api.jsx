import axios from 'axios';
import { API_URL } from '@env';

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 seconds timeout
axios.defaults.retry = 2; // Retry failed requests
axios.defaults.retryDelay = 1000; // Wait 1 second between retries

// ✅ Fallback if API_URL is undefined
export const BASE_URL = API_URL || 'http://172.20.10.10:3001/api';
// Use your LAN IP if on physical device

console.log('🌍 API_URL from @env:', API_URL);
console.log('🌍 Using BASE_URL:', BASE_URL);

// ✅ Register user API call
export const registerUser = async userData => {
  try {
    console.log('📤 Sending registerUser request with data:', userData);

    // If no image is provided, prefer JSON to avoid multipart boundary/host issues
    const shouldUseJson = !userData.image;

    // Attach device FCM token if available so backend can link it to the new user
    // try {
    //   const firebaseService = require('./firebaseService').default;
    //   const storedToken = await firebaseService.getStoredToken();
    //   if (storedToken) {
    //     userData.device_fcm_token = storedToken;
    //   }
    // } catch (e) {
    //   console.log('⚠️ Could not attach device FCM token to registration');
    // }

    let response;
    if (shouldUseJson) {
      console.log('📝 registerUser: sending JSON payload');
      response = await axios.post(`${BASE_URL}/users/register`, userData);
    } else {
      console.log('🖼️ registerUser: sending multipart/form-data payload');
      const formData = new FormData();
      for (const key in userData) {
        if (userData[key] !== undefined && userData[key] !== null) {
          formData.append(key, userData[key]);
        }
      }
      response = await axios.post(`${BASE_URL}/users/register`, formData);
    }

    console.log('✅ registerUser response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ registerUser error:', error);

    // Network error handling
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      throw {
        error:
          'Network Error: Unable to connect to server. Please check your internet connection.',
      };
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      throw { error: 'Request timeout: Server is taking too long to respond.' };
    }

    // Connection refused
    if (error.code === 'ECONNREFUSED') {
      throw {
        error:
          'Connection refused: Server is not accessible. Please check if the server is running.',
      };
    }

    if (error.response) {
      console.error('❌ Error response data:', error.response.data);
      throw error.response.data;
    } else {
      throw { error: error.message || 'Something went wrong' };
    }
  }
};

// ✅ Check user existence
export const checkUserExists = async data => {
  try {
    console.log('🔍 Checking user existence:', data);
    const response = await axios.post(`${BASE_URL}/users/check-exists`, data);
    console.log('✅ checkUserExists response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ checkUserExists error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get categories
export const getCategories = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/categories`);
    console.log('📂 getCategories response:', response.data);

    // Check if response has data property or if it's directly an array
    if (response.data && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      return { success: true, data: response.data.data };
    } else {
      console.warn(
        '📂 getCategories: Unexpected response format:',
        response.data,
      );
      return { success: false, data: [], error: 'Invalid response format' };
    }
  } catch (error) {
    console.error('❌ getCategories error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get approved categories for logged-in user
export const getApprovedCategoriesForUser = async (userId, token) => {
  try {
    console.log(
      '📂 getApprovedCategoriesForUser: Fetching for userId:',
      userId,
    );
    const response = await axios.get(
      `${BASE_URL}/login-requests/approved-categories/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log('📂 getApprovedCategoriesForUser response:', response.data);
    console.log(
      '📂 getApprovedCategoriesForUser response length:',
      response.data?.length,
    );

    // Check if response has data property or if it's directly an array
    if (response.data && Array.isArray(response.data)) {
      console.log(
        '📂 getApprovedCategoriesForUser: Returning array data with',
        response.data.length,
        'categories',
      );
      return { success: true, data: response.data };
    } else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      console.log(
        '📂 getApprovedCategoriesForUser: Returning nested data with',
        response.data.data.length,
        'categories',
      );
      return { success: true, data: response.data.data };
    } else {
      console.warn(
        '📂 getApprovedCategoriesForUser: Unexpected response format:',
        response.data,
      );
      return { success: false, data: [], error: 'Invalid response format' };
    }
  } catch (error) {
    console.error('❌ getApprovedCategoriesForUser error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get approved products for logged-in user (filtered by selected categories)
export const getApprovedProductsForUser = async (userId, token) => {
  try {
    console.log('📦 getApprovedProductsForUser: Fetching for userId:', userId);
    const response = await axios.get(
      `${BASE_URL}/login-requests/approved-products/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log('📦 getApprovedProductsForUser response:', response.data);
    console.log(
      '📦 getApprovedProductsForUser response length:',
      response.data?.length,
    );

    // Check if response has data property or if it's directly an array
    if (response.data && Array.isArray(response.data)) {
      console.log(
        '📦 getApprovedProductsForUser: Returning array data with',
        response.data.length,
        'products',
      );
      return { success: true, data: response.data };
    } else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      console.log(
        '📦 getApprovedProductsForUser: Returning nested data with',
        response.data.data.length,
        'products',
      );
      return { success: true, data: response.data.data };
    } else {
      console.warn(
        '📦 getApprovedProductsForUser: Unexpected response format:',
        response.data,
      );
      return { success: false, data: [], error: 'Invalid response format' };
    }
  } catch (error) {
    console.error('❌ getApprovedProductsForUser error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Request login
export const requestLogin = async (data, token) => {
  try {
    console.log('🔐 requestLogin data:', data);
    const response = await axios.post(
      `${BASE_URL}/login-requests`,
      data,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    );
    console.log('✅ requestLogin response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ requestLogin error:', error);
    // Surface backend error for active requests
    if (error.response && error.response.data && error.response.data.errors) {
      throw { error: error.response.data.errors.map(e => e.error).join(', ') };
    }
    throw error.response?.data || { error: error.message };
  }
};

export const sendBusinessOTP = async (phoneNumber, countryCode) => {
  try {
    const response = await axios.post(`${BASE_URL}/users/send-otp`, {
      phoneNumber,
      countryCode,
    });
    return response.data;
  } catch (error) {
    console.error('❌ sendBusinessOTP error:', error);
    throw error.response?.data || { error: error.message };
  }
};

export const verifyBusinessOTP = async phoneNumber => {
  try {
    const url = `${BASE_URL}/users/verify-otp`;
    console.log('--- Attempting to verify OTP with backend ---');
    console.log('Request URL:', url);
    console.log('Phone Number:', phoneNumber);
    const response = await axios.post(url, { phoneNumber });
    console.log('--- Backend verification response ---');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('-------------------------------------');
    return response.data;
  } catch (error) {
    console.error('--- Backend verification FAILED ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error(
        'Response Body:',
        JSON.stringify(error.response.data, null, 2),
      );
    } else if (error.request) {
      console.error(
        'No response received. Is the backend server running and the URL correct?',
      );
      console.error('Request Details:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('---------------------------------');
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get all products
export const getAllProducts = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    console.log('📦 getAllProducts response:', response.data);

    // Check if response has data property or if it's directly an array
    if (response.data && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      return { success: true, data: response.data.data };
    } else {
      console.warn(
        '📦 getAllProducts: Unexpected response format:',
        response.data,
      );
      return { success: false, data: [], error: 'Invalid response format' };
    }
  } catch (error) {
    console.error('❌ getAllProducts error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get products by category
export const getProductsByCategory = async categoryId => {
  try {
    const response = await axios.get(
      `${BASE_URL}/products/category/${categoryId}`,
    );
    console.log('📦 getProductsByCategory response:', response.data);

    // Check if response has data property or if it's directly an array
    if (response.data && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      return { success: true, data: response.data.data };
    } else {
      console.warn(
        '📦 getProductsByCategory: Unexpected response format:',
        response.data,
      );
      return { success: false, data: [], error: 'Invalid response format' };
    }
  } catch (error) {
    console.error('❌ getProductsByCategory error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get product by ID (for product details)
export const getProductById = async productId => {
  try {
    const response = await axios.get(`${BASE_URL}/products/${productId}`);
    console.log('📦 getProductById response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getProductById error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Update user profile
export const updateUserProfile = async (userId, profileData, token) => {
  try {
    console.log(
      '📤 Sending updateUserProfile request for user:',
      userId,
      profileData,
    );

    const formData = new FormData();
    for (const key in profileData) {
      if (profileData[key] !== undefined && profileData[key] !== null) {
        // Special handling for image file
        if (
          key === 'image' &&
          profileData[key] &&
          typeof profileData[key] === 'object' &&
          profileData[key].uri &&
          profileData[key].name &&
          profileData[key].type
        ) {
          formData.append('image', {
            uri: profileData[key].uri,
            name: profileData[key].name,
            type: profileData[key].type,
          });
        } else {
          formData.append(key, profileData[key]);
        }
      }
    }

    const headers = {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    console.log('Headers for update:', headers);

    const response = await axios.put(`${BASE_URL}/users/${userId}`, formData, {
      headers,
    });

    console.log('✅ updateUserProfile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ updateUserProfile error:', error);
    if (error.response) {
      console.error('❌ Error response data:', error.response.data);
      throw error.response.data;
    } else {
      throw { error: error.message || 'Something went wrong' };
    }
  }
};

// ✅ Get user by ID
export const getUserById = async (userId, token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/users/${userId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('❌ getUserById error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// 🛒 CART MANAGEMENT
export const addToCart = async (cartData, token) => {
  try {
    console.log('🛒 [API] addToCart called with data:', cartData);
    console.log(
      '🛒 [API] Token:',
      token ? token.substring(0, 20) + '...' : 'null',
    );
    console.log('🛒 [API] BASE_URL:', BASE_URL);

    const response = await axios.post(`${BASE_URL}/cart/add`, cartData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ [API] addToCart success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [API] addToCart error:', error);
    if (error.response) {
      console.error('❌ [API] Error response status:', error.response.status);
      console.error('❌ [API] Error response data:', error.response.data);
    }
    throw error.response?.data || { error: error.message };
  }
};

export const getUserCart = async (userId, token) => {
  try {
    console.log('🛒 [API] getUserCart called for user:', userId);
    console.log(
      '🛒 [API] Token:',
      token ? token.substring(0, 20) + '...' : 'null',
    );
    console.log('🛒 [API] BASE_URL:', BASE_URL);
    console.log('🛒 [API] Request URL:', `${BASE_URL}/cart/user/${userId}`);

    const response = await axios.get(`${BASE_URL}/cart/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ [API] getUserCart success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [API] getUserCart error:', error);
    if (error.response) {
      console.error('❌ [API] Error response status:', error.response.status);
      console.error('❌ [API] Error response data:', error.response.data);
    }
    throw error.response?.data || { error: error.message };
  }
};

export const updateCartItemQuantity = async (cartItemId, quantity, token) => {
  try {
    console.log('🛒 Updating cart item quantity:', { cartItemId, quantity });
    const response = await axios.put(
      `${BASE_URL}/cart/item/${cartItemId}/quantity`,
      { quantity },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log('✅ updateCartItemQuantity response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ updateCartItemQuantity error:', error);
    throw error.response?.data || { error: error.message };
  }
};

export const removeFromCart = async (cartItemId, token) => {
  try {
    console.log('🛒 Removing item from cart:', cartItemId);
    const response = await axios.delete(`${BASE_URL}/cart/item/${cartItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ removeFromCart response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ removeFromCart error:', error);
    throw error.response?.data || { error: error.message };
  }
};

export const clearUserCart = async (userId, token) => {
  try {
    console.log('🛒 Clearing user cart for user:', userId);
    const response = await axios.delete(
      `${BASE_URL}/cart/user/${userId}/clear`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log('✅ clearUserCart response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ clearUserCart error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// 📦 ORDER MANAGEMENT
export const createOrder = async (orderData, token) => {
  try {
    console.log('📦 [API] createOrder called with data:', orderData);
    console.log(
      '📦 [API] Token:',
      token ? token.substring(0, 20) + '...' : 'null',
    );
    console.log('📦 [API] BASE_URL:', BASE_URL);

    const response = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ [API] createOrder success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [API] createOrder error:', error);
    if (error.response) {
      console.error('❌ [API] Error response status:', error.response.status);
      console.error('❌ [API] Error response data:', error.response.data);
    }
    throw error.response?.data || { error: error.message };
  }
};

export const createOrderFromCart = async (cartOrderData, token) => {
  try {
    console.log(
      '📦 [API] createOrderFromCart called with data:',
      cartOrderData,
    );
    console.log(
      '📦 [API] Token:',
      token ? token.substring(0, 20) + '...' : 'null',
    );
    console.log('📦 [API] BASE_URL:', BASE_URL);
    console.log('📦 [API] Request URL:', `${BASE_URL}/orders/from-cart`);

    const response = await axios.post(
      `${BASE_URL}/orders/from-cart`,
      cartOrderData,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log(
      '✅ [API] createOrderFromCart success response:',
      response.data,
    );
    return response.data;
  } catch (error) {
    console.error('❌ [API] createOrderFromCart error:', error);
    if (error.response) {
      console.error('❌ [API] Error response status:', error.response.status);
      console.error('❌ [API] Error response data:', error.response.data);
    }
    throw error.response?.data || { error: error.message };
  }
};

export const getUserOrders = async (userId, token) => {
  try {
    console.log('📦 Getting user orders for user:', userId);
    const response = await axios.get(`${BASE_URL}/orders/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ getUserOrders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getUserOrders error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// Get current user's orders (requires authentication token)
export const getCurrentUserOrders = async token => {
  try {
    console.log('📦 Getting current user orders');
    const response = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ getCurrentUserOrders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getCurrentUserOrders error:', error);
    throw error.response?.data || { error: error.message };
  }
};

export const getOrderById = async (orderId, token) => {
  try {
    console.log('📦 Getting order by ID:', orderId);
    const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ getOrderById response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getOrderById error:', error);
    throw error.response?.data || { error: error.message };
  }
};

export const updateOrderStatus = async (orderId, status, token) => {
  try {
    console.log('📦 Updating order status:', { orderId, status });
    const response = await axios.patch(
      `${BASE_URL}/orders/${orderId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log('✅ updateOrderStatus response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ updateOrderStatus error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get product by SKU
export const getProductBySku = async sku => {
  try {
    console.log('🔍 [API] getProductBySku called with SKU:', sku);
    const response = await axios.get(`${BASE_URL}/products/sku/${sku}`);
    console.log('✅ [API] getProductBySku response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [API] getProductBySku error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get user notifications
export const getUserNotifications = async (userId, token) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/notifications/user/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error('❌ getUserNotifications error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get unread notifications count
export const getUnreadCount = async (userId, token) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/notifications/user/${userId}/unread`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error('❌ getUnreadCount error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Mark notification as read
export const markNotificationAsRead = async (notificationId, token) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error('❌ markNotificationAsRead error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Mark all notifications as read
export const markAllNotificationsAsRead = async (userId, token) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/notifications/user/${userId}/read-all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error('❌ markAllNotificationsAsRead error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Validate user session
export const validateUserSession = async token => {
  try {
    const response = await axios.get(`${BASE_URL}/users/validate-session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('❌ validateUserSession error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Logout user
export const logoutUser = async token => {
  try {
    console.log('🚪 Logging out user...');
    const response = await axios.post(
      `${BASE_URL}/users/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log('✅ logoutUser response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ logoutUser error:', error);
    // Don't throw error for logout - we want to clear local data anyway
    return { success: false, error: error.message };
  }
};

// ✅ Check app update
export const checkAppUpdate = async (platform, versionCode) => {
  try {
    const response = await axios.get(`${BASE_URL}/app-versions/check-update`, {
      params: { platform, version_code: versionCode },
    });
    console.log('📱 checkAppUpdate response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ checkAppUpdate error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get latest version info
export const getLatestVersion = async platform => {
  try {
    const response = await axios.get(
      `${BASE_URL}/app-versions/latest/${platform}`,
    );
    console.log('📱 getLatestVersion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getLatestVersion error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get current app icon
export const getCurrentAppIcon = async (platform, type = 'primary') => {
  try {
    const response = await axios.get(
      `${BASE_URL}/app-icons/current/${platform}/${type}`,
    );
    console.log('🎨 getCurrentAppIcon response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getCurrentAppIcon error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get all active app icons for platform
export const getActiveAppIcons = async platform => {
  try {
    const response = await axios.get(
      `${BASE_URL}/app-icons/active/${platform}`,
    );
    console.log('🎨 getActiveAppIcons response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getActiveAppIcons error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Get sliders/banners
export const getSliders = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/slider`);
    console.log('🖼️ getSliders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getSliders error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Search all (categories and products)
export const searchAll = async query => {
  try {
    console.log('🔍 Searching all with query:', query);
    const response = await axios.get(
      `${BASE_URL}/search/all?query=${encodeURIComponent(query)}`,
    );
    console.log('✅ searchAll response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ searchAll error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Search only categories
export const searchCategories = async query => {
  try {
    console.log('🔍 Searching categories with query:', query);
    const response = await axios.get(
      `${BASE_URL}/search/categories?query=${encodeURIComponent(query)}`,
    );
    console.log('✅ searchCategories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ searchCategories error:', error);
    throw error.response?.data || { error: error.message };
  }
};

// ✅ Search only products
export const searchProducts = async query => {
  try {
    console.log('🔍 Searching products with query:', query);
    const response = await axios.get(
      `${BASE_URL}/search/products?query=${encodeURIComponent(query)}`,
    );
    console.log('✅ searchProducts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ searchProducts error:', error);
    throw error.response?.data || { error: error.message };
  }
};
