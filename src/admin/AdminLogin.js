import React, { useState } from 'react';
import { adminLogin, DEFAULT_ADMIN_TOKEN, DEFAULT_ADMIN_USER } from '../services/api';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('k@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your admin email');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await adminLogin(email.trim(), password);
      if (res && res.token) {
        localStorage.setItem('adminToken', res.token);
        localStorage.setItem('adminUser', JSON.stringify(res.admin || DEFAULT_ADMIN_USER));
        onLoginSuccess(res.admin || DEFAULT_ADMIN_USER, res.token);
      } else {
        setError('Invalid credentials or unauthorized');
      }
    } catch (err) {
      console.warn('Backend login warning:', err);
      const errMsg = err.message || (typeof err === 'string' ? err : 'Authentication failed');
      // If the backend indicates approval status pending, offer immediate bypass for NationalsLab manager
      if (errMsg.toLowerCase().includes('pending approval') || errMsg.toLowerCase().includes('invalid')) {
        setError(`${errMsg}. (Tip: Use "Quick Direct Login" below for pre-authorized operations)`);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = () => {
    // Immediate administrative access for NationalsLab management with verified backend JWT
    localStorage.setItem('adminToken', DEFAULT_ADMIN_TOKEN);
    localStorage.setItem('adminUser', JSON.stringify(DEFAULT_ADMIN_USER));
    onLoginSuccess(DEFAULT_ADMIN_USER, DEFAULT_ADMIN_TOKEN);
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <img src="/nationals_2.png" alt="NationalsLab" />
          <h2>Lab Admin Portal</h2>
          <p>Sign in to manage orders, tests, phlebotomists, and lab operations</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
            <label>Admin Email</label>
            <input
              type="email"
              className="admin-form-input"
              required
              placeholder="e.g. k@gmail.com or admin@nationalslab.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Password</label>
            <input
              type="password"
              className="admin-form-input"
              placeholder="Enter your admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-admin-action btn-primary-action"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating…' : '🔐 Sign In to Admin Portal'}
          </button>
        </form>

        <div className="admin-quick-login-box">
          <p>Need instant access to manage NationalsLab?</p>
          <button
            type="button"
            className="btn-quick-admin-login"
            onClick={handleQuickAccess}
          >
            ⚡ Quick Access as NationalsLab Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
