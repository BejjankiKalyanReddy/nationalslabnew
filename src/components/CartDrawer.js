import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    clearCart,
    totalAmount,
    totalMRP,
    totalSavings,
    totalCount,
    openBooking,
    getTestName,
    getTestPrice,
    getTestId,
  } = useCart();

  const { currentLocation, openLocationModal } = useLocation();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (!user) {
      closeCart();
      navigate('/auth');
      return;
    }
    openBooking();
  };

  return (
    <div className="cart-drawer-overlay" onClick={(e) => e.target === e.currentTarget && closeCart()}>
      <div className="cart-drawer-panel">
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <span className="cart-icon-big">🛒</span>
            <h3>Your Cart</h3>
            <span className="cart-badge-count">{totalCount}</span>
          </div>
          <button className="cart-close-btn" onClick={closeCart} title="Close Cart">✕</button>
        </div>

        {/* Location snippet */}
        <div className="cart-location-bar">
          <span className="cart-loc-pin">📍</span>
          <div className="cart-loc-info">
            <small>Sample Collection At:</small>
            <strong>
              {currentLocation
                ? [currentLocation.city, currentLocation.postal_code].filter(Boolean).join(' - ') ||
                  currentLocation.address_line1
                : 'Choose collection location'}
            </strong>
          </div>
          <button
            className="cart-change-loc-btn"
            onClick={() => {
              openLocationModal();
            }}
          >
            Change
          </button>
        </div>

        {/* Items List */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <span className="empty-cart-emoji">🧪</span>
              <h4>Your cart is empty</h4>
              <p>Add diagnostic tests or health checkup profiles to get started.</p>
              <button
                className="btn-browse-tests"
                onClick={() => {
                  closeCart();
                  navigate('/diagnostics');
                }}
              >
                Browse Diagnostic Tests
              </button>
            </div>
          ) : (
            <div className="cart-items-scroll">
              {cart.map((item) => {
                const id = getTestId(item) || item.name;
                const name = getTestName(item);
                const price = getTestPrice(item);
                const orig = Math.round(Number(item.testOriginalPrice ?? item.orrate ?? price));
                return (
                  <div key={id} className="cart-item-row">
                    <div className="cart-item-main">
                      <h4 className="cart-item-title">{name}</h4>
                      <div className="cart-item-rates">
                        <span className="cart-item-curr">₹{price}</span>
                        {orig > price && (
                          <span className="cart-item-orig">₹{orig}</span>
                        )}
                        {orig > price && (
                          <span className="cart-item-save-tag">
                            Save ₹{orig - price}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="cart-item-remove-btn"
                      onClick={() => removeFromCart(id)}
                      title="Remove test"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer & Checkout */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            {totalSavings > 0 && (
              <div className="cart-savings-pill">
                🎉 Total savings on this booking: <strong>₹{totalSavings}</strong>
              </div>
            )}

            <div className="cart-bill-summary">
              <div className="bill-row">
                <span>Total MRP</span>
                <span>₹{totalMRP}</span>
              </div>
              {totalSavings > 0 && (
                <div className="bill-row discount">
                  <span>Special Discount</span>
                  <span>- ₹{totalSavings}</span>
                </div>
              )}
              <div className="bill-row total">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <div className="cart-actions-row">
              <button
                className="btn-clear-cart"
                onClick={clearCart}
                title="Empty Cart"
              >
                Clear
              </button>
              <button
                className="btn-proceed-checkout"
                onClick={handleCheckout}
                id="cart-checkout-btn"
              >
                Book Now • ₹{totalAmount} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
