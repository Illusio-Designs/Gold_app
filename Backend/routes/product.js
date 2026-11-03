const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const stockSyncController = require("../controllers/stockSyncController");
const erpCatalogController = require("../controllers/erpCatalogController");
const { upload, excelUpload } = require("../config/multerConfig");
const { verifyToken, requireAdmin, optionalAuth } = require("../middlewares/auth");

// ERP stock feed — admin-only test/preview. Calls API_RG_GetAllStock and
// returns the raw response (count, fields, sample) WITHOUT writing to the DB,
// so the dashboard can show exactly what the API returns.
router.post(
  "/erp/preview",
  verifyToken,
  requireAdmin,
  stockSyncController.previewStock
);

// Public image proxy for ERP product images (relative paths only). Public so
// <img> tags can load it; it only serves images from the ERP host.
router.get("/erp/image", stockSyncController.proxyImage);

// Live ERP catalog (public) — the app's products & categories come from here
// (cached from API_RG_GetAllStock), not the DB.
router.get("/erp/catalog", erpCatalogController.getCatalog);
router.get("/erp/catalog/:id", erpCatalogController.getCatalogItem);
router.get("/erp/categories", erpCatalogController.getCatalogCategories);

// Public routes (no authentication required)
router.get("/", optionalAuth, productController.getAllProducts);
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
