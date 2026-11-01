import React, { useState, useEffect } from "react";
import "./HomePage.css";
import logo from "../assests/dashboardlogo.png";
import heroBg from "../assests/Amruthero.png";
import phones from "../assests/phones.png";
import appstore from "../assests/appstore.png";
import googleplay from "../assests/googleplay.png";
import aboutImg from "../assests/ft.png";
import flowers from "../assests/flowers.png";
import flower from "../assests/Flower.png";
import cowflower from "../assests/cow & flower.png";
import SEOWrapper from "../components/SEOWrapper";
import RingLoader from "../components/common/RingLoader";

const faqData = [
  {
    question: "What makes Amrutkumar Govinddas LLP different from other jewelry retailers?",
    answer:
      "Our legacy of excellence in jewellery sets us apart. We combine traditional craftsmanship with timeless beauty, ensuring each piece reflects our commitment to quality and innovation.",
  },
  {
    question: "What types of jewelry do you specialize in?",
    answer:
      "We specialize in a wide range of gold jewelry including rings, necklaces, earrings, bracelets, chains, bangles, pendants, and anklets — each crafted with precision and attention to detail.",
  },
  {
    question: "How do you ensure the quality and authenticity of your jewelry?",
    answer:
      "We use only the finest materials and skilled craftsmen who follow traditional techniques. Every piece undergoes rigorous quality checks for authenticity, purity and durability.",
  },
  {
    question: "Do you offer custom jewelry design services?",
    answer:
      "Yes! Our skilled artisans work closely with you to bring your unique vision to life while maintaining our standards of excellence.",
  },
];

const CATEGORIES = [
  "Rings", "Necklaces", "Earrings", "Bracelets", "Chains",
  "Bangles", "Pendants", "Anklets", "Mangalsutra", "Nazariya",
];

const VALUES = [
  { k: "Our Motto", v: "A legacy of excellence in jewellery." },
  { k: "Vision", v: "To bring craftmanship and timeless beauty to people through jewellery." },
  { k: "Our Future", v: "Innovating brilliance, forever." },
  { k: "Join Our Journey", v: "Partner with us and together, let's create a sparkling future — one jewel at a time." },
];

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.goldapp.amrutkumargovinddasllp";
const APP_URL = "https://apps.apple.com/in/app/amrutkumar-govinddas-llp/id6754066073";

const HomePage = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeSection, setActiveSection] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const toggleFaq = (index) => setExpandedFaq(expandedFaq === index ? null : index);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "categories", "about", "faqs"];
      const pos = window.scrollY + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= pos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const navLink = (id, label) => (
    <li
      className={activeSection === id ? "active" : ""}
      onClick={() => scrollToSection(id)}
    >
      {label}
    </li>
  );

  return (
    <SEOWrapper pageUrl="/">
      {pageLoading && <RingLoader fullscreen label="Loading" />}

      <div className="hp">
        {/* gem symbol for category icons (defined first so <use> always resolves) */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <symbol id="hp-gem" viewBox="0 0 48 48">
            <defs>
              <linearGradient id="hp-gg" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0" stopColor="#E7D4B8" />
                <stop offset="1" stopColor="#B4824E" />
              </linearGradient>
            </defs>
            <path d="M24 3 44 18 24 45 4 18Z" fill="url(#hp-gg)" stroke="#FBEAD3" strokeWidth="1" strokeLinejoin="round" />
            <path d="M4 18h40M24 3 16 18l8 27 8-27-8-15M16 18l8 27M32 18l-8 27" stroke="#3A0519" strokeWidth=".9" opacity=".5" />
          </symbol>
        </svg>

        {/* Nav */}
        <nav className="hp-nav">
          <a className="hp-brand" href="#home" onClick={() => scrollToSection("home")}>
            <img src={logo} alt="Amrut Jewels" className="hp-logo" />
            <b>Amrut Jewels</b>
          </a>
          <button
            className={`hp-burger ${isMobileMenuOpen ? "open" : ""}`}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
          <ul className={`hp-menu ${isMobileMenuOpen ? "open" : ""}`}>
            {navLink("home", "Home")}
            {navLink("categories", "Categories")}
            {navLink("about", "About Us")}
            {navLink("faqs", "FAQs")}
            <li>
              <a className="hp-btn hp-btn-gold" href={PLAY_URL} target="_blank" rel="noopener noreferrer">
                Download app
              </a>
            </li>
          </ul>
        </nav>

        {/* Hero */}
        <header id="home" className="hp-hero">
          <div className="hp-wrap hp-hero__grid">
            <div className="hp-hero__text">
              <p className="hp-eyebrow">Amrutkumar Govinddas LLP</p>
              <h1>Elegance crafted <em>in gold</em>.</h1>
              <p className="hp-hero__desc">
                A legacy of excellence in jewellery — rings, necklaces, bangles and bridal sets,
                now available on our mobile app. Download to explore the full collection.
              </p>
              <div className="hp-hero__cta">
                <a className="hp-btn hp-btn-gold" href={PLAY_URL} target="_blank" rel="noopener noreferrer">Download the app</a>
                <a className="hp-btn hp-btn-ghost" href="#categories" onClick={() => scrollToSection("categories")}>Browse categories</a>
              </div>
            </div>
            <div className="hp-hero__art">
              <img src={heroBg} alt="Amrut Jewels" />
            </div>
          </div>
        </header>

        {/* Categories */}
        <section id="categories" className="hp-wrap hp-section">
          <div className="hp-shead">
            <span className="hp-eyebrow">Collections</span>
            <h2>Categories</h2>
            <p>Finely crafted gold jewellery for every occasion — explore the full range in the app.</p>
          </div>
          <div className="hp-cats">
            {CATEGORIES.map((c) => (
              <div className="hp-cat" key={c}>
                <svg className="hp-cat__ic" viewBox="0 0 48 48" aria-hidden="true"><use href="#hp-gem" /></svg>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="about" className="hp-about">
          <div className="hp-wrap hp-about__grid">
            <div className="hp-about__art">
              <img src={aboutImg} alt="Amrut Jewels craftsmanship" />
            </div>
            <div>
              <span className="hp-eyebrow">About us</span>
              <h2 className="hp-about__title">A legacy of excellence.</h2>
              <div className="hp-vals">
                {VALUES.map((val) => (
                  <div className="hp-val" key={val.k}>
                    <h4>{val.k}</h4>
                    <p>&ldquo;{val.v}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faqs" className="hp-wrap hp-section">
          <div className="hp-faq__grid">
            <div>
              <span className="hp-eyebrow">FAQs</span>
              <h2 className="hp-faq__title">We're here to answer all your questions.</h2>
              <p className="hp-faq__lead">
                Everything you need to know about partnering with us. Can't find what you're
                looking for? Reach out to our team anytime.
              </p>
            </div>
            <div className="hp-acc">
              {faqData.map((faq, index) => (
                <div className={`hp-q ${expandedFaq === index ? "open" : ""}`} key={index}>
                  <button type="button" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="hp-q__sign">+</span>
                  </button>
                  <div className="hp-q__a"><p>{faq.answer}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* App promo */}
        <section className="hp-wrap hp-section">
          <div className="hp-app">
            <div className="hp-app__text">
              <h2>Exclusively available on our app.</h2>
              <p>Browse the full catalogue, see today's gold rate and enquire about any piece — all from your phone.</p>
              <div className="hp-stores">
                <a href={APP_URL} target="_blank" rel="noopener noreferrer"><img src={appstore} alt="Download on the App Store" /></a>
                <a href={PLAY_URL} target="_blank" rel="noopener noreferrer"><img src={googleplay} alt="Get it on Google Play" /></a>
              </div>
            </div>
            <div className="hp-app__phones"><img src={phones} alt="Amrut Jewels app" /></div>
          </div>
        </section>

        {/* Footer */}
        <footer className="hp-footer">
          <img className="hp-deco hp-deco--flowers" src={flowers} alt="" aria-hidden="true" />
          <img className="hp-deco hp-deco--flower" src={flower} alt="" aria-hidden="true" />
          <img className="hp-deco hp-deco--cow" src={cowflower} alt="" aria-hidden="true" />
          <div className="hp-wrap hp-footer__grid">
            <div>
              <img src={logo} alt="Amrut Jewels" className="hp-footer__logo" />
              <div className="hp-footer__co">AMRUTKUMAR GOVINDDAS LLP</div>
              <p className="hp-footer__about">A legacy of excellence in jewellery, crafted with care.</p>
            </div>
            <div>
              <h4>Quick Links</h4>
              <a href="/">Home</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/delete">Delete Account</a>
              <a href="/contact">Contact Us</a>
            </div>
            <div>
              <h4>Contact</h4>
              <a href="tel:+919426783859">+91 94267 83859</a>
              <a href="mailto:amrutranpara109@gmail.com">amrutranpara109@gmail.com</a>
            </div>
            <div>
              <h4>Address</h4>
              <p className="hp-footer__about">Soni Bazar, Main Road,<br />Boghani Street Corner,<br />Rajkot - 360001</p>
            </div>
          </div>
          <div className="hp-wrap hp-footer__bar">
            © {new Date().getFullYear()} Amrutkumar Govinddas LLP. All rights reserved. · Made with ❤️ by{" "}
            <a href="https://finvera.solutions" target="_blank" rel="noopener noreferrer">Finvera Solutions</a>
          </div>
        </footer>

      </div>
    </SEOWrapper>
  );
};

export default HomePage;
