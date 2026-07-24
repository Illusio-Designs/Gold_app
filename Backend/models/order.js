const { db } = require("../config/db");
const productModel = require("./product");

// Create new order with individual product status tracking.
// Reserving the piece and creating the order is now race-safe: the atomic
// conditional flip in reserveProductForOrder guarantees that two concurrent
// buyers (e.g. one in the B2B app and one in the D2C app) can never both claim
// the same physical item — the second caller gets "not available".
function createOrder(order, callback) {
  productModel.reserveProductForOrder(
    order.product_id,
    (reserveErr, reserved) => {
      if (reserveErr) {
        return callback(reserveErr);
      }

      if (!reserved) {
        // Either already sold, reserved, or not active — reject cleanly.
        return callback(new Error("Product is not available for order"));
      }

      // The piece is now reserved (out_of_stock). Create the order row.
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
          // Roll the reservation back so a failed insert doesn't strand the
          // piece as permanently out_of_stock.
          productModel.updateProductStockStatus(
            order.product_id,
            "available",
            () => {}
          );
          return callback(err);
        }

        const orderId = result.insertId;

        // Record stock history (best-effort — never fail the order for this).
        const historyData = {
          product_id: order.product_id,
          action: "ordered",
          quantity: order.quantity,
          order_id: orderId,
          user_id: order.user_id,
          previous_status: "available",
          new_status: "out_of_stock",
          notes: `Order ${orderId} placed - Product marked as out of stock`,
        };

        productModel.recordStockHistory(historyData, () => {
          callback(null, result);
        });
      });
    }
  );
}

// Create order from cart items (multiple products)
function createOrderFromCart(userId, cartItems, orderDetails, callback) {
  const orderIds = [];
  let completedCount = 0;
  let hasError = false;

  // Create individual order for each cart item
  for (const cartItem of cartItems) {
    const orderData = {
      user_id: userId,
      product_id: cartItem.product_id,
      quantity: cartItem.quantity,
      total_amount: cartItem.mark_amount * cartItem.quantity,
      status: "pending",
      remark: orderDetails.remark || null,
      courier_company: orderDetails.courier_company || null,
    };

    // Create order for this product
    createOrder(orderData, (err, result) => {
      if (err) {
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
        orderIds.push(result.insertId);
        completedCount++;

        if (completedCount === cartItems.length) {
          if (hasError) {
            callback(new Error("Some orders failed to create"));
          } else {
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
           CONCAT('ORD-', LPAD(o.id, 6, '0')) as order_number,
           u.name as user_name, u.business_name, u.phone_number as user_phone, u.status as user_status, u.type as user_type,
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
           CONCAT('ORD-', LPAD(o.id, 6, '0')) as order_number,
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
           CONCAT('ORD-', LPAD(o.id, 6, '0')) as order_number,
           u.name as user_name, u.business_name, u.email, u.phone_number as user_phone, u.status as user_status, u.type as user_type,
           u.address_line1, u.address_line2, u.landmark, u.city, u.state, u.country,
           p.name as product_name, p.sku as product_sku, p.image as product_image
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

// Fetch orders (by id) with the data needed to compute an authoritative
// payment total server-side: the stored amount, the product net weight, and
// the buyer's account type (consumer prices come from the gold rate).
function getOrdersForPayment(orderIds, callback) {
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return callback(null, []);
  }
  const placeholders = orderIds.map(() => "?").join(",");
  const sql = `
    SELECT o.id, o.total_amount, o.quantity,
           p.net_weight AS net_weight,
           u.type AS user_type
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id IN (${placeholders})
  `;
  db.query(sql, orderIds, callback);
}

// Overwrite an order's total (used to record the gold-rate price actually
// charged to a consumer at payment time).
function updateOrderTotal(orderId, totalAmount, callback) {
  db.query(
    "UPDATE orders SET total_amount = ?, updated_at = NOW() WHERE id = ?",
    [totalAmount, orderId],
    callback
  );
}

// Update an order's payment fields (D2C Razorpay flow).
function updateOrderPayment(orderId, payment, callback) {
  const sql = `UPDATE orders SET
    payment_status = ?, payment_method = ?, razorpay_order_id = ?, razorpay_payment_id = ?, updated_at = NOW()
    WHERE id = ?`;
  const values = [
    payment.payment_status || "pending",
    payment.payment_method || null,
    payment.razorpay_order_id || null,
    payment.razorpay_payment_id || null,
    orderId,
  ];
  db.query(sql, values, callback);
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
  updateOrderPayment,
  getOrdersForPayment,
  updateOrderTotal,
  updateOrder,
  deleteOrder,
  getOrderStatistics,
};
