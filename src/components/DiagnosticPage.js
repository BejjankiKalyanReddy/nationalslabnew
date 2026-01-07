import React, { useState } from 'react';
import { testData } from '../data/testData';

const DiagnosticPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  const filteredTests = testData.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (test) => {
    if (cart.some(item => item.name === test.name)) {
      alert('Test already in cart');
      return;
    }
    setCart([...cart, test]);
  };

  const removeFromCart = (testIndex) => {
    setCart(cart.filter((_, index) => index !== testIndex));
  };

  const calculateDiscount = (currentPrice, originalPrice) => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const calculateTotalSavings = () => {
    return cart.reduce((total, item) => {
      return total + (parseInt(item.orrate) - parseInt(item.currate));
    }, 0);
  };

  const calculateTotalAmount = () => {
    return cart.reduce((total, item) => {
      return total + parseInt(item.currate);
    }, 0);
  };

  return (
    <div className="diagnostic-page">
      {/* Header Section */}
      <div className="diagnostic-header">
        <h1 className="page-title">Diagnostic Tests</h1>
        <p className="page-description">
          Choose from our comprehensive range of diagnostic tests with accurate results and competitive pricing.
          All tests are conducted in NABL accredited laboratories.
        </p>
      </div>
      {/* Information Notice */}
      <div className="info-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <h4>Important Information</h4>
          <p>
            Payment service is currently not available online. Please visit our nearest diagnostic center 
            to complete your payment and sample collection. Our team will assist you with the booking process.
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {/* <div className="filter-buttons">
            <button className="filter-btn active">All Tests</button>
            <button className="filter-btn">Blood Tests</button>
            <button className="filter-btn">Thyroid</button>
            <button className="filter-btn">Diabetes</button>
          </div> */}
        </div>
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="cart-summary">
          <div className="cart-header">
            <h3>Selected Tests ({cart.length})</h3>
            <div>
            <span className="total-savings">Total Savings: ₹{calculateTotalSavings()}</span>
            <span className="total-amount">Total Amount: ₹{calculateTotalAmount()}</span>
            </div>
          </div>
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span className="cart-item-name">{item.name}</span>
                <span className="cart-item-price">₹{item.currate}</span>
                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tests Grid */}
      <div className="tests-grid">
        {filteredTests.map((test, index) => {
          const discount = calculateDiscount(parseInt(test.currate), parseInt(test.orrate));
          return (
            <div key={index} className="test-card">
              <div className="test-card-header">
                <h3 className="test-name">{test.name}</h3>
                <div className="test-category">Lab Test</div>
              </div>
              
              <div className="test-card-body">
                <div className="test-description">
                  <p>Accurate results delivered within 24-48 hours</p>
                  <ul className="test-features">
                    <li>✓ Home collection available</li>
                    <li>✓ Digital reports</li>
                    <li>✓ Expert consultation</li>
                  </ul>
                </div>
              </div>

              <div className="test-card-footer">
                <div className="price-section">
                  <div className="current-price">₹{test.currate}</div>
                  <div className="original-price">₹{test.orrate}</div>
                  <div className="discount-badge">{discount}% OFF</div>
                </div>
                
                <div className="card-actions">
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(test)}
                  >
                    <span className="btn-icon">🛒</span>
                    Add to Cart
                  </button>
                  <button className="book-now-btn">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      
    </div>
  );
};

export default DiagnosticPage;
