import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, RefreshControl, Alert } from 'react-native';
import CustomHeader from '../components/common/CustomHeader';
import CartItemCard from '../components/common/CartItemCard';
import { ListSkeleton } from '../components/common/Motion';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PackageIcon } from '@hugeicons/core-free-icons';
import { useNavigation } from '@react-navigation/native';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { getCurrentUserOrders, getMyCustomOrders } from '../services/Api';
import { getCustomOrderImageUrl } from '../utils/imageUtils';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginPromptModal from '../components/common/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';

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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const navigation = useNavigation<any>();
  const { showLoginPrompt, checkAndPromptLogin, closeLoginPrompt } = useLoginPrompt();

  // Check if user is logged in when component mounts
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      setIsLoggedIn(!!token);
    })();
  }, []);

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

  // Custom orders (bespoke) — fetched separately and shown in the same list.
  const [customOrders, setCustomOrders] = useState<any[]>([]);

  const fetchCustomOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { setCustomOrders([]); return; }
      const res = await getMyCustomOrders(token);
      setCustomOrders(res?.data || []);
    } catch (e) {
      console.error('[Orders] Error fetching custom orders:', e);
      setCustomOrders([]);
    }
  };

  useEffect(() => {
    fetchCustomOrders();
  }, []);

  // Merge regular + custom orders into one list, newest first.
  const combinedOrders = [
    ...(orders || []).map((o: any) => ({ ...o, isCustom: false })),
    ...(customOrders || []).map((o: any) => ({ ...o, isCustom: true })),
  ].sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Filter orders based on selected tab (status applies to both types)
  const filteredOrders = combinedOrders.filter(order => {
    if (selectedTab === 'all') return true;
    return order.status === selectedTab;
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      await fetchCustomOrders();
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

  // Order status is managed by the admin only — the app shows it read-only.

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
    return (
      <View style={styles.container}>
        <CustomHeader title="My Orders" showBack={false} />
        <ListSkeleton count={5} />
      </View>
    );
  }

  // Not logged in → invite the user to log in (instead of a load error).
  if (isLoggedIn === false && orders.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader title="My Orders" showBack={false} />
        <View style={styles.errorContainer}>
          <View style={styles.loginIconCircle}>
            <HugeiconsIcon icon={PackageIcon} size={44} color="#C09E83" strokeWidth={1.8} />
          </View>
          <Text style={styles.loginTitle}>Login to see your orders</Text>
          <Text style={styles.loginSubtitle}>Sign in to track and view all your orders in one place.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.retryButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader title="My Orders" showBack={false} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>We couldn't load your orders</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="My Orders" showBack={false} />
      
      {/* Order Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={styles.tabBarScroll}
      >
        {orderTabs.map(tab => {
          const isActive = selectedTab === tab.key;
          const count =
            tab.key === 'all'
              ? combinedOrders.length
              : combinedOrders.filter(order => order.status === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive ? styles.tabBtnActive : styles.tabBtnInactive,
              ]}
              onPress={() => setSelectedTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.tabCount,
                  isActive ? styles.tabCountActive : styles.tabCountInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    isActive ? styles.tabCountTextActive : styles.tabCountTextInactive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
            <View style={styles.emptyIconCircle}>
              <HugeiconsIcon icon={PackageIcon} size={46} color="#C09E83" strokeWidth={1.8} />
            </View>
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
            <View key={(order.isCustom ? 'c' : 'o') + order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.orderId}>
                      {order.isCustom ? `Custom #${order.id}` : `Order #${order.id}`}
                    </Text>
                    {order.isCustom ? (
                      <View style={styles.customTag}>
                        <Text style={styles.customTagText}>CUSTOM</Text>
                      </View>
                    ) : null}
                  </View>
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

              {order.isCustom ? (
                /* Custom (bespoke) order — same maroon card look as a normal order */
                <>
                  {(() => {
                    const imgs: string[] = Array.isArray(order.images) ? order.images : [];
                    const firstUrl = getCustomOrderImageUrl(imgs[0]);
                    const mainSource = firstUrl
                      ? { uri: firstUrl }
                      : require('../assets/img/home/p1.png');
                    return (
                      <View style={ccStyles.bgContainer}>
                        <View style={ccStyles.cardContainer}>
                          <View style={ccStyles.row}>
                            <Image source={mainSource} style={ccStyles.productImage} resizeMode="cover" />
                            <View style={ccStyles.infoContainer}>
                              <Text style={ccStyles.title}>Custom Order</Text>
                              <Text style={ccStyles.subtitle}>{order.purity || 'Bespoke'}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={ccStyles.maroonSection}>
                          <View style={ccStyles.weightsRow}>
                            <Text style={ccStyles.weightText}>Wt: {order.weight || '—'}</Text>
                            <Text style={ccStyles.weightText}>Qty: {order.quantity || 1}</Text>
                            <Text style={ccStyles.weightText}>By: {formatDate(order.delivery_date)}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })()}
                  {/* Extra reference photos */}
                  {Array.isArray(order.images) && order.images.length > 1 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                      {order.images.slice(1).map((u: string, i: number) => {
                        const url = getCustomOrderImageUrl(u);
                        return (
                          <Image
                            key={i}
                            source={url ? { uri: url } : require('../assets/img/home/p1.png')}
                            style={styles.customThumb}
                            resizeMode="cover"
                          />
                        );
                      })}
                    </ScrollView>
                  ) : null}
                  {order.remark ? (
                    <View style={styles.orderSummary}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Remark:</Text>
                        <Text style={[styles.summaryValue, { flexShrink: 1, textAlign: 'right' }]} numberOfLines={2}>{order.remark}</Text>
                      </View>
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  {/* Order Items */}
                  {order.items && order.items.map((item, index) => (
                    <CartItemCard
                      key={item.id || index}
                      image={item.product_image ? { uri: item.product_image } : require('../assets/img/home/p1.png')}
                      title={item.product_name || 'Product'}
                      subtitle={item.category_name || 'Category'}
                      gWeight={item.gross_weight || '0'}
                      nWeight={item.net_weight || '0'}
                      showRemarkAndAmount={false}
                      readonly={true}
                      maroonPaddingBottom={12}
                      customQuantity={item.quantity}
                    />
                  ))}

                  {/* Order Summary */}
                  <View style={styles.orderSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Items:</Text>
                      <Text style={styles.summaryValue}>{order.total_items || 0}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>


      {/* Login Prompt Modal */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={closeLoginPrompt}
        title="Login Required"
        message="Please login to view your orders"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 6,
  },
  tabBarScroll: {
    height: 50,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 0.8,
    marginRight: 10,
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
    fontSize: 15,
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FCE2BF',
  },
  tabTextInactive: {
    color: '#5D0829',
  },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabCountActive: {
    backgroundColor: '#FCE2BF',
  },
  tabCountInactive: {
    backgroundColor: '#F1E4D6',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'GlorifyDEMO',
  },
  tabCountTextActive: {
    color: '#5D0829',
  },
  tabCountTextInactive: {
    color: '#5D0829',
  },
  cardsContent: {
    paddingTop: 16,
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
  customTag: {
    marginLeft: 8,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#C09E83',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  customTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5D0829',
    letterSpacing: 0.5,
  },
  customThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 8,
    marginTop: 4,
    backgroundColor: '#F7F1E8',
    borderWidth: 1,
    borderColor: '#EEE3D3',
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
  loginIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#EADBC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 19,
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 13,
    color: '#8A7A80',
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 19,
    paddingHorizontal: 20,
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
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#EADBC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconGlyph: {
    fontSize: 36,
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

// Maroon card styles matching CartItemCard so custom orders look the same
// as regular orders.
const ccStyles = StyleSheet.create({
  bgContainer: {
    backgroundColor: '#5D0829',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    alignSelf: 'stretch',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#F7F1E8',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
  },
  subtitle: {
    fontSize: 14,
    color: '#5D0829',
    marginTop: 2,
  },
  maroonSection: {
    backgroundColor: '#5D0829',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  weightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightText: {
    color: '#FCE2BF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Orders;