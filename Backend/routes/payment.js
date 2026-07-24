const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/auth");

// All payment routes require an authenticated user.
router.use(verifyToken);

// Create a Razorpay order for the app's checkout sheet.
router.post("/razorpay/order", paymentController.createRazorpayOrder);

// Verify the payment signature and mark our order paid/failed.
router.post("/razorpay/verify", paymentController.verifyRazorpayPayment);

module.exports = router;
