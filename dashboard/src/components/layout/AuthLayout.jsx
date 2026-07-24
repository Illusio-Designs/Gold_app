import React, { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { isAuthenticated, autoLogout } from "../../utils/authUtils";
import { showToast } from "../../utils/toast";

const AuthLayout = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  useEffect(() => {
    // If not authenticated when component mounts, auto logout with notification
    if (!authenticated) {
      const token = localStorage.getItem("admin_token");
      // Only show session expired message if there was a token (means it expired)
      if (token) {
        autoLogout(navigate, showToast);
      }
    }
  }, [authenticated, navigate]);

  return authenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default AuthLayout;
