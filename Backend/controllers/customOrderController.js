const customOrderModel = require("../models/customOrder");
const { getBaseUrl } = require("../config/environment");

// Turn stored image filenames into full URLs the apps/dashboard can render.
function toImageUrls(images) {
  const list = Array.isArray(images) ? images : safeParse(images);
  return (list || []).map((name) =>
    typeof name === "string" && name.indexOf("http") === 0
      ? name
      : `${getBaseUrl()}/uploads/customorders/${encodeURIComponent(name)}`
  );
}

// Create a custom order from the app. Identity comes from the verified token
// (req.user.id). Design photos arrive as multipart files under "images".
function createCustomOrder(req, res) {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { weight, purity, quantity, delivery_date, remark } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one design photo is required" });
  }
  if (!weight) {
    return res.status(400).json({ error: "Weight is required" });
  }
  if (!delivery_date) {
    return res.status(400).json({ error: "Delivery date is required" });
  }

  const images = req.files.map((f) => f.filename);

  customOrderModel.createCustomOrder(
    {
      user_id: userId,
      images,
      weight,
      purity,
      quantity: quantity ? parseInt(quantity, 10) : 1,
      delivery_date,
      remark,
    },
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      customOrderModel.getById(result.insertId, (getErr, rows) => {
        if (getErr || !rows || rows.length === 0) {
          return res.status(201).json({
            message: "Custom order submitted",
            id: result.insertId,
          });
        }
        res.status(201).json({
          message: "Custom order submitted",
          customOrder: rows[0],
        });
      });
    }
  );
}

function getMyCustomOrders(req, res) {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  customOrderModel.getByUser(userId, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const parsed = (rows || []).map((r) => ({
      ...r,
      images: toImageUrls(r.images),
      order_type: r.order_type || "B2B Custom",
    }));
    res.json({ success: true, data: parsed });
  });
}

// Admin: list every custom order (with the business's details).
function getAllCustomOrders(req, res) {
  customOrderModel.getAll((err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const parsed = (rows || []).map((r) => ({
      ...r,
      images: toImageUrls(r.images),
      order_type: r.order_type || "B2B Custom",
    }));
    res.json({ success: true, data: parsed });
  });
}

// Admin: update a custom order's status.
function updateCustomOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  customOrderModel.updateStatus(id, status, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    res.json({ success: true, message: "Status updated" });
  });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return [];
  }
}

module.exports = {
  createCustomOrder,
  getMyCustomOrders,
  getAllCustomOrders,
  updateCustomOrderStatus,
};
