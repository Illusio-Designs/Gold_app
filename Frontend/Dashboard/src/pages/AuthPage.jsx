import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/adminApiService";
import { isAuthenticated, setAdminToken } from "../utils/authUtils";
import "../styles/pages/AuthPage.css";
import shreenathji from "../assests/shreenathji.png";
import rightCow from "../assests/rightcow.png";
import loginLogo from "../assests/loginlogo.png";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      // Redirect to dashboard if already logged in
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await adminLogin({ email, password });
      setAdminToken(res.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <img src={shreenathji} alt="Shreenathji" className="auth-shreenathji" />
        <p className="auth-company-name">AMRUTKUMAR GOVINDDAS LLP</p>
      </div>
      <div className="auth-right-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-header">
            <div className="auth-logo">
              <img src={loginLogo} alt="Amrut Jewels Logo" />
            </div>
            <h2 className="auth-title">Admin Login</h2>
          </div>
          <div className="auth-fields">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <img src={rightCow} alt="Decoration" className="auth-cow" />
      </div>
    </div>
  );
};

export default AuthPage;
