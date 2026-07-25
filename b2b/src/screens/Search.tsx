import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList,
  Alert,
  RefreshControl
} from 'react-native';
import CustomHeader from '../components/common/CustomHeader';
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
// Removed client-side watermark overlay; backend already embeds watermark

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';
import { searchAll, searchCategories, searchProducts } from '../services/Api';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { EmptyState, AnimatedSearchBar } from '../components/ui';
import { resolveCategoryIcon } from '../utils/categoryIcons';
import Toast from 'react-native-toast-message';
import { useRealtimeData } from '../hooks/useRealtimeData';

type RootStackParamList = {
  Product: { category?: string };
  ProductDetail: { productId: number };
  Home: undefined;
};

const FILTERS = ['All', 'Categories', 'Products'];
const RECENT = ['Earring', 'Ring', 'Necklace', 'Bracelet'];

interface SearchResult {
  type: 'category' | 'product';
  id: number;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  images?: string[];
  category_name?: string;
  net_weight?: number;
  gross_weight?: number;
  size?: string;
  length?: string;
  purity?: string;
  mark?: string;
  sku?: string;
}

const Search = () => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [recent, setRecent] = useState(RECENT);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom search function for real-time updates
  const performSearchWithFilter = async (options: { query?: string; filter?: string }) => {
    const searchText = options?.query || '';
    const filter = options?.filter || 'All';
    
    if (!searchText || !searchText.trim()) {
      return { data: [] };
    }

    try {
      let response;
      
      switch (filter) {
        case 'Categories':
          response = await searchCategories(searchText);
          break;
        case 'Products':
          response = await searchProducts(searchText);
          break;
        default:
          response = await searchAll(searchText);
          break;
      }
      
      return response;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  };

  // Use real-time data hook for search results
  const { data: searchResponse, loading, error, refresh } = (useRealtimeData(
    'search',
    { query: search, filter: selectedFilter },
    search ? performSearchWithFilter : undefined,
    [search, selectedFilter]
  ) as any);

  // Extract search results from response
  const searchResults = searchResponse?.data || searchResponse || [];

  const removeRecent = (item: string) => {
    setRecent(recent.filter(r => r !== item));
  };

  const performSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSearched(false);
      return;
    }

    setSearched(true);
    
    // Show loading toast
  }, []);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    if (!search.trim()) return;
    
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Could not update search results',
        position: 'top',
        visibilityTime: 2000
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (search.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(search);
      }, 500);
    } else {
      setSearched(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, performSearch]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    if (search.trim()) {
      performSearch(search);
    }
  };

  const handleRecentPress = (item: string) => {
    setSearch(item);
    performSearch(item);
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'category') {
      // Navigate to Product screen with category
      (navigation as any).navigate('Product', { 
        category: result.name 
      });
    } else {
      // Navigate to ProductDetail screen
      (navigation as any).navigate('ProductDetail', { 
        productId: result.id 
      });
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      {/* Result Image */}
      <View style={styles.resultImageContainer}>
        {item.type === 'category' ? (
          <View style={[styles.resultImage, styles.iconResult]}>
            <HugeiconsIcon icon={resolveCategoryIcon(item.icon)} size={26} color="#A17C57" strokeWidth={1.6} />
          </View>
        ) : item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.resultImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        
        {/* Type Badge */}
        <View style={[
          styles.typeBadge,
          { backgroundColor: item.type === 'category' ? '#4CAF50' : '#2196F3' }
        ]}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'category' ? 'C' : 'P'}
          </Text>
        </View>
      </View>

      {/* Result Details */}
      <View style={styles.resultDetails}>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.description && (
          <Text style={styles.resultDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        {item.type === 'product' && (
          <View style={styles.productInfo}>
            {item.sku && (
              <Text style={styles.productSku}>SKU: {item.sku}</Text>
            )}
            {item.category_name && (
              <Text style={styles.productCategory}>{item.category_name}</Text>
            )}
            {item.net_weight && (
              <Text style={styles.productWeight}>Weight: {item.net_weight}g</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Show screen loader when initially loading
  if (loading && !searched) {
    return null;
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Search" timer={true} />
      
      {/* Search Bar — same premium bar as Home, in editable mode */}
      <View style={styles.searchContainer}>
        <AnimatedSearchBar
          editable
          autoFocus
          value={search}
          onChangeText={setSearch}
          placeholder="Search for products or categories…"
          onSubmitEditing={() => performSearch(search)}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive
            ]}
            onPress={() => handleFilterChange(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.filterTabTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Searches */}
      {!searched && recent.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.recentTags}>
            {recent.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentTag}
                onPress={() => handleRecentPress(item)}
              >
                <Text style={styles.recentTagText}>{item}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeRecent(item)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Search Results */}
      {searched && (
        <View style={styles.resultsContainer}>
          {loading ? (
            <CustomLoader 
              size="large" 
              text="Searching..." 
              textColor="#5D0829"
              containerStyle={{ marginTop: 40 }}
            />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Search failed</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <EmptyState
                  icon={Search01Icon}
                  title="No results found"
                  subtitle="Try adjusting your search terms or filters"
                />
              }
            />
          )}
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: getResponsiveSpacing(16, 20, 24),
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterTab: {
    flex: 1,
    paddingVertical: getResponsiveSpacing(12, 14, 16),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#5D0829',
  },
  filterTabText: {
    color: '#666',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#5D0829',
    fontWeight: '700',
  },
  recentContainer: {
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
    marginTop: getResponsiveSpacing(14, 18, 22),
    marginBottom: getResponsiveSpacing(8, 10, 12),
  },
  recentTitle: {
    color: '#6B0D33',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    marginBottom: getResponsiveSpacing(6, 8, 10),
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: getResponsiveSpacing(10, 12, 14),
    paddingHorizontal: getResponsiveSpacing(12, 14, 16),
    paddingVertical: getResponsiveSpacing(4, 5, 6),
    marginRight: getResponsiveSpacing(8, 10, 12),
    marginBottom: getResponsiveSpacing(6, 8, 10),
    maxWidth: getResponsiveSpacing(120, 140, 160),
  },
  recentTagText: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '500',
    marginRight: getResponsiveSpacing(4, 5, 6),
  },
  removeButton: {
    padding: getResponsiveSpacing(2, 3, 4),
  },
  removeButtonText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(18, 22, 26),
    fontWeight: '400',
  },
  resultsContainer: {
    flex: 1,
    marginTop: getResponsiveSpacing(16, 20, 24),
  },
  resultsList: {
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: getResponsiveSpacing(8, 10, 12),
    padding: getResponsiveSpacing(12, 14, 16),
    marginBottom: getResponsiveSpacing(8, 10, 12),
    alignItems: 'center',
  },
  resultImageContainer: {
    position: 'relative',
    marginRight: getResponsiveSpacing(12, 14, 16),
  },
  resultImage: {
    width: getResponsiveSpacing(50, 60, 70),
    height: getResponsiveSpacing(50, 60, 70),
    borderRadius: getResponsiveSpacing(6, 8, 10),
  },
  placeholderImage: {
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconResult: {
    backgroundColor: '#FBF3E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#888',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: getResponsiveSpacing(4, 5, 6),
    paddingVertical: getResponsiveSpacing(1, 2, 3),
    borderRadius: getResponsiveSpacing(4, 6, 8),
  },
  typeBadgeText: {
    color: '#fff',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '500',
  },
  resultDetails: {
    flex: 1,
  },
  resultName: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing(2, 3, 4),
  },
  resultDescription: {
    color: '#666',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(12, 14, 16),
    marginBottom: getResponsiveSpacing(2, 3, 4),
  },
  productInfo: {
    marginTop: getResponsiveSpacing(2, 3, 4),
  },
  productSku: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(11, 13, 15),
    fontWeight: '500',
    marginBottom: getResponsiveSpacing(1, 2, 3),
  },
  productCategory: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(11, 13, 15),
    fontWeight: '500',
    marginBottom: getResponsiveSpacing(1, 2, 3),
  },
  productWeight: {
    color: '#666',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(10, 12, 14),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSpacing(40, 50, 60),
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
  },
  errorText: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: getResponsiveSpacing(10, 12, 14),
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    backgroundColor: '#5D0829',
    borderRadius: getResponsiveSpacing(8, 10, 12),
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSpacing(40, 50, 60),
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
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
    fontSize: 34,
  },
  emptyText: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(12, 14, 16),
    marginTop: getResponsiveSpacing(8, 10, 12),
    textAlign: 'center',
  },
});

export default Search; 