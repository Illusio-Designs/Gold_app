const cartModel = require("../models/cart");
const productModel = require("../models/product");
const socketService = require("../services/socketService");

// Add item to cart with real-time updates
function addToCart(req, res) {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // First, check if product is available for order
  productModel.isProductAvailableForOrder(product_id, (err, isAvailable) => {
    if (err) {
      return res.status(500).json({ error: "Error checking product availability" });
    }
    
    if (!isAvailable) {
      return res.status(400).json({ error: "Product is not available for order" });
    }
    
    const cartItem = {
      user_id,
      product_id,
      quantity: quantity || 1
    };
    
    cartModel.addToCart(cartItem, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get the added cart item details
      cartModel.getCartItemById(result.insertId, (detailsErr, detailsResults) => {
        if (detailsErr) {
          return res.status(500).json({ error: detailsErr.message });
        }

        if (detailsResults.length > 0) {
          const cartItemDetails = detailsResults[0];
          // Verify the item was actually added to the database
          cartModel.getUserCart(user_id, (verifyErr, verifyResults) => {
            if (verifyErr) {
              } else {
              }
          });
          
          // Emit specific update to the user's room only
          socketService.emitToRoom(`user-${user_id}`, 'cart-item-added', {
            cartItem: cartItemDetails,
            timestamp: new Date().toISOString()
          });

          res.status(201).json({
            message: "Item added to cart successfully",
            cartItem: cartItemDetails
          });
        } else {
          res.status(500).json({ error: "Failed to retrieve cart item details" });
        }
      });
    });
  });
}

// Get user's cart
function getUserCart(req, res) {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  cartModel.getUserCart(user_id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      user_id: parseInt(user_id),
      items: results,
      total_items: results.length,
      total_quantity: results.reduce((sum, item) => sum + item.quantity, 0)
    });
  });
}

// Update cart item quantity with real-time updates
function updateCartItemQuantity(req, res) {
  const { cart_item_id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: "Valid quantity is required" });
  }

  cartModel.updateCartItemQuantity(cart_item_id, quantity, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Get updated cart item details
    cartModel.getCartItemById(cart_item_id, (detailsErr, detailsResults) => {
      if (detailsErr) {
        return res.status(500).json({ error: detailsErr.message });
      }

      if (detailsResults.length > 0) {
        const updatedCartItem = detailsResults[0];
        
        // Emit specific update to the user's room only
        socketService.emitToRoom(`user-${updatedCartItem.user_id}`, 'cart-item-updated', {
          cartItem: updatedCartItem,
          timestamp: new Date().toISOString()
        });

        res.json({
          message: "Cart item quantity updated successfully",
          cartItem: updatedCartItem
        });
      } else {
        res.status(500).json({ error: "Failed to retrieve updated cart item details" });
      }
    });
  });
}

// Remove item from cart with real-time updates
function removeFromCart(req, res) {
  const { cart_item_id } = req.params;

  cartModel.removeFromCart(cart_item_id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Note: No real-time update needed for item removal as it's user-specific

    res.json({ message: "Item removed from cart successfully" });
  });
}

// Clear user's cart with real-time updates
function clearUserCart(req, res) {
  const { user_id } = req.params;

  cartModel.clearUserCart(user_id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Emit specific update to the user's room only
    socketService.emitToRoom(`user-${user_id}`, 'cart-cleared', {
      timestamp: new Date().toISOString()
    });

    res.json({ 
      message: "Cart cleared successfully",
      itemsCleared: result.affectedRows
    });
  });
}

// Get cart item by ID
function getCartItemById(req, res) {
  const { cart_item_id } = req.params;

  cartModel.getCartItemById(cart_item_id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json(results[0]);
  });
}

module.exports = {
  addToCart,
  getUserCart,
  updateCartItemQuantity,
  removeFromCart,
  clearUserCart,
  getCartItemById
};
