import React, { useState, useEffect } from "react";
import { Edit, Trash2, Download, AlertTriangle, CheckCircle, XCircle, Plus, Smartphone, Globe } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import { getAllAppVersions, createAppVersion, updateAppVersion, deleteAppVersion, activateAppVersion } from "../services/adminApiService";
import "../styles/pages/AppVersionsPage.css";

const AppVersionsPage = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editVersion, setEditVersion] = useState(null);
  const [deleteVersion, setDeleteVersion] = useState(null);
  const [form, setForm] = useState({
    version_code: "",
    version_name: "",
    platform: "android",
    update_type: "patch",
    force_update: false,
    min_version_code: "",
    download_url: "",
    release_notes: "",
  });

  const platformOptions = [
    { value: "android", label: "Android" },
    { value: "ios", label: "iOS" },
  ];

  const updateTypeOptions = [
    { value: "major", label: "Major Update" },
    { value: "minor", label: "Minor Update" },
    { value: "patch", label: "Patch Update" },
    { value: "force", label: "Force Update" },
  ];

  const columns = [
    {
      key: "version_name",
      label: "Version",
      render: (value, row) => (
        <div className="version-info">
          <div className="version-name">{value}</div>
          <div className="version-code">Code: {row.version_code}</div>
        </div>
      ),
    },
    {
      key: "platform",
      label: "Platform",
      render: (value) => (
        <div className="platform-badge">
          {value === "android" ? <Smartphone className="icon" /> : <Globe className="icon" />}
          {value.toUpperCase()}
        </div>
      ),
    },
    {
      key: "update_type",
      label: "Update Type",
      render: (value, row) => (
        <div className="update-type-badge">
          <span className={`type ${value}`}>{value.toUpperCase()}</span>
          {row.force_update && <AlertTriangle className="force-icon" />}
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value) => (
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
      key: "download_url",
      label: "Download",
      render: (value) => (
        <div className="download-info">
          {value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="download-link">
              <Download className="icon" />
              Download
            </a>
          ) : (
            <span className="no-url">No URL</span>
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
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const response = await getAllAppVersions(token);
      if (response.success) {
        setVersions(response.data.versions || []);
      } else {
        setError(response.message || "Failed to load versions");
      }
    } catch (err) {
      setError("Failed to load versions");
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

  const handleCreate = () => {
    setEditVersion(null);
    setForm({
      version_code: "",
      version_name: "",
      platform: "android",
      update_type: "patch",
      force_update: false,
      min_version_code: "",
      download_url: "",
      release_notes: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (version) => {
    setEditVersion(version);
    setForm({
      version_code: version.version_code.toString(),
      version_name: version.version_name,
      platform: version.platform,
      update_type: version.update_type,
      force_update: version.force_update,
      min_version_code: version.min_version_code?.toString() || "",
      download_url: version.download_url || "",
      release_notes: version.release_notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const response = editVersion
        ? await updateAppVersion(editVersion.id, form, token)
        : await createAppVersion(form, token);

      if (response.success) {
        setModalOpen(false);
        setEditVersion(null);
        setForm({
          version_code: "",
          version_name: "",
          platform: "android",
          update_type: "patch",
          force_update: false,
          min_version_code: "",
          download_url: "",
          release_notes: "",
        });
        loadVersions();
      } else {
        setError(response.message || "Failed to save version");
      }
    } catch (err) {
      setError("Failed to save version");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (version) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const response = await activateAppVersion(version.id, token);
      if (response.success) {
        loadVersions();
      } else {
        setError(response.message || "Failed to activate version");
      }
    } catch (err) {
      setError("Failed to activate version");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (version) => {
    setDeleteVersion(version);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const response = await deleteAppVersion(deleteVersion.id, token);
      if (response.success) {
        setDeleteVersion(null);
        loadVersions();
      } else {
        setError(response.message || "Failed to delete version");
      }
    } catch (err) {
      setError("Failed to delete version");
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
    <div className="app-versions-page">
      <div className="page-header">
        <h1>App Version Management</h1>
        <p>Manage app versions for Android and iOS platforms</p>
        <Button onClick={handleCreate} className="create-btn">
          <Plus className="icon" />
          Create New Version
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <TableWithControls
        data={versions}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search versions..."
        filterOptions={[
          { key: "platform", label: "Platform", options: platformOptions },
          { key: "update_type", label: "Update Type", options: updateTypeOptions },
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
        title={editVersion ? "Edit App Version" : "Create New App Version"}
        size="lg"
      >
        <div className="form-grid">
          <div className="form-row">
            <InputField
              label="Version Code (Integer)"
              name="version_code"
              type="number"
              value={form.version_code}
              onChange={handleInputChange}
              placeholder="e.g., 1, 2, 3..."
              required
              style={inputStyle}
            />
            <InputField
              label="Version Name"
              name="version_name"
              type="text"
              value={form.version_name}
              onChange={handleInputChange}
              placeholder="e.g., 1.0.0, 1.1.0..."
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
            <DropdownSelect
              label="Update Type"
              name="update_type"
              value={form.update_type}
              onChange={handleInputChange}
              options={updateTypeOptions}
              required
              style={inputStyle}
            />
          </div>

          <div className="form-row">
            <InputField
              label="Minimum Version Code (Optional)"
              name="min_version_code"
              type="number"
              value={form.min_version_code}
              onChange={handleInputChange}
              placeholder="Minimum version required for update"
              style={inputStyle}
            />
            <div className="checkbox-field">
              <label>
                <input
                  type="checkbox"
                  name="force_update"
                  checked={form.force_update}
                  onChange={handleInputChange}
                />
                Force Update (Users must update to continue)
              </label>
            </div>
          </div>

          <div className="form-row full-width">
            <InputField
              label="Download URL"
              name="download_url"
              type="url"
              value={form.download_url}
              onChange={handleInputChange}
              placeholder="https://play.google.com/store/apps/details?id=..."
              style={inputStyle}
            />
          </div>

          <div className="form-row full-width">
            <label>Release Notes</label>
            <textarea
              name="release_notes"
              value={form.release_notes}
              onChange={handleInputChange}
              placeholder="What's new in this version..."
              rows={4}
              style={inputStyle}
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {editVersion ? "Update Version" : "Create Version"}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteVersion}
        onClose={() => setDeleteVersion(null)}
        title="Delete App Version"
        size="md"
      >
        <div className="delete-confirmation">
          <AlertTriangle className="warning-icon" />
          <p>
            Are you sure you want to delete version{" "}
            <strong>{deleteVersion?.version_name}</strong> for{" "}
            <strong>{deleteVersion?.platform}</strong>?
          </p>
          <p className="warning-text">
            This action cannot be undone. Users with this version may be affected.
          </p>
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={() => setDeleteVersion(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            Delete Version
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AppVersionsPage; 