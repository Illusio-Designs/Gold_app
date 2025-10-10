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

export const getProductImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If URL contains localhost, replace with production URL
  if (imageUrl.includes("localhost")) {
    const filename = imageUrl.split("/products/").pop();
    const fullUrl = `${IMAGE_BASE_URL}/products/${filename}?t=${Date.now()}`;
    console.log(`[Dashboard] Product image URL (localhost replaced):`, {
      originalUrl: imageUrl,
      fullUrl,
    });
    return fullUrl;
  }

  // If it's already a production URL, return as-is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If it's just a filename, build the full URL
  const fullUrl = `${IMAGE_BASE_URL}/products/${imageUrl}?t=${Date.now()}`;
  console.log(`[Dashboard] Product image URL:`, {
    imageUrl,
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

export const getSliderImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If URL contains localhost, replace with production URL
  if (imageUrl.includes("localhost")) {
    const filename = imageUrl.split("/slider/").pop();
    const fullUrl = `${IMAGE_BASE_URL}/slider/${filename}?t=${Date.now()}`;
    console.log(`[Dashboard] Slider image URL (localhost replaced):`, {
      originalUrl: imageUrl,
      fullUrl,
    });
    return fullUrl;
  }

  // If it's already a production URL, return as-is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If it's just a filename, build the full URL
  const fullUrl = `${IMAGE_BASE_URL}/slider/${imageUrl}?t=${Date.now()}`;
  console.log(`[Dashboard] Slider image URL:`, {
    imageUrl,
    fullUrl,
  });
  return fullUrl;
};