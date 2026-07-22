const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderController');
const multer = require('multer');
const path = require('path');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// Multer config for slider images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/slider'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize filename: replace spaces and special characters
    const sanitizedName = file.originalname
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/[^\w\-_.]/g, '');  // Remove special characters except dash, underscore, and dot
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});
const upload = multer({ storage });

router.post('/', verifyToken, requireAdmin, upload.single('image'), sliderController.createSlider);
router.get('/', sliderController.getSliders);
router.get('/:id', sliderController.getSliderById);
router.put('/:id', verifyToken, requireAdmin, upload.single('image'), sliderController.updateSlider);
router.delete('/:id', verifyToken, requireAdmin, sliderController.deleteSlider);

module.exports = router; 