const { db } = require("../config/db");

// Script to clear a specific user's cart completely
const clearUserCart = (userId) => {
  // First, let's see what's in the cart
  const checkSql = `
    SELECT ci.*, 
           p.name as product_name, p.sku as product_sku,
           p.mark_amount, p.net_weight, p.gross_weight
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ? AND ci.status != 'removed'
    ORDER BY ci.created_at DESC
  `;

  db.query(checkSql, [userId], (err, results) => {
    if (err) {
      return;
    }

    if (results.length === 0) {
      return;
    }

    // Clear the cart by setting status to 'removed'
    const clearSql = `UPDATE cart_items SET 
      status = 'removed', updated_at = NOW() 
      WHERE user_id = ? AND status != 'removed'`;

    db.query(clearSql, [userId], (err, result) => {
      if (err) {
        return;
      }

      // Verify the cart is empty
      db.query(checkSql, [userId], (err, verifyResults) => {
        if (err) {
          return;
        }

        process.exit(0);
      });
    });
  });
};

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  process.exit(1);
}

clearUserCart(parseInt(userId));
