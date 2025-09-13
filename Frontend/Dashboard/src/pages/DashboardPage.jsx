import React, { useState, useEffect } from 'react';
import { 
  getDashboardStats, 
  getTodayOrders 
} from '../services/adminApiService';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Tag,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import NotificationSender from '../components/common/NotificationSender';
import "../styles/pages/DashboardPage.css";

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase() === 'pending' ? 'status-pending' :
                       status?.toLowerCase() === 'approved' ? 'status-approved' :
                       status?.toLowerCase() === 'completed' ? 'status-completed' :
                       status?.toLowerCase() === 'cancelled' ? 'status-cancelled' : 'status-default';
    
    return (
      <span className={`status-badge ${statusClass}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin_token');
      const [statsResponse, ordersResponse] = await Promise.all([
        getDashboardStats(token),
        getTodayOrders(token)
      ]);
      
      console.log('Dashboard stats response:', statsResponse);
      console.log('Today orders response:', ordersResponse);
      
      setDashboardData(statsResponse?.data || null);
      // Ensure todayOrders is always an array, even if the API fails
      setTodayOrders(ordersResponse?.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.error || 'Failed to load dashboard data');
      // Set empty arrays as fallback when API fails
      setTodayOrders([]);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subtitle, trend }) => (
    <div className="stat-card">
      <div className="stat-content">
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && (
            <p className="stat-subtitle">{subtitle}</p>
          )}
          {trend && (
            <div className="stat-trend">
              <TrendingUp className={`trend-icon ${trend > 0 ? 'trend-positive' : 'trend-negative'}`} size={16} />
              <span className={`trend-text ${trend > 0 ? 'trend-positive' : 'trend-negative'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className={`stat-icon ${colorClass}`}>
          <Icon size={24} color="white" />
        </div>
      </div>
    </div>
  );

  const OrderStatusCard = ({ status, count, icon: Icon, colorClass, bgClass }) => (
    <div className={`order-status-card ${bgClass}`}>
      <div className="status-icon-container">
        <Icon className={`status-icon ${colorClass}`} size={20} />
      </div>
      <p className="status-count">{count}</p>
      <p className="status-label">{status}</p>
    </div>
  );

  const RecentOrderRow = ({ order }) => (
    <tr className="order-row">
      <td className="order-id">#{order.id}</td>
      <td className="order-customer">{order.user_name}</td>
      <td className="order-product">{order.product_name}</td>
      <td className="order-quantity">{order.quantity}</td>
      <td className="order-amount">{formatCurrency(order.total_amount)}</td>
      <td className="order-status">
        {getStatusBadge(order.status)}
      </td>
      <td className="order-date">{formatDate(order.created_at)}</td>
    </tr>
  );

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">Error Loading Dashboard</h2>
        <p className="error-message">{error}</p>
        <button className="error-retry-btn" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="header-title">Dashboard</h1>
            <p className="header-subtitle">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="auto-refresh-info">
              Auto-refresh every 30s
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Main Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Today's Orders"
            value={dashboardData?.today?.orders || 0}
            icon={ShoppingCart}
            colorClass="stat-blue"
            subtitle={`${formatCurrency(dashboardData?.today?.revenue || 0)} revenue`}
          />
          <StatCard
            title="Approved Users"
            value={dashboardData?.totals?.approvedUsers || 0}
            icon={Users}
            colorClass="stat-green"
            subtitle="Active business users"
          />
          <StatCard
            title="Total Products"
            value={dashboardData?.totals?.products || 0}
            icon={Package}
            colorClass="stat-purple"
            subtitle={`${dashboardData?.totals?.categories || 0} categories`}
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(dashboardData?.today?.averageOrderValue || 0)}
            icon={DollarSign}
            colorClass="stat-orange"
            subtitle={`${dashboardData?.metrics?.conversionRate || 0}% conversion`}
          />
        </div>

        {/* Order Status Overview */}
        <div className="order-status-section">
          <h2 className="section-title">Today's Order Status</h2>
          <div className="order-status-grid">
            <OrderStatusCard
              status="pending"
              count={dashboardData?.today?.pending || 0}
              icon={Clock}
              colorClass="status-yellow"
              bgClass="status-bg-yellow"
            />
            <OrderStatusCard
              status="approved"
              count={dashboardData?.today?.approved || 0}
              icon={CheckCircle}
              colorClass="status-blue"
              bgClass="status-bg-blue"
            />
            <OrderStatusCard
              status="completed"
              count={dashboardData?.today?.completed || 0}
              icon={CheckCircle}
              colorClass="status-green"
              bgClass="status-bg-green"
            />
            <OrderStatusCard
              status="cancelled"
              count={dashboardData?.today?.cancelled || 0}
              icon={XCircle}
              colorClass="status-red"
              bgClass="status-bg-red"
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="recent-orders-section">
          <div className="section-header">
            <h2 className="section-title">Recent Orders</h2>
            <p className="section-subtitle">Latest orders from today</p>
          </div>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Order ID</th>
                  <th className="table-header-cell">Customer</th>
                  <th className="table-header-cell">Product</th>
                  <th className="table-header-cell">Qty</th>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Date</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {(todayOrders || []).length > 0 ? (
                  (todayOrders || []).map((order) => (
                    <RecentOrderRow key={order.id} order={order} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-orders">
                      <div className="empty-orders-content">
                        <ShoppingCart className="empty-icon" size={48} />
                        <p className="empty-title">No orders today</p>
                        <p className="empty-subtitle">Orders placed today will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notification Sender */}
        <div className="notification-section">
          <NotificationSender onNotificationSent={fetchDashboardData} />
        </div>

        {/* Top Products */}
        {dashboardData?.topProducts && dashboardData.topProducts.length > 0 && (
          <div className="top-products-section">
            <h2 className="section-title">Top Selling Products</h2>
            <div className="products-list">
              {dashboardData.topProducts.map((product, index) => (
                <div key={product.product_sku} className="product-item">
                  <div className="product-info">
                    <div className="product-rank">
                      <span className="rank-number">#{index + 1}</span>
                    </div>
                    <div className="product-details">
                      <p className="product-name">{product.product_name}</p>
                      <p className="product-sku">SKU: {product.product_sku}</p>
                    </div>
                  </div>
                  <div className="product-stats">
                    <p className="product-orders">{product.order_count} orders</p>
                    <p className="product-revenue">{formatCurrency(product.total_revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;


