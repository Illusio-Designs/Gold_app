const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary (optional - will use local storage if not configured)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Upload file to Cloudinary or local storage
 * @param {string} filePath - Path to the file
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<Object>} - Upload result
 */
async function uploadToCloudinary(filePath, folder = 'app-icons') {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Fallback to local storage
      return uploadToLocalStorage(filePath, folder);
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 512, height: 512, crop: 'fill' }
      ]
    });

    // Clean up local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Fallback to local storage
    return uploadToLocalStorage(filePath, folder);
  }
}

/**
 * Upload file to local storage
 * @param {string} filePath - Path to the file
 * @param {string} folder - Folder name
 * @returns {Promise<Object>} - Upload result
 */
async function uploadToLocalStorage(filePath, folder = 'app-icons') {
  try {
    // Create folder if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileName = `icon-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(filePath)}`;
    const destinationPath = path.join(uploadDir, fileName);

    // Copy file to destination
    fs.copyFileSync(filePath, destinationPath);

    // Clean up original file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Return local URL
    const localUrl = `/uploads/${folder}/${fileName}`;
    
    return {
      secure_url: localUrl,
      public_id: fileName,
      width: 512,
      height: 512,
      format: path.extname(filePath).substring(1)
    };
  } catch (error) {
    console.error('Local storage upload error:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete file from Cloudinary or local storage
 * @param {string} publicId - Public ID or file path
 * @param {string} folder - Folder name
 * @returns {Promise<Object>} - Delete result
 */
async function deleteFromCloudinary(publicId, folder = 'app-icons') {
  try {
    // Check if it's a local file
    if (publicId.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return { success: true }; // Already deleted locally
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if Cloudinary is configured
 * @returns {boolean} - True if configured
 */
function isCloudinaryConfigured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured
}; 