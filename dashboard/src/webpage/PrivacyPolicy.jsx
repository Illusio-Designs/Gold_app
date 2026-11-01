import React from "react";
import PublicShell from "./PublicShell";
import SEOWrapper from "../components/SEOWrapper";

const PrivacyPolicy = () => (
  <SEOWrapper pageUrl="/privacy">
    <PublicShell
      title="Privacy Policy"
      subtitle="How Amrutkumar Govinddas LLP collects, uses and protects your data."
    >
      <div className="pub-prose">
        <p className="pub-updated">Last Updated: July 2026</p>
        <p>
          Amrutkumar Govinddas LLP operates this application and is committed to
          protecting your privacy. We are transparent about how we collect, use, and
          protect your data in our Gold B2B dealership business.
        </p>

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
        <p className="pub-note"><strong>We do not use your data for advertising, promotions, or marketing purposes.</strong></p>

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
          <li><strong>Phone:</strong> +91 94267 83859</li>
          <li><strong>Company Name:</strong> Amrutkumar Govinddas LLP</li>
        </ul>
      </div>
    </PublicShell>
  </SEOWrapper>
);

export default PrivacyPolicy;
