// SEO Service for fetching SEO data
import axios from "axios";

// Prioritize DEV mode - use /api for local development
const BASE_URL = import.meta.env.DEV 
  ? "/api" 
  : (import.meta.env.VITE_API_BASE_URL || "https://api.amrutkumargovinddasllp.com/api");

console.log("🔧 [SEO SERVICE] Configuration:", {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  DEV: import.meta.env.DEV,
  BASE_URL: BASE_URL,
  MODE: import.meta.env.MODE
});

// Create axios instance for SEO API calls
const seoAxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging
seoAxiosInstance.interceptors.request.use(
  (config) => {
    console.log("🔍 [SEO API] Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ [SEO API] Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
seoAxiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ [SEO API] Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ [SEO API] Response error:", error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

// Fetch SEO data by page URL
export const getSEOByPageUrl = (pageUrl) =>
  seoAxiosInstance
    .get(`/seo?page_url=${encodeURIComponent(pageUrl)}`)
    .then((response) => {
      console.log("📄 [SEO API] SEO data response:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("❌ [SEO API] Error fetching SEO data:", error);
      console.error("❌ [SEO API] Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    });

export default seoAxiosInstance;

