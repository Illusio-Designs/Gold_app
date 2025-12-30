const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const uploadController = require("../controllers/uploadController");
const { upload } = require("../config/multerConfig");
const {
  verifyToken,
  requireAdmin,
  requireBusiness,
} = require("../middlewares/auth");

// Public routes
router.post("/register", upload.single("image"), async (req, res) => {
  if (req.file) {
    }
  userController.registerUser(req, res);
});
router.post("/admin/login", userController.adminLogin);
router.post("/business/login", userController.businessLogin);
router.post("/check-exists", userController.checkUserExists);
router.post("/verify-otp", userController.verifyBusinessOTP);

// Protected routes
router.get("/", verifyToken, requireAdmin, userController.getAllUsers);
// COMMENTED OUT - Session management removed (no sessions needed)
// router.get(
//   "/validate-session",
//   verifyToken,
//   userController.validateUserSession
// );
// router.post("/logout", verifyToken, userController.logoutUser);
router.post(
  "/upload-profile",
  verifyToken,
  upload.single("image"),
  uploadController.uploadProfileImage
);
router.patch(
  "/:userId/status",
  verifyToken,
  requireAdmin,
  userController.updateUserStatus
);
router.get("/:id", verifyToken, userController.getUserById);
router.post(
  "/",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  userController.createUser
);
router.put(
  "/:id",
  verifyToken,
  upload.single("image"),
  userController.updateUser
);
router.delete("/:id", verifyToken, requireAdmin, userController.deleteUser);

module.exports = router;
