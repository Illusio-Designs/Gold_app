const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Convert image to webp and save
async function convertToWebp(inputPath, outputDir, filename) {
  try {
    ensureDirectoryExists(outputDir);

    const outputFilename =
      path.basename(filename, path.extname(filename)) + ".webp";
    const outputPath = path.join(outputDir, outputFilename);

    await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);

    // Remove original file
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    return outputFilename;
  } catch (error) {
    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

// Process uploaded image
async function processImageUpload(file, uploadType = "profile") {
  if (!file) {
    return null;
  }

  const uploadDirs = {
    profile: "uploads/profile",
    category: "uploads/category",
    product: "uploads/products",
  };

  const outputDir = uploadDirs[uploadType] || "uploads/profile";

  try {
    const webpFilename = await convertToWebp(
      file.path,
      outputDir,
      file.filename
    );
    return webpFilename;
  } catch (error) {
    throw error;
  }
}

// Delete image file
function deleteImage(filename, uploadType = "profile") {
  const uploadDirs = {
    profile: "uploads/profile",
    category: "uploads/category",
    product: "uploads/products",
  };

  const filePath = path.join(
    uploadDirs[uploadType] || "uploads/profile",
    filename
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/**
 * Apply a single, clean watermark to an image
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} watermarkPath - Path to watermark image
 * @returns {Promise<Buffer>} - Watermarked image buffer
 */
async function applyTiledWatermark(imageBuffer, watermarkPath) {
  try {
    // Check if watermark file exists
    if (!fs.existsSync(watermarkPath)) {
      return imageBuffer;
    }
    
    // Load the image
    let image = sharp(imageBuffer);
    
    // Get image metadata
    const metadata = await image.metadata();
    // Load watermark
    const watermark = sharp(watermarkPath);
    const watermarkMetadata = await watermark.metadata();
    // Calculate appropriate watermark size - not too large, not too small
    const minWatermarkSize = 400; // Increased minimum size for better visibility
    const maxWatermarkSize = 600; // Increased maximum size for better visibility
    const percentageSize = Math.min(metadata.width, metadata.height) * 0.12; // Increased to 12% of image
    const watermarkSize = Math.max(minWatermarkSize, Math.min(maxWatermarkSize, percentageSize));
    const watermarkWidth = Math.round(watermarkSize);
    const watermarkHeight = Math.round((watermarkSize * watermarkMetadata.height) / watermarkMetadata.width);
    
    // Resize watermark to the calculated size
    const resizedWatermark = await watermark
      .resize(watermarkWidth, watermarkHeight)
      .png()
      .toBuffer();
    
    // Place single watermark centered for any image dimension
    const watermarkPosition = {
      x: Math.round((metadata.width - watermarkWidth) / 2),
      y: Math.round((metadata.height - watermarkHeight) / 2)
    };
    
    // Create composite array with single watermark
    const composites = [{
      input: resizedWatermark,
      top: Math.round(watermarkPosition.y),
      left: Math.round(watermarkPosition.x),
      blend: 'over',
      opacity: 0.4
    }];
    
    // Apply watermark to the image
    const watermarkedImage = image.composite(composites);
    
    // Return the watermarked image as buffer
    return await watermarkedImage.toBuffer();
    
  } catch (error) {
    // Return original image if watermarking fails
    return imageBuffer;
  }
}

// Utility to delete old image if changed
function deleteOldImageIfChanged(oldFilename, newFilename, uploadType = "profile") {
  if (oldFilename && oldFilename !== newFilename) {
    try {
      deleteImage(oldFilename, uploadType);
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
}

module.exports = {
  processImageUpload,
  deleteImage,
  convertToWebp,
  ensureDirectoryExists,
  applyTiledWatermark,
  deleteOldImageIfChanged,
};
