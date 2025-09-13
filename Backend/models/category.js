const { db } = require('../config/db');

// Create new category
function createCategory(category, callback) {
  const sql = 'INSERT INTO categories (name, description, image, status) VALUES (?, ?, ?, ?)';
  const values = [category.name, category.description, category.image, 'draft']; // Always start as draft
  db.query(sql, values, callback);
}

// Get all categories (only active ones)
function getAllCategories(callback) {
  const sql = 'SELECT * FROM categories WHERE status = "active" ORDER BY created_at DESC';
  db.query(sql, callback);
}

// Get category by ID
function getCategoryById(id, callback) {
  const sql = 'SELECT * FROM categories WHERE id = ?';
  db.query(sql, [id], callback);
}

// Update category
function updateCategory(id, category, callback) {
  const sql = 'UPDATE categories SET name = ?, description = ?, image = ? WHERE id = ?';
  const values = [category.name, category.description, category.image, id];
  db.query(sql, values, callback);
}

// Delete category
function deleteCategory(id, callback) {
  const sql = 'DELETE FROM categories WHERE id = ?';
  db.query(sql, [id], callback);
}

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
}; 