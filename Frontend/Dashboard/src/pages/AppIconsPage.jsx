import React, { useState, useEffect } from "react";
import { Edit, Trash2, Upload, AlertTriangle, CheckCircle, XCircle, Plus, Smartphone, Globe, Calendar, Clock } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import { getAllAppIcons, createAppIcon, updateAppIcon, deleteAppIcon, activateAppIcon } from "../services/adminApiService";
import "../styles/pages/AppIconsPage.css";

const AppIconsPage = () => {
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editIcon, setEditIcon] = useState(null);
  const [deleteIcon, setDeleteIcon] = useState(null);
  const [form, setForm] = useState({
    icon_name: "",
    icon_type: "primary",
    platform: "both",
    icon_url: "",
    is_active: false,
    priority: 0,
    start_date: "",
    end_date: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");

  const platformOptions = [
    { value: "android", label: "Android" },
    { value: "ios", label: "iOS" },
    { value: "both", label: "Both Platforms" },
  ];

  const iconTypeOptions = [
    { value: "primary", label: "Primary Icon" },
    { value: "notification", label: "Notification Icon" },
    { value: "adaptive", label: "Adaptive Icon (Android)" },
    { value: "round", label: "Round Icon" },
    { value: "square", label: "Square Icon" },
  ];

  const columns = [
    {
      key: "icon_name",
      label: "Icon Name",
      render: (value, row) => (
        <div className="icon-info">
          <div className="icon-name">{value}</div>
          <div className="icon-type">{row.icon_type.toUpperCase()}</div>
        </div>
      ),
    },
    {
      key: "platform",
      label: "Platform",
      render: (value) => (
        <div className="platform-badge">
          {value === "android" ? <Smartphone className="icon" /> : 
           value === "ios" ? <Globe className="icon" /> : 
           <><Smartphone className="icon" /><Globe className="icon" /></>}
          {value.toUpperCase()}
        </div>
      ),
    },
    {
      key: "icon_path",
      label: "Preview",
      render: (value) => (
        <div className="icon-preview">
          {value ? (
            <img src={value} alt="Icon" className="preview-image" />
          ) : (
            <div className="no-preview">No Image</div>
          )}
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value, row) => (
        <div className="status-badge">
          {value ? (
            <CheckCircle className="active-icon" />
          ) : (
            <XCircle className="inactive-icon" />
          )}
          {value ? "Active" : "Inactive"}
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => (
        <div className="priority-badge">
          <span className={`priority-${value}`}>{value}</span>
        </div>
      ),
    },
    {
      key: "start_date",
      label: "Schedule",
      render: (value, row) => (
        <div className="schedule-info">
          {value || row.end_date ? (
            <>
              {value && (
                <div className="schedule-item">
                  <Calendar className="icon" />
                  <span>Start: {new Date(value).toLocaleDateString()}</span>
                </div>
              )}
              {row.end_date && (
                <div className="schedule-item">
                  <Clock className="icon" />
                  <span>End: {new Date(row.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </>
          ) : (
            <span className="no-schedule">No Schedule</span>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
            className="edit-btn"
          >
            <Edit className="icon" />
            Edit
          </Button>
          {!row.is_active && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleActivate(row)}
              className="activate-btn"
            >
              <CheckCircle className="icon" />
              Activate
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row)}
            className="delete-btn"
          >
            <Trash2 className="icon" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadIcons();
  }, []);

  const loadIcons = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const response = await getAllAppIcons(token);
      if (response.success) {
        setIcons(response.data.icons || []);
      } else {
        setError(response.error || "Failed to load icons");
      }
    } catch (err) {
      setError("Failed to load icons");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    setEditIcon(null);
    setForm({
      icon_name: "",
      icon_type: "primary",
      platform: "both",
      icon_url: "",
      is_active: false,
      priority: 0,
      start_date: "",
      end_date: "",
    });
    setSelectedFile(null);
    setFilePreview("");
    setModalOpen(true);
  };

  const handleEdit = (icon) => {
    setEditIcon(icon);
    setForm({
      icon_name: icon.icon_name,
      icon_type: icon.icon_type,
      platform: icon.platform,
      icon_url: icon.icon_url || "",
      is_active: icon.is_active,
      priority: icon.priority || 0,
      start_date: icon.start_date ? icon.start_date.split('T')[0] : "",
      end_date: icon.end_date ? icon.end_date.split('T')[0] : "",
    });
    setSelectedFile(null);
    setFilePreview(icon.icon_path || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      
      const formData = new FormData();
      formData.append("icon_name", form.icon_name);
      formData.append("icon_type", form.icon_type);
      formData.append("platform", form.platform);
      formData.append("icon_url", form.icon_url);
      formData.append("is_active", form.is_active);
      formData.append("priority", form.priority);
      formData.append("start_date", form.start_date || "");
      formData.append("end_date", form.end_date || "");
      
      if (selectedFile) {
        formData.append("icon_file", selectedFile);
      }

      const response = editIcon
        ? await updateAppIcon(editIcon.id, formData, token)
        : await createAppIcon(formData, token);

      if (response.success) {
        setModalOpen(false);
        setEditIcon(null);
        setForm({
          icon_name: "",
          icon_type: "primary",
          platform: "both",
          icon_url: "",
          is_active: false,
          priority: 0,
          start_date: "",
          end_date: "",
        });
        setSelectedFile(null);
        setFilePreview("");
        loadIcons();
      } else {
        setError(response.error || "Failed to save icon");
      }
    } catch (err) {
      setError("Failed to save icon");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (icon) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const response = await activateAppIcon(icon.id, token);
      if (response.success) {
        loadIcons();
      } else {
        setError(response.error || "Failed to activate icon");
      }
    } catch (err) {
      setError("Failed to activate icon");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (icon) => {
    setDeleteIcon(icon);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const response = await deleteAppIcon(deleteIcon.id, token);
      if (response.success) {
        setDeleteIcon(null);
        loadIcons();
      } else {
        setError(response.error || "Failed to delete icon");
      }
    } catch (err) {
      setError("Failed to delete icon");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "#f9f2e7",
    borderColor: "#c09e83",
    color: "#5d0829",
  };

  return (
    <div className="app-icons-page">
      <div className="page-header">
        <h1>Dynamic App Icon Management</h1>
        <p>Manage app icons for different platforms and use cases</p>
        <Button onClick={handleCreate} className="create-btn">
          <Plus className="icon" />
          Upload New Icon
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <TableWithControls
        data={icons}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search icons..."
        filterOptions={[
          { key: "platform", label: "Platform", options: platformOptions },
          { key: "icon_type", label: "Icon Type", options: iconTypeOptions },
          {
            key: "is_active",
            label: "Status",
            options: [
              { value: "", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
        ]}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editIcon ? "Edit App Icon" : "Upload New App Icon"}
        size="lg"
      >
        <div className="form-grid">
          <div className="form-row">
            <InputField
              label="Icon Name"
              name="icon_name"
              type="text"
              value={form.icon_name}
              onChange={handleInputChange}
              placeholder="e.g., Holiday Icon, Special Event"
              required
              style={inputStyle}
            />
            <DropdownSelect
              label="Icon Type"
              name="icon_type"
              value={form.icon_type}
              onChange={handleInputChange}
              options={iconTypeOptions}
              required
              style={inputStyle}
            />
          </div>

          <div className="form-row">
            <DropdownSelect
              label="Platform"
              name="platform"
              value={form.platform}
              onChange={handleInputChange}
              options={platformOptions}
              required
              style={inputStyle}
            />
            <InputField
              label="Priority (0-100)"
              name="priority"
              type="number"
              min="0"
              max="100"
              value={form.priority}
              onChange={handleInputChange}
              placeholder="Higher number = higher priority"
              style={inputStyle}
            />
          </div>

          <div className="form-row">
            <InputField
              label="Start Date (Optional)"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <InputField
              label="End Date (Optional)"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleInputChange}
              style={inputStyle}
            />
          </div>

          <div className="form-row full-width">
            <InputField
              label="Icon URL (Alternative to file upload)"
              name="icon_url"
              type="url"
              value={form.icon_url}
              onChange={handleInputChange}
              placeholder="https://example.com/icon.png"
              style={inputStyle}
            />
          </div>

          <div className="form-row full-width">
            <label>Upload Icon File</label>
            <div className="file-upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <div className="upload-placeholder">
                <Upload className="icon" />
                <span>Click to upload or drag and drop</span>
                <span className="file-info">PNG, JPG, SVG up to 5MB</span>
              </div>
            </div>
          </div>

          {filePreview && (
            <div className="form-row full-width">
              <label>Preview</label>
              <div className="preview-container">
                <img src={filePreview} alt="Preview" className="preview-image" />
              </div>
            </div>
          )}

          <div className="form-row full-width">
            <div className="checkbox-field">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleInputChange}
                />
                Activate this icon immediately
              </label>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {editIcon ? "Update Icon" : "Upload Icon"}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteIcon}
        onClose={() => setDeleteIcon(null)}
        title="Delete App Icon"
        size="md"
      >
        <div className="delete-confirmation">
          <AlertTriangle className="warning-icon" />
          <p>
            Are you sure you want to delete icon{" "}
            <strong>{deleteIcon?.icon_name}</strong> for{" "}
            <strong>{deleteIcon?.platform}</strong>?
          </p>
          <p className="warning-text">
            This action cannot be undone. The icon will be removed from all platforms.
          </p>
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={() => setDeleteIcon(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            Delete Icon
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AppIconsPage; 