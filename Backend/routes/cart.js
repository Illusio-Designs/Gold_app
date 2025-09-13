const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/auth');

// Cart routes - all require authentication
router.use(verifyToken);

// Add item to cart
router.post('/add', cartController.addToCart);

// Get user's cart
router.get('/user/:user_id', cartController.getUserCart);

// Update cart item quantity
router.put('/item/:cart_item_id/quantity', cartController.updateCartItemQuantity);

// Remove item from cart
router.delete('/item/:cart_item_id', cartController.removeFromCart);

// Clear user's cart
router.delete('/user/:user_id/clear', cartController.clearUserCart);

// Get specific cart item
router.get('/item/:cart_item_id', cartController.getCartItemById);

module.exports = router;
