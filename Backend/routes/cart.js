const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken, requireSelfOrAdmin } = require('../middlewares/auth');

// Cart routes - all require authentication
router.use(verifyToken);

// Add item to cart
router.post('/add', cartController.addToCart);

// Get user's cart (owner or admin only)
router.get('/user/:user_id', requireSelfOrAdmin('user_id'), cartController.getUserCart);

// Update cart item quantity (ownership verified in controller)
router.put('/item/:cart_item_id/quantity', cartController.updateCartItemQuantity);

// Remove item from cart (ownership verified in controller)
router.delete('/item/:cart_item_id', cartController.removeFromCart);

// Clear user's cart (owner or admin only)
router.delete('/user/:user_id/clear', requireSelfOrAdmin('user_id'), cartController.clearUserCart);

// Get specific cart item
router.get('/item/:cart_item_id', cartController.getCartItemById);

module.exports = router;
