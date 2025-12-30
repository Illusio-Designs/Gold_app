const { db } = require("../config/db");

// Add item to cart
function addToCart(cartItem, callback) {
  const sql = `INSERT INTO cart_items (
    user_id, product_id, quantity, status, created_at
  ) VALUES (?, ?, ?, ?, NOW())
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + VALUES(quantity),
    updated_at = NOW()`;

  const values = [
    cartItem.user_id,
    cartItem.product_id,
    cartItem.quantity || 1,
    cartItem.status || "pending",
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      } else {
      }
    callback(err, result);
  });
}

// Get user's cart
function getUserCart(userId, callback) {
  const sql = `
    SELECT ci.*, 
           p.name as product_name, p.image as product_image, p.sku as product_sku,
           p.mark_amount, p.net_weight, p.gross_weight,
           c.name as category_name
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ci.user_id = ? AND ci.status != 'removed'
    ORDER BY ci.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      } else {
      }
    callback(err, results);
  });
}

// Update cart item quantity
function updateCartItemQuantity(cartItemId, quantity, callback) {
  const sql = `UPDATE cart_items SET 
    quantity = ?, updated_at = NOW() 
    WHERE id = ?`;

  db.query(sql, [quantity, cartItemId], callback);
}

// Remove item from cart
function removeFromCart(cartItemId, callback) {
  const sql = `UPDATE cart_items SET 
    status = 'removed', updated_at = NOW() 
    WHERE id = ?`;

  db.query(sql, [cartItemId], callback);
}

// Clear user's cart
function clearUserCart(userId, callback) {
  const sql = `UPDATE cart_items SET 
    status = 'removed', updated_at = NOW() 
    WHERE user_id = ? AND status != 'removed'`;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      } else {
      }
    callback(err, result);
  });
}

// Get cart item by ID
function getCartItemById(cartItemId, callback) {
  const sql = `
    SELECT ci.*, 
           p.name as product_name, p.image as product_image, p.sku as product_sku,
           p.mark_amount, p.net_weight, p.gross_weight
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.id
    WHERE ci.id = ?
  `;

  db.query(sql, [cartItemId], callback);
}

// Check if product exists in user's cart
function checkProductInCart(userId, productId, callback) {
  const sql = `SELECT * FROM cart_items 
    WHERE user_id = ? AND product_id = ? AND status != 'removed'`;

  db.query(sql, [userId, productId], callback);
}

module.exports = {
  addToCart,
  getUserCart,
  updateCartItemQuantity,
  removeFromCart,
  clearUserCart,
  getCartItemById,
  checkProductInCart,
};
