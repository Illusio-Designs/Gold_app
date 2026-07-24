import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/common/Header';
import SearchBar from '../components/common/SearchBar';
import CustomSlider from '../components/common/CustomSlider';
import CategoryFilterGroup from '../components/common/CategoryFilterGroup';
import { ProductGridSkeleton, BannerSkeleton, PressableScale, FadeInSlide, Skeleton, ShimmerImage } from '../components/common/Motion';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ShoppingCart01Icon } from '@hugeicons/core-free-icons';
import FocusAwareStatusBar from '../components/common/FocusAwareStatusBar';
import { useCart } from '../context/CartContext';
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { getApprovedCategoriesForUser, getApprovedProductsForUser, getSliders } from '../services/Api';
import { BASE_URL } from '../services/Api';
import { getProductImageUrl } from '../utils/imageUtils';
import { getCategoryImageUrl } from '../utils/imageUtils';
import Toast from 'react-native-toast-message';



type ProductCardProps = {
  product: any;
  onPress: () => void;
  index?: number;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, index = 0 }) => {
  // Handle image source - use product image if available, otherwise fallback
  const imageUrl = getProductImageUrl(product.image);
  const imageSource = imageUrl
    ? { uri: imageUrl }
    : require('../assets/img/home/p1.png'); // Fallback image

  return (
  <FadeInSlide delay={Math.min(index, 8) * 55} style={productCardStyles.cardWrap}>
    <View style={productCardStyles.card}>
      <TouchableOpacity style={productCardStyles.imageWrap} activeOpacity={0.85} onPress={onPress}>
        <ShimmerImage
          source={imageSource?.uri ? imageSource : require('../assets/img/home/p1.png')}
          style={productCardStyles.image}
          radius={14}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <Text style={productCardStyles.name} numberOfLines={1}>{product.name || 'Product'}</Text>
      {/* View button */}
      <PressableScale containerStyle={productCardStyles.viewBtnWrap} style={productCardStyles.viewBtn} activeScale={0.96} onPress={onPress}>
        <Text style={productCardStyles.viewText}>View</Text>
      </PressableScale>
    </View>
  </FadeInSlide>
);
};

const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'new' | 'best'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [productsLoading, setProductsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getTotalQuantity } = useCart();
  const cartCount = typeof getTotalQuantity === 'function' ? getTotalQuantity() : 0;

  // Add error boundary
  const [hasError, setHasError] = useState(false);

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
      } catch (error: any) {
        console.error('[Home] Error checking user auth:', error);
        setIsUserLoggedIn(false);
      }
    };
    
    checkUserAuth();
  }, []);

  // Error handler
  const handleError = (error: any) => {
    console.error('[Home] Error occurred:', error);
    setHasError(true);
  };

  // State for categories
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<any>(null);

  // Fetch categories based on user authentication status
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      
      // Catalog is public — the backend serves all categories to everyone,
      // logged in or not, so the storefront is fully browsable as a guest.
      const response = await getApprovedCategoriesForUser(userId, accessToken);
      if (response && response.success && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('[Home] Error fetching categories:', err);
      setCategoriesError(err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch categories when component mounts or auth state changes
  useEffect(() => {
    fetchCategories();
  }, [isUserLoggedIn, userId, accessToken]);

  // Keep latest fetch function for socket callbacks (avoid stale closures)
  const fetchCategoriesRef = useRef(fetchCategories);
  useEffect(() => {
    fetchCategoriesRef.current = fetchCategories;
  });

  // Load products on mount and when auth state changes
  useEffect(() => {
    loadProducts();
  }, [isUserLoggedIn, userId, accessToken]);
  
  // Filter products when allProducts or selectedCategory changes
  useEffect(() => {
    if (allProducts.length > 0) {
      handleCategorySelect(selectedCategory);
    }
  }, [allProducts]);

  // Load products function
  const loadProducts = async () => {
    try {
      setProductsLoading(true);

      // Products are public — served to everyone regardless of auth, so guests
      // can browse the full catalog just like logged-in users.
      const response = await getApprovedProductsForUser(userId, accessToken);
      if (response && response.success && Array.isArray(response.data)) {
        setAllProducts(response.data); // Store all products
        setProducts(response.data); // Initially show all products
      } else {
        setAllProducts([]);
        setProducts([]);
      }
    } catch (error) {
      console.error('[Home] Error loading products:', error);
      setAllProducts([]);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Keep latest product loader for socket callbacks (avoid stale closures)
  const loadProductsRef = useRef(loadProducts);
  useEffect(() => {
    loadProductsRef.current = loadProducts;
  });

  // Use real-time data hook for sliders
  const slidersData: any = useRealtimeData(
    'sliders',
    {},
    getSliders,
    []
  );
  const slidersResponse = slidersData?.data || [];
  const slidersLoading = slidersData?.loading || false;
  const slidersError = slidersData?.error || null;
  const refreshSliders = slidersData?.refresh || (() => {});

  // Keep latest slider refresher for socket callbacks (avoid stale closures)
  const refreshSlidersRef = useRef(refreshSliders);
  useEffect(() => {
    refreshSlidersRef.current = refreshSliders;
  });

  // Extract sliders from response
  const sliders = slidersResponse || [];
  


  // Handle real-time category updates from socket events
  const handleRealTimeCategoryUpdate = (updateData: any) => {
    console.log('[Home] Real-time category update received:', updateData);
    
    const { action, category, timestamp } = updateData;
    
    switch (action) {
      case 'created':
        // Refresh categories silently
        fetchCategoriesRef.current();
        break;
        
      case 'updated':
        // Refresh categories silently
        fetchCategoriesRef.current();
        break;
        
      case 'deleted':
        // Refresh categories silently
        fetchCategoriesRef.current();
        break;
        
      default:
        console.log('[Home] Unknown category action:', action);
    }
  };

  // Handle real-time slider updates from socket events
  const handleRealTimeSliderUpdate = (updateData: any) => {
    console.log('[Home] Real-time slider update received:', updateData);
    
    const { action, slider, timestamp } = updateData;
    
    switch (action) {
      case 'created':
        // Refresh sliders silently
        refreshSlidersRef.current();
        break;
        
      case 'updated':
        // Refresh sliders silently
        refreshSlidersRef.current();
        break;
        
      case 'deleted':
        // Refresh sliders silently
        refreshSlidersRef.current();
        break;
        
      default:
        console.log('[Home] Unknown slider action:', action);
    }
  };

  // Handle real-time product updates from socket events
  const handleRealTimeProductUpdate = (updateData: any) => {
    console.log('[Home] Real-time product update received:', updateData);
    // Refresh products silently (will re-apply current filters via existing effects)
    loadProductsRef.current();
  };

  // Handle slider Show More button press
  const handleSliderShowMore = (categoryId: number, categoryName: string) => {
    console.log('[Home] Slider Show More pressed for category:', categoryId, categoryName);
    // Navigate to Collection screen with category filter
    (navigation as any).navigate('Collection', { 
      selectedCategory: categoryId,
      categoryName: categoryName 
    });
  };

  // Listen for real-time category updates
  useEffect(() => {
    // Import SocketService dynamically to avoid circular dependencies
    const setupRealTimeUpdates = async () => {
      try {
        const SocketService = require('../services/SocketService').default;
        
        // Listen for category updates
        const categoryUpdateListenerId = SocketService.addEventListener('category-update', handleRealTimeCategoryUpdate);
        
        // Listen for slider updates
        const sliderUpdateListenerId = SocketService.addEventListener('slider-update', handleRealTimeSliderUpdate);

        // Listen for product updates (admin add/update/delete)
        const productUpdateListenerId = SocketService.addEventListener('product-update', handleRealTimeProductUpdate);
        
        // Cleanup listeners on unmount
        return () => {
          SocketService.removeEventListener('category-update', categoryUpdateListenerId);
          SocketService.removeEventListener('slider-update', sliderUpdateListenerId);
          SocketService.removeEventListener('product-update', productUpdateListenerId);
        };
      } catch (error) {
        console.error('[Home] Error setting up real-time updates:', error);
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
      await fetchCategories();
      await loadProducts();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Could not update home page',
        position: 'top',
        visibilityTime: 2000
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleProductPress = (product: any) => {
    (navigation as any).navigate('ProductDetail', { productId: product.id });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category as 'all' | 'new' | 'best');
    
    // Filter products based on category selection
    let filteredProducts = [];
    
    console.log('[Home] Filtering products for category:', category);
    console.log('[Home] Total products available:', allProducts.length);
    
    if (category === 'all') {
      filteredProducts = allProducts;
    } else if (category === 'new') {
      // Filter products updated in the last 30 days (using updated_at instead of created_at)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      filteredProducts = allProducts.filter((product: any) => {
        const productUpdateDate = new Date(product.updated_at);
        const isNew = productUpdateDate >= thirtyDaysAgo;
        console.log('[Home] Product:', product.name, 'Updated:', product.updated_at, 'Is New:', isNew);
        return isNew;
      });
      
      // If no products found with updated_at filter, use created_at with extended period (60 days)
      if (filteredProducts.length === 0) {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        filteredProducts = allProducts.filter((product: any) => {
          const productCreateDate = new Date(product.created_at);
          return productCreateDate >= sixtyDaysAgo;
        });
        
        console.log('[Home] No recent updates found, using 60-day created filter:', filteredProducts.length);
      }
      
      // If still no products, show the most recently updated ones (top 50%)
      if (filteredProducts.length === 0) {
        filteredProducts = [...allProducts]
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, Math.ceil(allProducts.length * 0.5));
        
        console.log('[Home] Using most recently updated products:', filteredProducts.length);
      }
    } else if (category === 'best') {
      // For 'best' products - sort by gross_weight and recent updates
      filteredProducts = [...allProducts]
        .sort((a: any, b: any) => {
          // Sort by gross_weight descending, then by updated_at descending
          const weightDiff = parseFloat(b.gross_weight || '0') - parseFloat(a.gross_weight || '0');
          if (weightDiff !== 0) return weightDiff;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
        .slice(0, Math.ceil(allProducts.length * 0.8)); // Show top 80% as 'best'
      
      console.log('[Home] Best products filtered:', filteredProducts.length);
    } else {
      // Handle actual category names — match by category_id (reliable) with a
      // category_name fallback, since some products only carry the id.
      const selectedName = category.toLowerCase();
      const matchedCat = (categories || []).find(
        (c: any) => c && c.name && String(c.name).toLowerCase() === selectedName,
      );

      filteredProducts = allProducts.filter((product: any) => {
        if (matchedCat && product.category_id != null) {
          return String(product.category_id) === String(matchedCat.id);
        }
        return (product.category_name || '').toLowerCase() === selectedName;
      });
    }

    setProducts(filteredProducts);
  };

  // Show error state if something went wrong
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setHasError(false)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Dark battery/clock icons so they stay visible on the light top bar */}
      <FocusAwareStatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {/* Modern top bar — logo + greeting + search icon */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <Image
          source={require('../assets/img/common/maroonlogo.png')}
          style={styles.topLogo}
          resizeMode="contain"
        />
        <View style={styles.greet}>
          <Text style={styles.greetSmall}>Welcome back</Text>
          <Text style={styles.greetName}>Amrut Jewels</Text>
        </View>
        <TouchableOpacity
          style={styles.cartIconBtn}
          onPress={() => (navigation as any).navigate('Cart')}
          activeOpacity={0.8}
        >
          <HugeiconsIcon icon={ShoppingCart01Icon} size={20} color="#5D0829" strokeWidth={1.8} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeTxt}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchIconBtn}
          onPress={() => (navigation as any).navigate('Search')}
          activeOpacity={0.8}
        >
          <Image source={require('../assets/img/common/searchicon.png')} style={styles.searchIconImg} />
        </TouchableOpacity>
      </View>

      {/* Slider first */}
      {slidersLoading ? (
        <BannerSkeleton height={150} />
      ) : sliders && sliders.length > 0 ? (
        <CustomSlider
          sliders={sliders}
          loading={slidersLoading}
          onSliderPress={(slider) => {
            if (slider.link) {
              // Handle slider link navigation
            }
          }}
          onShowMore={handleSliderShowMore}
        />
      ) : null}

      {/* Shop by Category — shown AFTER the slider, in Glorify, with category cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
      </View>
      <View style={styles.sectionAccent} />

      {categoriesLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.catCard}>
              <Skeleton width={72} height={72} radius={36} />
              <Skeleton width={54} height={10} radius={5} style={{ marginTop: 8 }} />
            </View>
          ))}
        </ScrollView>
      ) : categories && categories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {categories.map((cat: any, i: number) => (
            <FadeInSlide key={cat.id || i} delay={Math.min(i, 8) * 45}>
              <PressableScale
                style={styles.catCard}
                onPress={() =>
                  (navigation as any).navigate('Product', { categoryId: cat.id, categoryName: cat.name })
                }
              >
                <View style={styles.catImgWrap}>
                  <Image
                    source={
                      getCategoryImageUrl(cat.image)
                        ? { uri: getCategoryImageUrl(cat.image) as string }
                        : require('../assets/img/home/p1.png')
                    }
                    style={styles.catImg}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
              </PressableScale>
            </FadeInSlide>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noSlidersContainer}>
          <Text style={styles.noSlidersText}>No categories available</Text>
        </View>
      )}

      {/* Category filter for the product grid */}
      <CategoryFilterGroup
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        categories={categories}
        loading={categoriesLoading}
        style={{
          paddingHorizontal: isSmallScreen() ? 16 : isMediumScreen() ? 28 : isLargeScreen() ? 38 : 25
        }}
      />
      
      {/* Products section */}
      <View style={[styles.sectionHeader, { marginTop: hp('1%') }]}>
        <Text style={styles.sectionTitle}>New Arrivals</Text>
      </View>
      <View style={styles.sectionAccent} />

      {/* Product Cards */}
      <ScrollView contentContainerStyle={productCardStyles.container} showsVerticalScrollIndicator={false}>
        {productsLoading ? (
          <ProductGridSkeleton count={6} />
        ) : products.length > 0 ? (
          products.map((product, idx) => (
          <ProductCard
              product={product}
              key={(product as any).id || idx}
              index={idx}
              onPress={() => handleProductPress(product)}
            />
          ))
        ) : (
          <View style={styles.noProductsContainer}>
            <Text style={styles.noProductsText}>No products available</Text>
          </View>
        )}
      </ScrollView>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('1.5%'),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 12,
  },
  topLogo: {
    width: 44,
    height: 44,
    marginRight: 11,
  },
  greet: {
    flex: 1,
  },
  searchIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#EEE3D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconImg: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  cartIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#EEE3D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cartBadgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  greetSmall: {
    fontSize: 11,
    color: '#8A7A80',
    fontFamily: 'GlorifyDEMO',
  },
  greetName: {
    fontSize: 18,
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: hp('1.6%'),
  },
  sectionTitle: {
    fontSize: 19,
    color: '#5D0829',
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  sectionAccent: {
    width: 44,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#C09E83',
    marginLeft: 18,
    marginTop: 6,
    marginBottom: 4,
  },
  catRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  catCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 76,
  },
  catImgWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#F7F1E8',
    borderWidth: 1,
    borderColor: '#EADBC8',
  },
  catImg: {
    width: '100%',
    height: '100%',
  },
  catName: {
    marginTop: 8,
    fontSize: 12,
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryHeading: {
    color: '#6B0D33',
    fontSize: wp('5.5%'),
    fontWeight: '700',
    alignSelf: 'flex-start',
    paddingHorizontal: wp('7%'),
    marginTop: hp('2%'),
    marginBottom: hp('1.2%'),
    fontFamily: 'GlorifyDEMO',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingText: {
    color: '#6B0D33',
    fontSize: 16,
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
  },
  noSlidersContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  noSlidersText: {
    color: '#6B0D33',
    fontSize: 16,
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
  },
  noProductsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  noProductsText: {
    color: '#6B0D33',
    fontSize: 16,
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#6B0D33',
    fontSize: 18,
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#5D0829',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FCE2BF',
    fontSize: 16,
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
  },
});

const productCardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  // Option A · Clean boutique — white card, soft gold hairline border, gentle
  // shadow, larger image, name in Glorify with an optional category sub-label.
  // Two per row (47% width + space-between).
  cardWrap: {
    width: '47%',
    marginBottom: hp('1.6%'),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('4.5%'),
    borderWidth: 1,
    borderColor: '#EADBC8',
    alignItems: 'center',
    paddingTop: hp('1%'),
    paddingBottom: hp('1.2%'),
    paddingHorizontal: wp('2%'),
    width: '100%',
    position: 'relative',
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: {
    width: '100%',
    borderRadius: wp('3.2%'),
    overflow: 'hidden',
    backgroundColor: '#F7F1E8',
  },
  image: {
    width: '100%',
    height: isSmallScreen() ? hp('11.8%') : isMediumScreen() ? hp('11.8%') : hp('11.4%'),
    borderRadius: wp('3.2%'),
  },
  heartBtn: {
    position: 'absolute',
    top: hp('1.6%'),
    right: wp('4%'),
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FCE2BF',
    alignItems: 'center',
    justifyContent: 'center',
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
  name: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: isSmallScreen() ? wp('3.6%') : isMediumScreen() ? wp('3.9%') : wp('3.8%'),
    fontWeight: '700',
    marginTop: hp('0.9%'),
    textAlign: 'center',
  },
  viewBtnWrap: {
    width: '100%',
    marginTop: hp('0.9%'),
  },
  viewBtn: {
    backgroundColor: '#5D0829',
    borderRadius: 10,
    paddingVertical: hp('0.9%'),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: {
    color: '#FCE2BF',
    fontFamily: 'GlorifyDEMO',
    fontSize: wp('3.4%'),
    fontWeight: '700',
  },
  sku: {
    color: '#C09E83',
    fontFamily: 'GlorifyDEMO',
    fontSize: wp('2.7%'),
    letterSpacing: 0.6,
    marginTop: hp('0.2%'),
    textAlign: 'center',
  },
});

export default Home; 