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
    
    // Final fallback — production API host
    return 'https://api.amrutkumargovinddasllp.com';
  } catch (error) {
    console.log('[ImageUtils] Error getting image URL, using fallback:', error);
    return 'https://api.amrutkumargovinddasllp.com';
  }
};

const BACKEND_URL = getImageUrl();

export const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
    return imagePath;
  }
  
  // Use direct file access for product images (same resolved base as the
  // other image helpers so it never depends on a raw env var being present)
  const fullUrl = `${BACKEND_URL}/uploads/products/${imagePath}?t=${Date.now()}`;
  return fullUrl;
};

export const getCategoryImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
    return imagePath;
  }
  
  // Use direct file access for category images
  const fullUrl = `${BACKEND_URL}/uploads/categories/${imagePath}?t=${Date.now()}`;
  return fullUrl;
};

// Pull just the file name out of any path/URL (drops host + query string).
const fileNameOf = (p: string): string => {
  const noQuery = p.split('?')[0];
  const seg = noQuery.substring(noQuery.lastIndexOf('/') + 1);
  try { return decodeURIComponent(seg); } catch { return seg; }
};

// Rebuild an /uploads/<folder>/<file> URL against the APP's backend host.
// The backend sometimes emits these URLs with a localhost/dev host (when
// NODE_ENV isn't 'production'), which never resolves on a device — so we
// always reconstruct them from the filename against BACKEND_URL.
const rebuildUploadUrl = (imagePath: string | null | undefined, folder: string): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  // A real external image that isn't one of our uploads → leave untouched.
  if (imagePath.indexOf('http') === 0 && imagePath.indexOf('/uploads/') === -1) {
    return imagePath;
  }
  const name = imagePath.indexOf('/uploads/') !== -1 ? fileNameOf(imagePath) : imagePath;
  return `${BACKEND_URL}/uploads/${folder}/${encodeURIComponent(name)}?t=${Date.now()}`;
};

export const getSliderImageUrl = (imagePath: string | null | undefined): string | null =>
  rebuildUploadUrl(imagePath, 'slider');

export const getCustomOrderImageUrl = (imagePath: string | null | undefined): string | null =>
  rebuildUploadUrl(imagePath, 'customorders');

export const getProfileImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  if (imagePath.indexOf('http') === 0) {
    return imagePath;
  }
  
  // Use direct file access for profile images
  const fullUrl = `${BACKEND_URL}/uploads/profile/${imagePath}?t=${Date.now()}`;
  return fullUrl;
};
