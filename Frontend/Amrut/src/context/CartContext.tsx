import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from '../services/Api';

export interface CartItem {
  id: string;
  image: any;
  title: string;
  subtitle: string;
  gWeight: string;
  nWeight: string;
  quantity: number;
  amount?: string;
  sku?: string;
  size?: string;
  length?: string;
  backendId?: number; // Backend cart item ID for syncing
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>, quantity: number, amount?: string) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => void;
  clearCartOnLogout: () => void;
  clearCartForNewUser: () => void;
  clearCartCompletely: () => Promise<void>;
  getTotalQuantity: () => number;
  getTotalWeight: () => number;
  checkout: (remark?: string, courierCompany?: string) => Promise<{ success: boolean; message: string; orderIds?: number[] }>;
  refreshCart: () => Promise<any>;
  handleRealTimeCartUpdate: (updateData: any) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    console.warn('[useCart] Cart context not available, returning default values');
    return {
      cartItems: [],
      addToCart: () => console.warn('[useCart] addToCart not available'),
      removeFromCart: () => console.warn('[useCart] removeFromCart not available'),
      clearCart: () => console.warn('[useCart] clearCart not available'),
      clearCartOnLogout: () => console.warn('[useCart] clearCartOnLogout not available'),
      clearCartForNewUser: () => console.warn('[useCart] clearCartForNewUser not available'),
      clearCartCompletely: () => console.warn('[useCart] clearCartCompletely not available'),
      getTotalQuantity: () => 0,
      getTotalWeight: () => 0,
    };
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  console.log('[CartProvider] Initializing cart provider');

  // Load cart items from AsyncStorage on app start
  useEffect(() => {
    const loadCartItems = async () => {
      try {
        const savedCartItems = await AsyncStorage.getItem('cartItems');
        if (savedCartItems) {
          const parsedItems = JSON.parse(savedCartItems);
          setCartItems(parsedItems);
          console.log('[CartProvider] Loaded cart items from storage:', parsedItems.length, 'items');
        } else {
          console.log('[CartProvider] No saved cart items found');
        }
      } catch (error) {
        console.error('[CartProvider] Error loading cart items:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadCartItems();
  }, []);

  // Handle real-time cart updates from socket events
  const handleRealTimeCartUpdate = (updateData: any) => {
    console.log('[CartContext] Real-time cart update received:', updateData);
    
    const { action, cartItem, timestamp } = updateData;
    
    switch (action) {
      case 'item-added':
        // Add new item to cart silently
        if (cartItem) {
          const newItem: CartItem = {
            id: cartItem.id.toString(),
            image: cartItem.product_image ? { uri: cartItem.product_image } : null,
            title: cartItem.product_name || 'Product',
            subtitle: cartItem.category_name || 'Category',
            gWeight: cartItem.gross_weight || '0',
            nWeight: cartItem.net_weight || '0',
            quantity: cartItem.quantity || 1,
            amount: cartItem.mark_amount || '0',
            sku: cartItem.product_sku || '',
            size: cartItem.size || '',
            length: cartItem.length || '',
            backendId: cartItem.id
          };
          
          setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.sku === newItem.sku);
            if (existingIndex !== -1) {
              // Update existing item
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], quantity: newItem.quantity };
              return updated;
            } else {
              // Add new item
              return [...prev, newItem];
            }
          });
        }
        break;
        
      case 'item-updated':
        // Update existing item in cart silently
        if (cartItem) {
          setCartItems(prev => prev.map(item => 
            item.backendId === cartItem.id 
              ? { ...item, quantity: cartItem.quantity || item.quantity }
              : item
          ));
        }
        break;
        
      case 'item-removed':
        // Remove item from cart silently
        if (cartItem) {
          setCartItems(prev => prev.filter(item => item.backendId !== cartItem.id));
        }
        break;
        
      case 'cart-cleared':
        // Clear entire cart silently
        setCartItems([]);
        break;
        
      default:
        console.log('[CartContext] Unknown cart action:', action);
    }
  };

  // Listen for real-time cart updates
  useEffect(() => {
    if (!isInitialized) return;

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
        console.error('[CartProvider] Error setting up real-time updates:', error);
      }
    };

    const cleanup = setupRealTimeUpdates();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [isInitialized, handleRealTimeCartUpdate]);

  // Sync with backend cart when user is authenticated (only once)
  const [hasSynced, setHasSynced] = useState(false);
  
  useEffect(() => {
    if (hasSynced) return; // Prevent multiple syncs
    
    const syncWithBackend = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('accessToken');
        
        if (userId && token) {
          console.log('[CartProvider] User authenticated, syncing with backend cart');
          const Api = require('../services/Api');
          
          try {
            const backendCart = await Api.getUserCart(parseInt(userId), token);
            console.log('[CartProvider] Backend cart synced:', backendCart);
            
            // Only update local cart with backend data if local cart is empty
            // This prevents backend from overwriting local changes
            if (backendCart.items && backendCart.items.length > 0) {
              const backendItems = backendCart.items.map((item: any) => ({
                id: item.id.toString(),
                image: item.product_image ? { uri: item.product_image } : null,
                title: item.product_name || item.product_sku || 'Product',
                subtitle: 'Jewelry',
                gWeight: item.gross_weight || '0',
                nWeight: item.net_weight || '0',
                sku: item.product_sku || '',
                size: '',
                length: '',
                quantity: item.quantity || 1,
                amount: item.mark_amount || '',
                backendId: item.id // Store the backend cart item ID
              }));
              
              // Only sync if local cart is empty or has different items
              setCartItems(prevItems => {
                if (prevItems.length === 0) {
                  console.log('[CartProvider] Local cart empty, syncing with backend');
                  return backendItems;
                } else {
                  console.log('[CartProvider] Local cart has items, keeping local state');
                  return prevItems;
                }
              });
              
              // Save to storage only if we updated the cart
              if (cartItems.length === 0) {
                await saveCartItems(backendItems);
                console.log('[CartProvider] Local cart updated with backend data');
              }
            } else {
              // Backend cart is empty, clear local cart if it has items
              setCartItems(prevItems => {
                if (prevItems.length > 0) {
                  console.log('[CartProvider] Backend cart empty, clearing local cart');
                  return [];
                }
                return prevItems;
              });
            }
          } catch (backendError) {
            console.error('[CartProvider] Error syncing with backend:', backendError);
          }
        }
      } catch (error) {
        console.error('[CartProvider] Error in syncWithBackend:', error);
      }
    };

    if (isInitialized && !hasSynced) {
      syncWithBackend().then(() => {
        setHasSynced(true);
      });
    }
  }, [isInitialized, hasSynced]);

  // Check if user has changed and clear cart if needed
  useEffect(() => {
    const checkUserChange = async () => {
      try {
        const currentUserId = await AsyncStorage.getItem('userId');
        const lastUserId = await AsyncStorage.getItem('lastUserId');
        
        if (currentUserId && lastUserId && currentUserId !== lastUserId) {
          // Different user logged in, clear cart
          console.log('[CartProvider] Different user logged in, clearing cart');
          setCartItems([]);
          saveCartItems([]);
        }
        
        // Update last user ID
        if (currentUserId) {
          await AsyncStorage.setItem('lastUserId', currentUserId);
        }
      } catch (error) {
        console.error('[CartProvider] Error checking user change:', error);
      }
    };

    checkUserChange();
  }, []);

  // Save cart items to AsyncStorage whenever cart changes
  const saveCartItems = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cartItems', JSON.stringify(items));
      console.log('[CartProvider] Saved cart items to storage:', items.length, 'items');
    } catch (error) {
      console.error('[CartProvider] Error saving cart items:', error);
    }
  };

  const addToCart = async (item: Omit<CartItem, 'id'>, quantity: number, amount?: string) => {
    try {
      console.log('🛒 [CartContext] addToCart called with:', { item, quantity, amount });
      console.log('🛒 [CartContext] Current local cart items:', cartItems);
      
      // Get user ID and token from storage
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!userId || !token) {
        console.log('🛒 [CartContext] User not authenticated, storing locally only');
        // Store locally if not authenticated
        addToCartLocally(item, quantity, amount);
        return;
      }

      // Try to sync with backend first
      try {
        console.log('🛒 [CartContext] Syncing with backend...');
        const Api = require('../services/Api');
        
        // First, get the real product ID from SKU
        console.log('🔍 [CartContext] Getting product ID for SKU:', item.sku);
        const productResponse = await Api.getProductBySku(item.sku);
        console.log('🔍 [CartContext] Product response:', productResponse);
        
        if (!productResponse || !productResponse.id) {
          console.error('❌ [CartContext] Product not found with SKU:', item.sku);
          throw new Error('Product not found with SKU: ' + item.sku);
        }
        
        const productId = productResponse.id;
        console.log('🔍 [CartContext] Real product ID found:', productId);
        
        const backendResponse = await Api.addToCart({
          user_id: parseInt(userId),
          product_id: productId,
          quantity: quantity
        }, token);
        
        console.log('✅ [CartContext] Backend sync successful:', backendResponse);
        
        // If backend sync successful, also store locally for consistency with backend ID
        addToCartLocally(item, quantity, amount, backendResponse.id || backendResponse.cartItemId);
        
      } catch (backendError) {
        console.error('❌ [CartContext] Backend sync failed, storing locally only:', backendError);
        // If backend fails, store locally
        addToCartLocally(item, quantity, amount);
      }
      
    } catch (error) {
      console.error('❌ [CartContext] addToCart error:', error);
      // Fallback to local storage
      addToCartLocally(item, quantity, amount);
    }
  };

  const addToCartLocally = (item: Omit<CartItem, 'id'>, quantity: number, amount?: string, backendId?: number) => {
    const existingItemIndex = cartItems.findIndex(cartItem => 
      cartItem.title === item.title && cartItem.sku === item.sku
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedItems = cartItems.map((cartItem, index) => 
        index === existingItemIndex 
          ? { ...cartItem, quantity: cartItem.quantity + quantity, backendId: backendId || cartItem.backendId }
          : cartItem
      );
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: CartItem = {
        ...item,
        id: Date.now().toString(), // Simple ID generation
        quantity,
        amount: amount || '',
        backendId: backendId, // Store backend ID for syncing
      };
      const updatedItems = [...cartItems, newItem];
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      console.log('🛒 [CartContext] removeFromCart called for id:', id);
      
      // Get user authentication
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (userId && token) {
        console.log('🛒 [CartContext] User authenticated, syncing with backend...');
        
        // Find the item to get its backend ID
        const itemToRemove = cartItems.find(item => item.id === id);
        if (itemToRemove && itemToRemove.backendId) {
          console.log('🛒 [CartContext] Removing item from backend with ID:', itemToRemove.backendId);
          
          try {
            // Remove from backend first
            await Api.removeFromCart(itemToRemove.backendId, token);
            console.log('✅ [CartContext] Item removed from backend successfully');
          } catch (backendError) {
            console.error('❌ [CartContext] Backend removal failed:', backendError);
            // Continue with local removal even if backend fails
          }
        } else {
          console.log('🛒 [CartContext] No backend ID found, removing locally only');
        }
      } else {
        console.log('🛒 [CartContext] User not authenticated, removing locally only');
      }
      
      // Update local state
      const updatedItems = cartItems.filter(item => item.id !== id);
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
      
      console.log('✅ [CartContext] Item removed from local cart');
      
    } catch (error: any) {
      console.error('❌ [CartContext] removeFromCart error:', error);
      // Fallback to local removal only
      const updatedItems = cartItems.filter(item => item.id !== id);
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartItems([]);
  };

  const clearCartOnLogout = () => {
    setCartItems([]);
    saveCartItems([]);
    console.log('[CartProvider] Cart cleared on logout');
  };

  const clearCartForNewUser = () => {
    setCartItems([]);
    saveCartItems([]);
    console.log('[CartProvider] Cart cleared for new user');
  };

  const clearCartCompletely = async () => {
    console.log('[CartProvider] Clearing cart completely');
    setCartItems([]);
    await AsyncStorage.removeItem('cartItems');
    
    // Also clear from backend if user is authenticated
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (userId && token) {
        const Api = require('../services/Api');
        await Api.clearUserCart(parseInt(userId), token);
        console.log('[CartProvider] Backend cart cleared');
      }
    } catch (error) {
      console.error('[CartProvider] Error clearing backend cart:', error);
    }
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalWeight = () => {
    return cartItems.reduce((total, item) => total + (parseFloat(item.nWeight) * item.quantity), 0);
  };

  const checkout = async (remark?: string, courierCompany?: string) => {
    try {
      console.log('🛒 [CartContext] Checkout started');
      console.log('🛒 [CartContext] Local cart items:', cartItems);
      console.log('🛒 [CartContext] Local cart count:', cartItems.length);
      
      // Get user ID and token from storage
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!userId || !token) {
        console.error('❌ [CartContext] Cannot checkout: missing userId or token');
        return { success: false, message: 'User not authenticated' };
      }

      console.log('🛒 [CartContext] User authenticated, getting backend cart first');
      
      // Import the API function
      const Api = require('../services/Api');
      
      // First, get the backend cart to ensure we have the latest data
      try {
        const backendCart = await Api.getUserCart(parseInt(userId), token);
        console.log('🛒 [CartContext] Backend cart retrieved:', backendCart);
        console.log('🛒 [CartContext] Backend cart items count:', backendCart.items?.length || 0);
        
        if (!backendCart.items || backendCart.items.length === 0) {
          console.log('❌ [CartContext] Cannot checkout: backend cart is empty');
          console.log('🛒 [CartContext] Local cart has items but backend cart is empty - sync issue detected');
          
          // Try to sync local cart items to backend first
          console.log('🛒 [CartContext] Attempting to sync local cart to backend...');
          
          let syncSuccess = true;
          for (const localItem of cartItems) {
            try {
              console.log('🛒 [CartContext] Syncing item:', localItem.sku);
              const productResponse = await Api.getProductBySku(localItem.sku);
              console.log('🔍 [CartContext] Product lookup response:', productResponse);
              
              if (!productResponse || !productResponse.id) {
                console.error('❌ [CartContext] Product not found for SKU:', localItem.sku);
                syncSuccess = false;
                continue;
              }
              
              const backendResponse = await Api.addToCart({
                user_id: parseInt(userId),
                product_id: productResponse.id,
                quantity: localItem.quantity
              }, token);
              
              console.log('✅ [CartContext] Item synced to backend:', backendResponse);
              
            } catch (syncError) {
              console.error('❌ [CartContext] Failed to sync item:', localItem.sku, syncError);
              syncSuccess = false;
            }
          }
          
          if (!syncSuccess) {
            return { success: false, message: 'Failed to sync cart items to backend' };
          }
          
          // Cart sync completed, proceed with checkout
        }
        
        console.log('🛒 [CartContext] Backend cart has items, proceeding with checkout');
        
      } catch (cartError) {
        console.error('❌ [CartContext] Error getting backend cart:', cartError);
        return { success: false, message: 'Failed to retrieve cart items' };
      }
      
      console.log('🛒 [CartContext] Calling createOrderFromCart API');
      
      // Call the backend API to create orders from cart
      const response = await Api.createOrderFromCart({
        user_id: parseInt(userId),
        remark: remark || '',
        courier_company: courierCompany || ''
      }, token);

      console.log('✅ [CartContext] Checkout successful, response:', response);
      
      // Clear both local and backend cart after successful order creation
      setCartItems([]);
      await saveCartItems([]);
      
      console.log('✅ [CartContext] Local cart cleared after successful checkout');
      
      return { 
        success: true, 
        message: 'Orders created successfully', 
        orderIds: response.orderIds 
      };
      
    } catch (error: any) {
      console.error('❌ [CartContext] Checkout error:', error);
      return { 
        success: false, 
        message: (error as any).message || 'Failed to create orders' 
      };
    }
  };

  // Refresh cart function for real-time updates
  const refreshCart = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (userId && token) {
        const Api = require('../services/Api');
        const backendCart = await Api.getUserCart(parseInt(userId), token);
        
        if (backendCart.items && backendCart.items.length > 0) {
          const backendItems = backendCart.items.map((item: any) => ({
            id: item.id.toString(),
            image: item.product_image ? { uri: item.product_image } : null,
            title: item.product_name || 'Product',
            subtitle: item.category_name || 'Category',
            gWeight: item.gross_weight || '0',
            nWeight: item.net_weight || '0',
            quantity: item.quantity || 1,
            amount: item.mark_amount || '0',
            sku: item.product_sku || '',
            size: item.size || '',
            length: item.length || ''
          }));
          
          setCartItems(backendItems);
          await saveCartItems(backendItems);
          return { data: backendItems };
        }
      }
      
      return { data: cartItems };
    } catch (error) {
      console.error('[CartContext] Error refreshing cart:', error);
      return { data: cartItems };
    }
  };


  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    clearCartOnLogout,
    clearCartForNewUser,
    clearCartCompletely,
    getTotalQuantity,
    getTotalWeight,
    checkout,
    refreshCart,
    handleRealTimeCartUpdate,
  };

  console.log('[CartProvider] Providing context value with cartItems:', cartItems);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 