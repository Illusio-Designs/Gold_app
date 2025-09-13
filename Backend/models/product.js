const { db } = require("../config/db");

// Create new product
function createProduct(product, callback) {
  const sql = `INSERT INTO products (
    category_id, name, image, net_weight, gross_weight, size, attributes, sku, purity, pieces, mark_amount, status, stock_status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    product.category_id,
    product.name,
    product.image,
    product.net_weight,
    product.gross_weight,
    product.size,
    product.attributes,
    product.sku,
    product.purity,
    product.pieces,
    product.mark_amount,
    "draft", // Always start as draft
    "available", // Always start as available stock
  ];
  db.query(sql, values, callback);
}

// Add product image
function addProductImage(productId, image, callback) {
  // Get current images from the product
  const getSql = "SELECT image FROM products WHERE id = ?";
  db.query(getSql, [productId], (err, results) => {
    if (err) {
      return callback(err);
    }

    if (results.length === 0) {
      return callback(new Error("Product not found"));
    }

    let currentImages = [];
    const currentImage = results[0].image;

    // Parse existing images (could be single image or JSON array)
    if (currentImage) {
      try {
        currentImages = JSON.parse(currentImage);
        if (!Array.isArray(currentImages)) {
          currentImages = [currentImage]; // Convert single image to array
        }
      } catch (e) {
        currentImages = [currentImage]; // Single image, convert to array
      }
    }

    // Add new image
    currentImages.push(image);

    // Update product with new images array
    const updateSql = "UPDATE products SET image = ? WHERE id = ?";
    db.query(updateSql, [JSON.stringify(currentImages), productId], callback);
  });
}

// Get all images for a product
function getProductImages(productId, callback) {
  const sql = "SELECT image FROM products WHERE id = ?";
  db.query(sql, [productId], (err, results) => {
    if (err) {
      return callback(err);
    }

    if (results.length === 0) {
      return callback(new Error("Product not found"));
    }

    const imageData = results[0].image;
    let images = [];

    if (imageData) {
      try {
        images = JSON.parse(imageData);
        if (!Array.isArray(images)) {
          images = [imageData]; // Single image, convert to array
        }
      } catch (e) {
        images = [imageData]; // Single image, convert to array
      }
    }

    // Convert to the expected format (with id and image fields)
    const formattedImages = images.map((image, index) => ({
      id: index + 1,
      image: image,
      product_id: productId,
    }));

    callback(null, formattedImages);
  });
}

// Delete a product image
function deleteProductImage(productId, imageIndex, callback) {
  // Get current images from the product
  const getSql = "SELECT image FROM products WHERE id = ?";
  db.query(getSql, [productId], (err, results) => {
    if (err) {
      return callback(err);
    }

    if (results.length === 0) {
      return callback(new Error("Product not found"));
    }

    let currentImages = [];
    const currentImage = results[0].image;

    // Parse existing images (could be single image or JSON array)
    if (currentImage) {
      try {
        currentImages = JSON.parse(currentImage);
        if (!Array.isArray(currentImages)) {
          currentImages = [currentImage]; // Convert single image to array
        }
      } catch (e) {
        currentImages = [currentImage]; // Single image, convert to array
      }
    }

    // Check if image index is valid
    if (imageIndex < 0 || imageIndex >= currentImages.length) {
      return callback(new Error("Invalid image index"));
    }

    // Remove the image at the specified index
    currentImages.splice(imageIndex, 1);

    // Update product with new images array
    const updateSql = "UPDATE products SET image = ? WHERE id = ?";
    const newImageValue =
      currentImages.length === 0
        ? null
        : currentImages.length === 1
        ? currentImages[0]
        : JSON.stringify(currentImages);

    db.query(updateSql, [newImageValue, productId], callback);
  });
}

// Get all products (only active ones)
function getAllProducts(callback) {
  console.log("🔍 [PRODUCTS] Getting all products...");

  // First, let's check all products to see what status values exist
  db.query(
    "SELECT id, name, status, stock_status FROM products ORDER BY created_at DESC",
    (debugErr, debugResults) => {
      if (debugErr) {
        console.error("❌ [PRODUCTS] Debug query error:", debugErr);
      } else {
        console.log(
          "🔍 [PRODUCTS] All products in database:",
          debugResults.length
        );
        console.log(
          "🔍 [PRODUCTS] Products with status 'active':",
          debugResults.filter((p) => p.status === "active").length
        );
        console.log(
          "🔍 [PRODUCTS] Products with status 'draft':",
          debugResults.filter((p) => p.status === "draft").length
        );
      }
    }
  );

  const sql =
    "SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC";

  console.log("🔍 [PRODUCTS] SQL Query:", sql);
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ [PRODUCTS] Database error:", err);
    } else {
      console.log("🔍 [PRODUCTS] Filtered results count:", results.length);
    }
    callback(err, results);
  });
}

// Get product by ID
function getProductById(id, callback) {
  const sql = "SELECT * FROM products WHERE id = ?";
  db.query(sql, [id], callback);
}

// Update product
function updateProduct(id, product, callback) {
  const sql = `UPDATE products SET 
    category_id = ?, name = ?, image = ?, net_weight = ?, gross_weight = ?, size = ?, attributes = ?, sku = ?, purity = ?, pieces = ?, mark_amount = ?
    WHERE id = ?`;
  const values = [
    product.category_id,
    product.name,
    product.image,
    product.net_weight,
    product.gross_weight,
    product.size,
    product.attributes,
    product.sku,
    product.purity,
    product.pieces,
    product.mark_amount,
    id,
  ];
  db.query(sql, values, callback);
}

// Delete product
function deleteProduct(id, callback) {
  const sql = "DELETE FROM products WHERE id = ?";
  db.query(sql, [id], callback);
}

// Get all products by category_id (only active ones)
function getProductsByCategory(categoryId, callback) {
  const sql =
    "SELECT * FROM products WHERE category_id = ? AND status = 'active' ORDER BY created_at DESC";
  db.query(sql, [categoryId], callback);
}

// Get product by SKU
function getProductBySku(sku, callback) {
  console.log("🔍 [MODEL] getProductBySku called with SKU:", sku);

  // For cart operations, we need to find the product regardless of stock status
  // Only check if the product is active (not draft) and available (not out of stock)
  const sql =
    "SELECT * FROM products WHERE sku = ? AND status = 'active' AND stock_status != 'out_of_stock'";

  console.log("🔍 [MODEL] SQL query:", sql);
  console.log("🔍 [MODEL] Values:", [sku]);

  db.query(sql, [sku], (err, results) => {
    if (err) {
      console.error("❌ [MODEL] Database error in getProductBySku:", err);
    } else {
      console.log("✅ [MODEL] getProductBySku database result:", results);
      console.log("✅ [MODEL] Results count:", results.length);
      if (results.length > 0) {
        console.log("✅ [MODEL] Product found:", {
          id: results[0].id,
          name: results[0].name,
          sku: results[0].sku,
          status: results[0].status,
          stock_status: results[0].stock_status,
        });
      }
    }
    callback(err, results);
  });
}

// Update product stock status
function updateProductStockStatus(productId, newStatus, callback) {
  const sql =
    "UPDATE products SET stock_status = ?, updated_at = NOW() WHERE id = ?";
  db.query(sql, [newStatus, productId], callback);
}

// Get product stock status
function getProductStockStatus(productId, callback) {
  const sql = "SELECT stock_status FROM products WHERE id = ?";
  db.query(sql, [productId], callback);
}

// Check if product is available for order
function isProductAvailableForOrder(productId, callback) {
  const sql =
    "SELECT status, stock_status FROM products WHERE id = ? AND status = 'active' AND stock_status != 'out_of_stock'";
  db.query(sql, [productId], (err, results) => {
    if (err) {
      return callback(err);
    }
    const isAvailable = results.length > 0;
    console.log("🔍 [MODEL] isProductAvailableForOrder check:", {
      productId,
      isAvailable,
      status: results[0]?.status,
      stock_status: results[0]?.stock_status,
    });
    callback(null, isAvailable);
  });
}

// Record stock history
function recordStockHistory(historyData, callback) {
  const sql = `INSERT INTO product_stock_history (
    product_id, action, quantity, order_id, user_id, previous_status, new_status, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    historyData.product_id,
    historyData.action,
    historyData.quantity,
    historyData.order_id || null,
    historyData.user_id || null,
    historyData.previous_status,
    historyData.new_status,
    historyData.notes || null,
  ];

  db.query(sql, values, callback);
}

// Get available products only (for frontend display)
function getAvailableProducts(callback) {
  console.log("🔍 [MODEL] getAvailableProducts called");

  // For frontend display, only show active products that are available (not out of stock)
  const sql =
    "SELECT * FROM products WHERE status = 'active' AND stock_status != 'out_of_stock' ORDER BY created_at DESC";

  console.log("🔍 [MODEL] SQL query:", sql);

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ [MODEL] Database error in getAvailableProducts:", err);
    } else {
      console.log(
        "✅ [MODEL] getAvailableProducts database result count:",
        results.length
      );
    }
    callback(err, results);
  });
}

// Get products by category (only available ones)
function getAvailableProductsByCategory(categoryId, callback) {
  console.log(
    "🔍 [MODEL] getAvailableProductsByCategory called for category:",
    categoryId
  );

  // For frontend display by category, only show active products that are available (not out of stock)
  const sql =
    "SELECT * FROM products WHERE category_id = ? AND status = 'active' AND stock_status != 'out_of_stock' ORDER BY created_at DESC";

  console.log("🔍 [MODEL] SQL query:", sql);
  console.log("🔍 [MODEL] Values:", [categoryId]);

  db.query(sql, [categoryId], (err, results) => {
    if (err) {
      console.error(
        "❌ [MODEL] Database error in getAvailableProductsByCategory:",
        err
      );
    } else {
      console.log(
        "✅ [MODEL] getAvailableProductsByCategory database result count:",
        results.length
      );
    }
    callback(err, results);
  });
}

module.exports = {
  createProduct,
  addProductImage,
  getProductImages,
  deleteProductImage,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  updateProductStockStatus,
  getProductStockStatus,
  isProductAvailableForOrder,
  recordStockHistory,
  getAvailableProducts,
  getAvailableProductsByCategory,
};
