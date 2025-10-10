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
    // Add production domains here
  ],

  // File Upload Paths
  UPLOAD_PATHS: {
    PRODUCTS: "/uploads/products",
    CATEGORIES: "/uploads/categories",
    PROFILE: "/uploads/profile",
    APP_ICONS: "/uploads/app-icons",
  },

  // Image Processing
  IMAGE_PROCESSING: {
    TIMEOUT: 30000,
    QUALITY: 80,
    FORMAT: "webp",
  },
};

// Helper function to get base URL based on environment
function getBaseUrl() {
  // Log for debugging
  console.log("Environment Check:", {
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: process.env.BASE_URL,
    PRODUCTION_URL: process.env.PRODUCTION_URL,
  });

  if (process.env.NODE_ENV === "production") {
    console.log("✅ Using PRODUCTION URL:", config.BASE_URLS.PRODUCTION);
    return config.BASE_URLS.PRODUCTION;
  }

  // Check if running on LAN
  if (process.env.LAN_MODE === "true" || process.env.USE_LAN === "true") {
    console.log("Using LAN URL:", config.BASE_URLS.LAN);
    return config.BASE_URLS.LAN;
  }

  console.log("Using DEVELOPMENT URL:", config.BASE_URLS.DEVELOPMENT);
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
