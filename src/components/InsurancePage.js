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

      {/* Insurance Plans Section */}
      {/* <div className="plans-section">
        <h2 className="section-title">Choose Your Plan</h2>
        <div className="plans-grid">
          {insurancePlans.map((plan) => (
            <div 
              key={plan.id} 
              className={`plan-card ${plan.popular ? 'popular' : ''} ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">{plan.price}</div>
                <div className="plan-coverage">Coverage: {plan.coverage}</div>
              </div>

              <div className="plan-features">
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="plan-footer">
                <button 
                  className={`select-plan-btn ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanSelect(plan);
                  }}
                >
                  {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Quote Form Section */}
      {/* <div className="quote-section">
        <div className="quote-container">
          <h2 className="section-title">Get Your Quote</h2>
          <p className="section-description">
            Fill out the form below to get a personalized quote for your selected plan.
          </p>

          <form className="quote-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="age">Age *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="18"
                  max="65"
                  placeholder="Enter your age"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your city"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="familyMembers">Family Members</label>
                <select
                  id="familyMembers"
                  name="familyMembers"
                  value={formData.familyMembers}
                  onChange={handleInputChange}
                >
                  <option value="">Select number of family members</option>
                  <option value="1">1 (Individual)</option>
                  <option value="2">2 (Couple)</option>
                  <option value="3">3 (Couple + 1 Child)</option>
                  <option value="4">4 (Couple + 2 Children)</option>
                  <option value="5+">5+ (Extended Family)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="coverageAmount">Coverage Amount</label>
                <input
                  type="text"
                  id="coverageAmount"
                  name="coverageAmount"
                  value={formData.coverageAmount}
                  onChange={handleInputChange}
                  placeholder="Selected plan coverage"
                  readOnly
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Get Quote Now
              </button>
              <button type="button" className="consult-btn">
                Consult Expert
              </button>
            </div>
          </form>
        </div>
      </div> */}

      {/* Benefits Section */}
      {/* <div className="benefits-section">
        <h2 className="section-title">Why Choose Our Insurance?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">🛡️</div>
            <h4>Comprehensive Coverage</h4>
            <p>Complete protection for hospitalization, surgeries, and medical emergencies</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">💰</div>
            <h4>Affordable Premiums</h4>
            <p>Competitive pricing with flexible payment options</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🏥</div>
            <h4>Cashless Treatment</h4>
            <p>Access to network hospitals without upfront payments</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📞</div>
            <h4>24/7 Support</h4>
            <p>Round-the-clock customer support and claim assistance</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">⚡</div>
            <h4>Quick Claims</h4>
            <p>Fast and hassle-free claim processing</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🏆</div>
            <h4>Trusted Partner</h4>
            <p>Licensed insurance provider with excellent track record</p>
          </div>
        </div>
      </div> */}

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
