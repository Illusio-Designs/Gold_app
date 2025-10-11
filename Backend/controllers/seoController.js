// SEO Controller - Returns hardcoded SEO data based on page URL
// No database table needed - SEO data is returned directly

const getSEOByPageUrl = (req, res) => {
  try {
    const { page_url } = req.query;

    console.log(`🔍 [SEO] Fetching SEO data for: ${page_url}`);

    // Hardcoded SEO data for each page
    const seoDataMap = {
      '/': {
        id: 1,
        page_url: '/',
        page_title: 'AmrutKumar Govinddas LLP - Premium Gold Jewelry',
        meta_description: 'Discover exquisite gold jewelry crafted with precision and elegance. AmrutKumar Govinddas LLP offers rings, necklaces, earrings, bracelets, chains, bangles, pendants, and anklets.',
        focus_keyword: 'gold jewelry, premium gold, amrutkumar govinddas',
        canonical_url: 'https://amrutkumargovinddasllp.com/',
        image_alt_tags: 'AmrutKumar Govinddas LLP - Gold Jewelry Collection',
        last_updated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      '/privacy': {
        id: 2,
        page_url: '/privacy',
        page_title: 'Privacy Policy - AmrutKumar Govinddas LLP',
        meta_description: 'Privacy Policy for AmrutKumar Govinddas LLP. Learn how we collect, use, and protect your personal information in our Gold B2B dealership business.',
        focus_keyword: 'privacy policy, data protection, amrutkumar govinddas privacy',
        canonical_url: 'https://amrutkumargovinddasllp.com/privacy',
        image_alt_tags: 'Privacy Policy - AmrutKumar Govinddas LLP',
        last_updated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      '/delete': {
        id: 3,
        page_url: '/delete',
        page_title: 'Delete Account - AmrutKumar Govinddas LLP',
        meta_description: 'Request to delete your account from AmrutKumar Govinddas LLP. Fill out the form to permanently delete all associated data.',
        focus_keyword: 'delete account, account deletion, remove account',
        canonical_url: 'https://amrutkumargovinddasllp.com/delete',
        image_alt_tags: 'Delete Account - AmrutKumar Govinddas LLP',
        last_updated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      '/privacy-policy': {
        id: 4,
        page_url: '/privacy-policy',
        page_title: 'Privacy Policy - AmrutKumar Govinddas LLP',
        meta_description: 'Privacy Policy for AmrutKumar Govinddas LLP website. Learn about our data collection, usage, and protection practices.',
        focus_keyword: 'Privacy Policy',
        canonical_url: 'https://amrutkumargovinddasllp.com/privacy-policy',
        image_alt_tags: 'Privacy Policy',
        last_updated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    // Get SEO data for the requested page
    const seoData = seoDataMap[page_url];

    if (!seoData) {
      // Return default SEO data if page not found
      console.log(`⚠️ [SEO] No SEO data found for: ${page_url}, returning default`);
      return res.status(200).json({
        id: 0,
        page_url: page_url,
        page_title: 'AmrutKumar Govinddas LLP',
        meta_description: 'Premium gold jewelry and ornaments',
        focus_keyword: 'gold jewelry',
        canonical_url: `https://amrutkumargovinddasllp.com${page_url}`,
        image_alt_tags: 'AmrutKumar Govinddas LLP',
        last_updated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`✅ [SEO] Returning SEO data for: ${page_url}`);
    return res.status(200).json(seoData);

  } catch (error) {
    console.error('❌ [SEO] Error fetching SEO data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching SEO data',
      error: error.message
    });
  }
};

module.exports = {
  getSEOByPageUrl
};

