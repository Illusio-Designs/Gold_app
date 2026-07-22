import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminNotifications } from "../services/adminApiService";
import { showErrorToast } from "../utils/toast";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import Badge from "../components/common/Badge";
import StatCards from "../components/common/StatCards";
import PageHeader from "../components/common/PageHeader";
import { SkeletonTable, SkeletonStats } from "../components/common/Skeleton";
import { BellOff, Bell } from "lucide-react";
import "../styles/pages/NotificationsPage.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      showErrorToast("Please login to access this page");
      navigate("/auth");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        navigate("/auth");
        return;
      }
      const response = await getAdminNotifications(token);
      setNotifications(response?.notifications || []);
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast("Session expired. Please login again");
        navigate("/auth");
        return;
      }
      showErrorToast("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
  };

  const typeTone = (type) => {
    switch (String(type || "").toLowerCase()) {
      case "new_order":
        return "success";
      case "user_registration":
        return "info";
      case "account_deletion":
        return "danger";
      case "alert":
      case "warning":
        return "warning";
      default:
        return "brand";
    }
  };

  const formatType = (type) =>
    String(type || "notification")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const total = notifications.length;
  const unread = notifications.filter((n) => !n.is_read).length;

  const notificationStats = [
    { label: "Total", value: total, tone: "brand" },
    { label: "Unread", value: unread, tone: "warning" },
  ];

  if (loading) {
    return (
      <div className="notifications-page">
        <PageHeader title="Notifications" subtitle="Recent activity across the platform" icon={Bell} />
        <SkeletonStats count={2} />
        <SkeletonTable rows={6} />
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <PageHeader title="Notifications" subtitle="Recent activity across the platform" icon={Bell} />
      <StatCards stats={notificationStats} />

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <BellOff size={40} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => {
            const message = n.message || n.body;
            return (
              <div
                key={n.id}
                className={`notification-card${n.is_read ? "" : " unread"}`}
              >
                <div className="notification-card__main">
                  <div className="notification-card__top">
                    <span className="notification-card__title">{n.title}</span>
                    <Badge tone={typeTone(n.type || n.data?.notificationType)}>
                      {formatType(n.type || n.data?.notificationType)}
                    </Badge>
                  </div>
                  {message && (
                    <p className="notification-card__body">{message}</p>
                  )}
                  <span className="notification-card__date">
                    {formatDate(n.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
