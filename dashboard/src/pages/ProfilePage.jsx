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
import Avatar from "../components/common/Avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Mail01Icon,
  ShieldUserIcon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
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
        icon={UserIcon}
        actions={
          <Button variant="secondary" onClick={openEdit}>
            <HugeiconsIcon icon={Edit02Icon} size={16} /> Edit Profile
          </Button>
        }
      />

      <section className="au-panel profile-card">
        <div className="profile-hero">
          <Avatar name={name} size={76} tone="gold" />
          <div className="profile-hero__id">
            <h2 className="profile-name">{name}</h2>
            <Badge tone="brand">{role}</Badge>
            {email && <div className="profile-hero__email">{email}</div>}
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-field">
            <span className="profile-field__ic">
              <HugeiconsIcon icon={UserIcon} size={18} />
            </span>
            <div>
              <div className="profile-field__k">Name</div>
              <div className="profile-field__v">{name}</div>
            </div>
          </div>
          <div className="profile-field">
            <span className="profile-field__ic">
              <HugeiconsIcon icon={ShieldUserIcon} size={18} />
            </span>
            <div>
              <div className="profile-field__k">Role</div>
              <div className="profile-field__v">{role}</div>
            </div>
          </div>
          {email && (
            <div className="profile-field">
              <span className="profile-field__ic">
                <HugeiconsIcon icon={Mail01Icon} size={18} />
              </span>
              <div>
                <div className="profile-field__k">Email</div>
                <div className="profile-field__v">{email}</div>
              </div>
            </div>
          )}
        </div>
      </section>

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
