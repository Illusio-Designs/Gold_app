const express = require("express");
const router = express.Router();
const mediaGalleryController = require("../controllers/mediaGalleryController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");
const { upload, bulkUpload } = require("../config/multerConfig");

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(requireAdmin);

// Get all media files
router.get("/all", mediaGalleryController.getAllMedia);

// Get media statistics
router.get("/stats", mediaGalleryController.getMediaStats);

// Delete orphaned files
router.delete("/orphaned", mediaGalleryController.deleteOrphanedFiles);

// Delete specific file
router.delete("/file", mediaGalleryController.deleteFile);

// Clean up orphaned database records
router.post(
  "/cleanup-orphaned-records",
  mediaGalleryController.cleanupOrphanedRecords
);

// Get file info - using encoded path parameter
router.get("/file-info/:encodedPath", mediaGalleryController.getFileInfo);

// Upload media file
router.post(
  "/upload",
  upload.single("image"),
  mediaGalleryController.uploadMedia
);

// Bulk upload media files
router.post(
  "/bulk-upload",
  bulkUpload.array("images", 20),
  mediaGalleryController.bulkUploadMedia
);

// Get available products and categories for manual selection
router.get("/available-items", mediaGalleryController.getAvailableItems);

// Get media items with actual processed images from products and categories tables
router.get(
  "/processed-images",
  mediaGalleryController.getMediaItemsWithProcessedImages
);

// Debug endpoint to check database contents
router.get("/debug-database", mediaGalleryController.debugDatabaseContents);

// Serve media files
router.get("/serve/:type/:filename", mediaGalleryController.serveMediaFile);

module.exports = router;
