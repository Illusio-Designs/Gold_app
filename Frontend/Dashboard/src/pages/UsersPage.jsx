import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, RefreshCw } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import { getProfileImageUrl } from "../utils/imageUtils";
import "../styles/pages/UsersPage.css";
import {
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../services/adminApiService";

const userTypes = [
  { value: "", label: "All Types" },
  { value: "admin", label: "Admin" },
  { value: "business", label: "Business" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "denied", label: "Denied" },
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [form, setForm] = useState({
    type: "",
    name: "",
    email: "",
    password: "",
    image: null,
    phone_number: "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    state: "",
    city: "",
    country: "",
    gst_number: "",
    pan_number: "",
    business_name: "",
    status: "",
    remarks: "",
  });

  // Table shows summary fields only
  const columns = [
    { header: "Type", accessor: "type" },
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Image",
      accessor: "image",
      cell: (row) => {
        if (!row.image) {
          return (
            <span style={{ color: "#999", fontSize: "12px" }}>No image</span>
          );
        }

        return (
          <img
            src={getProfileImageUrl(row.image)}
            alt={row.name}
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: "4px",
            }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML =
                '<span style="color: #999; font-size: 12px;">Error</span>';
            }}
          />
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => {
        const status = row.status || "";
        let color = "#aaa";
        if (status === "approved") color = "#4caf50";
        else if (status === "pending") color = "#ff9800";
        else if (status === "rejected") color = "#f44336";
        else if (status === "denied") color = "#9c27b0";
        return (
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: "12px",
              background: color + "22",
              color,
              fontWeight: 600,
              fontSize: 13,
              minWidth: 70,
              textAlign: "center",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    { header: "City", accessor: "city" },
    { header: "Business Name", accessor: "business_name" },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditUser(row);
              setForm({
                type: row.type || "",
                name: row.name || "",
                email: row.email || "",
                password: "",
                image: null,
                phone_number: row.phone_number || "",
                address_line1: row.address_line1 || "",
                address_line2: row.address_line2 || "",
                landmark: row.landmark || "",
                state: row.state || "",
                city: row.city || "",
                country: row.country || "",
                gst_number: row.gst_number || "",
                pan_number: row.pan_number || "",
                business_name: row.business_name || "",
                status: row.status || "",
                remarks: row.remarks || "",
              });
              setImagePreview(row.image ? getProfileImageUrl(row.image) : "");
              setModalOpen(true);
            }}
            tooltip="Edit"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteUser(row)}
            tooltip="Delete"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const cityOptions = useMemo(
    () => [
      { value: "", label: "All Cities" },
      ...Array.from(new Set((users || []).map((u) => u.city)))
        .filter(Boolean)
        .map((city) => ({ value: city, label: city })),
    ],
    [users]
  );

  // Consistent color styling for all fields
  const inputStyle = {
    background: "#f9f2e7",
    borderColor: "#c09e83",
    color: "#5d0829",
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      console.log("🔄 Fetching users...");
      console.log("🔄 Token:", token ? "Present" : "Missing");
      const data = await getAllUsers(token);
      console.log("✅ Users fetched:", data);
      console.log("✅ Users count:", data.length);
      console.log("✅ Users data:", JSON.stringify(data, null, 2));
      setUsers(data);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      console.error("❌ Error details:", err.response?.data);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      setImagePreview(file ? URL.createObjectURL(file) : "");
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDropdownChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : "";
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!form.name || form.name.trim() === "") {
        setError("Name is required");
        return;
      }
      if (!form.email || form.email.trim() === "") {
        setError("Email is required");
        return;
      }
      if (!editUser && (!form.password || form.password.trim() === "")) {
        setError("Password is required for new users");
        return;
      }

      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setError("Authentication required. Please login again.");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("type", form.type);
      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim());
      if (form.password) {
        formData.append("password", form.password);
      }
      if (form.image) {
        formData.append("image", form.image);
      }
      formData.append("phone_number", form.phone_number || "");
      formData.append("address_line1", form.address_line1 || "");
      formData.append("address_line2", form.address_line2 || "");
      formData.append("landmark", form.landmark || "");
      formData.append("state", form.state || "");
      formData.append("city", form.city || "");
      formData.append("country", form.country || "");
      formData.append("gst_number", form.gst_number || "");
      formData.append("pan_number", form.pan_number || "");
      formData.append("business_name", form.business_name || "");
      formData.append("status", form.status || "");
      formData.append("remarks", form.remarks || "");

      if (editUser) {
        console.log("🔄 Updating user with ID:", editUser.id);
        console.log("🔄 Update data:", Object.fromEntries(formData.entries()));
        const updateResult = await updateUser(editUser.id, formData, token);
        console.log("✅ User update response:", updateResult);
        console.log("✅ User updated successfully, refreshing user list...");
        setError(""); // Clear any previous errors
      } else {
        console.log("🔄 Creating new user...");
        const createResult = await createUser(formData, token);
        console.log("✅ User create response:", createResult);
        console.log("✅ User created successfully, refreshing user list...");
        setError(""); // Clear any previous errors
      }

      setModalOpen(false);
      setEditUser(null);
      setForm({
        type: "",
        name: "",
        email: "",
        password: "",
        image: null,
        phone_number: "",
        address_line1: "",
        address_line2: "",
        landmark: "",
        state: "",
        city: "",
        country: "",
        gst_number: "",
        pan_number: "",
        business_name: "",
        status: "",
        remarks: "",
      });
      setImagePreview("");

      // Refresh users to show updated data
      console.log("🔄 Refreshing user list after update...");
      await fetchUsers();
      console.log("✅ User list refresh completed");
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err.response?.data?.error || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      await deleteUser(deleteUser.id, token);
      setDeleteUser(null);

      // Refresh users
      await fetchUsers();
    } catch (err) {
      setError("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setEditUser(null);
    setForm({
      type: "",
      name: "",
      email: "",
      password: "",
      image: null,
      phone_number: "",
      address_line1: "",
      address_line2: "",
      landmark: "",
      state: "",
      city: "",
      country: "",
      gst_number: "",
      pan_number: "",
      business_name: "",
      status: "",
      remarks: "",
    });
    setImagePreview("");
  };

  // Show loading state while data is being fetched
  if (loading && !users.length) {
    return (
      <div className="users-page">
        <div className="page-header">
          <h1>User Management</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error && !users.length) {
    return (
      <div className="users-page">
        <div className="page-header">
          <h1>User Management</h1>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <TableWithControls
        columns={columns}
        data={users}
        searchFields={["name", "email", "city", "business_name"]}
        pageTitle="User Management"
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
              tooltip="Refresh user list"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditUser(null);
                setForm({
                  type: "",
                  name: "",
                  email: "",
                  password: "",
                  image: null,
                  phone_number: "",
                  address_line1: "",
                  address_line2: "",
                  landmark: "",
                  state: "",
                  city: "",
                  country: "",
                  gst_number: "",
                  pan_number: "",
                  business_name: "",
                  status: "",
                  remarks: "",
                });
                setImagePreview("");
                setModalOpen(true);
              }}
            >
              Add User
            </Button>
          </div>
        }
        filters={[
          { key: "type", options: userTypes, placeholder: "Filter by type" },
          {
            key: "status",
            options: statusOptions,
            placeholder: "Filter by status",
          },
          { key: "city", options: cityOptions, placeholder: "Filter by city" },
        ]}
        errorMessage={error}
      />
      {loading && <div>Loading users...</div>}
      {!loading && users.length === 0 && !error && <div>No users found.</div>}
      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editUser ? "Edit User" : "Add User"}
      >
        <DropdownSelect
          label="Type"
          name="type"
          options={userTypes.slice(1)}
          value={
            form.type
              ? {
                  value: form.type,
                  label: form.type === "admin" ? "Admin" : "Business",
                }
              : null
          }
          onChange={handleDropdownChange}
          style={inputStyle}
        />
        <InputField
          label="Name"
          name="name"
          placeholder="Enter full name"
          value={form.name}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          placeholder={
            editUser ? "Leave blank to keep current password" : "Enter password"
          }
          value={form.password}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={inputStyle}
        />
        {imagePreview && (
          <div style={{ margin: "10px 0" }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          </div>
        )}
        <InputField
          label="Phone"
          name="phone_number"
          placeholder="Enter phone number"
          value={form.phone_number}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Address Line 1"
          name="address_line1"
          placeholder="Enter address line 1"
          value={form.address_line1}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Address Line 2"
          name="address_line2"
          placeholder="Enter address line 2"
          value={form.address_line2}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Landmark"
          name="landmark"
          placeholder="Enter landmark"
          value={form.landmark}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="State"
          name="state"
          placeholder="Enter state"
          value={form.state}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="City"
          name="city"
          placeholder="Enter city"
          value={form.city}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Country"
          name="country"
          placeholder="Enter country"
          value={form.country}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="GST Number"
          name="gst_number"
          placeholder="Enter GST number"
          value={form.gst_number}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="PAN Number"
          name="pan_number"
          placeholder="Enter PAN number"
          value={form.pan_number}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Business Name"
          name="business_name"
          placeholder="Enter business name"
          value={form.business_name}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <DropdownSelect
          label="Status"
          name="status"
          options={statusOptions.slice(1)}
          value={
            form.status
              ? {
                  value: form.status,
                  label:
                    form.status.charAt(0).toUpperCase() + form.status.slice(1),
                }
              : null
          }
          onChange={handleDropdownChange}
          style={inputStyle}
        />
        <InputField
          label="Remarks"
          name="remarks"
          placeholder="Enter remarks"
          value={form.remarks}
          onChange={handleInputChange}
          style={inputStyle}
        />
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
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Delete User"
      >
        <p>
          Are you sure you want to delete user <b>{deleteUser?.name}</b>?
        </p>
        <div className="modal-actions">
          <Button onClick={handleDelete} variant="danger" disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={() => setDeleteUser(null)} variant="secondary">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
