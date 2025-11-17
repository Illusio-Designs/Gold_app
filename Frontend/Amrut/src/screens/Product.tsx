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
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
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

  // Filter products to exclude out-of-stock items and apply search
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    
    // Filter out out-of-stock products
    if (p.stock_status === 'out_of_stock') {
      console.log(`[Product] Filtering out out-of-stock product: ${p.name || p.sku} (Status: ${p.stock_status})`);
      return false;
    }
    
    // Filter by search term
    const name = p.name || p.sku || '';
    const matches = name.toLowerCase().includes(search.toLowerCase());
    return matches;
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
      // Use the same image priority as the display logic - prioritize original image
      let imageUrl = product.image || product.originalImageUrl || product.imageUrl || product.processedImageUrl;
      
      // Use the same URL construction as ProductDetail
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = getProductImageUrl(imageUrl) || undefined;
      }
      
      console.log(`[Product] Adding to cart: ${product.name || product.sku}`);
      console.log(`[Product] Cart image URL: ${imageUrl || 'No image'}`);
      
      await addToCart({
        image: imageUrl && imageUrl.trim() !== '' ? imageUrl : 'fallback',
        title: product.name || product.sku || 'Product',
        subtitle: 'Jewelry',
        gWeight: product.gross_weight || '2.512',
        nWeight: product.net_weight || '2.512',
        sku: product.sku || 'RMB1021',
        size: product.size || '18" (46cm)',
        length: product.length || '12-14 in',
        quantity: 1,
      }, 1, '');
      
      console.log(`[Product] Added to cart: ${product.name || product.sku} (Quantity: 1)`);
      console.log(`[Product] Cart image: ${imageUrl || 'No image'}`);
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${product.name || product.sku} added to cart`,
        position: 'top',
        visibilityTime: 2000
      });
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
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="cover"
          onLoad={() => console.log(`[Product] Image loaded successfully: ${imageUrl}`)}
          onError={(error) => {
            console.error(`[Product] Image failed to load: ${imageUrl}`, error.nativeEvent);
            // If original image fails, try to fall back to processed
            if (product.image && product.processedImageUrl && product.image !== product.processedImageUrl) {
              console.log(`[Product] Trying fallback to processed image: ${product.processedImageUrl}`);
            }
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
    return <ScreenLoader text="Loading Category..." />;
  }

  if (loading) {
    return <ScreenLoader text="Loading Products..." />;
  }

  return (
    <View style={styles.container}>
      <CustomHeader title={categoryName} timer={true} />
      {/* Search bar with filter button */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
          <Image source={require('../assets/img/common/filtericon.png')} style={styles.filterIcon} />
        </TouchableOpacity>
      </View>
      
      {/* Product grid */}
      {productsLoading ? (
        <CustomLoader 
          size="large" 
          text="Loading products..." 
          textColor="#5D0829"
          containerStyle={{ marginTop: 40 }}
        />
      ) : (error && !filteredProducts.length) ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filteredProducts.length === 0 ? (
        <Text style={styles.noProductsText}>No products found in this category.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.productGrid} showsVerticalScrollIndicator={false}>
          {filteredProducts.map((item, idx) => {
            // Debug logging for each product
            console.log(`[Product Screen] Rendering product ${idx + 1}:`, {
              id: item.id,
              name: item.name,
              sku: item.sku,
              image: item.image,
              processedImageUrl: item.processedImageUrl,
              originalImageUrl: item.originalImageUrl,
              imageUrl: item.imageUrl,
              imageType: typeof item.image,
              hasImage: !!item.image,
              hasProcessedImage: !!item.processedImageUrl,
              finalImageUrl: item.processedImageUrl || item.imageUrl || item.originalImageUrl || item.image
            });
            
            return (
              <TouchableOpacity
                key={item.id || idx}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              >
                {/* Cart icon at top-right */}
                <TouchableOpacity 
                  style={styles.cartIconContainer} 
                  onPress={() => addToCartDirectly(item)}
                  activeOpacity={0.7}
                >
                  <Image source={require('../assets/img/common/cart.png')} style={styles.cartIcon} />
                </TouchableOpacity>
                
                {/* Product Image - Using our custom render function */}
                {renderProductImage(item)}
                
                <Text style={styles.name}>{item.name || item.sku || 'Product'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <Filter
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={() => setFilterVisible(false)}
      />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    justifyContent: 'center',
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    alignItems: 'center',
    paddingTop: 6,
    margin: 8,
    width: 140,
    height: 140,
    position: 'relative', // for absolute positioning of cart icon
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
    width: 125,
    height: 90,
    borderRadius: 12,
  },
  noImageContainer: {
    width: 125,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  noImageText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  name: {
    color: '#6B0D33',
    fontFamily: 'Glorifydemo-BW3J3',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#dc2626',
    marginTop: 50,
    fontFamily: 'Glorifydemo-BW3J3',
  },
  noProductsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    fontFamily: 'Glorifydemo-BW3J3',
  },
});

export default Product;
