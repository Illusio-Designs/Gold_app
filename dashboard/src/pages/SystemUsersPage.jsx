import React, { useState, useEffect } from "react";
import { getSystemUsers } from "../services/adminApiService";
import { getAdminToken } from "../utils/authUtils";
import Badge from "../components/common/Badge";
import StatCards from "../components/common/StatCards";
import Skeleton from "../components/common/Skeleton";
import "../styles/pages/UsersPage.css";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "—";

// Dashboard page listing system / admin accounts (users.type = 'admin').
// These are the people who can sign in to this admin dashboard. They are
// preserved on a data wipe / review reset.
const SystemUsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const stats = [{ label: "System users", value: admins.length, tone: "brand" }];

  return (
    <div className="users-page">
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
    </div>
  );
};

export default SystemUsersPage;
