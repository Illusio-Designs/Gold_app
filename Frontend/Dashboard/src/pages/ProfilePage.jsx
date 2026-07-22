import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  isAuthenticated,
  getAdminToken,
  getAdminUser,
  setAdminUser,
} from "../utils/authUtils";
import { updateUser } from "../services/adminApiService";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import SidePanel from "../components/common/SidePanel";
import InputField from "../components/common/InputField";
import { User, Mail, ShieldCheck, Pencil } from "lucide-react";
import "../styles/pages/ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState({});
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      showErrorToast("Please login to access this page");
      navigate("/auth");
      return;
    }
    setUser(getAdminUser() || {});
  }, [navigate]);

  const name = user.name || "Admin";
  const email = user.email || "";
  const role = "Administrator";

  const openEdit = () => {
    setForm({ name: user.name || "", email: user.email || "", password: "" });
    setEditOpen(true);
  };

  const handleChange = (e) => {
    const { name: field, value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showErrorToast("Name and email are required");
      return;
    }
    if (!user.id) {
      showErrorToast("Could not determine your account id — please log in again");
      return;
    }
    try {
      setSaving(true);
      const token = getAdminToken();
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        type: "admin",
      };
      if (form.password) payload.password = form.password;

      await updateUser(user.id, payload, token);

      const updated = { ...user, name: payload.name, email: payload.email };
      setUser(updated);
      setAdminUser(updated);
      showSuccessToast("Profile updated");
      setEditOpen(false);
    } catch (err) {
      showErrorToast(err?.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <PageHeader
        title="Profile"
        subtitle="Your account details"
        icon={User}
        actions={
          <Button variant="secondary" onClick={openEdit}>
            <Pencil size={16} /> Edit Profile
          </Button>
        }
      />

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
        </ul>
      </div>

      <SidePanel
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </>
        }
      >
        <InputField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          className="form-control"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Your email"
          className="form-control"
        />
        <InputField
          label="New Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Leave blank to keep current password"
          className="form-control"
        />
      </SidePanel>
    </div>
  );
};

export default ProfilePage;
