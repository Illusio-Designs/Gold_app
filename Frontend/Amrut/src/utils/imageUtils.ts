// Utility functions for handling images in the app
declare const API_URL: string;
declare const IMAGE_URL: string;

// Use IMAGE_URL from environment variables
const BACKEND_URL = IMAGE_URL || API_URL?.replace('/api', '') || 'http://172.20.10.10:3001';

export const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
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
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
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
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
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
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
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
