import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import ProductsPage from "./pages/ProductsPage";
import UsersPage from "./pages/UsersPage";
import CategoriesPage from "./pages/CategoriesPage";
import MediaGalleryPage from "./pages/MediaGalleryPage";
import LoginRequestsPage from "./pages/LoginRequestsPage";
import AppVersionsPage from "./pages/AppVersionsPage";
import AppIconsPage from "./pages/AppIconsPage";
import SliderPage from "./pages/SliderPage";
import AuthLayout from "./components/layout/AuthLayout";
import AuthPage from "./pages/AuthPage";
import HomePage from "./webpage/HomePage";
import PrivacyPolicy from "./webpage/PrivacyPolicy";
import DeletePage from "./webpage/DeletePage";
import { isAuthenticated, autoLogout } from "./utils/authUtils";
import { showToast } from "./utils/toast";

// Removed Firebase messaging-related code

// This file previously used Firebase messaging for notifications.

// Session check component that runs inside Router context
function SessionChecker() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check session every minute
    const checkSession = () => {
      const isProtectedRoute = location.pathname.startsWith('/dashboard');
      
      if (isProtectedRoute && !isAuthenticated()) {
        autoLogout(navigate, showToast);
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [navigate, location]);

  return null;
}

function App() {
  // Add test function to global scope for debugging
  useEffect(() => {
    window.testFCM = async () => {
      console.log('[FCM TEST] Starting FCM test...');
      try {
        // The original code had Firebase messaging imports, but they are removed.
        // This function will now cause an error if not adapted.
        // For now, keeping the structure as per instructions.
        // If Firebase messaging is truly removed, this function should be removed.
        // For now, it's kept as a placeholder.
        // const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        // console.log('[FCM TEST] Token:', token);
        // return token;
        console.warn('[FCM TEST] Firebase messaging imports removed. Cannot perform FCM test.');
        return null;
      } catch (error) {
        console.error('[FCM TEST] Error:', error);
        return null;
      }
    };
    
    window.testNotification = () => {
      // The original code had a showCustomNotification function, but it's removed.
      // This function will now cause an error if not adapted.
      // For now, keeping the structure as per instructions.
      // If showCustomNotification is truly removed, this function should be removed.
      // For now, it's kept as a placeholder.
      // showCustomNotification('Test Notification', 'This is a test notification');
      console.warn('[FCM TEST] showCustomNotification function removed. Cannot display notification.');
    };
  }, []);

  return (
    <Router>
      <SessionChecker />
      <Routes>
        {/* Public webpage routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/delete" element={<DeletePage />} />
        
        {/* Public route for authentication */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected routes - require authentication */}
        <Route element={<AuthLayout />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="media-gallery" element={<MediaGalleryPage />} />
            <Route path="login-requests" element={<LoginRequestsPage />} />
            <Route path="app-versions" element={<AppVersionsPage />} />
            <Route path="app-icons" element={<AppIconsPage />} />
            <Route path="sliders" element={<SliderPage />} />
          </Route>
        </Route>
        
        {/* Catch all other routes and redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
