import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSEOByPageUrl } from '../services/seoService';

const SEOWrapper = ({ children, pageUrl }) => {
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        setLoading(true);
        console.log(`🔍 [SEO] Fetching SEO data for: ${pageUrl}`);
        const data = await getSEOByPageUrl(pageUrl);
        console.log('✅ [SEO] SEO data loaded:', data);
        setSeoData(data);
      } catch (error) {
        console.error('❌ [SEO] Error loading SEO data:', error);
        // Set default SEO data if API fails
        setSeoData({
          page_title: 'AmrutKumar Govinddas LLP',
          meta_description: 'Gold jewelry and ornaments',
          focus_keyword: 'gold jewelry',
          canonical_url: `https://amrutkumargovinddasllp.com${pageUrl}`,
          image_alt_tags: 'AmrutKumar Govinddas LLP'
        });
      } finally {
        setLoading(false);
      }
    };

    if (pageUrl) {
      fetchSEOData();
    }
  }, [pageUrl]);

  if (loading) {
    return <>{children}</>;
  }

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{seoData?.page_title || 'AmrutKumar Govinddas LLP'}</title>
        <meta name="title" content={seoData?.page_title || 'AmrutKumar Govinddas LLP'} />
        <meta 
          name="description" 
          content={seoData?.meta_description || 'Gold jewelry and ornaments'} 
        />
        <meta 
          name="keywords" 
          content={seoData?.focus_keyword || 'gold jewelry'} 
        />

        {/* Canonical URL */}
        {seoData?.canonical_url && (
          <link rel="canonical" href={seoData.canonical_url} />
        )}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seoData?.canonical_url || `https://amrutkumargovinddasllp.com${pageUrl}`} />
        <meta property="og:title" content={seoData?.page_title || 'AmrutKumar Govinddas LLP'} />
        <meta 
          property="og:description" 
          content={seoData?.meta_description || 'Gold jewelry and ornaments'} 
        />
        {seoData?.image_alt_tags && (
          <meta property="og:image" content={seoData.image_alt_tags} />
        )}

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={seoData?.canonical_url || `https://amrutkumargovinddasllp.com${pageUrl}`} />
        <meta property="twitter:title" content={seoData?.page_title || 'AmrutKumar Govinddas LLP'} />
        <meta 
          property="twitter:description" 
          content={seoData?.meta_description || 'Gold jewelry and ornaments'} 
        />
        {seoData?.image_alt_tags && (
          <meta property="twitter:image" content={seoData.image_alt_tags} />
        )}

        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="author" content="AmrutKumar Govinddas LLP" />
      </Helmet>
      {children}
    </>
  );
};

export default SEOWrapper;

