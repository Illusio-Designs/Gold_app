import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAccountDeletionRequests,
  getAccountDeletionStats,
  updateAccountDeletionStatus,
} from "../services/adminApiService";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import StatCards from "../components/common/StatCards";
import { SkeletonTable, SkeletonStats } from "../components/common/Skeleton";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

const AccountDeletionPage = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
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
      const [list, statistics] = await Promise.all([
        getAccountDeletionRequests(token),
        getAccountDeletionStats(token),
      ]);
      setRequests(list?.requests || []);
      setStats(statistics || {});
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast("Session expired. Please login again");
        navigate("/auth");
        return;
      }
      showErrorToast("Failed to load account deletion requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = getAdminToken();
      if (!token) {
        navigate("/auth");
        return;
      }
      await updateAccountDeletionStatus(id, status, token);
      showSuccessToast(`Request marked as ${status}`);
      loadData();
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast("Session expired. Please login again");
        navigate("/auth");
        return;
      }
      showErrorToast("Failed to update request");
    }
  };

  const formatRequestId = (id) => `DEL-${String(id ?? "").padStart(6, "0")}`;

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusTone = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "processed":
        return "success";
      case "rejected":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "neutral";
    }
  };

  const deletionStats = [
    { label: "Total Requests", value: stats.total || 0, tone: "brand" },
    { label: "Pending", value: stats.pending || 0, tone: "warning" },
    { label: "Processed", value: stats.processed || 0, tone: "success" },
    { label: "Rejected", value: stats.rejected || 0, tone: "danger" },
  ];

  const columns = [
    {
      header: "Request ID",
      accessor: "id",
      cell: (row) => (
        <span style={{ fontWeight: 600, color: "var(--brand)" }}>
          {formatRequestId(row.id)}
        </span>
      ),
    },
    {
      header: "User",
      accessor: "user_name",
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--brand)" }}>
            {row.user_name || "N/A"}
          </div>
          {row.business_name && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {row.business_name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Mobile",
      accessor: "mobile_number",
      cell: (row) => (
        <a href={`tel:${row.mobile_number}`} style={{ color: "var(--brand)" }}>
          {row.mobile_number || "N/A"}
        </a>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: "Requested",
      accessor: "created_at",
      cell: (row) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => {
        const status = String(row.status || "").toLowerCase();
        return (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {status !== "processed" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusUpdate(row.id, "processed")}
                title="Mark as processed"
              >
                <CheckCircle2 size={15} /> Processed
              </Button>
            )}
            {status !== "rejected" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleStatusUpdate(row.id, "rejected")}
                title="Reject request"
              >
                <XCircle size={15} /> Reject
              </Button>
            )}
            {status !== "pending" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusUpdate(row.id, "pending")}
                title="Reset to pending"
              >
                <RotateCcw size={15} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="account-deletion-page">
        <SkeletonStats count={4} />
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="account-deletion-page">
      <StatCards stats={deletionStats} />
      <TableWithControls
        columns={columns}
        data={requests}
        searchFields={["user_name", "business_name", "mobile_number"]}
        pageTitle="Account Deletion Requests"
        loading={loading}
      />
    </div>
  );
};

export default AccountDeletionPage;
