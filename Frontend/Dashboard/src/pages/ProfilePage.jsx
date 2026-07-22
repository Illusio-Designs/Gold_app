import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../utils/authUtils";
import { showErrorToast } from "../utils/toast";
import Badge from "../components/common/Badge";
import PageHeader from "../components/common/PageHeader";
import { User, Mail, ShieldCheck, Clock } from "lucide-react";
import "../styles/pages/ProfilePage.css";

const ProfilePage = () => {
  const [email, setEmail] = useState("");
  const [loginTime, setLoginTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      showErrorToast("Please login to access this page");
      navigate("/auth");
      return;
    }
    // No profile API exists — surface only what is genuinely stored locally.
    const storedEmail =
      localStorage.getItem("admin_email") || localStorage.getItem("adminEmail");
    if (storedEmail) setEmail(storedEmail);

    const storedLogin = localStorage.getItem("admin_login_time");
    if (storedLogin) {
      const ts = Number(storedLogin);
      if (!Number.isNaN(ts)) setLoginTime(new Date(ts).toLocaleString());
    }
  }, [navigate]);

  const name = "Admin";
  const role = "Administrator";

  return (
    <div className="profile-page">
      <PageHeader title="Profile" subtitle="Your account details" icon={User} />

      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-avatar">
            <User size={40} />
          </div>
          <div className="profile-identity">
            <h2 className="profile-name">{name}</h2>
            <Badge tone="brand">{role}</Badge>
          </div>
        </div>

        <ul className="profile-info">
          <li className="profile-info__row">
            <span className="profile-info__icon">
              <User size={18} />
            </span>
            <span className="profile-info__label">Name</span>
            <span className="profile-info__value">{name}</span>
          </li>
          <li className="profile-info__row">
            <span className="profile-info__icon">
              <ShieldCheck size={18} />
            </span>
            <span className="profile-info__label">Role</span>
            <span className="profile-info__value">{role}</span>
          </li>
          {email && (
            <li className="profile-info__row">
              <span className="profile-info__icon">
                <Mail size={18} />
              </span>
              <span className="profile-info__label">Email</span>
              <span className="profile-info__value">{email}</span>
            </li>
          )}
          {loginTime && (
            <li className="profile-info__row">
              <span className="profile-info__icon">
                <Clock size={18} />
              </span>
              <span className="profile-info__label">Last Login</span>
              <span className="profile-info__value">{loginTime}</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProfilePage;
