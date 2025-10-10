// Authentication utilities for the dashboard

// Session duration: 24 hours in milliseconds
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Check if user is authenticated and session is valid
 * @returns {boolean} - True if user is authenticated and session is valid
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("admin_token");
  const loginTime = localStorage.getItem("admin_login_time");
  
  if (!token) {
    return false;
  }
  
  // Check if token is expired (JWT validation)
  if (isTokenExpired(token)) {
    return false;
  }
  
  // Check if session duration has exceeded 24 hours
  if (loginTime) {
    const loginTimestamp = parseInt(loginTime, 10);
    const currentTime = Date.now();
    
    if (currentTime - loginTimestamp > SESSION_DURATION) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get admin token
 * @returns {string|null} - Admin token or null
 */
export const getAdminToken = () => {
  return localStorage.getItem("admin_token");
};

/**
 * Set admin token and login timestamp
 * @param {string} token - Admin token
 */
export const setAdminToken = (token) => {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_login_time", Date.now().toString());
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_login_time");
  localStorage.removeItem("admin_user");
  localStorage.removeItem("notification_settings");
};

/**
 * Logout user with confirmation
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
 * Auto logout without confirmation (for expired sessions)
 * @param {Function} navigate - React Router navigate function
 * @param {Function} showToast - Toast notification function
 */
export const autoLogout = (navigate, showToast = null) => {
  clearAuthData();
  
  // Show session expired notification
  if (showToast) {
    showToast("Your session has expired. Please login again.", "warning", "Session Expired");
  }
  
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

/**
 * Get remaining session time in milliseconds
 * @returns {number} - Remaining session time or 0 if expired
 */
export const getRemainingSessionTime = () => {
  const loginTime = localStorage.getItem("admin_login_time");
  
  if (!loginTime) {
    return 0;
  }
  
  const loginTimestamp = parseInt(loginTime, 10);
  const currentTime = Date.now();
  const elapsed = currentTime - loginTimestamp;
  const remaining = SESSION_DURATION - elapsed;
  
  return remaining > 0 ? remaining : 0;
}; 