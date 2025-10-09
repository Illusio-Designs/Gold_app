import React, { useState } from 'react';
import './DeletePage.css';
import './HomePage.css';
import logo from "../assests/dashboardlogo.png";
import flower from "../assests/Flower.png";
import cowflower from "../assests/cow & flower.png";
import appstore from "../assests/appstore.png";
import googleplay from "../assests/googleplay.png";
import flowers from "../assests/flowers.png";
import phones from "../assests/phones.png";
import footerBg from "../assests/bgdesign.png";

const DeletePage = () => {
  const [formData, setFormData] = useState({
    userName: '',
    businessName: '',
    mobileNumber: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate form
    if (!formData.userName || !formData.businessName || !formData.mobileNumber) {
      alert('Please fill in all fields');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    
    // Simulate API call
    try {
      // Here you would make an actual API call to delete the account
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Account deletion request submitted successfully. You will receive a confirmation email shortly.');
      setShowConfirmation(false);
      setFormData({ userName: '', businessName: '', mobileNumber: '' });
    } catch (error) {
      alert('Error processing deletion request. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="delete-page">
      {/* Header */}
      <nav className="homepage-nav">
        <img src={logo} alt="Logo" className="homepage-logo" />
        <ul className="homepage-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/delete" className="active">Delete Account</a></li>
        </ul>
      </nav>
      
      <main className="delete-main">
        <div className="delete-content">
          <h1>Delete Account</h1>
          <p>If you wish to delete your account, please fill out the form below with your account details. We will process your request and permanently delete all associated data.</p>
          
          {!showConfirmation ? (
            <form onSubmit={handleSubmit} className="delete-form">
              <div className="form-group">
                <label htmlFor="userName">User Name *</label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="businessName">Business Name *</label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter your business name"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="mobileNumber">Mobile Number *</label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your mobile number"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-button">
                  Send
                </button>
              </div>
            </form>
          ) : (
            <div className="confirmation-popup">
              <div className="popup-content">
                <h2>⚠️ Confirm Account Deletion</h2>
                <p>Are you sure you want to delete the account for:</p>
                <div className="account-details">
                  <p><strong>User Name:</strong> {formData.userName}</p>
                  <p><strong>Business Name:</strong> {formData.businessName}</p>
                  <p><strong>Mobile Number:</strong> {formData.mobileNumber}</p>
                </div>
                <p className="warning-text">
                  This action cannot be undone. All data associated with this account will be permanently deleted.
                </p>
                
                <div className="confirmation-buttons">
                  <button 
                    className="confirm-delete-button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Processing...' : 'Yes, Delete Account'}
                  </button>
                  <button 
                    className="cancel-delete-button"
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
       {/* Footer */}
       <section className="homepage-footer">
        <div className="homepage-app-promo-section">
          <div className="homepage-app-promo-content">
            <h2 className="homepage-app-promo-title">Exclusively available on our app</h2>
            <div className="homepage-app-store-buttons">
              <img src={appstore} alt="Download on App Store" className="homepage-store-img" />
              <img src={googleplay} alt="Get it on Google Play" className="homepage-store-img" />
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
        </div>
      </section>
    </div>
  );
};

export default DeletePage;
