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

module.exports = router;
