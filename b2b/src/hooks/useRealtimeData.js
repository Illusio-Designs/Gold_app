import { useState, useEffect, useRef } from 'react';
import RealtimeDataService from '../services/RealtimeDataService';

/**
 * Hook for real-time data updates
 * @param {string} dataType - Type of data to subscribe to (categories, products, etc.)
 * @param {Object} options - Additional options (categoryId for products, etc.)
 * @param {Function} fetchFunction - Function to fetch initial data
 * @param {Array} dependencies - Dependencies for the hook
 * @returns {Object} - { data, loading, error, refresh }
 */
export const useRealtimeData = (dataType, options = {}, fetchFunction = null, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionIdRef = useRef(null);
  
  // Debug error state changes
  useEffect(() => {
    console.log(`[useRealtimeData] Error state changed for ${dataType}:`, error);
  }, [error, dataType]);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let initialData = null;
      
      if (fetchFunction) {
        // Use provided fetch function
        initialData = await fetchFunction(options);
      } else {
        // Use default fetch based on dataType
        switch (dataType) {
          case 'categories':
            const { getCategories } = await import('../services/Api');
            initialData = await getCategories();
            break;
          case 'products':
            if (options.categoryId) {
              const { getProductsByCategory } = await import('../services/Api');
              initialData = await getProductsByCategory(options.categoryId);
            } else {
              // No categoryId provided, set empty data
              setData([]);
              setLoading(false);
              return;
            }
            break;
          case 'orders':
            const { getUserOrders } = await import('../services/Api');
            initialData = await getUserOrders();
            break;
          case 'cart':
            // Cart data is handled by CartContext, not API
            setData([]);
            setLoading(false);
            return;
          case 'search':
            // Search requires specific parameters, handled by custom function
            setData([]);
            setLoading(false);
            return;
          case 'sliders':
            const { getSliders } = await import('../services/Api');
            initialData = await getSliders();
            break;
          default:
            throw new Error(`No default fetch function for dataType: ${dataType}`);
        }
      }
      
      // Handle different response formats
      if (initialData && typeof initialData === 'object') {
        if (Array.isArray(initialData)) {
          setData(initialData);
        } else if (initialData.data && Array.isArray(initialData.data)) {
          setData(initialData.data);
        } else if (initialData.success && initialData.data && Array.isArray(initialData.data)) {
          setData(initialData.data);
        } else {
          setData([]);
        }
      } else {
        setData([]);
      }
      
      // Clear any previous errors on successful fetch
      console.log(`[useRealtimeData] Clearing error - successful fetch for ${dataType}`);
      setError(null);
    } catch (err) {
      console.error(`[useRealtimeData] Error fetching initial ${dataType}:`, err);
      setError(err.message || 'Failed to fetch data');
      setData([]); // Ensure data is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  const subscribeToUpdates = () => {
    if (subscriptionIdRef.current) {
      RealtimeDataService.unsubscribe(dataType, subscriptionIdRef.current);
    }

    subscriptionIdRef.current = RealtimeDataService.subscribe(
      dataType,
      (newData, updateOptions) => {
        console.log(`[useRealtimeData] Received real-time update for ${dataType}:`, newData);
        setData(newData);
        console.log(`[useRealtimeData] Clearing error - successful real-time update for ${dataType}`);
        setError(null); // Clear error on successful real-time update
      },
      options
    );
  };

  // Manual refresh function
  const refresh = async () => {
    await fetchInitialData();
  };

  // Effect for initial data fetch and subscription
  useEffect(() => {
    fetchInitialData();
    subscribeToUpdates();

    // Cleanup subscription on unmount or dependency change
    return () => {
      if (subscriptionIdRef.current) {
        RealtimeDataService.unsubscribe(dataType, subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, dependencies);

  // Clear error when data is successfully loaded
  useEffect(() => {
    if (data && data.length > 0) {
      console.log(`[useRealtimeData] Clearing error - data loaded successfully for ${dataType}:`, data.length, 'items');
      setError(null);
    }
  }, [data, dataType]);

  return {
    data,
    loading,
    error,
    refresh
  };
};

/**
 * Hook for real-time categories
 * @param {Array} dependencies - Dependencies for the hook
 * @returns {Object} - { categories, loading, error, refresh }
 */
export const useRealtimeCategories = (dependencies = []) => {
  return useRealtimeData('categories', {}, null, dependencies);
};

/**
 * Hook for real-time products by category
 * @param {number} categoryId - Category ID
 * @param {Array} dependencies - Dependencies for the hook
 * @returns {Object} - { products, loading, error, refresh }
 */
export const useRealtimeProducts = (categoryId, dependencies = []) => {
  return useRealtimeData('products', { categoryId }, null, [categoryId, ...dependencies]);
};

/**
 * Hook for real-time product details by ID
 * @param {number} productId - Product ID
 * @param {Array} dependencies - Dependencies for the hook
 * @returns {Object} - { product, loading, error, refresh }
 */
export const useRealtimeProductDetails = (productId, dependencies = []) => {
  return useRealtimeCustomData('product-details', 
    async (options) => {
      const { getProductById } = await import('../services/Api');
      return await getProductById(options.productId);
    }, 
    { productId }, 
    [productId, ...dependencies]
  );
};

/**
 * Hook for real-time data with custom fetch function
 * @param {string} dataType - Type of data
 * @param {Function} fetchFunction - Custom fetch function
 * @param {Object} options - Options for fetch function
 * @param {Array} dependencies - Dependencies for the hook
 * @returns {Object} - { data, loading, error, refresh }
 */
export const useRealtimeCustomData = (dataType, fetchFunction, options = {}, dependencies = []) => {
  return useRealtimeData(dataType, options, fetchFunction, dependencies);
}; 