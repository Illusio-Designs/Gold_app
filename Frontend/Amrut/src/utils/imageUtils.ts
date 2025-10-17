// Utility functions for handling images in the app
declare const API_URL: string;

// Get IMAGE_URL from environment or fallback to API_URL base
const getImageUrl = () => {
  try {
    // Try to get IMAGE_URL from environment
    const imageUrl = process.env.IMAGE_URL || (__DEV__ ? process.env.REACT_NATIVE_IMAGE_URL : undefined);
    if (imageUrl) return imageUrl;
    
    // Fallback to API_URL base
    if (typeof API_URL !== 'undefined') {
      return API_URL.replace('/api', '');
    }
    
    // Final fallback
    return 'http://172.20.10.10:3001';
  } catch (error) {
    console.log('[ImageUtils] Error getting image URL, using fallback:', error);
    return 'http://172.20.10.10:3001';
  }
};

const BACKEND_URL = getImageUrl();

export const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
    return imagePath;
  }
  
  // Use direct file access for product images
  const fullUrl = `${process.env.IMAGE_URL}/uploads/products/${imagePath}?t=${Date.now()}`;
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
