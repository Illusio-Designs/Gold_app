// Authentication utilities for the dashboard

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("admin_token");
  return !!token;
};

/**
 * Get admin token
 * @returns {string|null} - Admin token or null
 */
export const getAdminToken = () => {
  return localStorage.getItem("admin_token");
};

/**
 * Set admin token
 * @param {string} token - Admin token
 */
export const setAdminToken = (token) => {
  localStorage.setItem("admin_token", token);
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  localStorage.removeItem("notification_settings");
};

/**
 * Logout user
 * @param {Function} navigate - React Router navigate function
 */
export const logout = (navigate) => {
  const confirmed = window.confirm("Are you sure you want to logout?");
  if (!confirmed) {
    return;
  }
  
  clearAuthData();
  
  if (navigate) {
    navigate("/auth", { replace: true });
  } else {
    window.location.href = "/auth";
  }
};

/**
 * Validate token format (basic validation)
 * @param {string} token - Token to validate
 * @returns {boolean} - True if token format is valid
 */
export const validateTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Check if token is expired (if it's a JWT)
 * @param {string} token - Token to check
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
  try {
    if (!validateTokenFormat(token)) {
      return true;
    }
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}; 