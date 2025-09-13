const { db } = require("../config/db");
const orderModel = require("../models/order");
const cartModel = require("../models/cart");
const { notifyNewOrder } = require("../services/adminNotificationService");
const socketService = require("../services/socketService");

// Create new order
function createOrder(req, res) {
  const {
    business_user_id,
    product_id,
    total_qty,
    total_mark_amount,
    total_net_weight,
    total_less_weight,
    total_gross_weight,
    status,
    remark,
    courier_company,
  } = req.body;

  if (
    !business_user_id ||
    !product_id ||
    !total_qty ||
    !total_mark_amount ||
    !total_net_weight ||
    !total_gross_weight
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const orderData = {
    business_user_id,
    product_id,
    total_qty,
    total_mark_amount,
    total_net_weight,
    total_less_weight,
    total_gross_weight,
    status: status || "pending",
    remark: remark || null,
    courier_company: courier_company || null,
  };

  orderModel.createOrder(orderData, async (err, result) => {
    if (err) {
      console.error("Error creating order:", err);
      return res.status(500).json({ error: err.message });
    }

    // Get order details for notification and real-time update
    orderModel.getOrderById(
      result.insertId,
      async (detailsErr, detailsResults) => {
        if (detailsErr) {
          console.error("Error getting order details:", detailsErr);
          return res.status(500).json({ error: detailsErr.message });
        }

        if (detailsResults.length > 0) {
          const orderDetails = detailsResults[0];

          // Send notification to admin about new order
          try {
            const notificationData = {
              id: orderDetails.id,
              userId: orderDetails.business_user_id,
              userName: orderDetails.user_name,
              productName: orderDetails.product_name,
              productSku: orderDetails.product_sku,
              quantity: orderDetails.total_qty,
              totalAmount: orderDetails.total_mark_amount,
              status: orderDetails.status,
            };

            await notifyNewOrder(notificationData);
            console.log(
              "Admin notification sent for new order:",
              notificationData.id
            );
          } catch (notificationError) {
            console.error(
              "Error sending admin notification for new order:",
              notificationError
            );
          }

          // Emit real-time order update
          socketService.emitToAll("order-update", {
            action: "order-created",
            order: orderDetails,
            timestamp: new Date().toISOString(),
          });

          // Emit specific update to the user's room
          socketService.emitToRoom(
            `user-${business_user_id}`,
            "order-created",
            {
              order: orderDetails,
              timestamp: new Date().toISOString(),
            }
          );

          res.status(201).json({
            message: "Order created successfully",
            orderId: result.insertId,
            order: orderDetails,
          });
        } else {
          res.status(500).json({ error: "Failed to retrieve order details" });
        }
      }
    );
  });
}

// Create order from cart (multiple products)
function createOrderFromCart(req, res) {
  console.log("📦 [BACKEND] createOrderFromCart called with:", req.body);
  console.log("📦 [BACKEND] Headers:", req.headers);

  const { user_id, remark, courier_company } = req.body;

  if (!user_id) {
    console.error("❌ [BACKEND] Missing user_id in createOrderFromCart");
    return res.status(400).json({ error: "User ID is required" });
  }

  console.log("📦 [BACKEND] Creating order from cart for user:", user_id);

  // Get user's cart items
  console.log("🛒 [BACKEND] Getting user cart for user:", user_id);
  cartModel.getUserCart(user_id, (cartErr, cartResults) => {
    if (cartErr) {
      console.error("❌ [BACKEND] Error getting user cart:", cartErr);
      return res.status(500).json({ error: cartErr.message });
    }

    console.log(
      "🛒 [BACKEND] User cart retrieved, items count:",
      cartResults.length
    );
    console.log("🛒 [BACKEND] Cart items:", cartResults);

    if (cartResults.length === 0) {
      console.error("❌ [BACKEND] Cart is empty for user:", user_id);
      return res.status(400).json({ error: "Cart is empty" });
    }

    const orderDetails = { remark, courier_company };
    console.log("📦 [BACKEND] Order details prepared:", orderDetails);

    // Create orders from cart items
    console.log("📦 [BACKEND] Calling createOrderFromCart model function");
    orderModel.createOrderFromCart(
      user_id,
      cartResults,
      orderDetails,
      (err, orderIds) => {
        if (err) {
          console.error("❌ [BACKEND] Error creating orders from cart:", err);
          return res.status(500).json({ error: err.message });
        }

        console.log(
          "✅ [BACKEND] Orders created successfully, orderIds:",
          orderIds
        );

        // Clear user's cart after successful order creation
        console.log("🛒 [BACKEND] Clearing user cart after order creation");
        cartModel.clearUserCart(user_id, (clearErr) => {
          if (clearErr) {
            console.error("❌ [BACKEND] Error clearing cart:", clearErr);
            // Don't fail the order creation if cart clearing fails
          } else {
            console.log("✅ [BACKEND] User cart cleared successfully");
          }

          // Emit real-time updates
          console.log("🔄 [BACKEND] Emitting order-update to all clients");
          socketService.emitToAll("order-update", {
            action: "orders-created-from-cart",
            userId: parseInt(user_id),
            orderIds: orderIds,
            timestamp: new Date().toISOString(),
          });

          // Emit specific update to the user's room
          console.log(
            "🔄 [BACKEND] Emitting orders-created-from-cart to user room:",
            `user-${user_id}`
          );
          socketService.emitToRoom(
            `user-${user_id}`,
            "orders-created-from-cart",
            {
              orderIds: orderIds,
              timestamp: new Date().toISOString(),
            }
          );

          console.log("✅ [BACKEND] Sending success response to client");
          res.status(201).json({
            message: "Orders created successfully from cart",
            orderIds: orderIds,
            totalOrders: orderIds.length,
          });
        });
      }
    );
  });
}

// Get all orders
function getAllOrders(req, res) {
  orderModel.getAllOrders((err, results) => {
    if (err) {
      console.error("Error getting orders:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
}

// Get orders by user ID
function getOrdersByUserId(req, res) {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  orderModel.getOrdersByUserId(user_id, (err, results) => {
    if (err) {
      console.error("Error getting user orders:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      user_id: parseInt(user_id),
      orders: results,
      total_orders: results.length,
    });
  });
}

// Get current user's orders (from authentication token)
function getCurrentUserOrders(req, res) {
  const userId = req.user.id; // Get user ID from verified token

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  orderModel.getOrdersByUserId(userId, (err, results) => {
    if (err) {
      console.error("Error getting current user orders:", err);
      return res.status(500).json({ error: err.message });
    }

    // Format the response to match the expected structure
    const formattedOrders = results.map((order) => ({
      id: order.id,
      business_user_id: order.business_user_id,
      product_id: order.product_id,
      product_name: order.product_name,
      product_sku: order.product_sku,
      product_image: order.product_image,
      category_name: order.category_name,
      net_weight: order.net_weight,
      gross_weight: order.gross_weight,
      less_weight: order.less_weight,
      mark_amount: order.mark_amount,
      total_qty: order.total_qty,
      total_mark_amount: order.total_mark_amount,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      // Add items array for compatibility with mobile app
      items: [
        {
          id: order.product_id,
          product_name: order.product_name,
          product_sku: order.product_sku,
          product_image: order.product_image,
          category_name: order.category_name,
          net_weight: order.net_weight,
          gross_weight: order.gross_weight,
          less_weight: order.less_weight,
          mark_amount: order.mark_amount,
          quantity: order.total_qty,
        },
      ],
      total_items: 1,
    }));

    res.json({
      success: true,
      data: formattedOrders,
      total_orders: formattedOrders.length,
    });
  });
}

// Get order by ID
function getOrderById(req, res) {
  const { id } = req.params;
  orderModel.getOrderById(id, (err, results) => {
    if (err) {
      console.error("Error getting order by ID:", err);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(results[0]);
  });
}

// Update order status (individual product status)
function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  // Validate status
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
  }

  orderModel.updateOrderStatus(id, status, (err, result) => {
    if (err) {
      console.error("Error updating order status:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get updated order details for real-time update
    orderModel.getOrderById(id, (detailsErr, detailsResults) => {
      if (detailsErr) {
        console.error("Error getting updated order details:", detailsErr);
        return res.status(500).json({ error: detailsErr.message });
      }

      if (detailsResults.length > 0) {
        const updatedOrder = detailsResults[0];

        // Emit real-time order status update
        socketService.emitToAll("order-update", {
          action: "status-updated",
          order: updatedOrder,
          timestamp: new Date().toISOString(),
        });

        // Emit specific update to the user's room
        socketService.emitToRoom(
          `user-${updatedOrder.business_user_id}`,
          "order-status-updated",
          {
            order: updatedOrder,
            timestamp: new Date().toISOString(),
          }
        );

        res.json({
          message: "Order status updated successfully",
          order: updatedOrder,
        });
      } else {
        res
          .status(500)
          .json({ error: "Failed to retrieve updated order details" });
      }
    });
  });
}

// Bulk update order statuses
function bulkUpdateOrderStatuses(req, res) {
  const { order_ids, status } = req.body;

  if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
    return res.status(400).json({ error: "Order IDs array is required" });
  }

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  // Validate status
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
  }

  orderModel.bulkUpdateOrderStatuses(order_ids, status, (err, result) => {
    if (err) {
      console.error("Error bulk updating order statuses:", err);
      return res.status(500).json({ error: err.message });
    }

    // Emit real-time bulk update
    socketService.emitToAll("order-update", {
      action: "bulk-status-updated",
      orderIds: order_ids,
      status: status,
      affectedRows: result.affectedRows,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: "Order statuses updated successfully",
      affectedOrders: result.affectedRows,
    });
  });
}

// Update order with full details
function updateOrder(req, res) {
  const { id } = req.params;
  const {
    business_user_id,
    product_id,
    total_qty,
    total_mark_amount,
    total_net_weight,
    total_less_weight,
    total_gross_weight,
    status,
    remark,
    courier_company,
  } = req.body;

  const orderData = {
    business_user_id,
    product_id,
    total_qty,
    total_mark_amount,
    total_net_weight,
    total_less_weight,
    total_gross_weight,
    status: status || "pending",
    remark: remark || null,
    courier_company: courier_company || null,
  };

  orderModel.updateOrder(id, orderData, (err, result) => {
    if (err) {
      console.error("Error updating order:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get updated order details for real-time update
    orderModel.getOrderById(id, (detailsErr, detailsResults) => {
      if (detailsErr) {
        console.error("Error getting updated order details:", detailsErr);
        return res.status(500).json({ error: detailsErr.message });
      }

      if (detailsResults.length > 0) {
        const updatedOrder = detailsResults[0];

        // Emit real-time order update
        socketService.emitToAll("order-update", {
          action: "order-updated",
          order: updatedOrder,
          timestamp: new Date().toISOString(),
        });

        // Emit specific update to the user's room
        socketService.emitToRoom(
          `user-${updatedOrder.business_user_id}`,
          "order-updated",
          {
            order: updatedOrder,
            timestamp: new Date().toISOString(),
          }
        );

        res.json({
          message: "Order updated successfully",
          order: updatedOrder,
        });
      } else {
        res
          .status(500)
          .json({ error: "Failed to retrieve updated order details" });
      }
    });
  });
}

// Delete order
function deleteOrder(req, res) {
  const { id } = req.params;
  orderModel.deleteOrder(id, (err, result) => {
    if (err) {
      console.error("Error deleting order:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Emit real-time order deletion
    socketService.emitToAll("order-update", {
      action: "order-deleted",
      orderId: parseInt(id),
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "Order deleted successfully" });
  });
}

// Get order statistics
function getOrderStatistics(req, res) {
  orderModel.getOrderStatistics((err, results) => {
    if (err) {
      console.error("Error getting order statistics:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results[0]);
  });
}

// Download order PDF
function downloadOrderPDF(req, res) {
  const { id } = req.params;
  orderModel.getOrderById(id, (err, results) => {
    if (err) {
      console.error("Error getting order for PDF:", err);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // For now, just return the order data
    // In a real implementation, you would generate a PDF here
    res.json({
      message: "PDF download functionality not implemented",
      order: results[0],
    });
  });
}

module.exports = {
  createOrder,
  createOrderFromCart,
  getAllOrders,
  getOrdersByUserId,
  getCurrentUserOrders,
  getOrderById,
  updateOrderStatus,
  bulkUpdateOrderStatuses,
  updateOrder,
  deleteOrder,
  getOrderStatistics,
  downloadOrderPDF,
};
