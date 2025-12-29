// Admin API Service for Dashboard
// Uses axios for HTTP requests
// BASE_URL is set from environment variable

import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "https://api.amrutkumargovinddasllp.com/api");

// Debug logging
console.log(
  "🔧 Environment:",
  import.meta.env.DEV ? "development" : "production"
);
console.log("🔧 VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
console.log("🔧 Final BASE_URL:", BASE_URL);

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Prevent stale data due to cached GET responses (browser/proxy).
// This app expects "read-after-write" behavior after create/update/delete.
axiosInstance.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toLowerCase();
    if (method === "get") {
      // Cache-bust all GETs without changing server behavior.
      config.params = { ...(config.params || {}), _ts: Date.now() };

      // Ask intermediaries/browsers to revalidate.
      config.headers = config.headers || {};
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const { clearAuthData } = require("../utils/authUtils");
      const { showWarningToast } = require("../utils/toast");
      
      // Clear auth data
      clearAuthData();
      
      // Show session expired notification
      showWarningToast("Your session has expired. Please login again.", "Session Expired");
      
      // Redirect to login page
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

// USERS
export const adminLogin = (data) =>
  axiosInstance.post("/users/admin/login", data).then((r) => r.data);

export const getAllUsers = (token) =>
  axiosInstance
    .get("/users", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const createUser = (data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .post("/users", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .post("/users", formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const updateUser = (userId, data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .put(`/users/${userId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .put(`/users/${userId}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const updateUserStatus = (userId, data, token) =>
  axiosInstance
    .patch(`/users/${userId}/status`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const deleteUser = (userId, token) =>
  axiosInstance
    .delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// CATEGORIES
export const getAllCategories = (token) =>
  axiosInstance
    .get("/categories", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const getCategoryById = (id, token) =>
  axiosInstance
    .get(`/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const createCategory = (data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .post("/categories", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .post("/categories", formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const updateCategory = (id, data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .put(`/categories/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .put(`/categories/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const deleteCategory = (id, token) =>
  axiosInstance
    .delete(`/categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// APP VERSIONS
export const getAllAppVersions = (token) =>
  axiosInstance
    .get("/app-versions", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const createAppVersion = (data, token) =>
  axiosInstance
    .post("/app-versions", data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const updateAppVersion = (id, data, token) =>
  axiosInstance
    .put(`/app-versions/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const deleteAppVersion = (id, token) =>
  axiosInstance
    .delete(`/app-versions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const activateAppVersion = (id, token) =>
  axiosInstance
    .patch(
      `/app-versions/${id}/activate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then((r) => r.data);

// APP ICONS
export const getAllAppIcons = (token) =>
  axiosInstance
    .get("/app-icons", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const createAppIcon = (data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .post("/app-icons", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .post("/app-icons", formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const updateAppIcon = (id, data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .put(`/app-icons/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .put(`/app-icons/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const deleteAppIcon = (id, token) =>
  axiosInstance
    .delete(`/app-icons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const activateAppIcon = (id, token) =>
  axiosInstance
    .patch(
      `/app-icons/${id}/activate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then((r) => r.data);

// SLIDERS
export const getAllSliders = (token) =>
  axiosInstance
    .get("/slider", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const createSlider = (data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .post("/slider", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .post("/slider", formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const updateSlider = (id, data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .put(`/slider/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .put(`/slider/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const deleteSlider = (id, token) =>
  axiosInstance
    .delete(`/slider/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

// PRODUCTS
export const getAllProducts = (token) =>
  axiosInstance
    .get("/products", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const getProductById = (id, token) =>
  axiosInstance
    .get(`/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const createProduct = (data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .post("/products", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    // Include all values, even empty strings, but not null/undefined
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .post("/products", formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const updateProduct = (id, data, token) => {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return axiosInstance
      .put(`/products/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data);
  }

  // Otherwise, create FormData from object
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    // Include all values, even empty strings, but not null/undefined
    if (v !== null && v !== undefined) {
      formData.append(k, v);
    }
  });

  return axiosInstance
    .put(`/products/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const deleteProduct = (id, token) =>
  axiosInstance
    .delete(`/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Product Images
export const uploadProductImages = (productId, files, token) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return axiosInstance
    .post(`/products/${productId}/images`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
};

export const getProductImages = (productId, token) =>
  axiosInstance
    .get(`/products/${productId}/images`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const deleteProductImage = (productId, imageIndex, token) =>
  axiosInstance
    .delete(`/products/${productId}/images/${imageIndex}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// CART MANAGEMENT (Admin can view user carts)
export const getUserCart = (userId, token) =>
  axiosInstance
    .get(`/cart/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const getCartItemById = (cartItemId, token) =>
  axiosInstance
    .get(`/cart/item/${cartItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// ENHANCED ORDERS WITH INDIVIDUAL PRODUCT STATUS TRACKING
export const getAllOrders = (token) =>
  axiosInstance
    .get("/orders", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const getOrderById = (id, token) =>
  axiosInstance
    .get(`/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const getOrdersByUserId = (userId, token) =>
  axiosInstance
    .get(`/orders/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const createOrder = (data, token) =>
  axiosInstance
    .post("/orders", data, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const createOrderFromCart = (data, token) =>
  axiosInstance
    .post("/orders/from-cart", data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const updateOrder = (id, data, token) =>
  axiosInstance
    .put(`/orders/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// NEW: Update individual order status (individual product status)
export const updateOrderStatus = (orderId, status, token) =>
  axiosInstance
    .patch(
      `/orders/${orderId}/status`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

// NEW: Bulk update multiple order statuses
export const bulkUpdateOrderStatuses = (orderIds, status, token) =>
  axiosInstance
    .patch(
      `/orders/bulk-status`,
      { order_ids: orderIds, status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

export const deleteOrder = (id, token) =>
  axiosInstance
    .delete(`/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const downloadOrderPDF = (id, token) =>
  axiosInstance.get(`/orders/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });

// NEW: Get order statistics
export const getOrderStatistics = (token) =>
  axiosInstance
    .get("/orders/stats/statistics", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// LOGIN REQUESTS (Admin)
export const getAllLoginRequests = (token) =>
  axiosInstance
    .get("/login-requests", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const updateLoginRequest = (requestId, data, token) =>
  axiosInstance
    .patch(`/login-requests/${requestId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// NOTIFICATIONS
export const getAdminNotifications = (token) => {
  console.log(
    "🔔 [API] getAdminNotifications called with token:",
    token ? token.substring(0, 20) + "..." : "null"
  );
  return axiosInstance
    .get("/notifications/user/1", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => {
      console.log("🔔 [API] getAdminNotifications response:", r.data);
      return r.data;
    })
    .catch((error) => {
      console.error(
        "❌ [API] getAdminNotifications error:",
        error.response?.data || error.message
      );
      throw error;
    });
};

export const getUnreadCount = (token) => {
  console.log(
    "🔔 [API] getUnreadCount called with token:",
    token ? token.substring(0, 20) + "..." : "null"
  );
  return axiosInstance
    .get("/notifications/user/1/unread", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => {
      console.log("🔔 [API] getUnreadCount response:", r.data);
      return r.data;
    })
    .catch((error) => {
      console.error(
        "❌ [API] getUnreadCount error:",
        error.response?.data || error.message
      );
      throw error;
    });
};

export const markNotificationAsRead = (notificationId, token) => {
  console.log("🔔 [API] markNotificationAsRead called:", {
    notificationId,
    token: token ? token.substring(0, 20) + "..." : "null",
  });
  return axiosInstance
    .patch(
      `/notifications/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => {
      console.log("🔔 [API] markNotificationAsRead response:", r.data);
      return r.data;
    })
    .catch((error) => {
      console.error(
        "❌ [API] markNotificationAsRead error:",
        error.response?.data || error.message
      );
      throw error;
    });
};

export const markAllNotificationsAsRead = (token) =>
  axiosInstance
    .patch(
      "/notifications/user/1/read-all",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

export const deleteNotification = (notificationId, token) =>
  axiosInstance
    .delete(`/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Register FCM token for admin
export const registerFCMToken = (token, fcmToken) =>
  axiosInstance
    .post(
      "/notifications/register-token",
      {
        token: fcmToken,
        deviceType: "web",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

// Send notification
export const sendNotification = (notificationData, token) =>
  axiosInstance
    .post("/notifications", notificationData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Get users for notification targeting
export const getUsers = (token) =>
  axiosInstance
    .get("/users", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

// Get stored FCM tokens (for debugging)
export const getStoredTokens = (token) =>
  axiosInstance
    .get("/notifications/debug/tokens", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Subscribe user to topic
export const subscribeUserToTopic = (userId, topic, token) =>
  axiosInstance
    .post(
      "/notifications/subscribe-topic",
      { userId, topic },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

// Unsubscribe user from topic
export const unsubscribeUserFromTopic = (userId, topic, token) =>
  axiosInstance
    .post(
      "/notifications/unsubscribe-topic",
      { userId, topic },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

// Get VAPID key
export const getVapidKey = () =>
  axiosInstance.get("/notifications/vapid-key").then((r) => r.data);

// Import products and collections from Excel
export const importExcelFile = async (file, token, onProgress) => {
  try {
    const formData = new FormData();
    formData.append("excelFile", file);

    const response = await axiosInstance.post(
      "/products/import-excel",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Excel import error:", error);
    if (error.response) {
      throw new Error(
        error.response.data.error || "Failed to import Excel file"
      );
    }
    throw error;
  }
};

// MEDIA GALLERY
export const getMediaGallery = (token) =>
  axiosInstance
    .get("/media-gallery/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const getMediaStats = (token) =>
  axiosInstance
    .get("/media-gallery/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const deleteOrphanedFiles = (token) =>
  axiosInstance
    .delete("/media-gallery/orphaned", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const deleteMediaFile = (data, token) =>
  axiosInstance
    .delete("/media-gallery/file", {
      data,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const getFileInfo = (filePath, token) =>
  axiosInstance
    .get(`/media-gallery/file-info/${encodeURIComponent(filePath)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const uploadMediaFile = (formData, token) =>
  axiosInstance
    .post("/media-gallery/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })
    .then((r) => r.data);

export const bulkUploadMediaFiles = (formData, token) =>
  axiosInstance
    .post("/media-gallery/bulk-upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })
    .then((r) => r.data);

export const getAvailableItems = (token) =>
  axiosInstance
    .get("/media-gallery/available-items", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Debug endpoint to check database contents
export const debugDatabaseContents = (token) => {
  console.log("🔍 [API SERVICE] debugDatabaseContents called");
  return axiosInstance
    .get("/media-gallery/debug-database", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      console.log("🔍 [API SERVICE] Debug response:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("❌ [API SERVICE] Debug error:", error);
      throw error;
    });
};

// Get media items with actual processed images from products and categories tables
export const getMediaItemsWithProcessedImages = (token) => {
  console.log("🔍 [API SERVICE] getMediaItemsWithProcessedImages called");
  console.log("🔍 [API SERVICE] Token exists:", !!token);
  console.log(
    "🔍 [API SERVICE] Token preview:",
    token ? token.substring(0, 20) + "..." : "No token"
  );
  console.log(
    "🔍 [API SERVICE] Making request to:",
    `${BASE_URL}/media-gallery/processed-images`
  );

  return axiosInstance
    .get("/media-gallery/processed-images", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      console.log("🔍 [API SERVICE] Raw axios response:", response);
      console.log("🔍 [API SERVICE] Response status:", response.status);
      console.log("🔍 [API SERVICE] Response headers:", response.headers);
      console.log("🔍 [API SERVICE] Response data:", response.data);
      console.log("🔍 [API SERVICE] Response data type:", typeof response.data);
      console.log(
        "🔍 [API SERVICE] Response data keys:",
        response.data ? Object.keys(response.data) : "No data"
      );

      return response.data;
    })
    .catch((error) => {
      console.error(
        "❌ [API SERVICE] Error in getMediaItemsWithProcessedImages:",
        error
      );
      console.error("❌ [API SERVICE] Error response:", error.response);
      console.error("❌ [API SERVICE] Error message:", error.message);
      console.error("❌ [API SERVICE] Error status:", error.response?.status);
      console.error("❌ [API SERVICE] Error data:", error.response?.data);
      throw error;
    });
};

// DASHBOARD API
export const getDashboardStats = (token) =>
  axiosInstance
    .get("/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.data);

export const getTodayOrders = (token) =>
  axiosInstance
    .get("/dashboard/today-orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const getQuickStats = (token) =>
  axiosInstance
    .get("/dashboard/quick-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// STOCK MANAGEMENT
export const updateProductStockStatus = (productId, data, token) =>
  axiosInstance
    .patch(`/products/${productId}/stock-status`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const getProductStockStatus = (productId, token) =>
  axiosInstance
    .get(`/products/${productId}/stock-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const getProductStockHistory = (productId, token) =>
  axiosInstance
    .get(`/products/${productId}/stock-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
