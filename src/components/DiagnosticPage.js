import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { getTestsByLab, getLabLocationsByLabId, LAB_ID } from '../services/api';
import BookingModal from './BookingModal';

const DiagnosticPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, clearCart } = useCart();
  const { currentLocation, openLocationModal, setGuestLocation } = useLocation();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Serviceability status: 'NO_LOCATION' | 'CHECKING' | 'SERVICEABLE' | 'NOT_SERVICEABLE'
  const [serviceStatus, setServiceStatus] = useState('CHECKING');
  const [servicedLocations, setServicedLocations] = useState([]);

  // Check location and load tests whenever currentLocation changes
  useEffect(() => {
    checkServiceAndLoadTests();
  }, [currentLocation]);

  const checkServiceAndLoadTests = async () => {
    const postalCode = currentLocation?.postal_code?.toString().trim();

    if (!postalCode) {
      setServiceStatus('NO_LOCATION');
      setTests([]);
      return;
    }

    setServiceStatus('CHECKING');
    setLoading(true);
    setFetchError('');

    try {
      // 1. Fetch serviceable locations for the lab associated with application in env
      let labLocations = servicedLocations;
      if (!labLocations || labLocations.length === 0) {
        try {
          const locs = await getLabLocationsByLabId(LAB_ID);
          labLocations = Array.isArray(locs) ? locs : [];
          setServicedLocations(labLocations);
        } catch (locErr) {
          console.warn('Error fetching lab locations, fallback to defaults:', locErr);
          // Fallback to known default location if backend error
          labLocations = [{ postalCode: '504102', city: 'Bhainsa' }];
        }
      }

      // Check if the current postal code is serviced by this lab
      const isServiced = labLocations.some(
        (loc) => String(loc.postalCode).trim() === postalCode
      );

      if (!isServiced) {
        setServiceStatus('NOT_SERVICEABLE');
        setTests([]);
        setLoading(false);
        return;
      }

      // 2. Fetch tests strictly for the lab associated with application in env
      setServiceStatus('SERVICEABLE');
      const data = await getTestsByLab(LAB_ID);
      const testList = Array.isArray(data) ? data : [];
      // Filter to ensure test belongs to this lab
      const filteredByLab = testList.filter((t) => Number(t.labId) === Number(LAB_ID));
      setTests(filteredByLab);
    } catch (err) {
      console.error('Error fetching tests for lab:', err);
      setFetchError('Unable to load tests for your location. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Derive unique categories from loaded tests
  const categories = [
    'All',
    ...Array.from(
      new Set(
        tests
          .map((t) => t.categoryName)
          .filter(Boolean)
      )
    ),
  ];

  // Filter tests by search and category
  const filteredTests = tests.filter((test) => {
    const matchesSearch = (test.testName || test.name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' ||
      (test.categoryName && test.categoryName.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const getTestName = (test) => test.testName || test.name || 'Unknown Test';
  const getCurRate = (test) =>
    Math.round(Number(test.testDiscountedPrice ?? test.currate ?? test.currentRate ?? test.discountedPrice ?? 0));
  const getOrRate = (test) =>
    Math.round(Number(test.testOriginalPrice ?? test.orrate ?? test.originalRate ?? test.price ?? 0));

  const calculateDiscount = (cur, orig) => {
    if (!orig || orig === 0) return 0;
    return Math.max(0, Math.round(((orig - cur) / orig) * 100));
  };

  const calculateTotalSavings = () =>
    cart.reduce((total, item) => total + (getOrRate(item) - getCurRate(item)), 0);

  const calculateTotalAmount = () =>
    cart.reduce((total, item) => total + getCurRate(item), 0);

  const handleAddToCart = (test) => {
    addToCart(test, true);
  };

  const handleBookNow = (test) => {
    addToCart(test, false);
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowBooking(true);
  };

  const handleProceedToBook = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (cart.length === 0) {
      alert('Please add at least one test to your cart');
      return;
    }
    setShowBooking(true);
  };

  const handleBookingSuccess = (order) => {
    setBookingSuccess(order);
    clearCart();
    setShowBooking(false);
  };

  return (
    <div className="diagnostic-page">
      {/* Header Section */}
      <div className="diagnostic-header">
        <h1 className="page-title">Diagnostic Tests</h1>
        <p className="page-description">
          Choose from verified diagnostic tests with doorstep sample collection and accurate NABL-standard results.
        </p>
      </div>

      {/* Booking Success Banner */}
      {bookingSuccess && (
        <div className="booking-success-banner">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <div>
              <h4>Booking Confirmed! Order #{bookingSuccess.orderId}</h4>
              <p>We'll contact you to confirm your appointment. Payment: Cash on Collection.</p>
            </div>
            <div className="success-actions">
              <button className="view-order-btn" onClick={() => navigate('/profile')}>
                View Orders
              </button>
              <button className="dismiss-btn" onClick={() => setBookingSuccess(null)}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── State 1: No Location Selected ─────────────────────────────────── */}
      {serviceStatus === 'NO_LOCATION' && (
        <div className="location-prompt-card">
          <div className="prompt-icon">📍</div>
          <div className="prompt-content">
            <h3>Please Select Your Location</h3>
            <p>
              NationalsLab offers doorstep collection in select service zones. Please select your delivery address
              or enter your area pincode to view available diagnostic tests and prices.
            </p>
            <div className="prompt-actions">
              <button className="btn-select-location" onClick={openLocationModal}>
                📍 Select Delivery Location
              </button>
              <button
                className="btn-quick-bhainsa"
                onClick={() => setGuestLocation('504102', 'Bhainsa')}
              >
                Set Location to Bhainsa (504102)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── State 2: Location Not Serviceable ──────────────────────────────── */}
      {serviceStatus === 'NOT_SERVICEABLE' && (
        <div className="location-unserviceable-card">
          <div className="unserviceable-icon">⚠️</div>
          <div className="unserviceable-content">
            <h3>Service Unavailable at {currentLocation?.postal_code}</h3>
            <p>
              NationalsLab doorstep sample collection is currently not available in{' '}
              <strong>
                {[currentLocation?.city, currentLocation?.postal_code].filter(Boolean).join(' - ')}
              </strong>.
            </p>
            <p className="unserviceable-hint">
              We currently provide full coverage and home sample collection in <strong>Bhainsa (Pincode: 504102)</strong>.
              Please switch your delivery location to view and book available tests.
            </p>
            <div className="unserviceable-actions">
              <button className="btn-change-location" onClick={openLocationModal}>
                📍 Switch Delivery Location
              </button>
              <button
                className="btn-quick-bhainsa"
                onClick={() => setGuestLocation('504102', 'Bhainsa')}
              >
                Switch to Bhainsa (504102)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── State 3: Checking Location ────────────────────────────────────── */}
      {serviceStatus === 'CHECKING' && (
        <div className="tests-loading">
          <div className="loading-spinner"></div>
          <p>Checking service availability for your location…</p>
        </div>
      )}

      {/* ─── State 4: Location Serviceable ─────────────────────────────────── */}
      {serviceStatus === 'SERVICEABLE' && (
        <>
          {/* Active Location Indicator Bar */}
          <div className="location-active-bar">
            <div className="loc-bar-info">
              <span className="loc-bar-pin">📍</span>
              <span>
                Delivering to: <strong>{[currentLocation?.city, currentLocation?.postal_code].filter(Boolean).join(' - ')}</strong>
              </span>
              <span className="loc-serviceable-badge">✓ Home Collection Available</span>
            </div>
            <button className="loc-change-link" onClick={openLocationModal}>
              Change Location
            </button>
          </div>

          {/* Search and Category Filters */}
          <div className="tests-filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search diagnostic tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>

            {categories.length > 1 && (
              <div className="category-pills-row">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary Header */}
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
                    <span className="cart-item-name">{getTestName(item)}</span>
                    <span className="cart-item-price">₹{getCurRate(item)}</span>
                    <button className="remove-btn" onClick={() => removeFromCart(index)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <button className="proceed-book-btn" onClick={handleProceedToBook}>
                  🗓️ Proceed to Book ({cart.length} tests)
                </button>
              </div>
            </div>
          )}

          {/* Loading or Error */}
          {loading ? (
            <div className="tests-loading">
              <div className="loading-spinner"></div>
              <p>Loading tests for your area…</p>
            </div>
          ) : fetchError ? (
            <div className="fetch-error">
              <span>⚠️</span>
              <p>{fetchError}</p>
              <button onClick={checkServiceAndLoadTests} className="retry-btn">Retry</button>
            </div>
          ) : (
            <>
              <div className="tests-count">
                Showing {filteredTests.length} of {tests.length} tests available in your area
              </div>

              {/* Tests Grid */}
              <div className="tests-grid">
                {filteredTests.map((test, index) => {
                  const cur = getCurRate(test);
                  const orig = getOrRate(test);
                  const discount = calculateDiscount(cur, orig);
                  const inCart = cart.some((item) => getTestName(item) === getTestName(test));
                  return (
                    <div key={test.testId || test.test_id || index} className="test-card">
                      <div className="test-card-header">
                        <h3 className="test-name">{getTestName(test)}</h3>
                        <div className="test-category">{test.categoryName || 'Lab Test'}</div>
                      </div>

                      <div className="test-card-body">
                        <div className="test-description">
                          <p>{test.testDescription || 'Accurate results with verified lab analysis.'}</p>
                          <ul className="test-features">
                            <li>✓ Home sample collection</li>
                            <li>✓ Report: {test.testReportTime || '24-48 Hours'}</li>
                            <li>✓ NABL certified testing</li>
                          </ul>
                        </div>
                      </div>

                      <div className="test-card-footer">
                        <div className="price-section">
                          <div className="current-price">₹{cur}</div>
                          {orig > cur && <div className="original-price">₹{orig}</div>}
                          {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
                        </div>

                        <div className="card-actions">
                          <button
                            className={`add-to-cart-btn ${inCart ? 'in-cart' : ''}`}
                            onClick={() => inCart ? null : handleAddToCart(test)}
                            disabled={inCart}
                          >
                            <span className="btn-icon">{inCart ? '✓' : '🛒'}</span>
                            {inCart ? 'Added' : 'Add to Cart'}
                          </button>
                          <button
                            className="book-now-btn"
                            onClick={() => handleBookNow(test)}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          cart={cart}
          onClose={() => setShowBooking(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default DiagnosticPage;
