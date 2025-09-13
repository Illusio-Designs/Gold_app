const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderController');
const multer = require('multer');
const path = require('path');

// Multer config for slider images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/slider'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post('/', upload.single('image'), sliderController.createSlider);
router.get('/', sliderController.getSliders);
router.get('/:id', sliderController.getSliderById);
router.put('/:id', upload.single('image'), sliderController.updateSlider);
router.delete('/:id', sliderController.deleteSlider);

module.exports = router; 