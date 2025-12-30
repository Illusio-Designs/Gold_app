const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const categoryController = require("../controllers/categoryController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Configure multer for category image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/categories");
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for categories"), false);
    }
  },
});

// Category routes - GET routes are public, others require admin authentication
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Protected routes - require admin authentication
router.post(
  "/",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  categoryController.createCategory
);
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  categoryController.updateCategory
);
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  categoryController.deleteCategory
);

module.exports = router;
