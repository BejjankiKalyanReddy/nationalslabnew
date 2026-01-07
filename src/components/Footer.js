import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="footer-section">
            <div className="footer-brand">
              <div className="footer-logo">
                <img
                  src={"/nationals_2.png"}
                  alt="Home"
                  className="brand-icon"
                />
                {/* <span className="footer-icon">🏥</span> */}
                {/* <span className="footer-brand-name">HealthCall</span> */}
              </div>
              <p className="footer-description">
                Your trusted partner for comprehensive diagnostic services and
                health insurance solutions. We provide accurate, affordable, and
                convenient healthcare services.
              </p>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Services</h4>
            <ul className="footer-links">
              <li>
                <a href="/diagnostics">Diagnostic Tests</a>
              </li>
              <li>
                <a href="/insurance">Health Insurance</a>
              </li>
              <li>
                <a href="/home-collection">Home Collection</a>
              </li>
              <li>
                <a href="/lab-reports">Lab Reports</a>
              </li>
              <li>
                <a href="/consultation">Expert Consultation</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/about">About Us</a>
              </li>
              <li>
                <a href="/contact">Contact Us</a>
              </li>
              <li>
                <a href="/offers">Offers</a>
              </li>
              <li>
                <a href="/profile">Profile</a>
              </li>
            </ul>
          </div>

          <div className="footer-section" id="contact-section">
            <h4 className="footer-title">Contact Info</h4>
            <div className="contact-info">
              <div className="contact-item">
                <div>
                  <p>
                    <span className="contact-icon">📞</span> Phone
                  </p>
                  <a href="tel:+919492888989">+91 9492888989</a>
                </div>
              </div>
              <div className="contact-item">
                <div>
                  <p>
                    <span className="contact-icon">✉️</span> Email
                  </p>
                  <a href="mailto:nationalslabs@gmail.com">
                    nationalslabs@gmail.com
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <div>
                  <p>
                    <span className="contact-icon">📍</span> Address
                  </p>
                  <span>Visit our nearest diagnostic center</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media and Contact */}
        <div className="footer-social">
          <div className="social-links">
            <h4>Connect With Us</h4>
            <div className="social-icons">
              <a href="tel:+919492888989" className="social-link phone">
                <span className="social-icon">📞</span>
                <span>Call</span>
              </a>
              <a
                href="http://wa.me/919492888989"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link whatsapp"
              >
                <span className="social-icon">💬</span>
                <span>WhatsApp</span>
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=nationalslabs@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link email"
              >
                <span className="social-icon">✉️</span>
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2024 NationalsLab. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
