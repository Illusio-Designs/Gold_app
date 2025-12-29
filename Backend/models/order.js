const { db } = require("../config/db");
const productModel = require("./product");

// Create new order with individual product status tracking
function createOrder(order, callback) {
  console.log("📦 [MODEL] createOrder called for product:", order.product_id);

  // First, check if product is available for order
  productModel.isProductAvailableForOrder(
    order.product_id,
    (err, isAvailable) => {
      if (err) {
        console.error("❌ [MODEL] Error checking product availability:", err);
        return callback(err);
      }

      if (!isAvailable) {
        console.error(
          "❌ [MODEL] Product not available for order:",
          order.product_id
        );
        return callback(new Error("Product is not available for order"));
      }

      // Get current stock status for history tracking
      productModel.getProductStockStatus(
        order.product_id,
        (err, stockResult) => {
          if (err) {
            console.error(
              "❌ [MODEL] Error getting product stock status:",
              err
            );
            return callback(err);
          }

          const previousStatus = stockResult[0]?.stock_status || "available";

          // Create the order
          const sql = `INSERT INTO orders (
        user_id, product_id, quantity, total_amount, status, remark, courier_company
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
          const values = [
            order.user_id,
            order.product_id,
            order.quantity,
            order.total_amount,
            order.status || "pending",
            order.remark || null,
            order.courier_company || null,
          ];

          db.query(sql, values, (err, result) => {
            if (err) {
              console.error("❌ [MODEL] Error creating order:", err);
              return callback(err);
            }

            const orderId = result.insertId;
            console.log("✅ [MODEL] Order created successfully, ID:", orderId);

            // Update product stock status to 'out_of_stock'
            productModel.updateProductStockStatus(
              order.product_id,
              "out_of_stock",
              (err) => {
                if (err) {
                  console.error(
                    "❌ [MODEL] Error updating product stock status:",
                    err
                  );
                  // Don't fail the order creation if stock update fails
                } else {
                  console.log(
                    "✅ [MODEL] Product stock status updated to out_of_stock"
                  );
                }

                // Record stock history
                const historyData = {
                  product_id: order.product_id,
                  action: "ordered",
                  quantity: order.quantity,
                  order_id: orderId,
                  user_id: order.user_id,
                  previous_status: previousStatus,
                  new_status: "out_of_stock",
                  notes: `Order ${orderId} placed - Product marked as out of stock`,
                };

                productModel.recordStockHistory(historyData, (err) => {
                  if (err) {
                    console.error(
                      "❌ [MODEL] Error recording stock history:",
                      err
                    );
                    // Don't fail the order creation if history recording fails
                  } else {
                    console.log("✅ [MODEL] Stock history recorded");
                  }

                  // Return the order result
                  callback(null, result);
                });
              }
            );
          });
        }
      );
    }
  );
}

// Create order from cart items (multiple products)
function createOrderFromCart(userId, cartItems, orderDetails, callback) {
  console.log("📦 [MODEL] createOrderFromCart called for user:", userId);
  console.log("📦 [MODEL] Cart items count:", cartItems.length);
  console.log("📦 [MODEL] Order details:", orderDetails);

  console.log(
    "📦 [MODEL] Starting to create orders for cart items (no transaction)"
  );

  const orderIds = [];
  let completedCount = 0;
  let hasError = false;

  // Create individual order for each cart item
  for (const cartItem of cartItems) {
    console.log("📦 [MODEL] Processing cart item:", cartItem);

    const orderData = {
      user_id: userId,
      product_id: cartItem.product_id,
      quantity: cartItem.quantity,
      total_amount: cartItem.mark_amount * cartItem.quantity,
      status: "pending",
      remark: orderDetails.remark || null,
      courier_company: orderDetails.courier_company || null,
    };

    console.log("📦 [MODEL] Order data prepared:", orderData);

    // Create order for this product
    console.log("📦 [MODEL] Creating order for product:", cartItem.product_id);
    createOrder(orderData, (err, result) => {
      if (err) {
        console.error("❌ [MODEL] Error creating order:", err);
        hasError = true;
        completedCount++;

        if (completedCount === cartItems.length) {
          if (hasError) {
            callback(new Error("Some orders failed to create"));
          } else {
            callback(null, orderIds);
          }
        }
      } else {
        console.log(
          "✅ [MODEL] Order created successfully, ID:",
          result.insertId
        );
        orderIds.push(result.insertId);
        console.log("📦 [MODEL] Order ID added to list:", result.insertId);

        completedCount++;

        if (completedCount === cartItems.length) {
          if (hasError) {
            callback(new Error("Some orders failed to create"));
          } else {
            console.log(
              "✅ [MODEL] All orders created successfully:",
              orderIds
            );
            callback(null, orderIds);
          }
        }
      }
    });
  }
}

// Get all orders with user and product details
function getAllOrders(callback) {
  const sql = `
    SELECT o.*, 
           u.name as user_name, u.business_name, u.phone_number as user_phone, u.status as user_status,
           p.name as product_name, p.sku as product_sku, p.image as product_image
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN products p ON o.product_id = p.id
    ORDER BY o.created_at DESC
  `;
  db.query(sql, callback);
}

// Get orders by user ID with individual product status
function getOrdersByUserId(userId, callback) {
  const sql = `
    SELECT o.*, 
           p.name as product_name, p.image as product_image, p.sku as product_sku,
           c.name as category_name
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;
  db.query(sql, [userId], callback);
}

// Get order by ID with user and product details
function getOrderById(id, callback) {
  const sql = `
    SELECT o.*, 
           u.name as user_name, u.business_name, u.email, u.phone_number as user_phone, u.status as user_status,
           p.name as product_name, p.sku as product_sku, p.image as product_image, p.description
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.id = ?
  `;
  db.query(sql, [id], callback);
}

// Get a set of orders with their user approval status (for bulk admin actions)
function getOrdersByIds(orderIds, callback) {
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return callback(null, []);
  }

  const sql = `
    SELECT o.id as order_id, o.user_id, u.status as user_status
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id IN (${orderIds.map(() => "?").join(",")})
  `;
  db.query(sql, orderIds, callback);
}

// Update order status (individual product status)
function updateOrderStatus(orderId, status, callback) {
  const sql = `UPDATE orders SET 
    status = ?, updated_at = NOW()
    WHERE id = ?`;

  db.query(sql, [status, orderId], callback);
}

// Update order with full details
function updateOrder(id, order, callback) {
  const sql = `UPDATE orders SET 
    user_id = ?, product_id = ?, quantity = ?, total_amount = ?, status = ?, remark = ?, courier_company = ?, updated_at = NOW()
    WHERE id = ?`;
  const values = [
    order.user_id,
    order.product_id,
    order.quantity,
    order.total_amount,
    order.status || "pending",
    order.remark || null,
    order.courier_company || null,
    id,
  ];
  db.query(sql, values, callback);
}

// Bulk update order statuses
function bulkUpdateOrderStatuses(orderIds, status, callback) {
  const sql = `UPDATE orders SET 
    status = ?, updated_at = NOW()
    WHERE id IN (${orderIds.map(() => "?").join(",")})`;

  db.query(sql, [status, ...orderIds], callback);
}

// Delete order
function deleteOrder(id, callback) {
  const sql = "DELETE FROM orders WHERE id = ?";
  db.query(sql, [id], callback);
}

// Get order statistics
function getOrderStatistics(callback) {
  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
      COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
    FROM orders
  `;
  db.query(sql, callback);
}

module.exports = {
  createOrder,
  createOrderFromCart,
  getAllOrders,
  getOrdersByUserId,
  getOrderById,
  getOrdersByIds,
  updateOrderStatus,
  updateOrder,
  bulkUpdateOrderStatuses,
  deleteOrder,
  getOrderStatistics,
};
