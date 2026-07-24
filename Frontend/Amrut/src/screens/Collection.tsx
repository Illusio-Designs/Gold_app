import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
import { Skeleton, PressableScale, FadeInSlide } from '../components/common/Motion';
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

  // Fetch categories for all users (no authentication required)
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Collection] Fetching all categories (guest/logged-in)');
      const response = await getApprovedCategoriesForUser(userId, accessToken);
      console.log('[Collection] Categories response:', response);
      
      if (response && response.success && response.data && response.data.length > 0) {
        setCategories(response.data);
        console.log('[Collection] Set categories:', response.data.length, 'categories');
        console.log('[Collection] Category names:', response.data.map((cat: any) => cat.name));
      } else {
        console.log('[Collection] No categories found');
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

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Keep latest fetch function for socket callbacks (avoid stale closures)
  const fetchCategoriesRef = useRef(fetchCategories);
  useEffect(() => {
    fetchCategoriesRef.current = fetchCategories;
  });

  // Listen for real-time category updates (admin add/update/delete)
  useEffect(() => {
    const setupRealTimeUpdates = async () => {
      try {
        const SocketService = require('../services/SocketService').default;
        const categoryUpdateListenerId = SocketService.addEventListener(
          'category-update',
          () => fetchCategoriesRef.current(),
        );

        return () => {
          SocketService.removeEventListener(
            'category-update',
            categoryUpdateListenerId,
          );
        };
      } catch (error) {
        console.error('[Collection] Error setting up real-time updates:', error);
      }
    };

    const cleanup = setupRealTimeUpdates();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

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

  const tileHeight = isSmallScreen() ? hp('18%') : isMediumScreen() ? hp('18.5%') : hp('18%');

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <CustomHeader
          title="Collection"
          showBack={false}
          rightActions={[
            {
              icon: require('../assets/img/common/searchicon.png'),
              // @ts-ignore
              onPress: () => navigation.navigate('Search'),
            },
          ]}
        />

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
          <View style={productCardStyles.container}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                width="47%"
                height={tileHeight}
                radius={getResponsiveSpacing(16, 18, 22)}
                style={{ marginBottom: 14 }}
              />
            ))}
          </View>
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
                <FadeInSlide
                  key={category.id ? String(category.id) : String(index)}
                  delay={Math.min(index, 8) * 55}
                  style={productCardStyles.cardWrap}
                >
                  <PressableScale
                    style={productCardStyles.card}
                    onPress={() => handleCategoryPress(category)}
                  >
                    {/* Category Image fills the whole tile */}
                    {category.image ? (
                      <Image
                        source={{ uri: getCategoryImageUrl(category.image) || undefined }}
                        style={productCardStyles.image}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[productCardStyles.image, productCardStyles.placeholderImage]} />
                    )}

                    {/* Maroon fade so the name is always readable over the photo */}
                    <LinearGradient
                      colors={['transparent', 'rgba(58,5,25,0.9)']}
                      style={productCardStyles.overlay}
                    />

                    {/* Category name (cream Glorify) + arrow, over the image */}
                    <View style={productCardStyles.labelRow}>
                      <Text style={productCardStyles.name} numberOfLines={1}>{category.name}</Text>
                      <Text style={productCardStyles.arrow}>›</Text>
                    </View>
                  </PressableScale>
                </FadeInSlide>
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
    fontFamily: 'GlorifyDEMO',
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
    fontFamily: 'GlorifyDEMO',
  },
  timerMin: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '400',
    color: '#6B0D33',
    fontFamily: 'GlorifyDEMO',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#dc2626',
    marginTop: 50,
    fontFamily: 'GlorifyDEMO',
  },
  noCategoriesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    fontFamily: 'GlorifyDEMO',
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
    fontFamily: 'GlorifyDEMO',
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
    fontFamily: 'GlorifyDEMO',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'GlorifyDEMO',
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
    fontFamily: 'GlorifyDEMO',
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
    fontFamily: 'GlorifyDEMO',
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
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: getResponsiveSpacing(24, 30, 36),
  },
  // Reliable 2-per-row grid: container uses space-between and each wrapper is
  // 47% wide (sum < 100%, so it never collapses to a single column).
  cardWrap: {
    width: '47%',
    marginBottom: 14,
  },
  // Option A · Lookbook overlay — the image fills the tile, a maroon fade sits
  // over the bottom, and the category name (cream Glorify) + arrow overlay it.
  card: {
    borderRadius: getResponsiveSpacing(16, 18, 22),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#5D0829',
    width: '100%',
    height: isSmallScreen() ? hp('18%') : isMediumScreen() ? hp('18.5%') : hp('18%'),
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 4,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#5D0829',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
  },
  labelRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(12, 13, 14),
    paddingBottom: getResponsiveSpacing(11, 12, 13),
  },
  name: {
    flex: 1,
    color: '#FCE2BF',
    fontFamily: 'GlorifyDEMO',
    fontSize: isSmallScreen() ? wp('4%') : isMediumScreen() ? wp('4.3%') : wp('4.2%'),
    fontWeight: '700',
  },
  arrow: {
    color: '#FCE2BF',
    fontSize: isSmallScreen() ? wp('5%') : wp('5.4%'),
    fontWeight: '700',
    marginLeft: 6,
    marginBottom: -2,
  },
});

export default Collection;