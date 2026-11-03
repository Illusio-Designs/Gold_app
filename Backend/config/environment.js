// Environment Configuration
// Update this file when changing IP addresses or ports
require("dotenv").config();

const config = {
  // Server Configuration
  SERVER: {
    PORT: process.env.PORT || 3001,
    HOST: process.env.HOST || "0.0.0.0",
  },

  // Database Configuration
  DATABASE: {
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DATABASE: process.env.DB_NAME,
    PORT: process.env.DB_PORT || 3306,
  },

  // Base URLs for different environments
  BASE_URLS: {
    DEVELOPMENT: "http://localhost:3001",
    LAN: "http://192.168.1.14:3001",
    PRODUCTION:
      process.env.BASE_URL ||
      process.env.PRODUCTION_URL ||
      "https://api.amrutkumargovinddasllp.com",
  },

  // CORS Origins
  CORS_ORIGINS: [
    "http://localhost:3000", // Dashboard development (webpack)
    "http://localhost:5173", // Dashboard development (Vite)
    "http://localhost:8081", // React Native development
    "http://192.168.1.14:8081", // React Native on LAN
    "http://192.168.1.14:3001",
    "https://api.amrutkumargovinddasllp.com",
    "https://amrutkumargovinddasllp.com",
    "https://www.amrutkumargovinddasllp.com",
    // Add production domains here
  ],

  // File Upload Paths
  UPLOAD_PATHS: {
    PRODUCTS: "/uploads/products",
    CATEGORIES: "/uploads/categories",
    PROFILE: "/uploads/profile",
  },

  // Image Processing
  IMAGE_PROCESSING: {
    TIMEOUT: 30000,
    QUALITY: 80,
    FORMAT: "webp",
  },

  // RG jewelry ERP stock feed. The catalog (products/categories/images) comes
  // live from this API and is NOT stored in our DB. Server-side only — the API
  // key must never reach the mobile app. Host/company are non-secret defaults;
  // the key comes from env (RG_API_KEY) or is passed by an admin when testing.
  ERP: {
    STOCK_API_URL:
      process.env.RG_API_URL ||
      "http://183.83.240.52:17800/Ws/API_RG_GetAllStock",
    API_KEY: process.env.RG_API_KEY || "",
    COMPANY_ID: process.env.RG_COMPANY_ID || 1,
    // Optional override if product images are served from a different host/port
    // than the API (e.g. "http://183.83.240.52:8080"). Blank = same host as API.
    IMAGE_BASE_URL: process.env.RG_IMAGE_BASE_URL || "",
  },
};

// Helper function to get base URL based on environment
function getBaseUrl() {
  // Log for debugging
  if (process.env.NODE_ENV === "production") {
    return config.BASE_URLS.PRODUCTION;
  }

  // Check if running on LAN
  if (process.env.LAN_MODE === "true" || process.env.USE_LAN === "true") {
    return config.BASE_URLS.LAN;
  }

  return config.BASE_URLS.DEVELOPMENT;
}

// Helper function to get CORS origins
function getCorsOrigins() {
  return config.CORS_ORIGINS;
}

module.exports = {
  config,
  getBaseUrl,
  getCorsOrigins,
};
