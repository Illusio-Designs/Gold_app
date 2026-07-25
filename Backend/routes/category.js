const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Categories are icon-based (icon name stored as a plain string), so create/
// update accept JSON — no file upload middleware needed.

// Category routes - GET routes are public, others require admin authentication
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Protected routes - require admin authentication
router.post("/", verifyToken, requireAdmin, categoryController.createCategory);
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  categoryController.updateCategory
);
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  categoryController.deleteCategory
);

module.exports = router;
