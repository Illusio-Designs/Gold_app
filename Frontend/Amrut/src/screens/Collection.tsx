import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/common/CustomHeader';
import SearchBar from '../components/common/SearchBar';

import { getCategoryImageUrl } from '../utils/imageUtils';
import { isSmallScreen, isMediumScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';
import { wp, hp } from '../utils/responsiveConfig';
import { getApprovedCategoriesForUser } from '../services/Api';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ScreenLoader from '../components/common/ScreenLoader';
import Toast from 'react-native-toast-message';

type Category = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  processedImageUrl?: string;
  originalImageUrl?: string;
  imageUrl?: string;
  hasProcessedImage?: boolean;
  status: string;
};

const Collection = () => {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  // Get category filter from route params
  // @ts-ignore
  const selectedCategoryId = (route as any)?.params?.selectedCategory;
  // @ts-ignore
  const categoryName = (route as any)?.params?.categoryName;

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
        console.error('[Collection] Error checking user auth:', error);
        setIsUserLoggedIn(false);
      }
    };
    
    checkUserAuth();
  }, []);

  // State for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Fetch categories based on user authentication status
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isUserLoggedIn && userId && accessToken) {
        console.log('[Collection] Fetching approved categories for user:', userId);
        console.log('[Collection] User authentication state:', { isUserLoggedIn, userId, accessToken: accessToken ? 'present' : 'missing' });
        
        try {
          const response = await getApprovedCategoriesForUser(userId, accessToken);
          console.log('[Collection] Approved categories response:', response);
          
          if (response && response.success && response.data && response.data.length > 0) {
            setCategories(response.data);
            console.log('[Collection] Set approved categories:', response.data.length, 'categories');
            console.log('[Collection] Approved categories names:', response.data.map((cat: any) => cat.name));
          } else {
            console.log('[Collection] No approved categories found - user may not have approved login request yet');
            console.log('[Collection] Setting empty categories array - user needs to request login first');
            setCategories([]);
          }
        } catch (apiError) {
          console.error('[Collection] Error calling getApprovedCategoriesForUser:', apiError);
          console.log('[Collection] Setting empty categories array due to API error');
          setCategories([]);
        }
      } else {
        console.log('[Collection] User not logged in - showing empty categories');
        console.log('[Collection] User authentication state:', { isUserLoggedIn, userId, accessToken: accessToken ? 'present' : 'missing' });
        setCategories([]);
      }
    } catch (err) {
      console.error('[Collection] Error fetching categories:', err);
      setError(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories when component mounts or auth state changes
  useEffect(() => {
    fetchCategories();
  }, [isUserLoggedIn, userId, accessToken]);

  // Filter categories based on selected category from slider
  const filteredCategories = (categories || [])
    .filter((cat: Category) => cat && cat.name)
    .filter((cat: Category) => !selectedCategoryId || cat.id === selectedCategoryId)
    .filter((cat: Category) => search === '' || cat.name.toLowerCase().includes(search.toLowerCase()));

  // Debug logging
  console.log('[Collection] Current categories state:', categories);
  console.log('[Collection] Filtered categories:', filteredCategories);
  console.log('[Collection] User logged in:', isUserLoggedIn);
  console.log('[Collection] User ID:', userId);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
      Toast.show({
        type: 'success',
        text1: 'Categories Updated',
        text2: 'Your collections have been refreshed',
        position: 'top',
        visibilityTime: 2000
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Could not update collections',
        position: 'top',
        visibilityTime: 2000
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    console.log('Selected category:', category.name, 'ID:', category.id);
    // @ts-ignore
    navigation.navigate('Product', {
      categoryId: category.id,
      categoryName: category.name
    });
  };

  // Show screen loader when initially loading
  if (loading) {
    return <ScreenLoader text="Loading Collection..." />;
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <CustomHeader title="Collection" timer={true} />

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 25, marginTop: 10 }}>
          <SearchBar value={search} onChangeText={setSearch} onPress={() => {
            // @ts-ignore
            navigation.navigate('Search');
          }} />
        </View>

        {/* Category Filter Header */}
        {selectedCategoryId && categoryName && (
          <View style={styles.categoryFilterHeader}>
            <Text style={styles.categoryFilterText}>
              Showing: <Text style={styles.categoryFilterName}>{categoryName}</Text>
            </Text>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading/Error State */}
        {loading ? (
          <View style={styles.loadingContainer} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{String(error)}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Categories Display */
          <ScrollView
            contentContainerStyle={productCardStyles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredCategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No categories found</Text>
                <Text style={styles.emptySubtext}>
                  {search ? `No categories match "${search}"` : 'No categories available'}
                </Text>
              </View>
            ) : (
              filteredCategories.map((category: Category, index: number) => (
                <TouchableOpacity
                  key={category.id ? String(category.id) : String(index)}
                  style={productCardStyles.card}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.85}
                >
                  {/* Category Image */}
                  {category.image ? (
                    <Image
                      source={{ uri: getCategoryImageUrl(category.image) || undefined }}
                      style={productCardStyles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[productCardStyles.image, productCardStyles.placeholderImage]}>
                      <Text style={productCardStyles.placeholderText}>No Image</Text>
                    </View>
                  )}

                  {/* Category Name */}
                  <Text style={productCardStyles.name}>{category.name}</Text>

                  {/* Category Description */}
                  {category.description && (
                    <Text style={productCardStyles.description} numberOfLines={2}>
                      {category.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* Toast for notifications */}
        <Toast />
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: isShortScreen() ? 40 : isTallScreen() ? 60 : 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(16, 20, 24),
    marginBottom: getResponsiveSpacing(6, 8, 10),
  },
  backArrow: {
    color: '#6B0D33',
    fontSize: getResponsiveFontSize(24, 28, 32),
    fontWeight: '700',
    marginRight: getResponsiveSpacing(1, 2, 3),
    marginTop: -10,
  },
  header: {
    color: '#6B0D33',
    fontSize: getResponsiveFontSize(22, 26, 30),
    fontWeight: '700',
    fontFamily: 'Glorifydemo-BW3J3',
    marginLeft: getResponsiveSpacing(1, 2, 3),
  },
  timerCircle: {
    width: getResponsiveSpacing(48, 54, 60),
    height: getResponsiveSpacing(48, 54, 60),
    borderRadius: getResponsiveSpacing(24, 27, 30),
    borderWidth: 1,
    borderColor: '#6B0D33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSpacing(1, 2, 3),
  },
  timerText: {
    color: '#6B0D33',
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  timerMin: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '400',
    color: '#6B0D33',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#dc2626',
    marginTop: 50,
    fontFamily: 'Glorifydemo-BW3J3',
  },
  noCategoriesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    fontFamily: 'Glorifydemo-BW3J3',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#6B0D33',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'Glorifydemo-BW3J3',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  categoryFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
    paddingVertical: getResponsiveSpacing(10, 12, 14),
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  categoryFilterText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#333',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  categoryFilterName: {
    fontWeight: '700',
    color: '#6B0D33',
  },
  clearFilterButton: {
    paddingVertical: getResponsiveSpacing(5, 7, 9),
    paddingHorizontal: getResponsiveSpacing(10, 12, 14),
    backgroundColor: '#6B0D33',
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
});

const productCardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: getResponsiveSpacing(24, 30, 36),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12, 16, 22),
    borderWidth: 0.5,
    borderColor: '#5D0829',
    alignItems: 'center',
    paddingTop: getResponsiveSpacing(6, 8, 10),
    margin: getResponsiveSpacing(6, 8, 12),
    width: isSmallScreen() ? wp('38%') : isMediumScreen() ? wp('38%') : wp('40%'),
    height: isSmallScreen() ? hp('16.5%') : isMediumScreen() ? hp('16.8%') : hp('16%'),
  },
  image: {
    width: isSmallScreen() ? wp('34%') : isMediumScreen() ? wp('34%') : wp('35%'),
    height: isSmallScreen() ? hp('11.5%') : isMediumScreen() ? hp('11.5%') : hp('11%'),
    borderRadius: getResponsiveSpacing(10, 12, 16),
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  name: {
    color: '#6B0D33',
    fontFamily: 'Glorifydemo-BW3J3',
    fontSize: isSmallScreen() ? wp('3.2%') : isMediumScreen() ? wp('3.7%') : wp('3.5%'),
    fontWeight: '700',
    marginTop: getResponsiveSpacing(4, 6, 8),
    textAlign: 'center',
  },
  description: {
    color: '#666',
    fontSize: isSmallScreen() ? wp('2.8%') : isMediumScreen() ? wp('3.2%') : wp('3%'),
    fontFamily: 'Glorifydemo-BW3J3',
    marginTop: getResponsiveSpacing(2, 3, 4),
    textAlign: 'center',
  },
});

export default Collection;