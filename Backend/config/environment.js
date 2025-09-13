// Environment Configuration
// Update this file when changing IP addresses or ports

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
    LAN: "http://172.20.10.10:3001",
    PRODUCTION: process.env.PRODUCTION_URL || "https://yourdomain.com",
  },

  // CORS Origins
  CORS_ORIGINS: [
    "http://localhost:3000", // Dashboard development
    "http://localhost:8081", // React Native development
    "http://172.20.10.10:3000", // Dashboard on LAN
    "http://172.20.10.10:8081", // React Native on LAN
    "http://172.20.10.10:3001",
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
