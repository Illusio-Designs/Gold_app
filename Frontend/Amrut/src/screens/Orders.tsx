import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, RefreshControl, Alert } from 'react-native';
import CustomHeader from '../components/common/CustomHeader';
import CartItemCard from '../components/common/CartItemCard';
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { getCurrentUserOrders, updateOrderStatus } from '../services/Api';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Order status configuration
const orderStatuses = {
  pending: { label: 'Pending', color: '#ff9800', bgColor: '#fff3e0' },
  processing: { label: 'Processing', color: '#2196f3', bgColor: '#e3f2fd' },
  shipped: { label: 'Shipped', color: '#9c27b0', bgColor: '#f3e5f5' },
  delivered: { label: 'Delivered', color: '#4caf50', bgColor: '#e8f5e8' },
  cancelled: { label: 'Cancelled', color: '#f44336', bgColor: '#ffebee' }
};

const orderTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const Orders = () => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Custom fetch function for orders that gets the authentication token
  const fetchOrdersWithToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return await getCurrentUserOrders(token);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  // Use real-time data hook for orders
  const { data: ordersResponse, loading, error, refresh } = useRealtimeData(
    'orders',
    {},
    fetchOrdersWithToken,
    []
  );

  // Listen for real-time order updates
  useEffect(() => {
    // Import SocketService dynamically to avoid circular dependencies
    const setupRealTimeUpdates = async () => {
      try {
        const SocketService = require('../services/SocketService').default;
        
        // Listen for order updates
        const orderUpdateListenerId = SocketService.addEventListener('order-update', handleRealTimeOrderUpdate);
        const orderCreatedListenerId = SocketService.addEventListener('order-created', handleRealTimeOrderUpdate);
        const orderStatusUpdatedListenerId = SocketService.addEventListener('order-status-updated', handleRealTimeOrderUpdate);
        const ordersFromCartListenerId = SocketService.addEventListener('orders-created-from-cart', handleRealTimeOrderUpdate);
        
        // Cleanup listeners on unmount
        return () => {
          SocketService.removeEventListener('order-update', orderUpdateListenerId);
          SocketService.removeEventListener('order-created', orderCreatedListenerId);
          SocketService.removeEventListener('order-status-updated', orderStatusUpdatedListenerId);
          SocketService.removeEventListener('orders-created-from-cart', ordersFromCartListenerId);
        };
      } catch (error) {
        console.error('[Orders] Error setting up real-time updates:', error);
      }
    };

    const cleanup = setupRealTimeUpdates();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  // Extract orders from response
  const orders = ordersResponse?.data || ordersResponse || [];

  // Filter orders based on selected tab
  const filteredOrders = orders.filter(order => {
    if (selectedTab === 'all') return true;
    return order.status === selectedTab;
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      Toast.show({
        type: 'success',
        text1: 'Orders Updated',
        text2: 'Your orders have been refreshed',
        position: 'top',
        visibilityTime: 2000
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Could not update orders',
        position: 'top',
        visibilityTime: 2000
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      await updateOrderStatus(orderId, newStatus, token);
      
      // Refresh orders to get updated data
      await refresh();
      
      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: `Order status changed to ${orderStatuses[newStatus]?.label || newStatus}`,
        position: 'top',
        visibilityTime: 3000
      });
      
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not update order status',
        position: 'top',
        visibilityTime: 3000
      });
    }
  };

  // Handle real-time order updates from socket events
  const handleRealTimeOrderUpdate = (updateData) => {
    console.log('[Orders] Real-time order update received:', updateData);
    
    const { action, order, timestamp } = updateData;
    
    switch (action) {
      case 'order-created':
        // Refresh orders silently
        refresh();
        break;
        
      case 'status-updated':
        // Refresh orders silently
        refresh();
        break;
        
      case 'orders-created-from-cart':
        // Refresh orders silently
        refresh();
        break;
        
      default:
        console.log('[Orders] Unknown order action:', action);
    }
  };

  // Show status update confirmation
  const showStatusUpdateModal = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  // Get status color for order
  const getStatusColor = (status) => {
    return orderStatuses[status]?.color || '#666';
  };

  // Get status background color for order
  const getStatusBgColor = (status) => {
    return orderStatuses[status]?.bgColor || '#f5f5f5';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && orders.length === 0) {
    return <ScreenLoader text="Loading your orders..." />;
  }

  if (error && orders.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader title="My Orders" timer={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load orders</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="My Orders" timer={true} />
      
      {/* Order Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={styles.tabBarScroll}
      >
        {orderTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabBtn,
              selectedTab === tab.key ? styles.tabBtnActive : styles.tabBtnInactive,
            ]}
            onPress={() => setSelectedTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.key !== 'all' && (
              <View style={[
                styles.tabBadge,
                { backgroundColor: getStatusColor(tab.key) }
              ]}>
                <Text style={styles.tabBadgeText}>
                  {orders.filter(order => order.status === tab.key).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView 
        contentContainerStyle={styles.cardsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedTab === 'all' 
                ? 'No orders found' 
                : `No ${selectedTab} orders found`
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'all' 
                ? 'Start shopping to see your orders here' 
                : 'Check other tabs for orders'
              }
            </Text>
          </View>
        ) : (
          filteredOrders.map(order => (
            <View key={order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Order #{order.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBgColor(order.status) }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(order.status) }
                  ]}>
                    {orderStatuses[order.status]?.label || order.status}
                  </Text>
                </View>
              </View>

              {/* Order Items */}
              {order.items && order.items.map((item, index) => (
                <CartItemCard
                  key={item.id || index}
                  image={item.product_image ? { uri: item.product_image } : require('../assets/img/home/p1.png')}
                  title={item.product_name || 'Product'}
                  subtitle={item.category_name || 'Category'}
                  gWeight={item.gross_weight || '0'}
                  nWeight={item.net_weight || '0'}
                  showRemarkAndAmount={true}
                  readonly={true}
                  maroonPaddingBottom={12}
                  customAmount={formatCurrency(item.mark_amount)}
                  customQuantity={item.quantity}
                />
              ))}

              {/* Order Summary */}
              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Items:</Text>
                  <Text style={styles.summaryValue}>{order.total_items || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(order.total_mark_amount)}</Text>
                </View>
                {order.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.updateStatusButton}
                    onPress={() => showStatusUpdateModal(order)}
                  >
                    <Text style={styles.updateStatusButtonText}>Update Status</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Order #{selectedOrder.id} - {selectedOrder.product_name}
              </Text>
              
              <Text style={styles.modalDescription}>
                Select the new status for this order:
              </Text>
              
              <View style={styles.statusOptions}>
                {Object.entries(orderStatuses).map(([status, config]) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      { backgroundColor: config.bgColor }
                    ]}
                    onPress={() => handleStatusUpdate(selectedOrder.id, status)}
                  >
                    <Text style={[styles.statusOptionText, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Toast for notifications */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 50,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 6,
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  tabBarScroll: {
    height: 50,
    backgroundColor: '#fff',
    marginTop: 60,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 0.8,
    marginRight: 10,
    position: 'relative',
  },
  tabBtnActive: {
    backgroundColor: '#5D0829',
    borderColor: '#5D0829',
  },
  tabBtnInactive: {
    backgroundColor: '#fff',
    borderColor: '#5D0829',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FCE2BF',
  },
  tabTextInactive: {
    color: '#5D0829',
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardsContent: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  updateStatusButton: {
    backgroundColor: '#5D0829',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
  },
  updateStatusButtonText: {
    color: '#FCE2BF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#5D0829',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FCE2BF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Orders; 