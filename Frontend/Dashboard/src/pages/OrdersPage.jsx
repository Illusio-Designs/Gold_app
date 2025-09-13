import React, { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  getOrdersByUserId, 
  updateOrderStatus, 
  bulkUpdateOrderStatuses,
  getOrderStatistics,
  getUserCart 
} from '../services/adminApiService';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { isAuthenticated, getAdminToken } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(20);
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
    setCurrentPage(1); // Reset to first page when filters change
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
  


  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      showErrorToast('Failed to update order status');
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
    if (selectedOrders.length === currentOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentOrders.map(order => order.id));
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
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Order Management</h1>
        <p>Manage orders and track individual product status</p>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{statistics.total_orders || 0}</p>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <p className="stat-number">{statistics.pending_orders || 0}</p>
        </div>
        <div className="stat-card processing">
          <h3>Processing</h3>
          <p className="stat-number">{statistics.processing_orders || 0}</p>
        </div>
        <div className="stat-card shipped">
          <h3>Shipped</h3>
          <p className="stat-number">{statistics.shipped_orders || 0}</p>
        </div>
        <div className="stat-card delivered">
          <h3>Delivered</h3>
          <p className="stat-number">{statistics.delivered_orders || 0}</p>
        </div>
        <div className="stat-card cancelled">
          <h3>Cancelled</h3>
          <p className="stat-number">{statistics.cancelled_orders || 0}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by product name, user name, order ID, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bulk-actions">
          <select
            onChange={(e) => handleBulkStatusUpdate(e.target.value)}
            className="bulk-status-select"
            defaultValue=""
          >
            <option value="" disabled>Bulk Update Status</option>
            {statusOptions.slice(1).map(option => (
              <option key={option.value} value={option.value}>
                Update to {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Summary */}
      <div className="orders-summary">
        <p>Showing {filteredOrders.length} orders ({indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length})</p>
        {selectedOrders.length > 0 && (
          <p className="selected-count">{selectedOrders.length} orders selected</p>
        )}
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Order ID</th>
              <th>Product</th>
              <th>User</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map(order => (
              <tr key={order.id} className={`order-row ${order.status}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleOrderSelection(order.id)}
                  />
                </td>
                <td className="order-id">#{order.id}</td>
                <td>
                  <div className="product-info">
                    {order.product_image && (
                      <img 
                        src={order.product_image} 
                        alt={order.product_name} 
                        className="product-thumbnail"
                      />
                    )}
                    <div className="product-details">
                      <div className="product-name">{order.product_name || 'N/A'}</div>
                      <div className="product-sku">SKU: {order.product_sku || 'N/A'}</div>
                      {order.net_weight && (
                        <div className="product-weight">Weight: {order.net_weight}g</div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="user-info">
                    <div className="user-name">{order.user_name || 'N/A'}</div>
                    <div className="business-name">{order.business_name || 'N/A'}</div>
                    <div className="user-phone">{order.user_phone || 'N/A'}</div>
                  </div>
                </td>
                <td className="quantity">{order.total_qty || 0}</td>
                <td className="amount">{formatCurrency(order.total_mark_amount || 0)}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="status-update-select"
                    style={{ borderColor: getStatusColor(order.status) }}
                  >
                    {statusOptions.slice(1).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="created-date">{formatDate(order.created_at)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => viewUserCart(order.business_user_id)}
                      className="btn btn-secondary btn-sm"
                      title="View User Cart"
                    >
                      🛒 Cart
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {currentOrders.length === 0 && (
          <div className="no-orders">
            <p>No orders found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}
          
          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

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
                        src={item.product_image} 
                        alt={item.product_name} 
                        className="cart-item-image"
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
