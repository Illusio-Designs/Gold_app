import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import {
  addToCart,
  getUserCart,
  updateCartItemQuantity,
  removeFromCart,
  clearUserCart,
  createOrderFromCart,
} from '../../services/Api';
import { colors } from '../../theme/colors';

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image: string;
  category_name: string;
  quantity: number;
  mark_amount: number;
  net_weight: number;
}

interface CartProps {
  userId: string;
  token: string;
  onCartUpdate?: () => void;
  onCheckout?: () => void;
}

const Cart: React.FC<CartProps> = ({ userId, token, onCartUpdate, onCheckout }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, [userId]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await getUserCart(userId, token);
      if (response.success && response.data) {
        setCartItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      Alert.alert(
        'Remove Item',
        'Quantity cannot be 0. Would you like to remove this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) },
        ]
      );
      return;
    }

    try {
      await updateCartItemQuantity(itemId, newQuantity, token);
      await loadCart();
      onCartUpdate?.();
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await removeFromCart(itemId, token);
      await loadCart();
      onCartUpdate?.();
      Alert.alert('Success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserCart(userId, token);
              setCartItems([]);
              onCartUpdate?.();
              Alert.alert('Success', 'Cart cleared successfully');
            } catch (error) {
              console.error('Error clearing cart:', error);
              Alert.alert('Error', 'Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some items before checkout.');
      return;
    }

    Alert.alert(
      'Checkout',
      'Are you sure you want to proceed with checkout? This will create orders for all items in your cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: async () => {
            try {
              setCheckoutLoading(true);
              
              // Prepare checkout data
              const checkoutData = {
                user_id: userId,
                items: cartItems.map(item => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                  mark_amount: item.mark_amount,
                  net_weight: item.net_weight,
                })),
                total_amount: cartItems.reduce((sum, item) => sum + (item.mark_amount * item.quantity), 0),
                total_quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
                total_weight: cartItems.reduce((sum, item) => sum + (item.net_weight * item.quantity), 0),
              };

              // Create orders from cart
              const response = await createOrderFromCart(checkoutData, token);
              
              if (response.success) {
                Alert.alert(
                  'Success!',
                  `Orders created successfully! Order IDs: ${response.order_ids.join(', ')}`,
                  [
                    {
                      text: 'View Orders',
                      onPress: () => {
                        onCheckout?.();
                      },
                    },
                  ]
                );
                
                // Clear cart after successful checkout
                await clearUserCart(userId, token);
                setCartItems([]);
                onCartUpdate?.();
              } else {
                Alert.alert('Error', response.message || 'Failed to create orders');
              }
            } catch (error) {
              console.error('Error during checkout:', error);
              Alert.alert('Error', 'Failed to process checkout. Please try again.');
            } finally {
              setCheckoutLoading(false);
            }
          },
        },
      ]
    );
  };

  const startEditingQuantity = (item: CartItem) => {
    setEditingQuantity(item.id);
    setQuantityInput(item.quantity.toString());
  };

  const saveQuantityEdit = async (itemId: number) => {
    const newQuantity = parseInt(quantityInput);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0');
      return;
    }

    await handleQuantityChange(itemId, newQuantity);
    setEditingQuantity(null);
    setQuantityInput('');
  };

  const cancelQuantityEdit = () => {
    setEditingQuantity(null);
    setQuantityInput('');
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.mark_amount * item.quantity), 0);
  };

  const calculateTotalQuantity = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const calculateTotalWeight = () => {
    return cartItems.reduce((sum, item) => sum + (item.net_weight * item.quantity), 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add some products to get started</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshCart}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cart Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <ScrollView 
        style={styles.itemsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshCart} />
        }
      >
        {cartItems.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            {/* Product Image */}
            <Image source={{ uri: item.product_image }} style={styles.productImage} />
            
            {/* Product Details */}
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.product_name}
              </Text>
              <Text style={styles.productSku}>SKU: {item.product_sku}</Text>
              <Text style={styles.productCategory}>{item.category_name}</Text>
              <Text style={styles.productWeight}>Weight: {item.net_weight}g</Text>
              
              {/* Quantity Controls */}
              <View style={styles.quantityContainer}>
                {editingQuantity === item.id ? (
                  <View style={styles.quantityEditContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      keyboardType="numeric"
                      placeholder="Qty"
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => saveQuantityEdit(item.id)}
                    >
                      <Text style={styles.saveButtonText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={cancelQuantityEdit}
                    >
                      <Text style={styles.cancelButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => startEditingQuantity(item)}
                    >
                      <Text style={styles.editButtonText}>✎</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Price and Actions */}
            <View style={styles.priceActions}>
              <Text style={styles.itemPrice}>₹{item.mark_amount}</Text>
              <Text style={styles.totalPrice}>₹{item.mark_amount * item.quantity}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Cart Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items:</Text>
          <Text style={styles.summaryValue}>{calculateTotalQuantity()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Weight:</Text>
          <Text style={styles.summaryValue}>{calculateTotalWeight()}g</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryValue}>₹{calculateTotal()}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.checkoutButton, checkoutLoading && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f44336',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsContainer: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  productWeight: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quantityContainer: {
    marginTop: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  saveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  priceActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 100,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f44336',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Cart;
