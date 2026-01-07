import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {/* <div className="brand-icon">🏥</div> */}
        <img src={"/nationals_2.png"} alt="Home" className="brand-icon" />
        {/* <span className="brand-name">HealthCall</span> */}
      </div>

      <div className={`navbar-menu ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <ul className="nav-links">
          <li className="nav-item" onClick={() => handleNavigation("/")}>
            <span className="nav-icon">🏠</span>
            Home
          </li>
          <li
            className="nav-item"
            onClick={() => handleNavigation("/diagnostics")}
          >
            <span className="nav-icon">🔬</span>
            Diagnostics
          </li>
          <li
            className="nav-item"
            onClick={() => handleNavigation("/insurance")}
          >
            <span className="nav-icon">🛡️</span>
            Insurance
          </li>
          {/* <li className="nav-item">
            <span className="nav-icon">🎁</span>
            Offers
          </li> */}
          <li className="nav-item">
            <span className="nav-icon">📞</span>
            Contact Us
          </li>
          <li className="nav-item">
            <span className="nav-icon">👤</span>
            Profile
          </li>
        </ul>
      </div>

      <div className="navbar-actions">
        <button className="btn-login">Login</button>
        <button className="btn-signup">Sign Up</button>
      </div>

      <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span className={isMobileMenuOpen ? "active" : ""}></span>
        <span className={isMobileMenuOpen ? "active" : ""}></span>
        <span className={isMobileMenuOpen ? "active" : ""}></span>
      </div>
    </nav>
  );
};

export default Navbar;
