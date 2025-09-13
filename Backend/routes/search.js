const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Search all (categories and products)
router.get('/all', searchController.searchAll);

// Search only categories
router.get('/categories', searchController.searchCategories);

// Search only products
router.get('/products', searchController.searchProducts);

module.exports = router;
