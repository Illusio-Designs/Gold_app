import React, { useState, useEffect } from "react";
import "./HomePage.css";
import "./PublicShell.css";
import logo from "../assests/dashboardlogo.png";
import appstore from "../assests/appstore.png";
import googleplay from "../assests/googleplay.png";
import phones from "../assests/phones.png";
import flowers from "../assests/flowers.png";
import flower from "../assests/Flower.png";
import cowflower from "../assests/cow & flower.png";
import RingLoader from "../components/common/RingLoader";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.goldapp.amrutkumargovinddasllp";
const APP_URL = "https://apps.apple.com/in/app/amrutkumar-govinddas-llp/id6754066073";

/**
 * Shared chrome for the public sub-pages (Privacy / Delete / Contact):
 * brand nav, a slim maroon page header, the page content, and the footer —
 * matching the home page design. `active` highlights a nav link.
 */
const PublicShell = ({ title, subtitle, active, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="hp">
      {loading && <RingLoader fullscreen label="Loading" />}

      {/* Nav */}
      <nav className="hp-nav">
        <a className="hp-brand" href="/">
          <img src={logo} alt="Amrut Jewels" className="hp-logo" />
          <b>Amrut Jewels</b>
        </a>
        <button
          className={`hp-burger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
        <ul className={`hp-menu ${menuOpen ? "open" : ""}`}>
          <li className={active === "home" ? "active" : ""}><a href="/">Home</a></li>
          <li><a href="/#categories">Categories</a></li>
          <li><a href="/#about">About Us</a></li>
          <li><a href="/#faqs">FAQs</a></li>
          <li className={active === "contact" ? "active" : ""}><a href="/contact">Contact Us</a></li>
          <li><a className="hp-btn hp-btn-gold" href={PLAY_URL} target="_blank" rel="noopener noreferrer">Download app</a></li>
        </ul>
      </nav>

      {/* Page header */}
      <header className="pub-head">
        <div className="hp-wrap">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      {/* Content */}
      <main className="pub-main">
        <div className="hp-wrap">{children}</div>
      </main>

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
  );
};

export default PublicShell;
