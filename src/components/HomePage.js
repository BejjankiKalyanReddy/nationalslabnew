import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to HealthCall</h1>
          <p className="hero-subtitle">
            Your trusted partner for comprehensive diagnostic services and
            health insurance solutions
          </p>
          <div className="hero-buttons">
            <button
              className="btn-primary"
              onClick={() => handleNavigation("/diagnostics")}
            >
              Book Diagnostic Test
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleNavigation("/insurance")}
            >
              Get Insurance Quote
            </button>
          </div>
        </div>
        <div className="hero-image">
          {/* <div className="healthcare-icon">🏥</div> */}
          <img
            src={"/Bg_NationalsLab.webp"}
            alt="Home"
            className="healthcare-icon"
          />
        </div>
      </div>

      {/* Services Section */}
      <div className="services-section">
        <h2 className="section-title">Our Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">🔬</div>
            <h3>Diagnostic Tests</h3>
            <p>
              Comprehensive range of medical tests with accurate results and
              competitive pricing
            </p>
            <ul>
              <li>Blood Tests</li>
              <li>Urine Analysis</li>
              <li>Thyroid Profile</li>
              <li>Diabetes Screening</li>
            </ul>
            <button
              className="service-btn"
              onClick={() => handleNavigation("/diagnostics")}
            >
              View Tests
            </button>
          </div>
          <div className="service-card">
            <div className="service-icon">🛡️</div>
            <h3>Health Insurance</h3>
            <p>
              Protect your health and finances with our comprehensive insurance
              plans
            </p>
            <ul>
              <li>Individual Plans</li>
              <li>Family Coverage</li>
              <li>Critical Illness</li>
              <li>Cashless Treatment</li>
            </ul>
            <button
              className="service-btn"
              onClick={() => handleNavigation("/insurance")}
            >
              Get Quote
            </button>
          </div>
          <div className="service-card">
            <div className="service-icon">📱</div>
            <h3>Online Booking</h3>
            <p>
              Convenient online platform for easy test booking and report access
            </p>
            <ul>
              <li>24/7 Booking</li>
              <li>Home Collection</li>
              <li>Digital Reports</li>
              <li>Expert Consultation</li>
            </ul>
            <button
              className="service-btn"
              onClick={() => handleNavigation("/diagnostics")}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">Why Choose HealthCall?</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <h4>Fast Results</h4>
            <p>
              Get your test results quickly with our efficient processing system
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💰</div>
            <h4>Affordable Prices</h4>
            <p>Competitive pricing with special discounts and offers</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🏆</div>
            <h4>Quality Assurance</h4>
            <p>NABL accredited labs with certified technicians</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🚚</div>
            <h4>Home Collection</h4>
            <p>Convenient home sample collection service</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2>Ready to Take Control of Your Health?</h2>
        <p>Book your diagnostic test today or get a health insurance quote</p>
        <div className="cta-buttons">
          <button
            className="btn-primary"
            onClick={() => handleNavigation("/diagnostics")}
          >
            Book Now
          </button>
          <button
            className="btn-outline"
            onClick={() => handleNavigation("/insurance")}
          >
            Get Insurance Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
