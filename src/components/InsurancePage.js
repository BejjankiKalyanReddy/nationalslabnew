import React, { useState } from "react";

const InsurancePage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    city: "",
    coverageAmount: "",
    familyMembers: "",
  });

  const insurancePlans = [
    {
      id: 1,
      name: "Basic Health Plan",
      price: "₹500/month",
      coverage: "₹2,00,000",
      features: [
        "Hospitalization coverage",
        "Emergency ambulance",
        "Pre & post hospitalization",
        "Day care procedures",
        "Cashless treatment",
      ],
      popular: false,
    },
    {
      id: 2,
      name: "Family Health Plan",
      price: "₹1,200/month",
      coverage: "₹5,00,000",
      features: [
        "Family coverage (up to 4 members)",
        "Maternity benefits",
        "Critical illness coverage",
        "Preventive health checkups",
        "24/7 helpline support",
        "Cashless treatment",
      ],
      popular: true,
    },
    {
      id: 3,
      name: "Premium Health Plan",
      price: "₹2,500/month",
      coverage: "₹10,00,000",
      features: [
        "Comprehensive coverage",
        "International treatment",
        "Alternative medicine coverage",
        "Mental health coverage",
        "Annual health checkups",
        "Priority customer support",
        "Cashless treatment",
      ],
      popular: false,
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData((prev) => ({
      ...prev,
      coverageAmount: plan.coverage,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      alert("Please select an insurance plan first");
      return;
    }
    alert(
      `Thank you for your interest in ${selectedPlan.name}! Our team will contact you soon.`
    );
  };

  const handleAdviceClick = () => {
    const contactSection = document.getElementById("contact-section");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = "/#contact-section";
    }
  };

  return (
    <div className="insurance-page">
      {/* Header Section */}
      <div className="insurance-header">
        <h1 className="page-title">Health Insurance Plans</h1>
        <p className="page-description">
          Protect your health and finances with our comprehensive insurance
          plans. Choose the perfect coverage for you and your family.
        </p>
      </div>

      <div className="insurance-trust-section">
        <p className="family-message">
          Your family is the best gift you can ever get. Gift them an insurance
          policy from
        </p>
        <div className="partner-logos">
          <div className="partner-card">
            <img src="/hdfc-ergo-logo.png" alt="HDFC ERGO logo" />
            <span className="partner-name">HDFC ERGO</span>
          </div>
          <div className="partner-card">
            <img src="/star-health-logo.png" alt="Star Health logo" />
            <span className="partner-name">Star Health Insurance</span>
          </div>
        </div>
        <button className="advice-btn" onClick={handleAdviceClick}>
          <span className="contact-icon">☎️ {"  "}</span>
          <a href="tel:+919492888989">Get Advice</a>
        </button>
        <p className="advice-note">
          Speak with our advisors for personalized recommendations.
        </p>
      </div>

      {/* Information Notice */}
      <div className="info-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <h4>Important Information</h4>
          <p>
            All insurance plans are subject to terms and conditions. Premiums
            may vary based on age, medical history, and other factors. Please
            read the policy document carefully before purchasing. Our team will
            assist you with the complete process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsurancePage;
