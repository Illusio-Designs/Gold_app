import React, { useState, useEffect } from 'react';
import './PrivacyPolicy.css';
import './HomePage.css';
import logo from "../assests/dashboardlogo.png";
import flower from "../assests/Flower.png";
import cowflower from "../assests/cow & flower.png";
import appstore from "../assests/appstore.png";
import googleplay from "../assests/googleplay.png";
import flowers from "../assests/flowers.png";
import phones from "../assests/phones.png";
import footerBg from "../assests/bgdesign.png";
import SEOWrapper from "../components/SEOWrapper";

const PrivacyPolicy = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Page loader effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SEOWrapper pageUrl="/privacy">
      <div className="privacy-policy">
        {pageLoading && (
          <div className="page-loader">
            <div className="page-loader-spinner"></div>
            <p className="page-loader-text">Loading...</p>
          </div>
        )}
        {/* Header */}
        <nav className="homepage-nav">
        <img src={logo} alt="Logo" className="homepage-logo" />
        <button 
          className="homepage-burger-menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
        </button>
        <ul className={`homepage-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li onClick={() => setIsMobileMenuOpen(false)}><a href="/">Home</a></li>
          <li className="active" onClick={() => setIsMobileMenuOpen(false)}><a href="/privacy">Privacy Policy</a></li>
          <li onClick={() => setIsMobileMenuOpen(false)}><a href="/delete">Delete Account</a></li>
        </ul>
      </nav>
      
      <main className="privacy-main">
        <div className="privacy-content">
          <h1>Privacy Policy</h1>
          <p>AmrutKumar Goviddas LLP we operates this application and is committed to protecting your privacy. We are transparent about how we collect, use, and protect your data in our Gold B2B dealership business.</p>

          <h2>1. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li><strong>Basic account details:</strong> Name, contact number, email address (if provided).</li>
            <li><strong>Business-related details:</strong> Dealer code, transaction records, invoices, or accounting data.</li>
            <li><strong>Usage data:</strong> Limited technical data such as app activity logs for internal management only.</li>
          </ul>
          
          <h2>2. Purpose of Data Collection</h2>
          <p>The data we collect is used only for:</p>
          <ul>
            <li>Managing dealer relationships under our Gold B2B dealership business.</li>
            <li>Accounting, record keeping, and business management.</li>
            <li>Improving app functionality and maintaining system security.</li>
          </ul>
          <p><strong>👉 We do not use your data for advertising, promotions, or marketing purposes.</strong></p>
          
          <h2>3. Data Retention and Deletion</h2>
          <ul>
            <li>If your account remains inactive for more than 3 months (90 days), your data will be permanently deleted within the following 90 days.</li>
            <li>You can also request manual deletion of your data anytime by contacting us.</li>
          </ul>
          
          <h2>4. Data Sharing</h2>
          <ul>
            <li>We do not sell, share, or disclose consumer information to any market or third party.</li>
            <li>Your information is strictly used for our business operations only.</li>
          </ul>
          
          <h2>5. Data Security</h2>
          <ul>
            <li>We implement appropriate security measures to safeguard your information.</li>
            <li>However, please note that no method of transmission or storage is 100% secure. We aim to protect your data but cannot guarantee absolute security.</li>
          </ul>
          
          <h2>6. User Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the data we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your data.</li>
          </ul>
          
          <h2>7. Third-Party Services</h2>
          <ul>
            <li>Our app does not share personal data with third-party advertisers.</li>
            <li>If we use any third-party services (e.g., payment gateway, analytics), they will follow their own privacy practices.</li>
          </ul>
          
          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Updates will be posted with a new Effective Date.</p>
          
          <h2>9. Contact Us</h2>
          <p>For questions or concerns regarding this Privacy Policy, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> amrutranpara109@gmail.com</li>
            <li><strong>Phone:</strong> 9426783859</li>
            <li><strong>Company Name:</strong> AmrutKumar Goviddas LLP</li>
          </ul>
        </div>
      </main>
      
       {/* Footer */}
       <section className="homepage-footer">
        <div className="homepage-app-promo-section">
          <div className="homepage-app-promo-content">
            <h2 className="homepage-app-promo-title">Exclusively available on our app</h2>
            <div className="homepage-app-store-buttons">
              <a
                href="https://apps.apple.com/in/app/amrutkumar-govinddas-llp/id6754066073"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={appstore} alt="Download on App Store" className="homepage-store-img" />
              </a>
              <a
                href="http://api.amrutkumargovinddasllp.com/uploads/app/app-release.apk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={googleplay} alt="Get it on Google Play" className="homepage-store-img" />
              </a>
            </div>
          </div>
          <div className="homepage-app-mockup">
            <img
              src={phones}
              alt="App Screenshots"
              className="homepage-phone-mockup"
            />
          </div>
        </div>
        <div className="homepage-decorative-flower homepage-flower-top">
            <img src={flowers} alt="Flower" className="homepage-flower-img" />
          </div>
        
        <div className="homepage-footer-main">
          <div className="homepage-footer-content">
            <div className="homepage-footer-left">
              <img src={logo} alt="Company Logo" className="homepage-footer-logo" />
              <h3 className="homepage-company-name">AMRUTKUMAR GOVINDDAS LLP</h3>
            </div>
            
            <div className="homepage-footer-center">
            <div className="homepage-footer-section">
                <h4>Quick Links</h4>
                <a href="/">Home</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/delete">Delete Account</a>
              </div>
              <div className="homepage-footer-section">
                <h4>Contact Us</h4>
                <a href="tel:+919426783859" className="homepage-contact-link">+91 94267 83859</a>
              </div>
              
             
            </div>
            
            <div className="homepage-footer-right">
              <div className="homepage-footer-section">
                <h4>Address</h4>
                <p>Soni Bazar, Main Road,</p>
                <p>Boghani Street Corner,</p>
                <p>Rajkot - 360001</p>
              </div>

              <div className="homepage-footer-section">
                <h4>Email</h4>
                <a href="mailto:amrutranpara109@gmail.com" className="homepage-contact-link">amrutranpara109@gmail.com</a>
              </div>
              
             
            </div>
          </div>
          
          <div className="homepage-decorative-elements">
            <div className="homepage-flower-bottom-left">
              <img src={flower} alt="Flower" className="homepage-flower-img-left" />
            </div>
            <div className="homepage-decorative-cow">
              <img src={cowflower} alt="Cow" className="homepage-cow-img" />
            </div>
          </div>
          <div className="homepage-footer-bg-pattern">
          <img
            src={footerBg}
            alt="Background Pattern"
            className="homepage-bg-design homepage-bg-design-left footer-bg-design"
          />
        </div>
        <div className="homepage-copyright">
          <p>© 2025. All Right Reserved. Design & Develop with ❤️ by - <a href="https://illusiodesigns.agency/" target="_blank" rel="noopener noreferrer" className="homepage-illusio">Illusio Designs</a></p>
        </div>
        </div>
      </section>
      </div>
    </SEOWrapper>
  );
};

export default PrivacyPolicy;

