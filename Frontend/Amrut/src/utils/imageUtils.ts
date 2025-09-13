// Utility functions for handling images in the app
import { API_URL } from '@env';

// Extract base URL from API_URL (remove /api suffix)
const BACKEND_URL = API_URL?.replace('/api', '') || 'http://172.20.10.10:3001';

export const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Use direct file access for product images
  const fullUrl = `${BACKEND_URL}/uploads/products/${imagePath}?t=${Date.now()}`;
  console.log(`[App] Product image URL:`, {
    imagePath,
    fullUrl
  });
  return fullUrl;
};

export const getCategoryImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Use direct file access for category images
  const fullUrl = `${BACKEND_URL}/uploads/categories/${imagePath}?t=${Date.now()}`;
  console.log(`[App] Category image URL:`, {
    imagePath,
    fullUrl
  });
  return fullUrl;
};

export const getSliderImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Use direct file access for slider images
  const fullUrl = `${BACKEND_URL}/uploads/slider/${imagePath}?t=${Date.now()}`;
  console.log(`[App] Slider image URL:`, {
    imagePath,
    fullUrl
  });
  return fullUrl;
};

export const getProfileImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Use direct file access for profile images
  const fullUrl = `${BACKEND_URL}/uploads/profile/${imagePath}?t=${Date.now()}`;
  console.log(`[App] Profile image URL:`, {
    imagePath,
    fullUrl
  });
  return fullUrl;
};
