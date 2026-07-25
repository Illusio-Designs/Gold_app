const { db } = require("../config/db");
const socketService = require("../services/socketService");

// Categories are icon-based: each category stores a Hugeicons name (e.g.
// "Diamond01Icon") in the `icon` column and the apps render it directly.
// No image upload / processing is involved anymore.

// Get all active categories
function getAllCategories(req, res) {
  const sql =
    "SELECT * FROM categories WHERE status = 'active' ORDER BY name";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      success: true,
      message: "Active categories retrieved successfully",
      data: results,
      count: results.length,
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
function createCategory(req, res) {
  const { name, description, icon } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  if (!icon) {
    return res.status(400).json({ error: "Category icon is required" });
  }

  const sql =
    "INSERT INTO categories (name, description, icon, status) VALUES (?, ?, ?, 'draft')";

  db.query(sql, [name, description || null, icon], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const categoryId = result.insertId;
    const getCategorySql = "SELECT * FROM categories WHERE id = ?";
    db.query(getCategorySql, [categoryId], (getErr, categoryResults) => {
      if (!getErr && categoryResults.length > 0) {
        socketService.notifyCategoryUpdate(categoryResults[0], "created");
      }
    });

    res.status(201).json({
      message: "Category created successfully",
      categoryId: categoryId,
    });
  });
}

// Update category
function updateCategory(req, res) {
  const { id } = req.params;
  const { name, description, icon } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  let sql, params;
  if (icon) {
    sql =
      "UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?";
    params = [name, description || null, icon, id];
  } else {
    sql = "UPDATE categories SET name = ?, description = ? WHERE id = ?";
    params = [name, description || null, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const getCategorySql = "SELECT * FROM categories WHERE id = ?";
    db.query(getCategorySql, [id], (getErr, categoryResults) => {
      if (!getErr && categoryResults.length > 0) {
        socketService.notifyCategoryUpdate(categoryResults[0], "updated");
      }
    });

    res.json({ message: "Category updated successfully" });
  });
}

// Delete category
function deleteCategory(req, res) {
  const { id } = req.params;

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
