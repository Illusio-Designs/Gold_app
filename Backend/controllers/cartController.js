const cartModel = require("../models/cart");
const productModel = require("../models/product");
const socketService = require("../services/socketService");

// Add item to cart with real-time updates
function addToCart(req, res) {
  console.log('🛒 [BACKEND] addToCart called with:', req.body);
  console.log('🛒 [BACKEND] Headers:', req.headers);
  
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id) {
    console.error('❌ [BACKEND] Missing required fields:', { user_id, product_id });
    return res.status(400).json({ error: "Missing required fields" });
  }

  // First, check if product is available for order
  console.log('🛒 [BACKEND] Checking product availability for product_id:', product_id);
  productModel.isProductAvailableForOrder(product_id, (err, isAvailable) => {
    if (err) {
      console.error('❌ [BACKEND] Error checking product availability:', err);
      return res.status(500).json({ error: "Error checking product availability" });
    }
    
    if (!isAvailable) {
      console.error('❌ [BACKEND] Product not available for order:', product_id);
      return res.status(400).json({ error: "Product is not available for order" });
    }
    
    console.log('✅ [BACKEND] Product is available for order');
    
    const cartItem = {
      user_id,
      product_id,
      quantity: quantity || 1
    };
    
    console.log('🛒 [BACKEND] Cart item prepared:', cartItem);

    cartModel.addToCart(cartItem, (err, result) => {
      if (err) {
        console.error('❌ [BACKEND] Error adding to cart:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('✅ [BACKEND] Cart item added successfully, insertId:', result.insertId);

      // Get the added cart item details
      console.log('🛒 [BACKEND] Getting cart item details for ID:', result.insertId);
      cartModel.getCartItemById(result.insertId, (detailsErr, detailsResults) => {
        if (detailsErr) {
          console.error('❌ [BACKEND] Error getting cart item details:', detailsErr);
          return res.status(500).json({ error: detailsErr.message });
        }

        if (detailsResults.length > 0) {
          const cartItemDetails = detailsResults[0];
          console.log('✅ [BACKEND] Cart item details retrieved:', cartItemDetails);
          
          // Verify the item was actually added to the database
          console.log('🛒 [BACKEND] Verifying cart item in database...');
          cartModel.getUserCart(user_id, (verifyErr, verifyResults) => {
            if (verifyErr) {
              console.error('❌ [BACKEND] Error verifying cart:', verifyErr);
            } else {
              console.log('🛒 [BACKEND] Cart verification results:', verifyResults);
              console.log('🛒 [BACKEND] Total items in cart after addition:', verifyResults.length);
            }
          });
          
          // Emit specific update to the user's room only
          console.log('🔄 [BACKEND] Emitting cart-item-added to user room:', `user-${user_id}`);
          socketService.emitToRoom(`user-${user_id}`, 'cart-item-added', {
            cartItem: cartItemDetails,
            timestamp: new Date().toISOString()
          });

          console.log('✅ [BACKEND] Sending success response to client');
          res.status(201).json({
            message: "Item added to cart successfully",
            cartItem: cartItemDetails
          });
        } else {
          console.error('❌ [BACKEND] Failed to retrieve cart item details');
          res.status(500).json({ error: "Failed to retrieve cart item details" });
        }
      });
    });
  });
}

// Get user's cart
function getUserCart(req, res) {
  const { user_id } = req.params;

  console.log('🛒 [BACKEND] getUserCart called for user:', user_id);

  if (!user_id) {
    console.error('❌ [BACKEND] Missing user_id in getUserCart');
    return res.status(400).json({ error: "User ID is required" });
  }

  console.log('🛒 [BACKEND] Calling cartModel.getUserCart for user:', user_id);
  
  cartModel.getUserCart(user_id, (err, results) => {
    if (err) {
      console.error('❌ [BACKEND] Error getting user cart:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log('🛒 [BACKEND] getUserCart results:', results);
    console.log('🛒 [BACKEND] Results length:', results.length);

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
      console.error('Error updating cart item quantity:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Get updated cart item details
    cartModel.getCartItemById(cart_item_id, (detailsErr, detailsResults) => {
      if (detailsErr) {
        console.error('Error getting updated cart item details:', detailsErr);
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
      console.error('Error removing from cart:', err);
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
      console.error('Error clearing user cart:', err);
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
      console.error('Error getting cart item:', err);
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
