const { db } = require("../config/db");
const orderModel = require("../models/order");
const cartModel = require("../models/cart");
const { notifyNewOrder } = require("../services/adminNotificationService");
const socketService = require("../services/socketService");

function isApprovedBusinessStatus(status) {
  return String(status || "").toLowerCase() === "approved";
}

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
      return res.status(500).json({ error: err.message });
    }

    // Get order details for notification and real-time update
    orderModel.getOrderById(
      result.insertId,
      async (detailsErr, detailsResults) => {
        if (detailsErr) {
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
            } catch (notificationError) {
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
  const { user_id, remark, courier_company } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // Get user's cart items
  cartModel.getUserCart(user_id, (cartErr, cartResults) => {
    if (cartErr) {
      return res.status(500).json({ error: cartErr.message });
    }

    if (cartResults.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const orderDetails = { remark, courier_company };
    // Create orders from cart items
    orderModel.createOrderFromCart(
      user_id,
      cartResults,
      orderDetails,
      (err, orderIds) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Clear user's cart after successful order creation
        cartModel.clearUserCart(user_id, (clearErr) => {
          if (clearErr) {
            // Don't fail the order creation if cart clearing fails
          } else {
            }

          // Emit real-time updates
          socketService.emitToAll("order-update", {
            action: "orders-created-from-cart",
            userId: parseInt(user_id),
            orderIds: orderIds,
            timestamp: new Date().toISOString(),
          });

          // Emit specific update to the user's room
          socketService.emitToRoom(
            `user-${user_id}`,
            "orders-created-from-cart",
            {
              orderIds: orderIds,
              timestamp: new Date().toISOString(),
            }
          );

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

  // Admin-side rule:
  // - If the business/user is not approved, block status changes EXCEPT "cancelled".
  orderModel.getOrderById(id, (getErr, getResults) => {
    if (getErr) {
      return res.status(500).json({ error: getErr.message });
    }
    if (!getResults || getResults.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const existingOrder = getResults[0];
    const userStatus = existingOrder.user_status;
    const userId = existingOrder.user_id;

    if (status !== "cancelled" && !isApprovedBusinessStatus(userStatus)) {
      return res.status(403).json({
        error:
          "Business is not approved. Approve the business first or cancel the order.",
        code: "BUSINESS_NOT_APPROVED",
        orderId: parseInt(id),
        userId,
        userStatus,
        allowedStatuses: ["cancelled"],
      });
    }

    orderModel.updateOrderStatus(id, status, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get updated order details for real-time update
      orderModel.getOrderById(id, (detailsErr, detailsResults) => {
        if (detailsErr) {
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
          const roomUserId = updatedOrder.user_id || updatedOrder.business_user_id;
          if (roomUserId) {
            socketService.emitToRoom(
              `user-${roomUserId}`,
              "order-status-updated",
              {
                order: updatedOrder,
                timestamp: new Date().toISOString(),
              }
            );
          }

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

  // Same admin-side rule for bulk:
  // - If status != "cancelled", all involved businesses must be approved.
  if (status !== "cancelled") {
    orderModel.getOrdersByIds(order_ids, (listErr, listRows) => {
      if (listErr) {
        return res.status(500).json({ error: listErr.message });
      }

      const blocked = (listRows || []).filter(
        (r) => !isApprovedBusinessStatus(r.user_status)
      );

      if (blocked.length > 0) {
        return res.status(403).json({
          error:
            "One or more orders belong to businesses that are not approved. Approve them first or cancel the orders.",
          code: "BUSINESS_NOT_APPROVED",
          blockedOrders: blocked.map((b) => ({
            orderId: b.order_id,
            userId: b.user_id,
            userStatus: b.user_status,
          })),
          allowedStatuses: ["cancelled"],
        });
      }

      orderModel.bulkUpdateOrderStatuses(order_ids, status, (err, result) => {
        if (err) {
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
    });
    return;
  }

  // Cancelling is always allowed.
  orderModel.bulkUpdateOrderStatuses(order_ids, status, (err, result) => {
    if (err) {
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
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get updated order details for real-time update
    orderModel.getOrderById(id, (detailsErr, detailsResults) => {
      if (detailsErr) {
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
