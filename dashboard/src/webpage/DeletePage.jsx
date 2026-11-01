import React, { useState } from "react";
import PublicShell from "./PublicShell";
import SEOWrapper from "../components/SEOWrapper";
import { submitAccountDeletionRequest } from "../services/publicApiService";

const DeletePage = () => {
  const [formData, setFormData] = useState({
    userName: "",
    businessName: "",
    mobileNumber: "",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.userName || !formData.businessName || !formData.mobileNumber) {
      alert("Please fill in all fields");
      return;
    }
    const mobileDigits = formData.mobileNumber.replace(/[\s+-]/g, "");
    if (!/^\d{10,13}$/.test(mobileDigits)) {
      alert("Please enter a valid mobile number");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await submitAccountDeletionRequest({
        user_name: formData.userName,
        business_name: formData.businessName,
        mobile_number: formData.mobileNumber,
      });
      alert("Your account deletion request has been submitted. Our team will review and process it shortly.");
      setShowConfirmation(false);
      setFormData({ userName: "", businessName: "", mobileNumber: "" });
    } catch (error) {
      const msg = error?.response?.data?.error || "Error processing deletion request. Please try again later.";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => setShowConfirmation(false);

  return (
    <SEOWrapper pageUrl="/delete">
      <PublicShell
        title="Delete your account"
        subtitle="Submit your details and our team will permanently delete your account and all associated data."
      >
        <div className="pub-card">
          {!showConfirmation ? (
            <form onSubmit={handleSubmit}>
              <p className="pub-lead">
                Fill out the form below with your account details. We will review your
                request and permanently delete all associated data.
              </p>

              <div className="pub-field">
                <label htmlFor="userName">User Name *</label>
                <input type="text" id="userName" name="userName" value={formData.userName} onChange={handleInputChange} placeholder="Enter your full name" required />
              </div>
              <div className="pub-field">
                <label htmlFor="businessName">Business Name *</label>
                <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="Enter your business name" required />
              </div>
              <div className="pub-field">
                <label htmlFor="mobileNumber">Mobile Number *</label>
                <input type="tel" id="mobileNumber" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} placeholder="Enter your mobile number" required />
              </div>

              <button type="submit" className="pub-submit">Send request</button>
            </form>
          ) : (
            <div>
              <h2 style={{ fontFamily: "var(--hp-fd)", color: "var(--hp-maroon)", margin: "0 0 10px", fontSize: 22 }}>
                Confirm account deletion
              </h2>
              <p className="pub-lead" style={{ marginBottom: 12 }}>Are you sure you want to delete the account for:</p>
              <div className="pub-confirm">
                <p><strong>User Name:</strong> {formData.userName}</p>
                <p><strong>Business Name:</strong> {formData.businessName}</p>
                <p><strong>Mobile Number:</strong> {formData.mobileNumber}</p>
              </div>
              <p className="pub-warn">This action cannot be undone. All data associated with this account will be permanently deleted.</p>
              <div className="pub-btn-row">
                <button className="pub-submit pub-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                  {isDeleting ? "Processing…" : "Yes, delete account"}
                </button>
                <button className="pub-submit pub-cancel" onClick={handleCancelDelete} disabled={isDeleting}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </PublicShell>
    </SEOWrapper>
  );
};

export default DeletePage;
