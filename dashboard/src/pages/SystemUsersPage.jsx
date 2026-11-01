import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { getSystemUsers, createSystemUser } from "../services/adminApiService";
import { getAdminToken } from "../utils/authUtils";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import StatCards from "../components/common/StatCards";
import Skeleton from "../components/common/Skeleton";
import SidePanel from "../components/common/SidePanel";
import InputField from "../components/common/InputField";
import "../styles/pages/UsersPage.css";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const emptyForm = { name: "", email: "", phone_number: "", password: "" };

// Dashboard page listing system / admin accounts (users.type = 'admin').
// These are the people who can sign in to this admin dashboard. They are
// preserved on a data wipe / review reset.
const SystemUsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAdminToken();
      const data = await getSystemUsers(token);
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load system users");
    } finally {
      setLoading(false);
    }
  };

  const openPanel = () => {
    setForm(emptyForm);
    setPanelOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!name || !email || !password.trim()) {
      showErrorToast("Name, email and password are required.");
      return;
    }

    try {
      setSaving(true);
      const token = getAdminToken();
      await createSystemUser(
        {
          name,
          email,
          phone_number: form.phone_number.trim() || undefined,
          password,
        },
        token
      );
      setPanelOpen(false);
      await load();
      showSuccessToast("System user added successfully.");
    } catch (e) {
      showErrorToast(e?.response?.data?.error || "Failed to add system user");
    } finally {
      setSaving(false);
    }
  };

  const stats = [{ label: "System users", value: admins.length, tone: "brand" }];

  return (
    <div className="users-page">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button variant="primary" onClick={openPanel}>
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Add system user
        </Button>
      </div>

      <StatCards stats={stats} />

      <div className="au-notice" style={{ marginBottom: 16 }}>
        System users are admin accounts that can sign in to this dashboard. They
        are kept when you reset or wipe data.
      </div>

      {loading ? (
        <Skeleton variant="rect" height={240} radius={14} />
      ) : error ? (
        <div className="au-card">
          <div className="au-empty">
            <div className="au-empty-title">Couldn’t load system users</div>
            <div>{error}</div>
          </div>
        </div>
      ) : (
        <div className="au-card au-tablewrap">
          <table className="au-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {admins.length ? (
                admins.map((a) => {
                  const st = String(a.status || "").toLowerCase();
                  const tone = !a.status || st === "approved" || st === "active" ? "success" : "neutral";
                  return (
                    <tr key={a.id}>
                      <td>
                        <span className="au-ono">{a.name || "Admin"}</span>
                      </td>
                      <td className="au-sub">{a.email || "—"}</td>
                      <td className="tnum">{a.phone_number || "—"}</td>
                      <td>
                        <Badge tone={tone}>{a.status || "active"}</Badge>
                      </td>
                      <td className="au-sub tnum">{fmtDate(a.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="au-empty">
                      <div className="au-empty-title">No system users</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <SidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add system user"
      >
        <InputField
          label="Name"
          name="name"
          placeholder="Enter full name"
          value={form.name}
          onChange={handleInputChange}
          required
          className="form-control"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={handleInputChange}
          required
          className="form-control"
        />
        <InputField
          label="Phone"
          name="phone_number"
          placeholder="Enter phone number (optional)"
          value={form.phone_number}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleInputChange}
          required
          className="form-control"
        />
        <div className="modal-actions">
          <Button onClick={handleCreate} variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button onClick={() => setPanelOpen(false)} variant="secondary">
            Cancel
          </Button>
        </div>
      </SidePanel>
    </div>
  );
};

export default SystemUsersPage;
