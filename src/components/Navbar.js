import React, { useState } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";

const Navbar = () => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { user, logout } = useAuth();
  const { totalCount, toggleCart } = useCart();
  const { locationDisplayText, openLocationModal } = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return routerLocation.pathname === '/';
    return routerLocation.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-brand" onClick={() => handleNavigation("/")}>
          <img
            src={"/nationals_2.png"}
            alt="NationalsLab"
            className="brand-icon"
          />
        </div>

        {/* Location Selector Pill */}
        <div
          className="navbar-location-pill"
          onClick={openLocationModal}
          title="Click to select or switch location"
          id="nav-location-selector"
        >
          <span className="location-pin-icon">📍</span>
          <div className="location-pill-text">
            <span className="location-label">Deliver to</span>
            <span className="location-value">{locationDisplayText}</span>
          </div>
          <span className="location-caret">▾</span>
        </div>
      </div>

      <div className={`navbar-menu ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <ul className="nav-links">
          <li
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation("/")}
          >
            Home
          </li>
          <li
            className={`nav-item ${isActive('/diagnostics') ? 'active' : ''}`}
            onClick={() => handleNavigation("/diagnostics")}
          >
            Diagnostic Tests
          </li>
          <li
            className={`nav-item ${isActive('/insurance') ? 'active' : ''}`}
            onClick={() => handleNavigation("/insurance")}
          >
            Insurance
          </li>
          {user && (
            <li
              className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => handleNavigation("/profile")}
            >
              My Orders & Profile
            </li>
          )}
        </ul>
      </div>

      <div className="navbar-actions">
        {/* Cart Button with Count Badge */}
        <button
          className="navbar-cart-btn"
          onClick={toggleCart}
          title="View Cart"
          id="nav-cart-btn"
        >
          <span className="cart-btn-icon">🛒</span>
          <span className="cart-btn-label">Cart</span>
          {totalCount > 0 && (
            <span className="navbar-cart-badge" id="nav-cart-badge">
              {totalCount}
            </span>
          )}
        </button>

        {user ? (
          <div className="user-menu-wrapper">
            <button
              className="btn-user"
              onClick={() => setShowUserMenu(!showUserMenu)}
              id="user-menu-btn"
            >
              <span className="user-avatar-circle">
                {(user.fullname || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="user-name">{user.fullname?.split(' ')[0] || 'Account'}</span>
              <span className="dropdown-arrow">▾</span>
            </button>
            {showUserMenu && (
              <div className="user-dropdown" id="user-dropdown">
                <div className="dropdown-header">
                  <strong>{user.fullname}</strong>
                  <small>{user.mobileNumber}</small>
                </div>
                <button className="dropdown-item" onClick={() => handleNavigation('/profile')}>
                  👤 My Profile & Family
                </button>
                <button className="dropdown-item" onClick={() => handleNavigation('/profile')}>
                  📋 My Orders
                </button>
                <button className="dropdown-item" onClick={() => openLocationModal()}>
                  📍 Manage Addresses
                </button>
                <hr className="dropdown-divider" />
                <button className="dropdown-item logout-item" onClick={handleLogout} id="nav-logout-btn">
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons-group">
            <button
              className="btn-login"
              onClick={() => handleNavigation("/auth")}
              id="nav-login-btn"
            >
              Login
            </button>
            <button
              className="btn-signup"
              onClick={() => handleNavigation("/auth")}
              id="nav-signup-btn"
            >
              Sign Up
            </button>
          </div>
        )}
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

