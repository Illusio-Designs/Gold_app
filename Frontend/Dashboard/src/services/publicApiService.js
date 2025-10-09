// Public API Service for Homepage (no authentication required)
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "https://amrutkumargovinddasllp.com/api");

// Create axios instance for public API calls
const publicAxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging
publicAxiosInstance.interceptors.request.use(
  (config) => {
    console.log("🌐 [PUBLIC API] Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ [PUBLIC API] Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
publicAxiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ [PUBLIC API] Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ [PUBLIC API] Response error:", error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

// PUBLIC CATEGORIES API (no authentication required)
export const getPublicCategories = () =>
  publicAxiosInstance
    .get("/categories")
    .then((response) => {
      console.log("📂 [PUBLIC API] Categories response:", response.data);
      console.log("📂 [PUBLIC API] Response status:", response.status);
      console.log("📂 [PUBLIC API] Response headers:", response.headers);
      
      // Handle different response formats
      let categories = [];
      
      if (response.data && Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      } else if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
        categories = response.data.categories;
      } else {
        console.warn("⚠️ [PUBLIC API] Unexpected response format:", response.data);
        return [];
      }
      
      // Log image URLs for debugging
      categories.forEach((category, index) => {
        console.log(`📸 [PUBLIC API] Category ${index + 1}:`, {
          name: category.name,
          image_url: category.image_url,
          processed_image_url: category.processed_image_url,
          final_image: category.processed_image_url || category.image_url
        });
      });
      
      return categories;
    })
    .catch((error) => {
      console.error("❌ [PUBLIC API] Error fetching categories:", error);
      console.error("❌ [PUBLIC API] Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    });

// PUBLIC PRODUCTS API (no authentication required)
export const getPublicProducts = () =>
  publicAxiosInstance
    .get("/products")
    .then((response) => {
      console.log("📦 [PUBLIC API] Products response:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("❌ [PUBLIC API] Error fetching products:", error);
      throw error;
    });

// PUBLIC SLIDERS API (no authentication required)
export const getPublicSliders = () =>
  publicAxiosInstance
    .get("/sliders")
    .then((response) => {
      console.log("🎠 [PUBLIC API] Sliders response:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("❌ [PUBLIC API] Error fetching sliders:", error);
      throw error;
    });

export default publicAxiosInstance;
