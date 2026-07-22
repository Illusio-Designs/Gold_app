const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// Order routes - all require authentication
router.use(verifyToken);

// Create new order
router.post('/', orderController.createOrder);

// Create order from cart (multiple products)
router.post('/from-cart', orderController.createOrderFromCart);

// Get all orders (admin only — returns every customer's orders)
router.get('/', requireAdmin, orderController.getAllOrders);

// Get orders by user ID
router.get('/user/:user_id', orderController.getOrdersByUserId);

// Get current user's orders (from token)
router.get('/my-orders', orderController.getCurrentUserOrders);

// Get order statistics (must come before /:id route)
router.get('/stats/statistics', orderController.getOrderStatistics);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status (individual product status)
router.patch('/:id/status', orderController.updateOrderStatus);

// Bulk update order statuses (admin only)
router.patch('/bulk-status', requireAdmin, orderController.bulkUpdateOrderStatuses);

// Update order with full details (admin only)
router.put('/:id', requireAdmin, orderController.updateOrder);

// Delete order (admin only)
router.delete('/:id', requireAdmin, orderController.deleteOrder);

// Download order PDF
router.get('/:id/pdf', orderController.downloadOrderPDF);

module.exports = router;
