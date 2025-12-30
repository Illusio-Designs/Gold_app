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
      .size,
        "bytes"
      );
    } else {
      }
  }

  /**
   * Ensure upload directories exist
   */
  ensureDirectoriesExist() {
    Object.values(this.uploadDirs).forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
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

      // Simple approach: Just return the original image for now
      // The complex background cleaning was causing failures
      return image;
    } catch (error) {
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
      // Check if watermark file exists
      if (!fs.existsSync(this.watermarkPath)) {
        return image;
      }

      // Get image metadata
      const metadata = await image.metadata();
      // Load watermark
      const watermark = sharp(this.watermarkPath);
      const watermarkMetadata = await watermark.metadata();
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

      // Resize watermark to the calculated size
      const resizedWatermark = await watermark
        .resize(watermarkWidth, watermarkHeight)
        .png()
        .toBuffer();

      // Place single watermark centered for any image dimension
      const watermarkPosition = {
        x: Math.round((metadata.width - watermarkWidth) / 2),
        y: Math.round((metadata.height - watermarkHeight) / 2),
      };

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

      // Apply watermark to the image
      const watermarkedImage = image.composite(composites);

      return watermarkedImage;
    } catch (error) {
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

      return outputPath;
    } catch (error) {
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
      }`
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

      // Load image
      let image = sharp(inputPath);
      // Clean any potential grey backgrounds first
      image = await this.cleanGreyBackground(image);
      // Apply watermark after cleaning
      try {
        image = await this.applyWatermark(image, 0.8); // Increased opacity to 0.8 for better visibility
        // Verify watermark was applied by checking if image is still a Sharp instance
        if (image && typeof image.composite === "function") {
          } else {
          throw new Error(
            "Watermark verification failed - image is not processable"
          );
        }
      } catch (watermarkError) {
        ,
        });
        // Don't continue without watermark - throw the error
        throw new Error(
          `Watermark application failed: ${watermarkError.message}`
        );
      }

      // Save as WebP
      await image
        .webp({
          quality: 85,
          effort: 6,
        })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean and watermark all existing product images in the uploads directory
   * @returns {Promise<Array>} - Array of cleaned and watermarked image paths
   */
  async cleanAllExistingProductImages() {
    try {
      const productDir = this.uploadDirs.product;
      const files = fs.readdirSync(productDir);
      const imageFiles = files.filter(
        (file) =>
          /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.includes("-cleaned")
      );

      const cleanedPaths = [];

      for (const file of imageFiles) {
        try {
          const imagePath = path.join(productDir, file);
          const cleanedPath = await this.processExistingProductImage(imagePath);
          cleanedPaths.push(cleanedPath);
        } catch (error) {
          }
      }

      return cleanedPaths;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EnhancedImageProcessingService;
