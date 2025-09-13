const { db } = require("../config/db");
const socketService = require("../services/socketService");
const path = require("path");
const fs = require("fs");
const { getBaseUrl } = require("../config/environment");

// Get all categories (only active ones with images)
function getAllCategories(req, res) {
  // For debugging, let's first check what we have in the database
  console.log("🔍 [CATEGORIES] Getting all categories...");

  const sql =
    "SELECT * FROM categories WHERE status = 'active' AND image IS NOT NULL ORDER BY name";

  console.log("🔍 [CATEGORIES] SQL Query:", sql);

  // First, let's check all categories to see what status values exist
  db.query(
    "SELECT id, name, status, image FROM categories ORDER BY name",
    (debugErr, debugResults) => {
      if (debugErr) {
        console.error("❌ [CATEGORIES] Debug query error:", debugErr);
      } else {
        console.log(
          "🔍 [CATEGORIES] All categories in database:",
          debugResults
        );
        console.log(
          "🔍 [CATEGORIES] Categories with status 'active':",
          debugResults.filter((c) => c.status === "active")
        );
        console.log(
          "🔍 [CATEGORIES] Categories with images:",
          debugResults.filter((c) => c.image && c.image !== "null")
        );
      }
    }
  );

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    console.log("🔍 [CATEGORIES] Filtered results count:", results.length);

    // Process results to include processed image URLs
    const processedResults = results.map((category) => {
      let processedImageUrl = null;
      let originalImageUrl = null;
      let finalImageUrl = null;

      if (category.image) {
        // Original image URL
        originalImageUrl = `${getBaseUrl()}/uploads/categories/${category.image}`;

        // Always check for cleaned/watermarked image first (highest priority)
        const baseName = category.image.split(".")[0]; // Remove original extension
        const cleanedImageName = `${baseName}-cleaned.webp`;
        const cleanedImagePath = path.join(
          __dirname,
          "../uploads/categories",
          cleanedImageName
        );

        if (fs.existsSync(cleanedImagePath)) {
          // Use cleaned/watermarked image (highest priority)
          processedImageUrl = `${getBaseUrl()}/uploads/categories/${cleanedImageName}`;
          finalImageUrl = processedImageUrl;
          console.log(
            `[Backend] ✅ Using enhanced cleaned/watermarked category image: ${processedImageUrl}`
          );
        } else if (category.image.endsWith(".webp")) {
          // Fall back to existing processed .webp file
          processedImageUrl = originalImageUrl;
          finalImageUrl = processedImageUrl;
          console.log(
            `[Backend] Using existing processed category image: ${processedImageUrl}`
          );
        } else {
          // Convert to processed image path (.webp extension)
          const processedImageName = `${baseName}.webp`;
          const processedImagePath = path.join(
            __dirname,
            "../uploads/categories",
            processedImageName
          );

          if (fs.existsSync(processedImagePath)) {
            // Use regular processed image
            processedImageUrl = `${getBaseUrl()}/uploads/categories/${processedImageName}`;
            finalImageUrl = processedImageUrl;
            console.log(
              `[Backend] ✅ Using processed category image: ${processedImageUrl}`
            );
          } else {
            // Processed image doesn't exist, fall back to original
            processedImageUrl = null;
            finalImageUrl = originalImageUrl;
            console.log(
              `[Backend] ⚠️ No processed category image found for: ${category.image}`
            );
            console.log(
              `[Backend] 🔄 Falling back to original category image: ${originalImageUrl}`
            );
          }
        }
      }

      return {
        ...category,
        processedImageUrl: processedImageUrl,
        originalImageUrl: originalImageUrl,
        imageUrl: finalImageUrl, // Use final image as primary image
        hasProcessedImage: !!processedImageUrl,
      };
    });

    // Add logging to debug category response
    console.log(
      "Total active categories with images found:",
      processedResults.length
    );
    processedResults.forEach((category, index) => {
      console.log(`Category ${index + 1}:`, {
        id: category.id,
        name: category.name,
        image: category.image,
        processedImageUrl: category.processedImageUrl,
        originalImageUrl: category.originalImageUrl,
        finalImageUrl: category.imageUrl,
        hasProcessedImage: category.hasProcessedImage,
        description: category.description,
        status: category.status,
      });
    });

    res.json({
      success: true,
      message: "Active categories with images retrieved successfully",
      data: processedResults,
      count: processedResults.length,
    });
  });
}

// Get category by ID
function getCategoryById(req, res) {
  const { id } = req.params;
  const sql = "SELECT * FROM categories WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(results[0]);
  });
}

// Create new category
async function createCategory(req, res) {
  const { name, description } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    // Process image if uploaded
    let processedImage = image;
    if (image && req.file) {
      console.log(`🖼️ [CATEGORY] Processing category image: ${image}`);
      const imageProcessingService = require("../services/imageProcessingService");

      try {
        const processedPath = await imageProcessingService.processCategoryImage(
          req.file.path,
          image
        );
        processedImage = path.basename(processedPath);
        console.log(`✅ [CATEGORY] Image processed: ${processedImage}`);
      } catch (processError) {
        console.error(`❌ [CATEGORY] Image processing failed:`, processError);
        // Continue with original image if processing fails
      }
    }

    const sql =
      "INSERT INTO categories (name, description, image, status) VALUES (?, ?, ?, 'draft')";

    db.query(sql, [name, description, processedImage], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get the created category for real-time update
      const categoryId = result.insertId;
      const getCategorySql = "SELECT * FROM categories WHERE id = ?";
      db.query(getCategorySql, [categoryId], (getErr, categoryResults) => {
        if (!getErr && categoryResults.length > 0) {
          // Emit real-time update
          socketService.notifyCategoryUpdate(categoryResults[0], "created");
        }
      });

      res.status(201).json({
        message: "Category created successfully",
        categoryId: categoryId,
      });
    });
  } catch (error) {
    console.error("❌ [CATEGORY] Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
}

// Update category
async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    let processedImage = image;

    // Process image if uploaded
    if (image && req.file) {
      console.log(`🖼️ [CATEGORY] Processing updated category image: ${image}`);
      const imageProcessingService = require("../services/imageProcessingService");

      try {
        const processedPath = await imageProcessingService.processCategoryImage(
          req.file.path,
          image
        );
        processedImage = path.basename(processedPath);
        console.log(`✅ [CATEGORY] Updated image processed: ${processedImage}`);
      } catch (processError) {
        console.error(`❌ [CATEGORY] Image processing failed:`, processError);
        // Continue with original image if processing fails
      }
    }

    let sql, params;
    if (processedImage) {
      sql =
        "UPDATE categories SET name = ?, description = ?, image = ? WHERE id = ?";
      params = [name, description, processedImage, id];
    } else {
      sql = "UPDATE categories SET name = ?, description = ? WHERE id = ?";
      params = [name, description, id];
    }

    db.query(sql, params, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Get the updated category for real-time update
      const getCategorySql = "SELECT * FROM categories WHERE id = ?";
      db.query(getCategorySql, [id], (getErr, categoryResults) => {
        if (!getErr && categoryResults.length > 0) {
          // Emit real-time update
          socketService.notifyCategoryUpdate(categoryResults[0], "updated");
        }
      });

      res.json({ message: "Category updated successfully" });
    });
  } catch (error) {
    console.error("❌ [CATEGORY] Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
}

// Delete category
function deleteCategory(req, res) {
  const { id } = req.params;

  // Get category info before deletion for real-time update
  const getCategorySql = "SELECT * FROM categories WHERE id = ?";
  db.query(getCategorySql, [id], (getErr, categoryResults) => {
    const categoryToDelete = getErr ? null : categoryResults[0];

    const deleteSql = "DELETE FROM categories WHERE id = ?";
    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Emit real-time update with deleted category info
      if (categoryToDelete) {
        socketService.notifyCategoryUpdate(categoryToDelete, "deleted");
      }

      res.json({ message: "Category deleted successfully" });
    });
  });
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
