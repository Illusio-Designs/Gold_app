const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { upload, excelUpload } = require("../config/multerConfig");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Public routes (no authentication required)
router.get("/", productController.getAllProducts);
router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/sku/:sku", productController.getProductBySku);
router.get("/:id", productController.getProductById);

// Stock management routes (admin only)
router.patch(
  "/:id/stock-status",
  verifyToken,
  requireAdmin,
  productController.updateProductStockStatus
);
router.get("/:id/stock-status", productController.getProductStockStatus);
router.get("/:id/stock-history", productController.getProductStockHistory);

// Protected routes (require authentication)
router.post(
  "/",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  productController.createProduct
);
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  productController.updateProduct
);
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  productController.deleteProduct
);

// Product images routes
router.post(
  "/:productId/images",
  verifyToken,
  requireAdmin,
  upload.array("images", 5),
  productController.uploadProductImages
);
router.get("/:productId/images", productController.getProductImages);
router.delete(
  "/:productId/images/:imageIndex",
  verifyToken,
  requireAdmin,
  productController.deleteProductImage
);

// Excel import route (admin only)
router.post(
  "/import-excel",
  verifyToken,
  requireAdmin,
  excelUpload.single("excelFile"),
  productController.importFromExcel
);

// Debug endpoint to check Excel file structure (admin only)
router.post(
  "/debug-excel",
  verifyToken,
  requireAdmin,
  excelUpload.single("excelFile"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Excel file is required" });
      }

      // Read the Excel file
      const xlsx = require("xlsx");
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      );

      // Clean up uploaded file
      const fs = require("fs");
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        }

      res.json({
        message: "Excel file structure analyzed",
        fileInfo: {
          filename: req.file.filename,
          size: req.file.size,
          sheets: workbook.SheetNames,
          activeSheet: sheetName,
          totalRows: data.length,
          headers: data[0] || [],
          sampleData: data.slice(1, 4) || [], // First 3 data rows
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && require("fs").existsSync(req.file.path)) {
        require("fs").unlinkSync(req.file.path);
      }

      res.status(500).json({ error: "Failed to analyze Excel file" });
    }
  }
);

// Add watermarks to existing products (admin only)
router.post(
  "/add-watermarks",
  verifyToken,
  requireAdmin,
  productController.addWatermarksToExistingProducts
);

module.exports = router;
