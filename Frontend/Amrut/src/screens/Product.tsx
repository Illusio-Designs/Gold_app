import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../context/CartContext';
import CustomHeader from '../components/common/CustomHeader';
import SearchBar from '../components/common/SearchBar';
import Filter from './Filter';
import { getProductImageUrl } from '../utils/imageUtils';
import { getApprovedProductsForUser } from '../services/Api';
import ScreenLoader from '../components/common/ScreenLoader';
import { ProductGridSkeleton, PressableScale, FadeInSlide, ShimmerImage } from '../components/common/Motion';
import { useRealtimeData } from '../hooks/useRealtimeData';

import Toast from 'react-native-toast-message';

// Define a simple product type based on what we expect from the API
type Product = {
  id: number;
  name: string;
  sku: string;
  image: string | undefined;
  processedImageUrl?: string; // New field for processed images with watermarks
  originalImageUrl?: string; // Original image URL
  imageUrl?: string; // Final image URL (processed or fallback)
  hasProcessedImage?: boolean; // Whether processed image exists
  net_weight?: string;
  gross_weight?: string;
  size?: string;
  purity?: string;
  pieces?: string;
  mark_amount?: string;
  status?: string;
  category_id?: number;
  length?: string;
  stock_status?: string; // Added for stock status
};

const Product = () => {
  const [search, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvingCategory, setResolvingCategory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTimestamp, setErrorTimestamp] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  
  // Debug error state changes
  useEffect(() => {
    console.log('[Product] Error state changed:', error);
    if (error) {
      setErrorTimestamp(Date.now());
    } else {
      setErrorTimestamp(null);
    }
  }, [error]);

  const navigation = useNavigation<any>();
  const route = useRoute();
  const { addToCart } = useCart();

  // Check if user is logged in
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedToken = await AsyncStorage.getItem('accessToken');
        
        if (storedUserId && storedToken) {
          setUserId(parseInt(storedUserId));
          setAccessToken(storedToken);
          setIsUserLoggedIn(true);
        } else {
          setIsUserLoggedIn(false);
        }
      } catch (error) {
        console.error('[Product] Error checking user auth:', error);
        setIsUserLoggedIn(false);
      }
    };
    
    checkUserAuth();
  }, []);

  useEffect(() => {
    try {
      const params = route.params as any;
      console.log('[Product] Route params:', params);
      
      // Check for categoryId from Collection page
      if (params?.categoryId) {
        const idNum = typeof params.categoryId === 'string' ? parseInt(params.categoryId, 10) : params.categoryId;
        const validId = Number.isFinite(idNum) && idNum > 0 ? idNum : null;
        setCategoryId(validId);
        setCategoryFilter(params.categoryName || 'Products');
        console.log('[Product] Category ID from Collection:', params.categoryId);
        // If we have a valid ID, we are done resolving
        if (validId !== null) {
          setResolvingCategory(false);
        }
      } else {
        // Fallback to old collection parameter
        const category = params?.collection || params?.category;
        if (category) {
          setCategoryFilter(category);
          setSearch('');
        }
        // Will resolve by name in next effect
      }
    } catch (error) {
      console.log('[Product] No route params found');
      setResolvingCategory(false);
    }
  }, [route.params]);

  // Set resolving to false since we don't need category resolution
  useEffect(() => {
    setResolvingCategory(false);
  }, []);

  const isValidCategoryId = typeof categoryId === 'number' && Number.isFinite(categoryId) && categoryId > 0;

  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<any>(null);

  // Load products for all users (no authentication required)
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      
      console.log('[Product] Loading all products (guest/logged-in)');
      const response = await getApprovedProductsForUser(userId, accessToken);
      
      if (response && response.success && response.data) {
        let filteredProducts = response.data;
        
        // If we have a specific category, filter by it
        if (isValidCategoryId) {
          filteredProducts = response.data.filter((product: Product) => product.category_id === categoryId);
          console.log('[Product] Filtered products by category:', categoryId, 'Found:', filteredProducts.length);
        }
        
        setProducts(filteredProducts);
        console.log('[Product] Set products:', filteredProducts.length, 'products');
      } else {
        setProducts([]);
        console.log('[Product] No products found');
      }
    } catch (err) {
      console.error('[Product] Error loading products:', err);
      setProductsError(err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load products when component mounts or category changes
  useEffect(() => {
    if (!resolvingCategory) {
      loadProducts();
    }
  }, [isValidCategoryId, resolvingCategory]);

  // A product matches a chosen filter value only when it actually has that
  // field set and it differs — missing data never hides a product.
  const matchesFilter = (productVal: any, selected: any) => {
    if (!selected) return true;
    const pv = productVal != null ? String(productVal).trim().toLowerCase() : '';
    if (pv === '') return true; // no data on this product → don't exclude
    return pv === String(selected).trim().toLowerCase();
  };

  // Filter products to exclude out-of-stock items and apply search + filters
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;

    // Filter out out-of-stock products
    if (p.stock_status === 'out_of_stock') {
      return false;
    }

    // Filter by search term
    const name = p.name || p.sku || '';
    if (!name.toLowerCase().includes(search.toLowerCase())) return false;

    // Applied filters (from the Filter sheet)
    if (appliedFilters) {
      if (!matchesFilter((p as any).size, appliedFilters.size)) return false;
      if (!matchesFilter((p as any).length, appliedFilters.length)) return false;
      if (!matchesFilter((p as any).purity, appliedFilters.purity)) return false;
    }

    return true;
  });

  // Update loading state based on products loading
  useEffect(() => {
    setLoading(productsLoading);
  }, [productsLoading]);

  // Update error state based on products error
  useEffect(() => {
    console.log('[Product] Products error changed:', productsError);
    setError(productsError);
  }, [productsError]);

  // Clear error when products are successfully loaded
  useEffect(() => {
    console.log('[Product] Products changed:', products);
    if (products && products.length > 0) {
      console.log('[Product] Clearing error - products loaded successfully');
      setError(null);
    }
  }, [products]);

  // Clear stale errors (older than 5 seconds)
  useEffect(() => {
    if (error && errorTimestamp) {
      const timer = setTimeout(() => {
        const now = Date.now();
        if (errorTimestamp && (now - errorTimestamp) > 5000) {
          console.log('[Product] Clearing stale error - error is older than 5 seconds');
          setError(null);
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, errorTimestamp]);

  // Refresh products function
  const refreshProducts = async () => {
    console.log('[Product] Refreshing products...');
    await loadProducts();
  };

  // Handle real-time product updates from socket events
  const handleRealTimeProductUpdate = (updateData: any) => {
    console.log('[Product] Real-time product update received:', updateData);
    
    const { action, product, timestamp } = updateData;
    
    switch (action) {
      case 'created':
        // Refresh products silently
        refreshProducts();
        break;
        
      case 'updated':
        // Refresh products silently
        refreshProducts();
        break;
        
      case 'deleted':
        // Refresh products silently
        refreshProducts();
        break;
        
      default:
        console.log('[Product] Unknown product action:', action);
    }
  };

  // Listen for real-time product updates
  useEffect(() => {
    // Import SocketService dynamically to avoid circular dependencies
    const setupRealTimeUpdates = async () => {
      try {
        const SocketService = require('../services/SocketService').default;
        
        // Listen for product updates
        const productUpdateListenerId = SocketService.addEventListener('product-update', handleRealTimeProductUpdate);
        
        // Cleanup listeners on unmount
        return () => {
          SocketService.removeEventListener('product-update', productUpdateListenerId);
        };
      } catch (error) {
        console.error('[Product] Error setting up real-time updates:', error);
      }
    };

    const cleanup = setupRealTimeUpdates();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  const addToCartDirectly = async (product: Product) => {
    try {
      // A valid SKU is required — CartContext resolves the real product_id via
      // getProductBySku(sku) before adding it to the backend cart. Never fall
      // back to a placeholder SKU, or we'd add the wrong product to the cart.
      if (!product.sku || String(product.sku).trim() === '') {
        Toast.show({
          type: 'error',
          text1: 'Cannot add to cart',
          text2: 'This product is missing its SKU. Please try again later.',
          position: 'top',
          visibilityTime: 2500,
        });
        return;
      }

      // Use the same image priority as the display logic - prioritize original image
      let imageUrl = product.image || product.originalImageUrl || product.imageUrl || product.processedImageUrl;

      // Use the same URL construction as ProductDetail
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = getProductImageUrl(imageUrl) || undefined;
      }

      await addToCart({
        image: imageUrl && imageUrl.trim() !== '' ? imageUrl : 'fallback',
        title: product.name || product.sku || 'Product',
        subtitle: 'Jewelry',
        gWeight: product.gross_weight || '',
        nWeight: product.net_weight || '',
        sku: product.sku,
        size: product.size || '',
        length: product.length || '',
        quantity: 1,
      }, 1, '');

      // Show success toast
    } catch (error) {
      console.error('[Product] Error adding to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to cart',
        position: 'top',
        visibilityTime: 2000
      });
    }
  };

  // Get the category name from route params if available
  const getCategoryName = () => {
    try {
      const params = route.params as any;
      return params?.categoryName || params?.collection || params?.category || 'Products';
    } catch (error) {
      return 'Products';
    }
  };

  const categoryName = getCategoryName();

  // Function to render product image with proper fallback (same logic as ProductDetail)
  const renderProductImage = (product: Product) => {
    // Use the same logic as ProductDetail page - prioritize original image over watermarked
    let imageUrl = product.image || product.originalImageUrl || product.imageUrl || product.processedImageUrl;
    
    if (imageUrl && imageUrl.trim() !== '') {
      // Use the same URL construction as ProductDetail
      if (!imageUrl.startsWith('http')) {
        imageUrl = getProductImageUrl(imageUrl) || undefined;
      }
      
      console.log(`[Product] Using image: ${imageUrl}`);
      console.log(`[Product] Image type: ${product.hasProcessedImage ? 'PROCESSED (watermarked)' : 'ORIGINAL'}`);
      
      return (
        <ShimmerImage
          source={{ uri: imageUrl }}
          style={styles.image}
          radius={14}
          resizeMode="cover"
          onError={(error: any) => {
            console.error(`[Product] Image failed to load: ${imageUrl}`, error?.nativeEvent);
          }}
        />
      );
    } else {
      // Show "no image" placeholder
      console.log(`[Product] No image available, showing placeholder`);
      return (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      );
    }
  };

  // Show screen loader when initially loading
  if (resolvingCategory) {
    return null;
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title={categoryName || 'Products'}
        rightActions={[
          {
            icon: require('../assets/img/common/searchicon.png'),
            onPress: () => (navigation as any).navigate('Search'),
          },
          {
            icon: require('../assets/img/common/filtericon.png'),
            onPress: () => setFilterVisible(true),
          },
        ]}
      />

      {/* Product grid */}
      {productsLoading ? (
        <ScrollView contentContainerStyle={{ paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <ProductGridSkeleton count={6} />
        </ScrollView>
      ) : (error && !filteredProducts.length) ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filteredProducts.length === 0 ? (
        <Text style={styles.noProductsText}>No products found in this category.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.productGrid} showsVerticalScrollIndicator={false}>
          {filteredProducts.map((item, idx) => {
            return (
              <FadeInSlide key={item.id || idx} delay={Math.min(idx, 8) * 55} style={styles.cardWrap}>
                <View style={styles.card}>
                  {/* Cart icon at top-right */}
                  <TouchableOpacity
                    style={styles.cartIconContainer}
                    onPress={() => addToCartDirectly(item)}
                    activeOpacity={0.7}
                  >
                    <Image source={require('../assets/img/common/cart.png')} style={styles.cartIcon} />
                  </TouchableOpacity>

                  {/* Product Image - tap to view */}
                  <TouchableOpacity
                    style={styles.imageTouch}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  >
                    {renderProductImage(item)}
                    <Text style={styles.name}>{item.name || item.sku || 'Product'}</Text>
                  </TouchableOpacity>

                  {/* View button */}
                  <PressableScale
                    containerStyle={styles.viewBtnWrap}
                    style={styles.viewBtn}
                    activeScale={0.96}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  >
                    <Text style={styles.viewText}>View</Text>
                  </PressableScale>
                </View>
              </FadeInSlide>
            );
          })}
        </ScrollView>
      )}
      <Filter
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          setFilterVisible(false);
        }}
      />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 10,
    marginBottom: 5,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    paddingHorizontal: 12,
    height: 45,
    flex: 1,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    tintColor: '#5D0829',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#5D0829',
    fontWeight: '400',
    fontFamily: 'GlorifyDEMO',
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  clearButton: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  clearIcon: {
    width: 8,
    height: 8,
    tintColor: '#6B0D33',
    resizeMode: 'contain',
  },
  filterBtn: {
    marginLeft: 10,
    backgroundColor: '#5D0829', // updated to match design
    borderRadius: 18, // perfect circle for 40x40
    width: 60,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    top:4,
    
  },
  filterIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    // removed tintColor to preserve original icon color
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 30,
  },
  // Option A · Clean boutique — white card, soft gold hairline border, gentle
  // shadow, rounded image; keeps the quick add-to-cart icon. Two per row.
  cardWrap: {
    width: '47%',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EADBC8',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    width: '100%',
    position: 'relative', // for absolute positioning of cart/heart icons
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageTouch: {
    width: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FCE2BF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  heartGlyph: {
    color: '#5D0829',
    fontSize: 16,
    marginTop: -1,
  },
  heartActive: {
    color: '#C0392B',
  },
  viewBtnWrap: {
    width: '100%',
    marginTop: 10,
  },
  viewBtn: {
    backgroundColor: '#5D0829',
    borderRadius: 10,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: {
    color: '#FCE2BF',
    fontFamily: 'GlorifyDEMO',
    fontSize: 13,
    fontWeight: '700',
  },
  cartIconContainer: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: '#FCE2BF', // Light beige background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },
  cartIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    tintColor: '#5D0829', // Dark maroon shopping bag icon
  },
  image: {
    width: '100%',
    height: 108,
    borderRadius: 13,
  },
  noImageContainer: {
    width: '100%',
    height: 108,
    borderRadius: 13,
    backgroundColor: '#F7F1E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EADBC8',
    borderStyle: 'dashed',
  },
  noImageText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'GlorifyDEMO',
  },
  name: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#dc2626',
    marginTop: 50,
    fontFamily: 'GlorifyDEMO',
  },
  noProductsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    fontFamily: 'GlorifyDEMO',
  },
});

export default Product;
