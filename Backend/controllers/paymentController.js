const crypto = require("crypto");
const axios = require("axios");
const orderModel = require("../models/order");
const settingsModel = require("../models/settings");

// Consumer price for one order line: (net_weight × gold_rate) + making %.
// Falls back to the stored order amount if the rate isn't configured.
function consumerLineAmount(order, settings) {
  const rate = Number(settings.gold_rate || 0);
  const makingPct = Number(settings.making_charge_percent || 0);
  const netWeight = Number(order.net_weight || 0);
  if (rate > 0 && netWeight > 0) {
    const qty = Number(order.quantity || 1);
    return netWeight * rate * (1 + makingPct / 100) * qty;
  }
  return Number(order.total_amount || 0);
}

// Compute the authoritative payable total for a set of orders (server-side —
// never trust an amount sent by the client). Consumer orders are priced from
// the gold rate; anything else uses the stored order amount. As a side effect
// each consumer order's stored total is updated to the charged amount so the
// order history matches what was paid.
function computeAuthoritativeTotal(orderIds) {
  return new Promise((resolve, reject) => {
    settingsModel.getAllSettings((sErr, settings) => {
      if (sErr) return reject(sErr);
      orderModel.getOrdersForPayment(orderIds, (oErr, rows) => {
        if (oErr) return reject(oErr);
        let total = 0;
        (rows || []).forEach((o) => {
          const isConsumer = o.user_type === "consumer";
          const line = isConsumer
            ? Math.round(consumerLineAmount(o, settings))
            : Number(o.total_amount || 0);
          total += line;
          if (isConsumer) {
            orderModel.updateOrderTotal(o.id, line, () => {});
          }
        });
        resolve(Math.round(total));
      });
    });
  });
}

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

  const { amount, orderId, orderIds, currency } = req.body;

  // Prefer a server-computed total for real orders; fall back to a client
  // amount only when no order ids are supplied.
  const ids = Array.isArray(orderIds)
    ? orderIds
    : orderId != null
    ? [orderId]
    : [];

  let rupees;
  try {
    if (ids.length > 0) {
      rupees = await computeAuthoritativeTotal(ids);
    } else {
      rupees = Math.round(Number(amount));
    }
  } catch (e) {
    return res.status(500).json({ error: "Failed to price order", detail: e.message });
  }

  const amountPaise = Math.round(Number(rupees) * 100); // rupees -> paise
  if (!amountPaise || amountPaise < 100) {
    return res.status(400).json({ error: "A valid amount (>= ₹1) is required" });
  }

  try {
    const resp = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: amountPaise,
        currency: currency || "INR",
        receipt: ids.length ? `order_${ids[0]}` : `rcpt_${Date.now()}`,
        notes: ids.length ? { internal_order_ids: ids.join(",") } : {},
      },
      { auth: { username: RAZORPAY_KEY_ID, password: RAZORPAY_KEY_SECRET } }
    );

    // Link the Razorpay order to every order row (payment stays 'pending').
    ids.forEach((oid) => {
      orderModel.updateOrderPayment(
        oid,
        {
          payment_status: "pending",
          payment_method: "razorpay",
          razorpay_order_id: resp.data.id,
          razorpay_payment_id: null,
        },
        () => {}
      );
    });

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
    orderIds,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  const ids = Array.isArray(orderIds)
    ? orderIds
    : orderId != null
    ? [orderId]
    : [];

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

  const newStatus = ok ? "paid" : "failed";
  ids.forEach((oid) => {
    orderModel.updateOrderPayment(
      oid,
      {
        payment_status: newStatus,
        payment_method: "razorpay",
        razorpay_order_id,
        razorpay_payment_id,
      },
      () => {}
    );
  });

  if (!ok) {
    return res.status(400).json({ error: "Payment signature verification failed" });
  }
  return res.json({ success: true, payment_status: "paid" });
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  isConfigured,
};
