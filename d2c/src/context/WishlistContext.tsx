import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * WishlistContext — a lightweight, device-local wishlist (saved items).
 * Persisted with AsyncStorage so it survives app restarts and needs no
 * backend change. Stores plain product fields (JSON-serialisable).
 */

export interface WishlistItem {
  id: string | number;
  name?: string;
  image?: string; // stored as a path/URL string so it serialises cleanly
  sku?: string;
  category_name?: string;
  gross_weight?: string;
  net_weight?: string;
  size?: string;
  length?: string;
  [key: string]: any;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  isWishlisted: (id: string | number) => boolean;
  toggleWishlist: (product: WishlistItem) => void;
  addToWishlist: (product: WishlistItem) => void;
  removeFromWishlist: (id: string | number) => void;
  clearWishlist: () => void;
  count: number;
}

const STORAGE_KEY = 'wishlistItems';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = (): WishlistContextType => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    // Safe no-op fallback if the provider isn't mounted yet.
    return {
      wishlist: [],
      isWishlisted: () => false,
      toggleWishlist: () => {},
      addToWishlist: () => {},
      removeFromWishlist: () => {},
      clearWishlist: () => {},
      count: 0,
    };
  }
  return ctx;
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Load saved wishlist on start
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setWishlist(JSON.parse(raw));
      } catch (e) {
        console.warn('[Wishlist] load failed', e);
      }
    })();
  }, []);

  const persist = useCallback(async (items: WishlistItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[Wishlist] save failed', e);
    }
  }, []);

  const isWishlisted = useCallback(
    (id: string | number) => wishlist.some(w => String(w.id) === String(id)),
    [wishlist],
  );

  const addToWishlist = useCallback(
    (product: WishlistItem) => {
      setWishlist(prev => {
        if (prev.some(w => String(w.id) === String(product.id))) return prev;
        const next = [...prev, product];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeFromWishlist = useCallback(
    (id: string | number) => {
      setWishlist(prev => {
        const next = prev.filter(w => String(w.id) !== String(id));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleWishlist = useCallback(
    (product: WishlistItem) => {
      setWishlist(prev => {
        const exists = prev.some(w => String(w.id) === String(product.id));
        const next = exists
          ? prev.filter(w => String(w.id) !== String(product.id))
          : [...prev, product];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    persist([]);
  }, [persist]);

  const value: WishlistContextType = {
    wishlist,
    isWishlisted,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    count: wishlist.length,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
