import React from "react";
import PublicShell from "./PublicShell";
import SEOWrapper from "../components/SEOWrapper";

const ContactUs = () => (
  <SEOWrapper pageUrl="/contact">
    <PublicShell
      title="Contact us"
      subtitle="We'd love to hear from you. Reach out through any of the channels below and our team will be happy to help."
      active="contact"
    >
      <div className="pub-contact">
        <a
          className="pub-ccard"
          href="https://maps.google.com/?q=Soni+Bazar+Main+Road+Boghani+Street+Corner+Rajkot+360001"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="pub-ccard__ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <h3>Visit Us</h3>
          <p>Soni Bazar, Main Road,<br />Boghani Street Corner,<br />Rajkot - 360001, Gujarat</p>
        </a>

        <a className="pub-ccard" href="tel:+919426783859">
          <span className="pub-ccard__ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <h3>Call Us</h3>
          <p>+91 94267 83859</p>
        </a>

        <a className="pub-ccard" href="mailto:amrutranpara109@gmail.com">
          <span className="pub-ccard__ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <h3>Email Us</h3>
          <p>amrutranpara109@gmail.com</p>
        </a>
      </div>
    </PublicShell>
  </SEOWrapper>
);

export default ContactUs;
