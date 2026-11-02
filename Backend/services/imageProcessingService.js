const path = require("path");
const fs = require("fs");

// Image processing has been removed.
//
// Uploaded images are now stored and served EXACTLY as received — original
// format and dimensions, no resize, no WebP conversion, and no watermark.
// These methods are kept as thin pass-throughs so the existing controllers
// keep working unchanged: they just make sure the original file ends up in the
// correct served directory and return its path (callers use
// path.basename(result) to get the stored filename).
class ImageProcessingService {
  constructor() {
    this.uploadDirs = {
      category: path.join(__dirname, "../uploads/categories"),
      product: path.join(__dirname, "../uploads/products"),
    };

    this.ensureDirectoriesExist();
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
   * Keep the original uploaded file. Move it into destDir only when it isn't
   * already there (media-gallery uploads land in a temp dir first). No image
   * processing is performed.
   * @param {string} inputPath - Path to the uploaded file
   * @param {string} destDir - Directory the file should be served from
   * @returns {string} - Final path of the kept file
   */
  keepOriginal(inputPath, destDir) {
    try {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const dest = path.join(destDir, path.basename(inputPath));
      if (
        fs.existsSync(inputPath) &&
        path.resolve(inputPath) !== path.resolve(dest)
      ) {
        try {
          fs.renameSync(inputPath, dest);
        } catch (e) {
          // Cross-device move or locked file: copy then remove the original.
          fs.copyFileSync(inputPath, dest);
          try {
            fs.unlinkSync(inputPath);
          } catch (_) {}
        }
      }
      return dest;
    } catch (error) {
      // On any failure, fall back to the original path so the upload is still
      // usable rather than lost.
      return inputPath;
    }
  }

  /**
   * No-op (image processing removed). The original upload already lives in its
   * served directory; return it unchanged.
   */
  async processImage(inputPath /*, outputPath, options */) {
    return inputPath;
  }

  /**
   * Store the uploaded product image as-is (no watermark, no WebP).
   */
  async processProductImage(inputPath /*, filename */) {
    return this.keepOriginal(inputPath, this.uploadDirs.product);
  }

  /**
   * Store the uploaded category image as-is (no WebP).
   */
  async processCategoryImage(inputPath /*, filename */) {
    return this.keepOriginal(inputPath, this.uploadDirs.category);
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
      return 0;
    }
  }

  /**
   * Delete a file
   * @param {string} filePath - Path to file to delete
   */
  deleteOriginalFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("[imageProcessingService.js]:", error && error.message);
    }
  }
}

module.exports = new ImageProcessingService();
