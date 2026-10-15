import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithPassword, signupWithPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState(1); // for signup: 1=details, 2=done
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithPassword(form.phone, form.password);
      login(user);
      navigate('/profile');
    } catch (err) {
      if (err.status === 401) setError('Invalid phone number or password');
      else setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.fullname || !form.phone || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signupWithPassword(form.fullname, form.phone, form.email, form.password);
      // Auto-login after signup
      const user = await loginWithPassword(form.phone, form.password);
      login(user);
      navigate('/profile');
    } catch (err) {
      if (err.status === 409) setError('An account already exists with this phone or email');
      else setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <img src="/nationals_2.png" alt="NationalsLab" className="auth-logo" />
          <h2>NationalsLab Portal</h2>
          <p>Your health, our priority</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin} id="login-form">
              <h3>Welcome Back</h3>
              <p className="auth-subtitle">Login to your account</p>

              <div className="form-group">
                <label htmlFor="login-phone">📱 Mobile Number</label>
                <input
                  id="login-phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">🔒 Password</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                id="login-submit-btn"
              >
                {loading ? <span className="spinner"></span> : 'Login'}
              </button>

              <p className="auth-switch">
                Don't have an account?{' '}
                <span onClick={() => { setMode('signup'); setError(''); }}>Sign Up</span>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup} id="signup-form">
              <h3>Create Account</h3>
              <p className="auth-subtitle">Join NationalsLab today</p>

              <div className="form-group">
                <label htmlFor="signup-name">👤 Full Name *</label>
                <input
                  id="signup-name"
                  type="text"
                  name="fullname"
                  placeholder="Enter your full name"
                  value={form.fullname}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-phone">📱 Mobile Number *</label>
                <input
                  id="signup-phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">✉️ Email (optional)</label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">🔒 Password *</label>
                <input
                  id="signup-password"
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-confirm">🔒 Confirm Password *</label>
                <input
                  id="signup-confirm"
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                id="signup-submit-btn"
              >
                {loading ? <span className="spinner"></span> : 'Create Account'}
              </button>

              <p className="auth-switch">
                Already have an account?{' '}
                <span onClick={() => { setMode('login'); setError(''); }}>Login</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
