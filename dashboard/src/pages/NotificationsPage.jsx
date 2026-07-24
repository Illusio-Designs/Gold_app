import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminNotifications } from "../services/adminApiService";
import { showErrorToast } from "../utils/toast";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import Badge from "../components/common/Badge";
import StatCards from "../components/common/StatCards";
import PageHeader from "../components/common/PageHeader";
import TableWithControls from "../components/common/TableWithControls";
import { SkeletonTable, SkeletonStats } from "../components/common/Skeleton";
import { Bell } from "lucide-react";
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

  const columns = [
    {
      header: "Notification",
      accessor: "title",
      cell: (row) => (
        <div className="notif-cell">
          {!row.is_read && <span className="notif-dot" title="Unread" />}
          <div>
            <div className="notif-cell__title">{row.title || "—"}</div>
            {(row.message || row.body) && (
              <div className="notif-cell__body">{row.message || row.body}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      cell: (row) => (
        <Badge tone={typeTone(row.type || row.data?.notificationType)}>
          {formatType(row.type || row.data?.notificationType)}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: "is_read",
      cell: (row) => (
        <Badge tone={row.is_read ? "neutral" : "warning"}>
          {row.is_read ? "Read" : "Unread"}
        </Badge>
      ),
    },
    {
      header: "Date",
      accessor: "created_at",
      cell: (row) => (
        <span className="notif-date">{formatDate(row.created_at)}</span>
      ),
    },
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
      <TableWithControls
        columns={columns}
        data={notifications}
        searchFields={["title", "message", "body", "type"]}
        pageTitle="All Notifications"
        loading={loading}
      />
    </div>
  );
};

export default NotificationsPage;
