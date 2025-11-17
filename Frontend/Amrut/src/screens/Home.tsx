import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/common/Header';
import SearchBar from '../components/common/SearchBar';
import CustomSlider from '../components/common/CustomSlider';
import CategoryFilterGroup from '../components/common/CategoryFilterGroup';
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
import { useNavigation } from '@react-navigation/native';
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { getApprovedCategoriesForUser, getApprovedProductsForUser, getCategories, getSliders } from '../services/Api';
import { BASE_URL } from '../services/Api';
import { getProductImageUrl } from '../utils/imageUtils';
import Toast from 'react-native-toast-message';



type ProductCardProps = { 
  product: any;
  onPress: () => void;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  // Handle image source - use product image if available, otherwise fallback
  const imageUrl = getProductImageUrl(product.image);
console.log("imageSource",imageUrl)

  const imageSource = imageUrl
    ? { uri: imageUrl }
    : require('../assets/img/home/p1.png'); // Fallback image
  return (
  <TouchableOpacity style={productCardStyles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={imageSource?.uri ? imageSource : require('../assets/img/home/p1.png')} style={productCardStyles.image} resizeMode="cover" />
      <Text style={productCardStyles.name}>{product.name || 'Product'}</Text>
  </TouchableOpacity>
);
};

const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'new' | 'best'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [productsLoading, setProductsLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const navigation = useNavigation();

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

  // Fetch categories for all users (no authentication required)
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      
      console.log('[Home] Fetching all categories (guest/logged-in)');
      const response = await getCategories();
      console.log('[Home] Categories response:', response);
      
      if (response && response.success && response.data && response.data.length > 0) {
        setCategories(response.data);
        console.log('[Home] Set categories:', response.data.length, 'categories');
        console.log('[Home] Category names:', response.data.map((cat: any) => cat.name));
      } else {
        console.log('[Home] No categories found');
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

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);
  
  // Filter products when allProducts or selectedCategory changes
  useEffect(() => {
    if (allProducts.length > 0) {
      handleCategorySelect(selectedCategory);
    }
  }, [allProducts]);

  // Load products function - for all users (no authentication required)
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      
      console.log('[Home] Loading all products (guest/logged-in)');
      const response = await getApprovedProductsForUser(userId, accessToken);
      console.log('[Home] Products response:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        setAllProducts(response.data); // Store all products
        setProducts(response.data); // Initially show all products
        console.log('[Home] Loaded products:', response.data.length);
      } else {
        console.log('[Home] No products found');
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

  // Use real-time data hook for sliders
  const slidersData: any = useRealtimeData(
    'sliders',
    {},
    getSliders,
    []
  );
  
  console.log("slidersData:", slidersData);
  
  // Process sliders response and fix localhost URLs
  const slidersResponse = (slidersData?.data || []).map((slider: any) => ({
    ...slider,
    image_url: slider.image_url ? slider.image_url.replace('http://localhost:3001', 'https://api.amrutkumargovinddasllp.com') : slider.image_url
  }));
  const slidersLoading = slidersData?.loading || false;
  const slidersError = slidersData?.error || null;
  const refreshSliders = slidersData?.refresh || (() => {});

  // Categories are now managed by local state
  console.log('[Home] Current categories state:', categories);
  console.log('[Home] User logged in:', isUserLoggedIn);
  console.log('[Home] User ID:', userId);

  // Extract sliders from response
  const sliders = slidersResponse || [];
  


  // Handle real-time category updates from socket events
  const handleRealTimeCategoryUpdate = (updateData: any) => {
    console.log('[Home] Real-time category update received:', updateData);
    
    const { action, category, timestamp } = updateData;
    
    switch (action) {
      case 'created':
        // Refresh categories silently
        fetchCategories();
        break;
        
      case 'updated':
        // Refresh categories silently
        fetchCategories();
        break;
        
      case 'deleted':
        // Refresh categories silently
        fetchCategories();
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
        refreshSliders();
        break;
        
      case 'updated':
        // Refresh sliders silently
        refreshSliders();
        break;
        
      case 'deleted':
        // Refresh sliders silently
        refreshSliders();
        break;
        
      default:
        console.log('[Home] Unknown slider action:', action);
    }
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
        
        // Cleanup listeners on unmount
        return () => {
          SocketService.removeEventListener('category-update', categoryUpdateListenerId);
          SocketService.removeEventListener('slider-update', sliderUpdateListenerId);
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
      Toast.show({
        type: 'success',
        text1: 'Home Updated',
        text2: 'Your home page has been refreshed',
        position: 'top',
        visibilityTime: 2000
      });
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
    console.log('[Home] Sample product for debugging:', allProducts[0]);
    
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
      // Handle actual category selection - filter by category_id
      console.log('[Home] Filtering by category name:', category);
      
      // Find the category object from categories array
      const selectedCategoryObj = categories.find((cat: any) => 
        cat.name.toLowerCase() === category.toLowerCase()
      );
      
      console.log('[Home] Found category object:', selectedCategoryObj);
      
      if (selectedCategoryObj) {
        // Filter products by category_id
        filteredProducts = allProducts.filter((product: any) => {
          const matches = product.category_id === selectedCategoryObj.id;
          console.log('[Home] Product:', product.name, 'CategoryID:', product.category_id, 'Selected:', selectedCategoryObj.id, 'Matches:', matches);
          return matches;
        });
      } else {
        // Fallback to category name matching
        filteredProducts = allProducts.filter((product: any) => {
          const productCategoryName = product.category_name?.toLowerCase();
          const selectedCategoryName = category.toLowerCase();
          const matches = productCategoryName === selectedCategoryName;
          
          console.log('[Home] Product:', product.name, 'Category:', productCategoryName, 'Matches:', matches);
          return matches;
        });
      }
      
      console.log('[Home] Category-specific products filtered:', filteredProducts.length);
    }
    
    console.log('[Home] Final filtered products count:', filteredProducts.length);
    setProducts(filteredProducts);
    
    Toast.show({
      type: 'info',
      text1: 'Category Selected',
      text2: `Showing ${filteredProducts.length} ${category} products`,
      position: 'top',
      visibilityTime: 1500
    });
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

  // Show screen loader when categories are loading
  if (categoriesLoading) {
    return <ScreenLoader text="Loading Home..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Header />
      <View style={{paddingHorizontal:25}}>
        <SearchBar value={search} onChangeText={setSearch} onPress={() => (navigation as any).navigate('Search')} />
      </View>
      
      <Text style={styles.categoryHeading}>Category</Text>
      {slidersLoading ? (
        <View style={styles.loadingContainer}>
          <CustomLoader size="large" text="Loading categories..." textColor="#5D0829" />
        </View>
      ) : sliders && sliders.length > 0 ? (
        <CustomSlider
          sliders={sliders}
          loading={slidersLoading}
          onSliderPress={(slider) => {
            if (slider.link) {
              // Handle slider link navigation
              Toast.show({
                type: 'info',
                text1: 'Slider Action',
                text2: `Opening: ${slider.title}`,
                position: 'top',
                visibilityTime: 2000
              });
            }
          }}
          onShowMore={handleSliderShowMore}
        />
      ) : (
        <View style={styles.noSlidersContainer}>
          <Text style={styles.noSlidersText}>No categories available</Text>
        </View>
      )}
      
      {/* Responsive padding for CategoryFilterGroup */}
      <CategoryFilterGroup 
        selected={selectedCategory} 
        onSelect={handleCategorySelect}
        categories={categories}
        loading={categoriesLoading}
        style={{
          paddingHorizontal: isSmallScreen() ? 16 : isMediumScreen() ? 28 : isLargeScreen() ? 38 : 25
        }}
      />
      
      {/* Product Cards */}
      <ScrollView contentContainerStyle={productCardStyles.container} showsVerticalScrollIndicator={false}>
        {productsLoading ? (
          <View style={styles.loadingContainer}>
            <CustomLoader size="large" text="Loading products..." textColor="#5D0829" />
          </View>
        ) : products.length > 0 ? (
          products.map((product, idx) => (
          <ProductCard 
              product={product}
              key={(product as any).id || idx} 
              onPress={() => handleProductPress(product)}
            />
          ))
        ) : (
          <View style={styles.noProductsContainer}>
            <Text style={styles.noProductsText}>No products available</Text>
          </View>
        )}
      </ScrollView>

      {/* Toast for notifications */}
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: hp('2.5%'),
    paddingHorizontal: wp('1.5%'),
  },
  categoryHeading: {
    color: '#6B0D33',
    fontSize: wp('5.5%'),
    fontWeight: '700',
    alignSelf: 'flex-start',
    paddingHorizontal: wp('7%'),
    marginTop: hp('2%'),
    marginBottom: hp('1.2%'),
    fontFamily: 'Glorifydemo-BW3J3',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingText: {
    color: '#6B0D33',
    fontSize: 16,
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
  },
});

const productCardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    borderWidth: isSmallScreen() ? 0.5 : isMediumScreen() ? 0.5 : isLargeScreen() ? 0.8 : 0.5,
    borderColor: '#5D0829',
    alignItems: 'center',
    paddingTop: hp('0.7%'),
    margin: wp('2%'),
    width: isSmallScreen() ? wp('38%') : isMediumScreen() ? wp('38%') : wp('40%'),
    height: isSmallScreen() ? hp('16.5%') : isMediumScreen() ? hp('16.8%') : hp('16%'),
  },
  image: {
    width: isSmallScreen() ? wp('34%') : isMediumScreen() ? wp('34%') : wp('35%'),
    height: isSmallScreen() ? hp('11.5%') : isMediumScreen() ? hp('11.5%') : hp('11%'),
    borderRadius: wp('3%'),
    borderColor: '#5D0829',
  },
  name: {
    color: '#6B0D33',
    fontFamily: 'Glorifydemo-BW3J3',
    fontSize: isSmallScreen() ? wp('3.2%') : isMediumScreen() ? wp('3.7%') : wp('3.5%'),
    fontWeight: '700',
    marginTop: isSmallScreen() ? hp('0.7%') : isMediumScreen() ? hp('1.2%') : isLargeScreen() ? hp('1.2%') : hp('1.2%'),
    textAlign: 'center',
  },
});

export default Home; 