import React, { useState, useEffect } from 'react';
import './ContactUs.css';
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

const ContactUs = () => {
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
    <SEOWrapper pageUrl="/contact">
      <div className="contact-page">
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
            <li onClick={() => setIsMobileMenuOpen(false)}><a href="/privacy">Privacy Policy</a></li>
            <li onClick={() => setIsMobileMenuOpen(false)}><a href="/delete">Delete Account</a></li>
            <li className="active" onClick={() => setIsMobileMenuOpen(false)}><a href="/contact">Contact Us</a></li>
          </ul>
        </nav>

        <main className="contact-main">
          <div className="contact-content">
            <h1>Contact Us</h1>
            <p className="contact-intro">
              We'd love to hear from you. Reach out to Amrutkumar Govinddas LLP
              through any of the channels below and our team will be happy to help.
            </p>

            <div className="contact-cards">
              {/* Address */}
              <a
                className="contact-card"
                href="https://maps.google.com/?q=Soni+Bazar+Main+Road+Boghani+Street+Corner+Rajkot+360001"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <h3>Visit Us</h3>
                <p>Soni Bazar, Main Road,<br />Boghani Street Corner,<br />Rajkot - 360001, Gujarat</p>
              </a>

              {/* Phone */}
              <a className="contact-card" href="tel:+919426783859">
                <span className="contact-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <h3>Call Us</h3>
                <p>+91 94267 83859</p>
              </a>

              {/* Email */}
              <a className="contact-card" href="mailto:amrutranpara109@gmail.com">
                <span className="contact-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <h3>Email Us</h3>
                <p>amrutranpara109@gmail.com</p>
              </a>
            </div>
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
                  href="https://play.google.com/store/apps/details?id=com.goldapp.amrutkumargovinddasllp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={googleplay} alt="Get it on Google Play" className="homepage-store-img" />
                </a>
              </div>
            </div>
            <div className="homepage-app-mockup">
              <img src={phones} alt="App Screenshots" className="homepage-phone-mockup" />
            </div>
          </div>
          <div className="homepage-decorative-flower homepage-flower-top">
            <img src={flowers} alt="" className="homepage-flower-img" />
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
                  <a href="/contact">Contact Us</a>
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
                <img src={flower} alt="" className="homepage-flower-img-left" />
              </div>
              <div className="homepage-decorative-cow">
                <img src={cowflower} alt="" className="homepage-cow-img" />
              </div>
            </div>
            <div className="homepage-footer-bg-pattern">
              <img
                src={footerBg}
                alt=""
                className="homepage-bg-design homepage-bg-design-left footer-bg-design"
              />
            </div>
            <div className="homepage-copyright">
              <p>© {new Date().getFullYear()}. All Rights Reserved. Made with ❤️ by <a href="https://finvera.solutions" target="_blank" rel="noopener noreferrer" className="homepage-illusio">Finvera Solutions</a></p>
            </div>
          </div>
        </section>
      </div>
    </SEOWrapper>
  );
};

export default ContactUs;
