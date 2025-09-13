const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

class ImageProcessingService {
  constructor() {
    this.watermarkPath = path.join(__dirname, "../assets/watermark.png");
    this.uploadDirs = {
      category: path.join(__dirname, "../uploads/categories"),
      product: path.join(__dirname, "../uploads/products"),
    };

    // Ensure upload directories exist
    this.ensureDirectoriesExist();

    // Check if watermark file exists
    if (fs.existsSync(this.watermarkPath)) {
      console.log("✅ Watermark file found:", this.watermarkPath);
    } else {
      console.error("❌ Watermark file not found:", this.watermarkPath);
    }
  }

  /**
   * Ensure upload directories exist
   */
  ensureDirectoriesExist() {
    Object.values(this.uploadDirs).forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  /**
   * Process image: compress, convert to WebP, and apply watermark
   * @param {string} inputPath - Path to input image
   * @param {string} outputPath - Path to save processed image
   * @param {Object} options - Processing options
   * @returns {Promise<string>} - Path to processed image
   */
  async processImage(inputPath, outputPath, options = {}) {
    const {
      quality = 80,
      width = null,
      height = null,
      applyWatermark = true,
      watermarkOpacity = 0.3,
      watermarkSpacing = 100,
    } = options;

    // Processing image with options

    try {
      let image = sharp(inputPath);

      // Resize if dimensions provided
      if (width || height) {
        image = image.resize(width, height, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Apply watermark if requested and watermark file exists
      if (applyWatermark && fs.existsSync(this.watermarkPath)) {
        image = await this.applyWatermark(image, watermarkOpacity);
      }

      // Convert to WebP with compression
      await image
        .webp({
          quality: quality,
          effort: 6, // Higher effort for better compression
          nearLossless: false,
        })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  }

  /**
   * Apply watermark to image with single, clean placement
   * @param {Sharp} image - Sharp image instance
   * @param {number} opacity - Watermark opacity (0-1)
   * @returns {Promise<Sharp>} - Sharp image with watermark
   */
  async applyWatermark(image, opacity = 0.4) {
    try {
      console.log(`🔍 [WATERMARK] Starting single watermark application`);

      // Check if watermark file exists
      if (!fs.existsSync(this.watermarkPath)) {
        console.error(
          `❌ [WATERMARK] Watermark file not found: ${this.watermarkPath}`
        );
        return image;
      }

      console.log(`✅ [WATERMARK] Watermark file found: ${this.watermarkPath}`);

      // Get image metadata
      const metadata = await image.metadata();
      console.log(`🔍 [WATERMARK] Image metadata:`, {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels,
      });

      // Load watermark
      const watermark = sharp(this.watermarkPath);
      const watermarkMetadata = await watermark.metadata();
      console.log(`🔍 [WATERMARK] Watermark metadata:`, {
        width: watermarkMetadata.width,
        height: watermarkMetadata.height,
        format: watermarkMetadata.format,
        channels: watermarkMetadata.channels,
      });

      // Calculate appropriate watermark size - not too large, not too small
      const minWatermarkSize = 100; // Increased minimum size for better visibility
      const maxWatermarkSize = 200; // Increased maximum size for better visibility
      const percentageSize = Math.min(metadata.width, metadata.height) * 0.12; // Increased to 12% of image
      const watermarkSize = Math.max(
        minWatermarkSize,
        Math.min(maxWatermarkSize, percentageSize)
      );
      const watermarkWidth = Math.round(watermarkSize);
      const watermarkHeight = Math.round(
        (watermarkSize * watermarkMetadata.height) / watermarkMetadata.width
      );

      console.log(
        `🔍 [WATERMARK] Calculated watermark size: ${watermarkWidth}x${watermarkHeight} pixels`
      );
      console.log(
        `🔍 [WATERMARK] Size constraints: min=${minWatermarkSize}, max=${maxWatermarkSize}, calculated=${percentageSize}`
      );

      // Resize watermark to the calculated size
      const resizedWatermark = await watermark
        .resize(watermarkWidth, watermarkHeight)
        .png()
        .toBuffer();

      console.log(`✅ [WATERMARK] Watermark resized successfully`);

      // Place single watermark centered for any image dimension
      const watermarkPosition = {
        x: Math.round((metadata.width - watermarkWidth) / 2),
        y: Math.round((metadata.height - watermarkHeight) / 2),
      };

      console.log(
        `🔍 [WATERMARK] Center watermark position: x=${watermarkPosition.x}, y=${watermarkPosition.y}`
      );

      // Create composite array with single watermark
      const composites = [
        {
          input: resizedWatermark,
          top: Math.round(watermarkPosition.y),
          left: Math.round(watermarkPosition.x),
          blend: "over",
          opacity: opacity,
        },
      ];

      console.log(`🔍 [WATERMARK] Applied single watermark`);
      console.log(
        `🔍 [WATERMARK] Watermark size: ${watermarkWidth}x${watermarkHeight}px`
      );
      console.log(`🔍 [WATERMARK] Opacity: ${opacity}`);

      // Apply watermark to the image
      const watermarkedImage = image.composite(composites);

      console.log(
        `✅ [WATERMARK] Single watermark application completed successfully`
      );
      return watermarkedImage;
    } catch (error) {
      console.error(`❌ [WATERMARK] Error applying watermark:`, error);
      // Return original image if watermarking fails
      return image;
    }
  }

  /**
   * Process uploaded image for products (with watermark only, no background cleaning)
   * @param {string} inputPath - Path to uploaded image
   * @param {string} filename - Original filename
   * @returns {Promise<string>} - Path to processed image
   */
  async processProductImage(inputPath, filename) {
    try {
      console.log(`🔧 [PRODUCT IMAGE] Starting processing for: ${filename}`);
      console.log(`🔧 [PRODUCT IMAGE] Input path: ${inputPath}`);
      console.log(`🔧 [PRODUCT IMAGE] Watermark path: ${this.watermarkPath}`);
      console.log(
        `🔧 [PRODUCT IMAGE] Watermark exists: ${fs.existsSync(
          this.watermarkPath
        )}`
      );

      // Use enhanced processing for new uploads
      const EnhancedImageProcessingService = require("./enhancedImageProcessingService");
      const enhancedService = new EnhancedImageProcessingService();

      console.log(`🔧 [PRODUCT IMAGE] Using enhanced processing service`);
      const result = await enhancedService.processNewProductImage(
        inputPath,
        filename
      );
      console.log(
        `🔧 [PRODUCT IMAGE] Enhanced processing completed: ${result}`
      );

      // Clean up original uploaded file
      try {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
          console.log(
            `🧹 [PRODUCT IMAGE] Deleted original uploaded file: ${inputPath}`
          );
        }
      } catch (cleanupError) {
        console.warn(
          `⚠️  [PRODUCT IMAGE] Failed to delete original file ${inputPath}:`,
          cleanupError.message
        );
      }

      return result;
    } catch (error) {
      console.error(
        `❌ [PRODUCT IMAGE] Enhanced processing failed, falling back to original method:`,
        error
      );

      // Fallback to original method
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const outputPath = path.join(this.uploadDirs.product, `${baseName}.webp`);

      console.log(`🔧 [PRODUCT IMAGE] Fallback processing to: ${outputPath}`);
      const fallbackResult = await this.processImage(inputPath, outputPath, {
        quality: 85,
        applyWatermark: true,
        watermarkOpacity: 0.6,
        watermarkSpacing: 80,
      });

      console.log(
        `🔧 [PRODUCT IMAGE] Fallback processing completed: ${fallbackResult}`
      );

      // Clean up original uploaded file after fallback
      try {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
          console.log(
            `🧹 [PRODUCT IMAGE] Deleted original uploaded file after fallback: ${inputPath}`
          );
        }
      } catch (cleanupError) {
        console.warn(
          `⚠️  [PRODUCT IMAGE] Failed to delete original file after fallback ${inputPath}:`,
          cleanupError.message
        );
      }
      return fallbackResult;
    }
  }

  /**
   * Process uploaded image for categories (without watermark)
   * @param {string} inputPath - Path to uploaded image
   * @param {string} filename - Original filename
   * @returns {Promise<string>} - Path to processed image
   */
  async processCategoryImage(inputPath, filename) {
    // Handle filename - it might be just the filename or contain a path
    let cleanFilename = filename;
    if (filename.includes("/")) {
      // If it contains a path, extract just the filename
      cleanFilename = path.basename(filename);
    }

    const ext = path.extname(cleanFilename);
    const baseName = path.basename(cleanFilename, ext);
    const outputPath = path.join(this.uploadDirs.category, `${baseName}.webp`);

    console.log(`🖼️ [CATEGORY IMAGE] Clean filename: ${cleanFilename}`);
    console.log(`🖼️ [CATEGORY IMAGE] Base name: ${baseName}`);
    console.log(`🖼️ [CATEGORY IMAGE] Output path: ${outputPath}`);

    return this.processImage(inputPath, outputPath, {
      quality: 90,
      applyWatermark: false,
    });
  }

  /**
   * Get file size in bytes
   * @param {string} filePath - Path to file
   * @returns {number} - File size in bytes
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error("Error getting file size:", error);
      return 0;
    }
  }

  /**
   * Delete original file after processing
   * @param {string} filePath - Path to file to delete
   */
  deleteOriginalFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        // Try multiple approaches to delete the file
        const deleteFile = () => {
          try {
            fs.unlinkSync(filePath);
            console.log("Successfully deleted original file:", filePath);
          } catch (err) {
            if (err.code === "EPERM") {
              // File might be locked, try again after a longer delay
              console.log("File locked, retrying deletion in 5 seconds...");
              setTimeout(() => {
                try {
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(
                      "Successfully deleted original file after retry:",
                      filePath
                    );
                  }
                } catch (retryErr) {
                  console.log(
                    "Could not delete file after retry, will be cleaned up later:",
                    filePath
                  );
                  // Try one more time with a different approach
                  setTimeout(() => {
                    try {
                      if (fs.existsSync(filePath)) {
                        fs.unlink(filePath, (finalErr) => {
                          if (finalErr) {
                            console.log(
                              "Final attempt to delete file failed:",
                              filePath
                            );
                          } else {
                            console.log(
                              "Successfully deleted original file on final attempt:",
                              filePath
                            );
                          }
                        });
                      }
                    } catch (finalErr) {
                      console.log(
                        "All attempts to delete file failed:",
                        filePath
                      );
                    }
                  }, 3000);
                }
              }, 5000);
            } else {
              console.error("Error deleting original file:", err);
            }
          }
        };

        deleteFile();
      }
    } catch (error) {
      console.error("Error checking file existence:", error);
    }
  }
}

module.exports = new ImageProcessingService();
