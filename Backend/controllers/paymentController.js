const crypto = require("crypto");
const axios = require("axios");
const orderModel = require("../models/order");

// Razorpay is integrated over its REST API + HMAC signature check (built-in
// crypto), so the backend needs NO extra npm package — it still deploys over
// FTP with no server-side install. Keys live in the server environment only.
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

function isConfigured() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

// POST /payments/razorpay/order  body: { amount (rupees), orderId?, currency? }
// Creates a Razorpay order the app hands to the Razorpay checkout sheet.
async function createRazorpayOrder(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({ error: "Payment gateway not configured" });
  }

  const { amount, orderId, currency } = req.body;
  const amountPaise = Math.round(Number(amount) * 100); // rupees -> paise
  if (!amountPaise || amountPaise < 100) {
    return res.status(400).json({ error: "A valid amount (>= ₹1) is required" });
  }

  try {
    const resp = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: amountPaise,
        currency: currency || "INR",
        receipt: orderId ? `order_${orderId}` : `rcpt_${Date.now()}`,
        notes: orderId ? { internal_order_id: String(orderId) } : {},
      },
      { auth: { username: RAZORPAY_KEY_ID, password: RAZORPAY_KEY_SECRET } }
    );

    // Link the Razorpay order to our order row (payment stays 'pending').
    if (orderId) {
      orderModel.updateOrderPayment(
        orderId,
        {
          payment_status: "pending",
          payment_method: "razorpay",
          razorpay_order_id: resp.data.id,
          razorpay_payment_id: null,
        },
        () => {}
      );
    }

    return res.json({ key: RAZORPAY_KEY_ID, order: resp.data });
  } catch (err) {
    const detail =
      (err.response && err.response.data && err.response.data.error &&
        err.response.data.error.description) ||
      err.message;
    return res
      .status(502)
      .json({ error: "Failed to create payment order", detail });
  }
}

// POST /payments/razorpay/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId? }
// Verifies the signature server-side, then marks our order paid/failed.
function verifyRazorpayPayment(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({ error: "Payment gateway not configured" });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const ok =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(razorpay_signature)
    );

  if (!ok) {
    if (orderId) {
      orderModel.updateOrderPayment(
        orderId,
        {
          payment_status: "failed",
          payment_method: "razorpay",
          razorpay_order_id,
          razorpay_payment_id,
        },
        () => {}
      );
    }
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  if (orderId) {
    return orderModel.updateOrderPayment(
      orderId,
      {
        payment_status: "paid",
        payment_method: "razorpay",
        razorpay_order_id,
        razorpay_payment_id,
      },
      (e) => {
        if (e) return res.status(500).json({ error: e.message });
        return res.json({ success: true, payment_status: "paid" });
      }
    );
  }

  return res.json({ success: true, payment_status: "paid" });
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  isConfigured,
};
