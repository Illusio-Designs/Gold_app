import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, RefreshCw, Plus } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import SidePanel from "../components/common/SidePanel";
import { SkeletonTable } from "../components/common/Skeleton";
import Badge from "../components/common/Badge";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import { getProfileImageUrl } from "../utils/imageUtils";
import "../styles/pages/UsersPage.css";
import {
  getAllUsers,
  createUser,
  updateUser,
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
              e.currentTarget.style.display = "none";
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
        let tone = "neutral";
        if (status === "approved") tone = "success";
        else if (status === "pending") tone = "warning";
        else if (status === "rejected") tone = "danger";
        else if (status === "denied") tone = "danger";
        return (
          <Badge tone={tone}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
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

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const data = await getAllUsers(token);
      setUsers(data);
    } catch (err) {
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
        await updateUser(editUser.id, formData, token);
        setError(""); // Clear any previous errors
      } else {
        await createUser(formData, token);
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
      await fetchUsers();
    } catch (err) {
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

  return (
    <div className="users-page">
      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
      <TableWithControls
        columns={columns}
        data={users}
        searchFields={["name", "email", "city", "business_name"]}
        pageTitle="User Management"
        loading={loading}
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
              <Plus size={16} />
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
      )}
      <SidePanel
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
          className="form-control"
        />
        <InputField
          label="Name"
          name="name"
          placeholder="Enter full name"
          value={form.name}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={handleInputChange}
          className="form-control"
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
          className="form-control"
        />
        <InputField
          label="Image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="form-control"
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
          className="form-control"
        />
        <InputField
          label="Address Line 1"
          name="address_line1"
          placeholder="Enter address line 1"
          value={form.address_line1}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Address Line 2"
          name="address_line2"
          placeholder="Enter address line 2"
          value={form.address_line2}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Landmark"
          name="landmark"
          placeholder="Enter landmark"
          value={form.landmark}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="State"
          name="state"
          placeholder="Enter state"
          value={form.state}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="City"
          name="city"
          placeholder="Enter city"
          value={form.city}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Country"
          name="country"
          placeholder="Enter country"
          value={form.country}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="GST Number"
          name="gst_number"
          placeholder="Enter GST number"
          value={form.gst_number}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="PAN Number"
          name="pan_number"
          placeholder="Enter PAN number"
          value={form.pan_number}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Business Name"
          name="business_name"
          placeholder="Enter business name"
          value={form.business_name}
          onChange={handleInputChange}
          className="form-control"
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
          className="form-control"
        />
        <InputField
          label="Remarks"
          name="remarks"
          placeholder="Enter remarks"
          value={form.remarks}
          onChange={handleInputChange}
          className="form-control"
        />
        <div className="modal-actions">
          <Button onClick={handleSave} variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </SidePanel>
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
