const express = require("express");
const router = express.Router();
const customOrderController = require("../controllers/customOrderController");
const orderController = require("../controllers/orderController");
const { bulkUpload } = require("../config/multerConfig");
const { verifyToken } = require("../middlewares/auth");

// All custom-order routes require authentication.
router.use(verifyToken);

// Create a custom order — approved businesses only (same rule as regular
// orders). Up to 6 design photos under the "images" field.
router.post(
  "/",
  orderController.requireApprovedBusiness,
  bulkUpload.array("images", 6),
  customOrderController.createCustomOrder
);

// The signed-in user's own custom orders.
router.get("/my", customOrderController.getMyCustomOrders);

module.exports = router;
