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
import AppVersionsPage from "./pages/AppVersionsPage";
import AppIconsPage from "./pages/AppIconsPage";
import SliderPage from "./pages/SliderPage";
import AccountDeletionPage from "./pages/AccountDeletionPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AuthLayout from "./components/layout/AuthLayout";
import AuthPage from "./pages/AuthPage";
import HomePage from "./webpage/HomePage";
import PrivacyPolicy from "./webpage/PrivacyPolicy";
import DeletePage from "./webpage/DeletePage";
import ContactUs from "./webpage/ContactUs";
import { isAuthenticated, autoLogout } from "./utils/authUtils";
import { showToast } from "./utils/toast";
import ToastManager from "./components/common/ToastManager";

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
  return (
    <Router>
      <SessionChecker />
      {/* Mounted at the root so login/logout/session toasts render on every
          route, not only inside the dashboard. */}
      <ToastManager />
      <Routes>
        {/* Public webpage routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/delete" element={<DeletePage />} />
        <Route path="/contact" element={<ContactUs />} />
        
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
            <Route path="app-versions" element={<AppVersionsPage />} />
            <Route path="app-icons" element={<AppIconsPage />} />
            <Route path="sliders" element={<SliderPage />} />
            <Route path="account-deletion" element={<AccountDeletionPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
        
        {/* Catch all other routes and redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
