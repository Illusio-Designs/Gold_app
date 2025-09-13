const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const appIconController = require("../controllers/appIconController");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// Configure multer for icon uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/app-icons/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "icon-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Public routes (no authentication required)
router.get("/current/:platform", appIconController.getCurrentAppIcon);
router.get("/current/:platform/:type", appIconController.getCurrentAppIcon);
router.get("/active/:platform", appIconController.getActiveAppIcons);

// Protected routes (require admin authentication)
router.post("/", verifyToken, requireAdmin, upload.single("icon_file"), appIconController.createAppIcon);
router.get("/", verifyToken, requireAdmin, appIconController.getAllAppIcons);
router.get("/stats", verifyToken, requireAdmin, appIconController.getIconStats);
router.get("/:id", verifyToken, requireAdmin, appIconController.getAppIconById);
router.put("/:id", verifyToken, requireAdmin, upload.single("icon_file"), appIconController.updateAppIcon);
router.delete("/:id", verifyToken, requireAdmin, appIconController.deleteAppIcon);
router.patch("/:id/activate", verifyToken, requireAdmin, appIconController.activateAppIcon);

module.exports = router; 