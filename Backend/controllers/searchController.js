const { db } = require("../config/db");

// Search through categories and products
function searchAll(req, res) {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  const searchTerm = `%${query.trim()}%`;

  // Check if this is a frontend request (no admin token)
  const isFrontendRequest =
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ");

  // Search in active categories
  const categorySearchQuery = `
    SELECT 
      'category' as type,
      id,
      name,
      description,
      image,
      status,
      created_at,
      updated_at
    FROM categories 
    WHERE status = 'active' 
    AND (name LIKE ? OR description LIKE ?)
    ORDER BY name ASC
  `;

  // Search in active products (exclude out-of-stock for frontend)
  const productSearchQuery = isFrontendRequest
    ? `
    SELECT 
      'product' as type,
      p.id,
      p.name,
      p.image,
      p.net_weight,
      p.gross_weight,
      p.less_weight,
      p.size,
      p.length,
      p.sku,
      p.purity,
      p.mark,
      p.mark_amount,
      p.status,
      p.stock_status,
      p.created_at,
      p.updated_at,
      c.id as category_id,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active' 
    AND p.stock_status != 'out_of_stock'
    AND c.status = 'active'
    AND (
      p.name LIKE ? 
      OR p.sku LIKE ? 
      OR p.purity LIKE ? 
      OR p.mark LIKE ?
      OR c.name LIKE ?
    )
    ORDER BY p.name ASC
  `
    : `
    SELECT 
      'product' as type,
      p.id,
      p.name,
      p.image,
      p.net_weight,
      p.gross_weight,
      p.less_weight,
      p.size,
      p.length,
      p.sku,
      p.purity,
      p.mark,
      p.mark_amount,
      p.status,
      p.stock_status,
      p.created_at,
      p.updated_at,
      c.id as category_id,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active' 
    AND c.status = 'active'
    AND (
      p.name LIKE ? 
      OR p.sku LIKE ? 
      OR p.purity LIKE ? 
      OR p.mark LIKE ?
      OR c.name LIKE ?
    )
    ORDER BY p.name ASC
  `;

  // Execute both queries
  db.query(
    categorySearchQuery,
    [searchTerm, searchTerm],
    (categoryErr, categories) => {
      if (categoryErr) {
        console.error("Category search error:", categoryErr);
        return res.status(500).json({
          success: false,
          message: "Error searching categories",
          error: categoryErr.message,
        });
      }

      db.query(
        productSearchQuery,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm],
        (productErr, products) => {
          if (productErr) {
            console.error("Product search error:", productErr);
            return res.status(500).json({
              success: false,
              message: "Error searching products",
              error: productErr.message,
            });
          }

          // Process product images
          const processedProducts = products.map((product) => {
            let images = [];
            if (product.image) {
              try {
                images = JSON.parse(product.image);
                if (!Array.isArray(images)) {
                  images = [product.image];
                }
              } catch (e) {
                images = [product.image];
              }
            }
            return {
              ...product,
              images: images,
            };
          });

          res.json({
            success: true,
            data: {
              categories: categories,
              products: processedProducts,
              totalResults: categories.length + products.length,
              categoryCount: categories.length,
              productCount: products.length,
            },
            searchQuery: query,
          });
        }
      );
    }
  );
}

// Search only in categories
function searchCategories(req, res) {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  const searchTerm = `%${query.trim()}%`;

  const sql = `
    SELECT 
      id,
      name,
      description,
      image,
      status,
      created_at,
      updated_at
    FROM categories 
    WHERE status = 'active' 
    AND (name LIKE ? OR description LIKE ?)
    ORDER BY name ASC
  `;

  db.query(sql, [searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error("Category search error:", err);
      return res.status(500).json({
        success: false,
        message: "Error searching categories",
        error: err.message,
      });
    }

    res.json({
      success: true,
      data: results,
      totalResults: results.length,
      searchQuery: query,
    });
  });
}

// Search only in products
function searchProducts(req, res) {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  const searchTerm = `%${query.trim()}%`;

  // Check if this is a frontend request (no admin token)
  const isFrontendRequest =
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ");

  // Build SQL query based on request type
  let sql;
  let params;

  if (isFrontendRequest) {
    // Frontend request - exclude out-of-stock products
    sql = `
      SELECT 
        p.id,
        p.name,
        p.image,
        p.net_weight,
        p.gross_weight,
        p.less_weight,
        p.size,
        p.length,
        p.sku,
        p.purity,
        p.mark,
        p.mark_amount,
        p.status,
        p.stock_status,
        p.created_at,
        p.updated_at,
        c.id as category_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' 
      AND p.stock_status != 'out_of_stock'
      AND c.status = 'active'
      AND (
        p.name LIKE ? 
        OR p.sku LIKE ? 
        OR p.purity LIKE ? 
        OR p.mark LIKE ?
        OR c.name LIKE ?
      )
      ORDER BY p.name ASC
    `;
    params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
  } else {
    // Admin request - show all products including stock status
    sql = `
      SELECT 
        p.id,
        p.name,
        p.image,
        p.net_weight,
        p.gross_weight,
        p.less_weight,
        p.size,
        p.length,
        p.sku,
        p.purity,
        p.mark,
        p.mark_amount,
        p.status,
        p.stock_status,
        p.created_at,
        p.updated_at,
        c.id as category_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' 
      AND c.status = 'active'
      AND (
        p.name LIKE ? 
        OR p.sku LIKE ? 
        OR p.purity LIKE ? 
        OR p.mark LIKE ?
        OR c.name LIKE ?
      )
      ORDER BY p.name ASC
    `;
    params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Product search error:", err);
      return res.status(500).json({
        success: false,
        message: "Error searching products",
        error: err.message,
      });
    }

    // Process product images
    const processedResults = results.map((product) => {
      let images = [];
      if (product.image) {
        try {
          images = JSON.parse(product.image);
          if (!Array.isArray(images)) {
            images = [product.image];
          }
        } catch (e) {
          images = [product.image];
        }
      }
      return {
        ...product,
        images: images,
      };
    });

    res.json({
      success: true,
      data: processedResults,
      totalResults: processedResults.length,
      searchQuery: query,
    });
  });
}

module.exports = {
  searchAll,
  searchCategories,
  searchProducts,
};
