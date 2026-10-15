import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  const getTestId = (test) => test.testId ?? test.test_id ?? test.id;
  const getTestName = (test) => test.testName || test.name || 'Test';
  const getTestPrice = (test) => Math.round(Number(test.testDiscountedPrice ?? test.currate ?? test.price ?? 0));
  const getOrigPrice = (test) => Math.round(Number(test.testOriginalPrice ?? test.orrate ?? test.originalRate ?? 0));

  const addToCart = (test, autoOpenDrawer = true) => {
    const testId = getTestId(test);
    const testName = getTestName(test);

    const exists = cart.some(
      (item) => (testId && getTestId(item) === testId) || getTestName(item) === testName
    );

    if (exists) {
      if (autoOpenDrawer) setIsCartOpen(true);
      return false;
    }

    const normalized = {
      ...test,
      testId: testId,
      test_id: testId,
      name: testName,
      testName: testName,
      currate: getTestPrice(test),
      testDiscountedPrice: getTestPrice(test),
      orrate: getOrigPrice(test),
      testOriginalPrice: getOrigPrice(test),
    };

    setCart((prev) => [...prev, normalized]);
    if (autoOpenDrawer) setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (identifier) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          getTestId(item) !== identifier &&
          item.testId !== identifier &&
          item.name !== identifier &&
          item.testName !== identifier
      )
    );
  };

  const clearCart = () => setCart([]);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const openBooking = () => {
    setIsCartOpen(false);
    setIsBookingOpen(true);
  };
  const closeBooking = () => setIsBookingOpen(false);

  const totalAmount = cart.reduce((sum, item) => sum + getTestPrice(item), 0);
  const totalMRP = cart.reduce((sum, item) => sum + (getOrigPrice(item) || getTestPrice(item)), 0);
  const totalSavings = Math.max(0, totalMRP - totalAmount);
  const totalCount = cart.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        isBookingOpen,
        openBooking,
        closeBooking,
        totalAmount,
        totalMRP,
        totalSavings,
        totalCount,
        getTestName,
        getTestPrice,
        getTestId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
