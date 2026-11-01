import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/adminApiService";
import { isAuthenticated, setAdminToken, clearAuthData } from "../utils/authUtils";
import { showSuccessToast, showInfoToast } from "../utils/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import "../styles/pages/AuthPage.css";
import loginLogo from "../assests/loginlogo.png";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, go straight to the dashboard
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    // Otherwise clear any stale/expired auth data on the login page
    clearAuthData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await adminLogin({ email, password });
      setAdminToken(res.token);
      if (res.user) {
        localStorage.setItem("admin_user", JSON.stringify(res.user));
      }

      showSuccessToast("Welcome back! You have successfully logged in.", "Login Successful");

      // Small delay so the toast is visible before navigating
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    showInfoToast(
      "Please contact your administrator to reset your password.",
      "Password help"
    );
  };

  return (
    <div className="auth-page">
      {/* Brand panel */}
      <aside className="auth-brand">
        <div className="auth-brand__top">
          <img src={loginLogo} alt="Amrut Jewels" className="auth-brand__logo" />
          <span className="auth-brand__wordmark">
            <b>Amrut Jewels</b>
            <span>Admin Console</span>
          </span>
        </div>

        <div className="auth-brand__mid">
          <h1>
            Where every order is <em>crafted</em> with care.
          </h1>
          <p>
            Manage your wholesale catalogue, orders and firms from one refined
            console — built for Amrutkumar Govardhandas LLP.
          </p>
          <div className="auth-brand__badges">
            <span className="auth-badge">B2B Wholesale</span>
            <span className="auth-badge">Secure Access</span>
          </div>
        </div>

        <div className="auth-brand__bot">
          <span>© {new Date().getFullYear()} Amrutkumar Govardhandas LLP</span>
        </div>
      </aside>

      {/* Form */}
      <main className="auth-pane">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="auth-eyebrow">Welcome back</p>
          <h2 className="auth-title">Sign in to continue</h2>
          <p className="auth-sub">Use your admin credentials to access the dashboard.</p>

          <div className="auth-field">
            <label htmlFor="auth-email">Email address</label>
            <div className="auth-input">
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="you@amrutjewels.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input">
              <input
                id="auth-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <HugeiconsIcon
                  icon={showPw ? ViewOffSlashIcon : ViewIcon}
                  size={20}
                />
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-row">
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <a className="auth-link" href="#" onClick={handleForgot}>
              Forgot password?
            </a>
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="auth-foot">Protected area · Authorised staff only</p>
        </form>
      </main>
    </div>
  );
};

export default AuthPage;
