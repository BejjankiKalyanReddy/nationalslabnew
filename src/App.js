import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import DiagnosticPage from './components/DiagnosticPage';
import InsurancePage from './components/InsurancePage';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import LocationModal from './components/LocationModal';
import CartDrawer from './components/CartDrawer';
import BookingModal from './components/BookingModal';
import Footer from './components/Footer';
import AdminPage from './admin/AdminPage';
import './index.css';

const GlobalBookingModalWrapper = () => {
  const navigate = useNavigate();
  const { cart, isBookingOpen, closeBooking, clearCart } = useCart();

  if (!isBookingOpen || cart.length === 0) return null;

  return (
    <BookingModal
      cart={cart}
      onClose={closeBooking}
      onSuccess={(order) => {
        clearCart();
        closeBooking();
        navigate('/profile');
      }}
    />
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminRoute && (
        <>
          <Navbar />
          <LocationModal />
          <CartDrawer />
          <GlobalBookingModalWrapper />
        </>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnostics" element={<DiagnosticPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
