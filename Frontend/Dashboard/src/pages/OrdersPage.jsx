import React, { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  getOrdersByUserId, 
  updateOrderStatus, 
  bulkUpdateOrderStatuses,
  getOrderStatistics,
  getUserCart,
  updateUserStatus,
} from '../services/adminApiService';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { isAuthenticated, getAdminToken } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';
import TableWithControls from '../components/common/TableWithControls';
import Button from '../components/common/Button';
import DropdownSelect from '../components/common/DropdownSelect';
import { ShoppingCart, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { getProductImageUrl } from '../utils/imageUtils';
import '../styles/pages/OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
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
      console.error('Error loading orders:', error);
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
      console.error('Error loading statistics:', error);
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
      console.error('Error updating order status:', error);
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
      console.error('Error approving business:', error);
      if (error.response?.status === 401) {
        showErrorToast('Session expired. Please login again');
        navigate('/auth');
        return;
      }
      showErrorToast('Failed to approve business');
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) {
      showErrorToast('Please select orders to update');
      return;
    }

    try {
      const token = getAdminToken();
      if (!token) {
        showErrorToast('Authentication token not found');
        navigate('/auth');
        return;
      }
      await bulkUpdateOrderStatuses(selectedOrders, newStatus, token);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          selectedOrders.includes(order.id) ? { ...order, status: newStatus } : order
        )
      );
      
      setSelectedOrders([]);
      showSuccessToast(`${selectedOrders.length} orders updated to ${newStatus}`);
      loadStatistics(); // Refresh statistics
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      if (error.response?.status === 401) {
        showErrorToast('Session expired. Please login again');
        navigate('/auth');
        return;
      }
      if (error.response?.status === 403 && error.response?.data?.code === 'BUSINESS_NOT_APPROVED') {
        const blocked = error.response?.data?.blockedOrders || [];
        const msg = blocked.length
          ? `Some orders belong to not-approved businesses. Approve first or cancel. Blocked: ${blocked
              .map(b => `#${b.orderId}(${b.userStatus})`)
              .join(', ')}`
          : 'Some orders belong to not-approved businesses. Approve first or cancel.';
        showErrorToast(msg);
        return;
      }
      showErrorToast('Failed to bulk update orders');
    }
  };

  const handleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
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
      console.error('Error loading user cart:', error);
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

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Create columns for TableWithControls
  const columns = [

    {
      header: "Order ID",
      accessor: "id",
      cell: (row) => (
        <span className="order-id">#{row.id}</span>
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
                console.error("[OrdersPage] Product image failed to load:", row.product_image);
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
          <div className="user-name">{row.user_name || 'N/A'}</div>
          <div className="business-name">{row.business_name || 'N/A'}</div>
          <div className="user-phone">{row.user_phone || 'N/A'}</div>
          {row.user_status && (
            <div className={`user-status-badge ${String(row.user_status).toLowerCase()}`}>
              {row.user_status}
            </div>
          )}
        </div>
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
            <select
              value={row.status}
              onChange={(e) => handleStatusUpdate(row.id, e.target.value)}
              className="status-update-select"
              style={{ borderColor: getStatusColor(row.status) }}
            >
              {allowedOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
        </div>
      ),
    },
  ];

  return (
    <div className="orders-page">
      {/* Statistics Display */}
      <div className="statistics-display">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{statistics.total_orders || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending:</span>
          <span className="stat-value pending">{statistics.pending_orders || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Processing:</span>
          <span className="stat-value processing">{statistics.processing_orders || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Shipped:</span>
          <span className="stat-value shipped">{statistics.shipped_orders || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Delivered:</span>
          <span className="stat-value delivered">{statistics.delivered_orders || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Cancelled:</span>
          <span className="stat-value cancelled">{statistics.cancelled_orders || 0}</span>
        </div>
      </div>

      <TableWithControls
        columns={columns}
        data={filteredOrders}
        searchFields={["product_name", "user_name", "id", "product_sku"]}
        pageTitle="Order Management"
        loading={loading}
        actions={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "max-content" }}>
              <DropdownSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={statusOptions}
                placeholder="All Statuses"
              />
            </div>
            <div style={{ width: "max-content" }}>
              <DropdownSelect
                value=""
                onChange={(value) => handleBulkStatusUpdate(value)}
                options={statusOptions.slice(1).map(option => ({
                  value: option.value,
                  label: `Update to ${option.label}`
                }))}
                placeholder="Bulk Update Status"
                disabled={selectedOrders.length === 0}
              />
            </div>
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
                {userCart.items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <img 
                        src={getProductImageUrl(item.product_image)} 
                        alt={item.product_name} 
                        className="cart-item-image"
                        onError={(e) => {
                          console.error("[OrdersPage] Cart item image failed to load:", item.product_image);
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
