import React, { useState, useEffect } from "react";
import "./HomePage.css";
import logo from "../assests/dashboardlogo.png";
import heroBg from "../assests/Amruthero.png";
import designBg from "../assests/designbg.png";
import bg1 from "../assests/bg1.png";
import flowers from "../assests/flowers.png";
import phones from "../assests/phones.png";
import appstore from "../assests/appstore.png";
import googleplay from "../assests/googleplay.png";
import aboutImg from "../assests/ft.png";
import footerBg from "../assests/bgdesign.png";
import flower from "../assests/Flower.png";
import cowflower from "../assests/cow & flower.png";
import SEOWrapper from "../components/SEOWrapper";

const faqData = [
  {
    question: "What makes Amrutkumar Govinddas LLP different from other jewelry retailers?",
    answer: "Our legacy of excellence in jewellery sets us apart. We combine traditional craftmanship with timeless beauty, ensuring each piece reflects our commitment to quality and innovation. Our vision is to bring exceptional jewelry to people through dedicated craftsmanship and personalized service."
  },
  {
    question: "What types of jewelry do you specialize in?",
    answer: "We specialize in a wide range of gold jewelry including rings, necklaces, earrings, bracelets, chains, bangles, pendants, and anklets. Each piece is crafted with precision and attention to detail, representing our commitment to timeless beauty and excellence."
  },
  {
    question: "How do you ensure the quality and authenticity of your jewelry?",
    answer: "Quality is at the heart of our legacy of excellence. We use only the finest materials and employ skilled craftsmen who follow traditional techniques. Every piece undergoes rigorous quality checks to ensure authenticity, purity, and durability that meets our high standards."
  },
  {
    question: "Do you offer custom jewelry design services?",
    answer: "Yes! As part of our vision to bring craftmanship and timeless beauty to people, we offer custom design services. Partner with us to create a sparkling future, one jewel at a time. Our skilled artisans work closely with you to bring your unique vision to life while maintaining our standards of excellence."
  }
];

// Predefined categories shown on the homepage — static names, no API, no images.
const PREDEFINED_CATEGORIES = [
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Chains",
  "Bangles",
  "Pendants",
  "Anklets",
  "Mangalsutra",
  "Nazariya",
];

const HomePage = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Track scroll position to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'categories', 'about', 'faqs'];
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Page loader effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SEOWrapper pageUrl="/">
      <div className="homepage-root">
        {pageLoading && (
          <div className="page-loader">
            <div className="page-loader-spinner"></div>
            <p className="page-loader-text">Loading...</p>
          </div>
        )}
        <section id="home" className="homepage-hero-section">
        <div className="homepage-hero-bg-pattern">
          <img
            src={designBg}
            alt=""
            className="homepage-bg-design homepage-bg-design-left"
          />
          <img
            src={designBg}
            alt=""
            className="homepage-bg-design homepage-bg-design-right"
          />
        </div>
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
            <li 
              className={activeSection === 'home' ? 'active' : ''} 
              onClick={() => {
                scrollToSection('home');
                setIsMobileMenuOpen(false);
              }}
            >
              Home
            </li>
            <li 
              className={activeSection === 'categories' ? 'active' : ''} 
              onClick={() => {
                scrollToSection('categories');
                setIsMobileMenuOpen(false);
              }}
            >
              Categories
            </li>
            <li 
              className={activeSection === 'about' ? 'active' : ''} 
              onClick={() => {
                scrollToSection('about');
                setIsMobileMenuOpen(false);
              }}
            >
              About Us
            </li>
            <li
              className={activeSection === 'faqs' ? 'active' : ''}
              onClick={() => {
                scrollToSection('faqs');
                setIsMobileMenuOpen(false);
              }}
            >
              FAQs
            </li>
            <li onClick={() => setIsMobileMenuOpen(false)}>
              <a href="/contact">Contact Us</a>
            </li>
          </ul>
        </nav>
        <div className="homepage-hero-content">
          <div className="homepage-hero-text">
            <h1>
              Elegance Crafted
              <br />
              in Gold
            </h1>
          </div>
          <div className="homepage-hero-bg">
            <img
              src={heroBg}
              alt="Hero Background"
              className="homepage-hero-bg-img"
            />
          </div>
          <div className="homepage-hero-text-small">
            <p className="homepage-hero-desc">
              Now available on our mobile app
              <br />
              Download now to explore more.
            </p>
            <a
              className="homepage-download-btn"
              href="https://play.google.com/store/apps/details?id=com.goldapp.amrutkumargovinddasllp"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          </div>
        </div>
      </section>
      <section id="categories" className="homepage-categories-section">
        <h2 className="homepage-categories-title">Categories</h2>
        <div className="homepage-categories-container">
          <div className="homepage-categories-shadow-left"></div>
          <div className="homepage-categories-shadow-right"></div>
          <div className="homepage-categories-list">
            {PREDEFINED_CATEGORIES.map((name) => (
              <div className="homepage-category-card homepage-category-card--text" key={name}>
                <span className="homepage-category-label">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
       <div className="homepage-about-container">
         <section id="about" className="homepage-about">
           <h2 className="homepage-about-title">About Us</h2>
           <div className="homepage-about-content">
             <div className="homepage-about-gallery">
               <div className="homepage-about-gallery-frame">
                 <img src={bg1} alt="" className="homepage-about-bg-pattern" />
                 <div className="homepage-about-photos">
                   <div className="homepage-about-photo-item">
                     <img src={aboutImg} alt="Team Member" className="homepage-about-photo" />
                   </div>
                 </div>
               </div>
             </div>
             <div className="homepage-about-text">
               <div className="homepage-about-section">
                 <h3 className="homepage-about-section-title">Our Motto:</h3>
                 <p>"A legacy of excellence in jewellery."</p>
               </div>
               
               <div className="homepage-about-section">
                 <h3 className="homepage-about-section-title">Vision:</h3>
                 <p>"To bring craftmanship and timeless beauty to people through jewellery."</p>
               </div>
               
               <div className="homepage-about-section">
                 <h3 className="homepage-about-section-title">Our Future:</h3>
                 <p>"Innovating Brilliance, forever"</p>
               </div>
               
               <div className="homepage-about-section">
                 <h3 className="homepage-about-section-title">Join Our Journey:</h3>
                 <p>"Partner with us and together, let's create a sparkling future, one jewel at a time."</p>
               </div>
             </div>
           </div>
         </section>
       </div>
      <section id="faqs" className="homepage-faq">
        <div className="homepage-faq-container">
          <div className="homepage-faq-left">
            <h2 className="homepage-faq-title">We're here to answer all your questions.</h2>
            <p className="homepage-faq-subtitle">
              Everything you need to know about partnering with us. Can't find what you're looking for? Reach out to our team anytime.
            </p>
          </div>
          <div className="homepage-faq-right">
            {faqData.map((faq, index) => (
              <div key={index} className={`homepage-faq-item ${expandedFaq === index ? 'expanded' : ''}`}>
                <div 
                  className="homepage-faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <span className={`homepage-faq-icon ${expandedFaq === index ? 'expanded' : ''}`}>
                    {expandedFaq === index ? '×' : '+'}
                  </span>
                </div>
                {expandedFaq === index && (
                  <div className="homepage-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
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
            <img
              src={phones}
              alt="App Screenshots"
              className="homepage-phone-mockup"
            />
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

export default HomePage;