import React, { useState, useEffect } from 'react';
import { 
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics,
  getUserCart,
  updateUserStatus,
  downloadOrderPDF,
} from '../services/adminApiService';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { isAuthenticated, getAdminToken } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';
import TableWithControls from '../components/common/TableWithControls';
import Button from '../components/common/Button';
import DropdownSelect from '../components/common/DropdownSelect';
import { SkeletonTable, SkeletonStats } from '../components/common/Skeleton';
import StatCards from '../components/common/StatCards';
import Badge from '../components/common/Badge';
import { ShoppingCart, Image as ImageIcon, FileDown } from 'lucide-react';
import { getProductImageUrl } from '../utils/imageUtils';
import '../styles/pages/OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({});
  const [selectedUser, setSelectedUser] = useState('');
  const [userCart, setUserCart] = useState(null);
  const [showUserCart, setShowUserCart] = useState(false);
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'all', label: 'All Statuses', color: '#666' },
    { value: 'pending', label: 'Pending', color: '#ff9800' },
    { value: 'processing', label: 'Processing', color: '#2196f3' },
    { value: 'shipped', label: 'Shipped', color: '#9c27b0' },
    { value: 'delivered', label: 'Delivered', color: '#4caf50' },
    { value: 'cancelled', label: 'Cancelled', color: '#f44336' }
  ];

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      showErrorToast('Please login to access this page');
      navigate('/auth');
      return;
    }

    loadOrders();
    loadStatistics();
  }, [navigate]);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        showErrorToast('Authentication token not found');
        navigate('/auth');
        return;
      }
      
      const response = await getAllOrders(token);
      setOrders(response);
      setFilteredOrders(response);
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast('Session expired. Please login again');
        navigate('/auth');
        return;
      }
      showErrorToast('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        return;
      }
      
      const response = await getOrderStatistics(token);
      setStatistics(response);
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast('Session expired. Please login again');
        navigate('/auth');
        return;
      }
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm) ||
        order.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };
  



  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = getAdminToken();
      if (!token) {
        showErrorToast('Authentication token not found');
        navigate('/auth');
        return;
      }
      await updateOrderStatus(orderId, newStatus, token);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      showSuccessToast(`Order ${orderId} status updated to ${newStatus}`);
      loadStatistics(); // Refresh statistics
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast('Session expired. Please login again');
        navigate('/auth');
        return;
      }
      if (error.response?.status === 403 && error.response?.data?.code === 'BUSINESS_NOT_APPROVED') {
        const info = error.response.data;
        showErrorToast(`Business not approved (status: ${info.userStatus}). Approve business first or cancel the order.`);
        return;
      }
      showErrorToast('Failed to update order status');
    }
  };

  const handleApproveBusiness = async (userId) => {
    try {
      const token = getAdminToken();
      if (!token) {
        showErrorToast('Authentication token not found');
        navigate('/auth');
        return;
      }

      await updateUserStatus(userId, { status: 'approved' }, token);

      // Update local state (unlock status updates for all orders by this user)
      setOrders(prevOrders =>
        prevOrders.map(order =>
          (order.user_id === userId || order.business_user_id === userId)
            ? { ...order, user_status: 'approved' }
            : order
        )
      );

      showSuccessToast('Business approved successfully');
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast('Session expired. Please login again');
        navigate('/auth');
        return;
      }
      showErrorToast('Failed to approve business');
    }
  };


  const handleDownloadPdf = async (order) => {
    try {
      const token = getAdminToken();
      if (!token) {
        showErrorToast('Authentication token not found');
        navigate('/auth');
        return;
      }
      const res = await downloadOrderPDF(order.id, token);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showErrorToast('Failed to download order PDF');
    }
  };

  const viewUserCart = async (userId) => {
    try {
      const token = getAdminToken();
      if (!token) {
        showErrorToast('Authentication token not found');
        navigate('/auth');
        return;
      }
      const response = await getUserCart(userId, token);
      setUserCart(response);
      setSelectedUser(userId);
      setShowUserCart(true);
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorToast('Session expired. Please login again');
        navigate('/auth');
        return;
      }
      showErrorToast('Failed to load user cart');
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : '#666';
  };

  const getStatusTone = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'delivered':
      case 'approved':
        return 'success';
      case 'shipped':
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'rejected':
      case 'blocked':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Unique, human-readable order id, e.g. ORD-000012
  const formatOrderId = (id) => `ORD-${String(id ?? '').padStart(6, '0')}`;

  if (loading) {
    return (
      <div className="orders-page">
        <SkeletonStats count={6} />
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  const orderStats = [
    { label: 'Total', value: statistics.total_orders || 0, tone: 'brand' },
    { label: 'Pending', value: statistics.pending_orders || 0, tone: 'warning' },
    { label: 'Processing', value: statistics.processing_orders || 0, tone: 'info' },
    { label: 'Shipped', value: statistics.shipped_orders || 0, tone: 'purple' },
    { label: 'Delivered', value: statistics.delivered_orders || 0, tone: 'success' },
    { label: 'Cancelled', value: statistics.cancelled_orders || 0, tone: 'danger' },
  ];

  // Create columns for TableWithControls
  const columns = [

    {
      header: "Order ID",
      accessor: "id",
      cell: (row) => (
        <span className="order-id">{formatOrderId(row.id)}</span>
      ),
    },
    {
      header: "Product",
      accessor: "product_info",
      cell: (row) => (
        <div className="product-info">
          {row.product_image ? (
            <img 
              src={getProductImageUrl(row.product_image)} 
              alt={row.product_name} 
              className="product-thumbnail"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="product-thumbnail no-image">
              <ImageIcon size={12} />
            </div>
          )}
          <div className="product-details">
            <div className="product-name">{row.product_name || 'N/A'}</div>
            <div className="product-sku">SKU: {row.product_sku || 'N/A'}</div>
            {row.net_weight && (
              <div className="product-weight">Weight: {row.net_weight}g</div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "User",
      accessor: "user_info",
      cell: (row) => (
        <div className="user-info">
          <div className="user-name">{row.user_name || row.business_name || 'N/A'}</div>
        </div>
      ),
    },
    {
      header: "User Status",
      accessor: "user_status",
      cell: (row) =>
        row.user_status ? (
          <Badge tone={getStatusTone(row.user_status)}>{row.user_status}</Badge>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>—</span>
        ),
    },
    {
      header: "Quantity",
      accessor: "total_qty",
      cell: (row) => (
        <span className="quantity">{row.total_qty || 0}</span>
      ),
    },
    {
      header: "Amount",
      accessor: "total_mark_amount",
      cell: (row) => (
        <span className="amount">{formatCurrency(row.total_mark_amount || 0)}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => {
        const userStatus = String(row.user_status || '').toLowerCase();
        const isApproved = !userStatus || userStatus === 'approved';
        const baseOptions = statusOptions.slice(1);
        const allowedOptions = isApproved
          ? baseOptions
          : baseOptions.filter(opt => opt.value === 'cancelled' || opt.value === row.status);

        return (
          <div className="status-cell">
            <div style={{ minWidth: 150 }}>
              <DropdownSelect
                value={row.status}
                onChange={(opt) => opt && handleStatusUpdate(row.id, opt.value)}
                options={allowedOptions}
                isClearable={false}
                isSearchable={false}
                placeholder="Status"
              />
            </div>
            {!isApproved && (
              <div className="status-guard">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleApproveBusiness(row.user_id || row.business_user_id)}
                >
                  Approve Business
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleStatusUpdate(row.id, 'cancelled')}
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Created",
      accessor: "created_at",
      cell: (row) => (
        <span className="created-date">{formatDate(row.created_at)}</span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="action-buttons">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => viewUserCart(row.user_id || row.business_user_id)}
            title="View User Cart"
          >
            <ShoppingCart size={16} />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleDownloadPdf(row)}
            title="Download PDF"
          >
            <FileDown size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="orders-page">
      <StatCards stats={orderStats} />

      <TableWithControls
        columns={columns}
        data={filteredOrders}
        searchFields={["product_name", "user_name", "id", "product_sku"]}
        pageTitle="Order Management"
        loading={loading}
        actions={
          <div style={{ width: "max-content" }}>
            <DropdownSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusOptions}
              placeholder="All Statuses"
            />
          </div>
        }
      />

      {/* User Cart Modal */}
      {showUserCart && userCart && (
        <div className="modal-overlay" onClick={() => setShowUserCart(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Cart - User ID: {selectedUser}</h3>
              <button 
                className="close-button"
                onClick={() => setShowUserCart(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="cart-summary">
                <p><strong>Total Items:</strong> {userCart.total_items}</p>
                <p><strong>Total Quantity:</strong> {userCart.total_quantity}</p>
              </div>
              
              <div className="cart-items">
                <h4>Cart Items:</h4>
                {(userCart.items || []).map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <img 
                        src={getProductImageUrl(item.product_image)} 
                        alt={item.product_name} 
                        className="cart-item-image"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect fill='%23f0f0f0' width='50' height='50'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div>
                        <div className="cart-item-name">{item.product_name}</div>
                        <div className="cart-item-sku">SKU: {item.product_sku}</div>
                        <div className="cart-item-category">Category: {item.category_name}</div>
                      </div>
                    </div>
                    <div className="cart-item-details">
                      <div className="cart-item-quantity">Qty: {item.quantity}</div>
                      <div className="cart-item-price">₹{item.mark_amount}</div>
                      <div className="cart-item-weight">Weight: {item.net_weight}g</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
