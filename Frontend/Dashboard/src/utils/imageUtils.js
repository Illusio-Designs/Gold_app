// Utility functions for handling images

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.amrutkumargovinddasllp.com/uploads";

export const getImageUrl = (imagePath, uploadType = "category") => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Use direct file access for images
  const directory = uploadType === "category" ? "categories" : "products";
  const fullUrl = `${IMAGE_BASE_URL}/${directory}/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Image URL:`, {
    imagePath,
    uploadType,
    directory,
    fullUrl,
  });
  return fullUrl;
};

export const getCategoryImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Use direct file access for category images like profile images
  const fullUrl = `${IMAGE_BASE_URL}/categories/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Category image URL:`, {
    imagePath,
    fullUrl,
  });
  return fullUrl;
};

export const getProductImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Use direct file access for product images like profile images
  const fullUrl = `${IMAGE_BASE_URL}/products/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Product image URL:`, {
    imagePath,
    fullUrl,
  });
  return fullUrl;
};

export const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Use direct file access for profile images
  const fullUrl = `${IMAGE_BASE_URL}/profile/${imagePath}?t=${Date.now()}`;
  console.log(`[Dashboard] Profile image URL:`, {
    imagePath,
    fullUrl,
  });
  return fullUrl;
};
