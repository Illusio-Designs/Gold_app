import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, RefreshControl } from 'react-native';
import CartItemCard from '../components/common/CartItemCard';
import CustomHeader from '../components/common/CustomHeader';
import Button from '../components/common/Button';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';
import ScreenLoader from '../components/common/ScreenLoader';
import Toast from 'react-native-toast-message';
import LoginPromptModal from '../components/common/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';

const Cart = () => {
  const navigation = useNavigation<any>();
  const { cartItems, removeFromCart, getTotalQuantity, getTotalWeight, checkout, refreshCart } = useCart() as any;
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ success: boolean; message: string; orderIds?: number[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const { showLoginPrompt, checkAndPromptLogin, closeLoginPrompt } = useLoginPrompt();
  
  console.log('[Cart] Rendering with cartItems:', cartItems);
  console.log('[Cart] Cart items length:', cartItems.length);

  // Check if user is logged in whenever screen comes into focus
  useEffect(() => {
    if (isFocused) {
      checkAndPromptLogin();
    }
  }, [isFocused]);

  // Cart data is managed by CartContext, no need for useRealtimeData

  // Handle real-time cart updates from socket events
  const handleRealTimeCartUpdate = (updateData: any) => {
    console.log('[Cart] Real-time cart update received:', updateData);
    
    const { action, cartItem, timestamp } = updateData;
    
    switch (action) {
      case 'item-added':
        // Refresh cart silently
        refreshCart();
        break;
        
      case 'item-updated':
        // Refresh cart silently
        refreshCart();
        break;
        
      case 'item-removed':
        // Refresh cart silently
        refreshCart();
        break;
        
      case 'cart-cleared':
        // Refresh cart silently
        refreshCart();
        break;
        
      default:
        console.log('[Cart] Unknown cart action:', action);
    }
  };

  // Listen for real-time cart updates
  useEffect(() => {
    // Import SocketService dynamically to avoid circular dependencies
    const setupRealTimeUpdates = async () => {
      try {
        const SocketService = require('../services/SocketService').default;
        
        // Listen for user-specific cart updates only
        const cartItemAddedListenerId = SocketService.addEventListener('cart-item-added', handleRealTimeCartUpdate);
        const cartItemUpdatedListenerId = SocketService.addEventListener('cart-item-updated', handleRealTimeCartUpdate);
        const cartItemRemovedListenerId = SocketService.addEventListener('cart-item-removed', handleRealTimeCartUpdate);
        const cartClearedListenerId = SocketService.addEventListener('cart-cleared', handleRealTimeCartUpdate);
        
        // Cleanup listeners on unmount
        return () => {
          SocketService.removeEventListener('cart-item-added', cartItemAddedListenerId);
          SocketService.removeEventListener('cart-item-updated', cartItemUpdatedListenerId);
          SocketService.removeEventListener('cart-item-removed', cartItemRemovedListenerId);
          SocketService.removeEventListener('cart-cleared', cartClearedListenerId);
        };
      } catch (error) {
        console.error('[Cart] Error setting up real-time updates:', error);
      }
    };

    const cleanup = setupRealTimeUpdates();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCart();
      Toast.show({
        type: 'success',
        text1: 'Cart Updated',
        text2: 'Your cart has been refreshed',
        position: 'top',
        visibilityTime: 2000
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Could not update cart',
        position: 'top',
        visibilityTime: 2000
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFromCart(id);
      Toast.show({
        type: 'success',
        text1: 'Item Removed',
        text2: 'Item removed from cart',
        position: 'top',
        visibilityTime: 2000
      });
    } catch (error) {
      console.error('[Cart] Error removing item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item from cart',
        position: 'top',
        visibilityTime: 2000
      });
    }
  };

  const handleCheckout = async () => {
    try {
      console.log('[Cart] Checkout button pressed');
      setIsProcessing(true);
      
      // Call the checkout function from CartContext
      const result = await checkout();
      
      console.log('[Cart] Checkout result:', result);
      setOrderResult(result);
      
      if (result.success) {
        setModalVisible(true);
        
        // Auto-close modal after 5 seconds
        setTimeout(() => {
          handleCloseModal();
        }, 5000);
        
        Toast.show({
          type: 'success',
          text1: 'Order Placed',
          text2: 'Your order has been placed successfully',
          position: 'top',
          visibilityTime: 3000
        });
      } else {
        // Show error message
        console.error('[Cart] Checkout failed:', result.message);
        Toast.show({
          type: 'error',
          text1: 'Checkout Failed',
          text2: result.message,
          position: 'top',
          visibilityTime: 3000
        });
      }
    } catch (error) {
      console.error('[Cart] Checkout error:', error);
      setOrderResult({ success: false, message: 'An unexpected error occurred' });
      Toast.show({
        type: 'error',
        text1: 'Checkout Error',
        text2: 'An unexpected error occurred during checkout',
        position: 'top',
        visibilityTime: 3000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // Navigate back to home screen after successful order
    navigation.navigate('Home' as never);
  };

  // Show loading state while cart is being fetched (if needed)
  // Cart data is managed by CartContext, so we don't need separate loading state

  return (
    <View style={styles.container}>
      <CustomHeader title="My Cart" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubtext}>Start shopping to add items to your cart</Text>
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => navigation.navigate('Collection' as never)}
            >
              <Text style={styles.shopNowButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cartItems.map((item: any) => {
              console.log('[Cart] Rendering cart item:', {
                id: item.id,
                title: item.title,
                image: item.image,
                imageType: typeof item.image,
                hasUri: item.image?.uri,
                hasImage: !!item.image
              });
              
              return (
                <CartItemCard
                  key={item.id}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  gWeight={item.gWeight}
                  nWeight={item.nWeight}
                  quantity={item.quantity}
                  onRemove={() => handleRemove(item.id)}
                  showRemarkAndAmount={true}
                  amount={item.amount}
                />
              );
            })}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Quantity</Text>
                <Text style={styles.summaryValue}>{getTotalQuantity()} items</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total N.W</Text>
                <Text style={styles.summaryValue}>{getTotalWeight()}g</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>₹{cartItems.reduce((total: any, item: any) => total + (parseFloat(item.amount || '0') || 0), 0)}</Text>
              </View>
            </View>
            
            {/* Checkout Button */}
            <View style={styles.checkoutContainer}>
              <Button
                title={isProcessing ? "Processing..." : "Checkout"}
                onPress={handleCheckout}
                disabled={isProcessing || cartItems.length === 0}
                style={styles.checkoutButton}
                textStyle={styles.checkoutButtonText}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Placed Successfully!</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Your order has been placed successfully. You will receive a confirmation shortly.
              </Text>
              {orderResult?.orderIds && (
                <View style={styles.orderIdsContainer}>
                  <Text style={styles.orderIdsTitle}>Order IDs:</Text>
                  {orderResult.orderIds.map((orderId, index) => (
                    <Text key={index} style={styles.orderId}>#{orderId}</Text>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast for notifications */}
      <Toast />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={closeLoginPrompt}
        title="Login Required"
        message="Please login to view and manage your cart"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: isShortScreen() ? 40 : isTallScreen() ? 60 : 50,
  },
  scrollContent: {
    paddingVertical: getResponsiveSpacing(16, 20, 24),
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(80, 100, 120),
  },
  emptyCartText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#6B1839',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyCartSubtext: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#6B1839',
    textAlign: 'center',
    marginTop: getResponsiveSpacing(10, 12, 14),
  },
  shopNowButton: {
    backgroundColor: '#6B1839',
    paddingHorizontal: getResponsiveSpacing(20, 24, 28),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    borderRadius: getResponsiveSpacing(20, 25, 30),
    marginTop: getResponsiveSpacing(20, 24, 28),
  },
  shopNowButtonText: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(80, 100, 120),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#6B1839',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(80, 100, 120),
  },
  errorText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#6B1839',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6B1839',
    paddingHorizontal: getResponsiveSpacing(20, 24, 28),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    borderRadius: getResponsiveSpacing(20, 25, 30),
    marginTop: getResponsiveSpacing(20, 24, 28),
  },
  retryButtonText: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryDivider: {
    borderStyle: 'dashed',
    borderTopWidth: 1.5,
    borderColor: '#5D0829',
    marginVertical: getResponsiveSpacing(24, 30, 36),
    width: '80%',
    alignSelf: 'center',
  },
  summaryBox: {
    marginHorizontal: getResponsiveSpacing(20, 24, 28),
    marginBottom: getResponsiveSpacing(16, 20, 24),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing(6, 8, 10),
    paddingHorizontal: getResponsiveSpacing(12, 15, 18),
  },
  summaryLabel: {
    color: '#6B1839',
    fontSize: getResponsiveFontSize(13, 15, 17),
    fontWeight: 'bold',
  },
  summaryValue: {
    color: '#6B1839',
    fontSize: getResponsiveFontSize(13, 15, 17),
    fontWeight: 'bold',
  },
  checkoutContainer: {
    marginHorizontal: getResponsiveSpacing(20, 24, 28),
    marginBottom: getResponsiveSpacing(16, 20, 24),
  },
  checkoutButton: {
    backgroundColor: '#6B1839',
    paddingHorizontal: getResponsiveSpacing(20, 24, 28),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    borderRadius: getResponsiveSpacing(20, 25, 30),
  },
  checkoutButtonText: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: isSmallScreen() ? wp('60%') : isMediumScreen() ? wp('65%') : wp('70%'),
    height: isSmallScreen() ? wp('60%') : isMediumScreen() ? wp('65%') : wp('70%'),
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#6B1839', // Darker background for modal
  },
  modalHeader: {
    marginBottom: getResponsiveSpacing(10, 12, 14),
  },
  modalTitle: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
  },
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(20, 24, 28),
  },
  modalMessage: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(10, 12, 14),
  },
  orderIdsContainer: {
    marginBottom: getResponsiveSpacing(10, 12, 14),
  },
  orderIdsTitle: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(5, 6, 7),
  },
  orderId: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#FCE2BF',
    paddingHorizontal: getResponsiveSpacing(20, 24, 28),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    borderRadius: getResponsiveSpacing(20, 25, 30),
  },
  modalButtonText: {
    color: '#6B1839',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Cart; 