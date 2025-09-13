import React, { useState, useEffect } from "react";
import { Edit, Check, Trash2 } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import "../styles/pages/LoginRequestsPage.css";
import {
  getAllLoginRequests,
  updateLoginRequest,
  getAllUsers,
  getAllCategories,
} from "../services/adminApiService";

// All possible statuses for filtering and display
const allStatusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "logged_in", label: "Logged In" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
];
// Only allow admin to set 'approved' or 'rejected' in the modal
const statusOptions = [
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const LoginRequestsPage = () => {
  const [loginRequests, setLoginRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [form, setForm] = useState({
    user_id: "",
    category_id: "",
    remarks: "",
    status: "",
    session_time_minutes: "",
  });

  const userOptions = [
    { value: "", label: "All Users" },
    ...users.map((user) => ({
      value: user.id,
      label: `${user.name} (${user.business_name || user.email})`,
    })),
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...(Array.isArray(categories) ? categories : []).map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  const userMap = Object.fromEntries(
    users.map((user) => [
      user.id,
      `${user.name} (${user.business_name || user.email})`,
    ])
  );

  // Map category IDs to names for display
  const categoryMap = Object.fromEntries(
    (Array.isArray(categories) ? categories : []).map((cat) => [
      String(cat.id),
      cat.name,
    ])
  );

  // Helper to display category names for a request
  const getCategoryNames = (category_ids) => {
    if (!category_ids) return "";
    try {
      // Try to parse as JSON first
      const categoryIds = JSON.parse(category_ids);
      if (Array.isArray(categoryIds)) {
        return categoryIds
          .map((id) => categoryMap[String(id)] || String(id))
          .join(", ");
      }
    } catch (e) {
      // Fallback to comma-separated string
      return category_ids
        .split(",")
        .map((id) => categoryMap[id.trim()] || id.trim())
        .join(", ");
    }
    return category_ids;
  };

  // Table shows summary fields only
  const columns = [
    // { header: "ID", accessor: "id" }, // Remove ID column
    {
      header: "User",
      accessor: "user_id",
      cell: (row) => userMap[row.user_id] || row.user_id,
    },
    {
      header: "Categories",
      accessor: "category_ids",
      cell: (row) => getCategoryNames(row.category_ids),
    },
    { header: "Status", accessor: "status" },
    { header: "Session Time (min)", accessor: "session_time_minutes" },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditRequest(row);
              setForm({
                user_id: row.user_id || "",
                category_id: row.category_id || "",
                remarks: row.remarks || "",
                status: row.status || "",
                session_time_minutes: row.session_time_minutes || "",
              });
              setModalOpen(true);
            }}
            tooltip="Edit"
          >
            <Edit size={16} />
          </Button>
          {/* Remove Approve button */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteRequest(row)}
            tooltip="Delete"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("admin_token");
        const [requestsData, usersData, categoriesData] = await Promise.all([
          getAllLoginRequests(token),
          getAllUsers(token),
          getAllCategories(token),
        ]);
        setLoginRequests(requestsData.requests || requestsData); // <-- use the array from the API response
        setUsers(usersData.data || usersData);
        setCategories(categoriesData.data || categoriesData);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const inputStyle = {
    background: "#f9f2e7",
    borderColor: "#c09e83",
    color: "#5d0829",
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      await updateLoginRequest(
        editRequest.id,
        {
          status: form.status,
          remarks: form.remarks,
          sessionTimeMinutes: Number(form.session_time_minutes),
        },
        token
      );

      setModalOpen(false);
      setEditRequest(null);
      setForm({
        user_id: "",
        category_id: "",
        remarks: "",
        status: "",
        session_time_minutes: "",
      });

      // Refresh requests
      const data = await getAllLoginRequests(token);
      setLoginRequests(data.requests);
    } catch (err) {
      setError("Failed to save login request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      await updateLoginRequest(
        request.id,
        {
          status: "approved",
          remarks: request.remarks || "Approved by admin",
          sessionTimeMinutes: request.session_time_minutes || 60,
        },
        token
      );

      // Refresh requests
      const data = await getAllLoginRequests(token);
      setLoginRequests(data.requests);
    } catch (err) {
      setError("Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      await updateLoginRequest(
        deleteRequest.id,
        {
          status: "denied",
          remarks: "Request denied by admin",
          sessionTimeMinutes: 0,
        },
        token
      );

      setDeleteRequest(null);

      // Refresh requests
      const data = await getAllLoginRequests(token);
      setLoginRequests(data.requests);
    } catch (err) {
      setError("Failed to deny request");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setEditRequest(null);
    setForm({
      user_id: "",
      category_id: "",
      remarks: "",
      status: "",
      session_time_minutes: "",
    });
  };

  // TableWithControls filter state fix for status
  const [selectedStatus, setSelectedStatus] = useState(allStatusOptions[0]);

  return (
    <div className="login-requests-page">
      <TableWithControls
        columns={columns}
        data={loginRequests}
        searchFields={["user_id", "category_id", "status"]}
        pageTitle="Login Requests Management"
        filters={[
          {
            key: "status",
            options: allStatusOptions,
            value: selectedStatus,
            onChange: (option) => setSelectedStatus(option),
            placeholder: "Filter by status",
          },
          {
            key: "user_id",
            options: userOptions,
            placeholder: "Filter by user",
          },
          {
            key: "category_id",
            options: categoryOptions,
            placeholder: "Filter by category",
          },
        ]}
        itemsPerPage={10}
        errorMessage={error}
      />
      {loading && <div>Loading login requests...</div>}
      {!loading && loginRequests.length === 0 && !error && (
        <div>No login requests found.</div>
      )}
      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editRequest ? "Edit Login Request" : "Add Login Request"}
      >
        <div className="modal-field">
          <label>User</label>
          <div className="readonly-value">
            {userMap[form.user_id] || form.user_id}
          </div>
        </div>
        <div className="modal-field">
          <label>Category</label>
          <div className="readonly-value">
            {categoryMap[form.category_id] || form.category_id}
          </div>
        </div>
        <InputField
          label="Remarks"
          name="remarks"
          placeholder="Enter remarks"
          value={form.remarks}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <DropdownSelect
          label="Status"
          name="status"
          options={statusOptions}
          value={form.status}
          onChange={(option) =>
            setForm((prev) => ({ ...prev, status: option.value }))
          }
          style={inputStyle}
        />
        <select
          label="Session Time (min)"
          name="session_time_minutes"
          value={form.session_time_minutes}
          onChange={handleInputChange}
          style={{
            ...inputStyle,
            width: "100%",
            padding: "8px",
            fontSize: "16px",
            marginBottom: "12px",
          }}
        >
          <option value="">Select session time</option>
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="120">2 hours</option>
          <option value="240">4 hours</option>
          <option value="480">8 hours</option>
        </select>
        <div className="modal-actions">
          <Button onClick={handleSave} variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={!!deleteRequest}
        onClose={() => setDeleteRequest(null)}
        title="Deny Login Request"
      >
        <p>
          Are you sure you want to deny login request <b>{deleteRequest?.id}</b>
          ?
        </p>
        <div className="modal-actions">
          <Button onClick={handleDelete} variant="danger" disabled={loading}>
            {loading ? "Denying..." : "Deny"}
          </Button>
          <Button onClick={() => setDeleteRequest(null)} variant="secondary">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LoginRequestsPage;
