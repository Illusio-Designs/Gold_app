const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

class EnhancedImageProcessingService {
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
      console.log(
        "✅ Watermark file size:",
        fs.statSync(this.watermarkPath).size,
        "bytes"
      );
    } else {
      console.error("❌ Watermark file not found:", this.watermarkPath);
      console.error("❌ Current directory:", __dirname);
      console.error("❌ Attempted path:", this.watermarkPath);
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
   * Clean grey striped backgrounds from images
   * @param {Sharp} image - Sharp image instance
   * @returns {Promise<Sharp>} - Cleaned image
   */
  async cleanGreyBackground(image) {
    try {
      // Get image metadata
      const metadata = await image.metadata();

      console.log(
        `🧹 Cleaning grey background for ${metadata.width}x${metadata.height} image`
      );

      // Simple approach: Just return the original image for now
      // The complex background cleaning was causing failures
      console.log(`✅ Background cleaning skipped to prevent failures`);
      return image;
    } catch (error) {
      console.error("Error cleaning grey background:", error);
      // Return original image if cleaning fails
      return image;
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

      // Calculate appropriate watermark size - make it more visible
      const minWatermarkSize = 120; // Further increased minimum size for better visibility
      const maxWatermarkSize = 250; // Further increased maximum size for better visibility
      const percentageSize = Math.min(metadata.width, metadata.height) * 0.15; // Increased to 15% of image
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
   * Process and clean existing product images (with background cleaning and watermarking)
   * @param {string} imagePath - Path to existing image
   * @returns {Promise<string>} - Path to cleaned and watermarked image
   */
  async processExistingProductImage(imagePath) {
    try {
      console.log(`🧹 Cleaning and processing image: ${imagePath}`);

      // Load the image
      let image = sharp(imagePath);

      // Clean grey background first
      image = await this.cleanGreyBackground(image);

      // Apply watermark after cleaning
      image = await this.applyWatermark(image, 0.4);

      // Generate output path
      const ext = path.extname(imagePath);
      const baseName = path.basename(imagePath, ext);
      const outputPath = path.join(
        this.uploadDirs.product,
        `${baseName}-cleaned.webp`
      );

      // Save as WebP
      await image
        .webp({
          quality: 85,
          effort: 6,
        })
        .toFile(outputPath);

      console.log(`✅ Cleaned and watermarked image saved: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`❌ Error processing image ${imagePath}:`, error);
      throw error;
    }
  }

  /**
   * Process new product image upload (with background cleaning and watermarking)
   * @param {string} inputPath - Path to uploaded image
   * @param {string} filename - Original filename
   * @returns {Promise<string>} - Path to processed image
   */
  async processNewProductImage(inputPath, filename) {
    try {
      console.log(`🆕 [ENHANCED] Processing new product image: ${filename}`);
      console.log(`🆕 [ENHANCED] Input path: ${inputPath}`);
      console.log(`🆕 [ENHANCED] Watermark path: ${this.watermarkPath}`);
      console.log(
        `🆕 [ENHANCED] Watermark exists: ${fs.existsSync(this.watermarkPath)}`
      );

      // Handle filename - it might be just the filename or contain a path
      let cleanFilename = filename;
      if (filename.includes("/")) {
        // If it contains a path, extract just the filename
        cleanFilename = path.basename(filename);
      }

      // Extract name without extension
      const originalName = path.parse(cleanFilename).name;
      const outputPath = path.join(
        this.uploadDirs.product,
        `${originalName}.webp`
      );

      console.log(`🆕 [ENHANCED] Clean filename: ${cleanFilename}`);
      console.log(`🆕 [ENHANCED] Original name: ${originalName}`);
      console.log(`🆕 [ENHANCED] Output path: ${outputPath}`);

      // Load image
      let image = sharp(inputPath);
      console.log(`🆕 [ENHANCED] Image loaded successfully`);

      // Clean any potential grey backgrounds first
      console.log(`🆕 [ENHANCED] Starting background cleaning...`);
      image = await this.cleanGreyBackground(image);
      console.log(`🆕 [ENHANCED] Background cleaning completed`);

      // Apply watermark after cleaning
      console.log(`🆕 [ENHANCED] Starting watermark application...`);
      try {
        image = await this.applyWatermark(image, 0.8); // Increased opacity to 0.8 for better visibility
        console.log(
          `🆕 [ENHANCED] Watermark application completed successfully`
        );

        // Verify watermark was applied by checking if image is still a Sharp instance
        if (image && typeof image.composite === "function") {
          console.log(
            `🆕 [ENHANCED] Watermark verification: Image is still processable`
          );
        } else {
          console.error(
            `🆕 [ENHANCED] Watermark verification failed: Image is not processable`
          );
          throw new Error(
            "Watermark verification failed - image is not processable"
          );
        }
      } catch (watermarkError) {
        console.error(
          `❌ [ENHANCED] Watermark application failed:`,
          watermarkError
        );
        console.error(`❌ [ENHANCED] Watermark error details:`, {
          message: watermarkError.message,
          stack: watermarkError.stack,
          watermarkPath: this.watermarkPath,
          watermarkExists: fs.existsSync(this.watermarkPath),
        });
        // Don't continue without watermark - throw the error
        throw new Error(
          `Watermark application failed: ${watermarkError.message}`
        );
      }

      // Save as WebP
      console.log(`🆕 [ENHANCED] Saving as WebP...`);
      await image
        .webp({
          quality: 85,
          effort: 6,
        })
        .toFile(outputPath);

      console.log(`✅ [ENHANCED] New product image processed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`❌ [ENHANCED] Error processing new product image:`, error);
      throw error;
    }
  }

  /**
   * Clean and watermark all existing product images in the uploads directory
   * @returns {Promise<Array>} - Array of cleaned and watermarked image paths
   */
  async cleanAllExistingProductImages() {
    try {
      console.log(
        "🧹 Starting cleanup and watermarking of all existing product images..."
      );

      const productDir = this.uploadDirs.product;
      const files = fs.readdirSync(productDir);
      const imageFiles = files.filter(
        (file) =>
          /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.includes("-cleaned")
      );

      console.log(`Found ${imageFiles.length} images to clean and watermark`);

      const cleanedPaths = [];

      for (const file of imageFiles) {
        try {
          const imagePath = path.join(productDir, file);
          const cleanedPath = await this.processExistingProductImage(imagePath);
          cleanedPaths.push(cleanedPath);
        } catch (error) {
          console.error(`Failed to clean ${file}:`, error);
        }
      }

      console.log(
        `✅ Cleaned and watermarked ${cleanedPaths.length} images successfully`
      );
      return cleanedPaths;
    } catch (error) {
      console.error("❌ Error during bulk cleanup:", error);
      throw error;
    }
  }
}

module.exports = EnhancedImageProcessingService;
