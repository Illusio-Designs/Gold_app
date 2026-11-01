import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getTodayOrders } from "../services/adminApiService";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingCart01Icon,
  UserGroupIcon,
  PackageIcon,
  Coins01Icon,
  RefreshIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import Badge from "../components/common/Badge";
import NotificationSender from "../components/common/NotificationSender";
import Skeleton, { SkeletonTable } from "../components/common/Skeleton";
import "../styles/pages/DashboardPage.css";

// ---- formatting helpers ----
const inr = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

// Compact Indian currency: ₹48.2L / ₹1.2Cr
const inrCompact = (amount) => {
  const n = Number(amount || 0);
  if (n >= 1e7) return `₹ ${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹ ${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹ ${(n / 1e3).toFixed(1)}K`;
  return inr(n);
};

const formatDate = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    : "—";

// Map an order status to a Badge tone
const statusTone = (s) => {
  const v = String(s || "").toLowerCase();
  if (["delivered", "approved", "completed", "paid"].includes(v)) return "success";
  if (v === "pending") return "warning";
  if (["processing", "shipped"].includes(v)) return "info";
  if (["cancelled", "canceled", "rejected", "failed"].includes(v)) return "danger";
  return "neutral";
};
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

// Build an SVG area+line path from a chronological list of numbers.
function buildChart(values) {
  const W = 640, H = 200, padL = 48, padR = 16, padT = 16, padB = 28;
  const n = values.length;
  const max = Math.max(1, ...values);
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => padT + innerH - (v / max) * innerH;
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
  const last = pts[pts.length - 1] || [x(0), y(0)];
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => padT + innerH - f * innerH);
  return { W, H, padL, padR, innerH, padT, line, area, last, grid, max };
}

// Build a mini sparkline path.
function buildSpark(values, w = 86, h = 34) {
  const n = values.length;
  if (!n) return { line: "", area: "", last: [0, 0] };
  const max = Math.max(1, ...values);
  const x = (i) => (n <= 1 ? w / 2 : (i / (n - 1)) * (w - 2) + 1);
  const y = (v) => h - 4 - (v / max) * (h - 8);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[n - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  return { line, area, last: pts[n - 1] };
}

const monthLabel = (ym) => {
  if (!ym) return "";
  const [, m] = ym.split("-");
  return ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    Number(m)
  ] || ym;
};

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => interval && clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("admin_token");
      const [statsResponse, ordersResponse] = await Promise.all([
        getDashboardStats(token),
        getTodayOrders(token),
      ]);
      setDashboardData(statsResponse?.data || null);
      setTodayOrders(ordersResponse?.data || []);
    } catch (err) {
      setError(err.error || "Failed to load dashboard data");
      setTodayOrders([]);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="dash-page">
        <div className="au-kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={96} radius={14} />
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <SkeletonTable rows={5} cols={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <HugeiconsIcon icon={Alert02Icon} size={40} />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button className="au-btn" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  const today = dashboardData?.today || {};
  const totals = dashboardData?.totals || {};
  const metrics = dashboardData?.metrics || {};
  const topProducts = dashboardData?.topProducts || [];

  // monthlyRevenue comes back newest-first; chronological for charts.
  const months = [...(dashboardData?.monthlyRevenue || [])].reverse();
  const revValues = months.map((m) => Number(m.revenue || 0));
  const thisMonth = dashboardData?.monthlyRevenue?.[0];
  const lastMonth = dashboardData?.monthlyRevenue?.[1];
  let revDelta = null;
  if (thisMonth && lastMonth && Number(lastMonth.revenue) > 0) {
    revDelta = ((Number(thisMonth.revenue) - Number(lastMonth.revenue)) / Number(lastMonth.revenue)) * 100;
  }
  const monthRevenue = thisMonth ? Number(thisMonth.revenue) : null;

  const spark = buildSpark(revValues);
  const chart = buildChart(revValues.length ? revValues : [0, 0]);

  const statuses = [
    { key: "pending", label: "Pending", bar: "var(--warn)" },
    { key: "processing", label: "Processing", bar: "var(--info)" },
    { key: "shipped", label: "Shipped", bar: "var(--shipped)" },
    { key: "delivered", label: "Delivered", bar: "var(--ok)" },
    { key: "cancelled", label: "Cancelled", bar: "var(--danger)" },
  ];

  const maxTopOrders = Math.max(1, ...topProducts.map((p) => Number(p.order_count || 0)));

  return (
    <div className="dash-page">
      {/* Refresh row */}
      <div className="dash-toolbar">
        <span className="au-sub">Auto-refreshes every 30s</span>
        <button className="dash-refresh" onClick={fetchDashboardData} disabled={loading}>
          <HugeiconsIcon icon={RefreshIcon} size={15} className={loading ? "spin" : ""} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* KPIs */}
      <div className="au-kpis">
        <div className="au-kpi">
          <div className="au-lab">
            <span className="au-ic"><HugeiconsIcon icon={Coins01Icon} size={16} /></span>
            Revenue · this month
          </div>
          <div className="au-val tnum">{monthRevenue != null ? inrCompact(monthRevenue) : inr(today.revenue)}</div>
          {revDelta != null ? (
            <div className={`au-delta ${revDelta >= 0 ? "up" : "down"}`}>
              {revDelta >= 0 ? "▲" : "▼"} {Math.abs(revDelta).toFixed(1)}%
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>vs last month</span>
            </div>
          ) : (
            <div className="au-delta">{inr(today.revenue)} today</div>
          )}
        </div>

        <div className="au-kpi">
          <div className="au-lab">
            <span className="au-ic"><HugeiconsIcon icon={ShoppingCart01Icon} size={16} /></span>
            Orders today
          </div>
          <div className="au-val tnum">{today.orders || 0}</div>
          <div className="au-delta">{inr(today.revenue)} · avg {inr(today.averageOrderValue)}</div>
        </div>

        <div className="au-kpi">
          <div className="au-lab">
            <span className="au-ic"><HugeiconsIcon icon={UserGroupIcon} size={16} /></span>
            Firms
          </div>
          <div className="au-val tnum">{totals.approvedUsers || 0}</div>
          <div className="au-delta">{metrics.conversionRate || 0}% conversion today</div>
        </div>

        <div className="au-kpi">
          <div className="au-lab">
            <span className="au-ic"><HugeiconsIcon icon={PackageIcon} size={16} /></span>
            Products
          </div>
          <div className="au-val tnum">{totals.products || 0}</div>
          <div className="au-delta">{totals.categories || 0} categories</div>
        </div>
      </div>

      {/* Revenue bars + Order status */}
      <div className="au-grid dash-main-grid" style={{ marginTop: 16 }}>
        <div className="au-panel">
          <div className="au-panel-head">
            <h3>Revenue — last {months.length || 0} months</h3>
            {monthRevenue != null && <span className="au-link">{inrCompact(monthRevenue)} this month</span>}
          </div>
          {revValues.length ? (
            <div className="dash-bars" role="img" aria-label="Monthly revenue">
              {months.map((m, i) => {
                const v = Number(m.revenue || 0);
                const max = Math.max(1, ...revValues);
                const h = Math.max(3, Math.round((v / max) * 100));
                return (
                  <div className="dash-bar-col" key={i} title={inr(v)}>
                    <div className="dash-bar-wrap">
                      <div className="dash-bar" style={{ height: `${h}%` }} />
                    </div>
                    <span className="dash-bar-lbl">{monthLabel(m.month)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="au-empty"><div className="au-empty-title">No revenue yet</div><div>Sales will chart here as orders come in.</div></div>
          )}
        </div>

        <div className="au-panel">
          <div className="au-panel-head"><h3>Order status</h3><span className="au-muted">today</span></div>
          <div className="dash-status-list">
            {statuses.map((s) => (
              <div className="dash-status-row" key={s.key}>
                <span className="dash-status-name">
                  <span className="dash-status-dot" style={{ background: s.bar }} />
                  {s.label}
                </span>
                <b
                  className="tnum"
                  style={s.key === "cancelled" ? { color: "var(--danger)" } : undefined}
                >
                  {today[s.key] || 0}
                </b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="au-sechead">
        <h2>Recent orders</h2>
        <span className="au-spacer" />
        <button className="au-link" onClick={() => navigate("/dashboard/orders")}>View all →</button>
      </div>
      <div className="au-card au-tablewrap">
        <table className="au-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {todayOrders.length ? (
              todayOrders.map((o) => (
                <tr key={o.id}>
                  <td><span className="au-ono">#{o.id}</span></td>
                  <td>{o.user_name || "—"}</td>
                  <td className="au-sub">{o.product_name || "—"}</td>
                  <td className="tnum">{o.quantity || 1}</td>
                  <td className="au-amt tnum">{inr(o.total_amount)}</td>
                  <td><Badge tone={statusTone(o.status)}>{cap(o.status)}</Badge></td>
                  <td className="au-sub tnum">{formatDate(o.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="au-empty">
                    <HugeiconsIcon icon={ShoppingCart01Icon} size={40} color="var(--gold)" />
                    <div className="au-empty-title">No orders today</div>
                    <div>Orders placed today will appear here.</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick notification */}
      <div className="au-sechead"><h2>Notifications</h2></div>
      <div className="au-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span className="au-sub">Send a push notification to the B2B app.</span>
        <NotificationSender onNotificationSent={fetchDashboardData} />
      </div>
    </div>
  );
};

export default DashboardPage;
