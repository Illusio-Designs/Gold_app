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
import AuthLayout from "./components/layout/AuthLayout";
// Route pages are code-split (lazy) so the initial bundle stays small.
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const OrdersPage = React.lazy(() => import("./pages/OrdersPage"));
const ProductsPage = React.lazy(() => import("./pages/ProductsPage"));
const UsersPage = React.lazy(() => import("./pages/UsersPage"));
const CategoriesPage = React.lazy(() => import("./pages/CategoriesPage"));
const MediaGalleryPage = React.lazy(() => import("./pages/MediaGalleryPage"));
const SliderPage = React.lazy(() => import("./pages/SliderPage"));
const AccountDeletionPage = React.lazy(() => import("./pages/AccountDeletionPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const HomePage = React.lazy(() => import("./webpage/HomePage"));
const PrivacyPolicy = React.lazy(() => import("./webpage/PrivacyPolicy"));
const DeletePage = React.lazy(() => import("./webpage/DeletePage"));
const ContactUs = React.lazy(() => import("./webpage/ContactUs"));
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
      <React.Suspense
        fallback={
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5D0829",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Loading…
          </div>
        }
      >
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
      </React.Suspense>
    </Router>
  );
}

export default App;
