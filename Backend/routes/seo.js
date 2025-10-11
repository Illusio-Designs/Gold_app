// SEO Routes - Public routes for SEO data
const express = require('express');
const router = express.Router();
const { getSEOByPageUrl } = require('../controllers/seoController');

// GET /api/seo?page_url=/privacy-policy
// Public route - no authentication required
router.get('/', getSEOByPageUrl);

module.exports = router;

