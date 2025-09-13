// Utility functions for handling images

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "https://amrutkumargovinddasllp.com";

export const getImageUrl = (imagePath, uploadType = "category") => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Use direct file access for images
  const directory = uploadType === 'category' ? 'categories' : 'products';
  const fullUrl = `${BACKEND_URL}/uploads/${directory}/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Image URL:`, {
    imagePath,
    uploadType,
    directory,
    fullUrl
  });
  return fullUrl;
};

export const getCategoryImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  // Use direct file access for category images like profile images
  const fullUrl = `${BACKEND_URL}/uploads/categories/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Category image URL:`, {
    imagePath,
    fullUrl
  });
  return fullUrl;
};

export const getProductImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  // Use direct file access for product images like profile images
  const fullUrl = `${BACKEND_URL}/uploads/products/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Product image URL:`, {
    imagePath,
    fullUrl
  });
  return fullUrl;
};

export const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  // Use direct file access for profile images
  const fullUrl = `${BACKEND_URL}/uploads/profile/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Profile image URL:`, {
    imagePath,
    fullUrl
  });
  return fullUrl;
};
