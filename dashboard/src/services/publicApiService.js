// Public API Service for Homepage (no authentication required)
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "https://api.amrutkumargovinddasllp.com/api");

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
  (config) => config,
  (error) => {
    console.error("❌ [PUBLIC API] Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
publicAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ [PUBLIC API] Response error:", error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

// PUBLIC — submit an account deletion request from the website /delete form.
export const submitAccountDeletionRequest = (data) =>
  publicAxiosInstance
    .post("/account-deletion/request", data)
    .then((response) => response.data);

// PUBLIC CATEGORIES API (no authentication required)
export const getPublicCategories = () =>
  publicAxiosInstance
    .get("/categories")
    .then((response) => {
      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response.data && Array.isArray(response.data.categories)) {
        return response.data.categories;
      }
      console.warn("⚠️ [PUBLIC API] Unexpected response format:", response.data);
      return [];
    });

// PUBLIC PRODUCTS API (no authentication required)
export const getPublicProducts = () =>
  publicAxiosInstance
    .get("/products")
    .then((response) => response.data);

// PUBLIC SLIDERS API (no authentication required)
export const getPublicSliders = () =>
  publicAxiosInstance
    .get("/sliders")
    .then((response) => response.data);

export default publicAxiosInstance;
