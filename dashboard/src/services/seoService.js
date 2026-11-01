// SEO Service for fetching SEO data
import axios from "axios";

// Prioritize DEV mode - use /api for local development
const BASE_URL = import.meta.env.DEV 
  ? "/api" 
  : (import.meta.env.VITE_API_BASE_URL || "https://api.amrutkumargovinddasllp.com/api");

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
  (config) => config,
  (error) => {
    console.error("❌ [SEO API] Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
seoAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ [SEO API] Response error:", error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

// Fetch SEO data by page URL
export const getSEOByPageUrl = (pageUrl) =>
  seoAxiosInstance
    .get(`/seo?page_url=${encodeURIComponent(pageUrl)}`)
    .then((response) => response.data);

export default seoAxiosInstance;

