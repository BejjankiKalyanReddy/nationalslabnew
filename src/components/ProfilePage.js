import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUserById,
  updateUser,
  getAddressesByUser,
  createAddress,
  updateAddress,
  deleteAddress,
  getOrdersByUser,
  getFamilyProfiles,
  createFamilyProfile,
  deleteFamilyProfile,
} from '../services/api';

const ProfilePage = () => {
  const { user, updateUserData, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile edit state
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  // Address state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
  });

  // Family Profiles state
  const [familyProfiles, setFamilyProfiles] = useState([]);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyForm, setFamilyForm] = useState({
    fullname: '',
    mobile: '',
    relation: 'SELF',
    age: '',
    gender: 'MALE',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'addresses') loadAddresses();
      if (activeTab === 'orders') loadOrders();
      if (activeTab === 'family') loadFamily();
    }
  }, [activeTab]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserById(user.user_id);
      setProfileData(data);
      setProfileForm({
        user_id: data.user_id,
        fullname: data.fullname || '',
        email: data.email || '',
        mobileNumber: data.mobileNumber || '',
      });
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await getAddressesByUser(user.user_id);
      setAddresses(data || []);
    } catch (e) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrdersByUser(user.user_id);
      setOrders(data || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFamily = async () => {
    setLoading(true);
    try {
      const data = await getFamilyProfiles(user.user_id);
      setFamilyProfiles(data || []);
    } catch (e) {
      setFamilyProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFamilySubmit = async (e) => {
    e.preventDefault();
    if (!familyForm.fullname || !familyForm.mobile || !familyForm.age) {
      setError('Please fill in name, mobile, and age');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createFamilyProfile({
        userId: user.user_id,
        fullname: familyForm.fullname,
        mobile: familyForm.mobile,
        relation: familyForm.relation,
        age: parseInt(familyForm.age),
        gender: familyForm.gender,
      });
      setShowFamilyForm(false);
      setFamilyForm({ fullname: '', mobile: '', relation: 'SELF', age: '', gender: 'MALE' });
      await loadFamily();
      setSuccess('Family profile added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add family profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFamily = async (profileId) => {
    if (!window.confirm('Remove this family member?')) return;
    try {
      await deleteFamilyProfile(profileId);
      await loadFamily();
      setSuccess('Family profile removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete family profile');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateUser(profileForm);
      updateUserData(updated);
      setProfileData(updated);
      setEditProfile(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingAddress) {
        await updateAddress({ ...addressForm, address_id: editingAddress.address_id });
      } else {
        await createAddress({ ...addressForm, user_id: user.user_id });
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddressForm();
      await loadAddresses();
      setSuccess('Address saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteAddress(addressId);
      await loadAddresses();
      setSuccess('Address deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Failed to delete address');
    }
  };

  const startEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      address_line1: addr.address_line1 || '',
      address_line2: addr.address_line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
    });
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setAddressForm({ address_line1: '', address_line2: '', city: '', state: '', postal_code: '' });
  };

  const getStatusColor = (status) => {
    const map = {
      PENDING: '#f59e0b',
      CONFIRMED: '#3b82f6',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
      SAMPLE_COLLECTED: '#8b5cf6',
    };
    return map[status] || '#6b7280';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-icon">👤</span>
          <div>
            <h2>{user.fullname || 'User'}</h2>
            <p>{user.mobileNumber}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} id="logout-btn">
          🚪 Logout
        </button>
      </div>

      <div className="profile-tabs">
        {['profile', 'orders', 'addresses', 'family'].map((tab) => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setError(''); setSuccess(''); }}
            id={`tab-${tab}`}
          >
            {tab === 'profile' && '👤 '}
            {tab === 'orders' && '📋 '}
            {tab === 'addresses' && '📍 '}
            {tab === 'family' && '👨‍👩‍👧 '}
            {tab === 'family' ? 'Family Members' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="tab-content">
          {loading ? (
            <div className="loading-state">Loading profile…</div>
          ) : (
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Personal Information</h3>
                {!editProfile && (
                  <button
                    className="edit-btn"
                    onClick={() => setEditProfile(true)}
                    id="edit-profile-btn"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {editProfile ? (
                <form onSubmit={handleProfileSave} className="profile-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.fullname}
                      onChange={(e) => setProfileForm((p) => ({ ...p, fullname: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input type="tel" value={profileForm.mobileNumber} disabled />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={saving}>
                      {saving ? 'Saving…' : '✅ Save Changes'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setEditProfile(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-details">
                  <div className="detail-row">
                    <span className="detail-label">👤 Full Name</span>
                    <span className="detail-value">{profileData?.fullname || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">✉️ Email</span>
                    <span className="detail-value">{profileData?.email || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📱 Mobile</span>
                    <span className="detail-value">{profileData?.mobileNumber || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">💰 Wallet</span>
                    <span className="detail-value">₹{profileData?.walletBalance?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🎁 Referral Code</span>
                    <span className="detail-value referral-code">{profileData?.referralCode || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        <div className="tab-content">
          {loading ? (
            <div className="loading-state">Loading your bookings…</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No bookings yet</h3>
              <p>Book your diagnostic tests for doorstep sample collection</p>
              <button className="btn-primary" onClick={() => navigate('/diagnostics')}>
                Browse Diagnostics
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const status = (order.orderStatus || 'PENDING').toUpperCase();
                const isCollected = status === 'SAMPLE COLLECTED' || status === 'COMPLETED' || order.otpCode === 'VERIFIED';
                const isCompleted = status === 'COMPLETED';

                return (
                  <div key={order.orderId} className="order-card-enhanced">
                    <div className="order-card-header">
                      <div>
                        <span className="order-id">Booking #{order.orderId}</span>
                        <div className="order-booking-date">
                          📅 Slot: <strong>{order.slotDate}</strong> ({order.slotTime})
                        </div>
                      </div>
                      <span
                        className="order-status-badge"
                        style={{ background: getStatusColor(order.orderStatus) }}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    {/* Live Tracking Progress Bar */}
                    <div className="order-tracking-stepper">
                      <div className="track-step active">
                        <div className="track-circle">✓</div>
                        <span>Booked</span>
                      </div>
                      <div className={`track-line ${isCollected ? 'active' : ''}`}></div>
                      <div className={`track-step ${isCollected ? 'active' : ''}`}>
                        <div className="track-circle">{isCollected ? '✓' : '2'}</div>
                        <span>Sample Collected</span>
                      </div>
                      <div className={`track-line ${isCompleted ? 'active' : ''}`}></div>
                      <div className={`track-step ${isCompleted ? 'active' : ''}`}>
                        <div className="track-circle">{isCompleted ? '✓' : '3'}</div>
                        <span>Report Ready</span>
                      </div>
                    </div>

                    {/* Safety Verification OTP Code (Matches HealthCall Mobile App) */}
                    {order.otpCode && order.otpCode !== 'VERIFIED' && (
                      <div className="order-safety-otp-card">
                        <div className="otp-card-left">
                          <span className="otp-shield-icon">🛡️</span>
                          <div>
                            <strong>Safety Verification Code</strong>
                            <p>Share this code with your phlebotomist to confirm their identity</p>
                          </div>
                        </div>
                        <div className="otp-code-pill">{order.otpCode}</div>
                      </div>
                    )}

                    {order.otpCode === 'VERIFIED' && (
                      <div className="order-verified-banner">
                        <span>✅</span> Sample Collected & Verified by Phlebotomist
                      </div>
                    )}

                    {/* Phlebotomist / Agent Details */}
                    {order.agentName && (
                      <div className="order-agent-info-card">
                        <span className="agent-avatar">🩺</span>
                        <div className="agent-meta">
                          <span className="agent-label">Assigned Phlebotomist</span>
                          <strong className="agent-name">{order.agentName}</strong>
                          {order.agentPhone && (
                            <a href={`tel:${order.agentPhone}`} className="agent-call-link">
                              📞 {order.agentPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="order-details-grid">
                      <div className="order-info-item">
                        <span className="info-label">👤 Patient Name</span>
                        <span className="info-val">{order.fullname} ({order.mobile})</span>
                      </div>
                      <div className="order-info-item">
                        <span className="info-label">📍 Collection Address</span>
                        <span className="info-val">{order.addressDetails}</span>
                      </div>
                      <div className="order-info-item">
                        <span className="info-label">💳 Payment Method</span>
                        <span className="info-val">{order.paymentMode} ({order.paymentStatus})</span>
                      </div>
                      <div className="order-info-item">
                        <span className="info-label">💰 Total Amount</span>
                        <span className="info-val highlight">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Tests List */}
                    {order.items && order.items.length > 0 && (
                      <div className="order-tests-section">
                        <strong>Selected Tests ({order.items.length}):</strong>
                        <div className="order-tests-chips">
                          {order.items.map((item, i) => (
                            <span key={i} className="order-test-chip">
                              🧪 {item.testName} {item.price ? `— ₹${item.price}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Links */}
                    <div className="order-actions-bar">
                      {order.reportUrl && (
                        <a
                          href={order.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-download-report"
                        >
                          📄 Download Test Report (PDF)
                        </a>
                      )}
                      {order.prescriptionUrl && (
                        <a
                          href={order.prescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-view-prescription"
                        >
                          📋 View Attached Prescription
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Addresses Tab ── */}
      {activeTab === 'addresses' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>Saved Addresses</h3>
            <button
              className="add-btn"
              onClick={() => { setShowAddressForm(true); setEditingAddress(null); resetAddressForm(); }}
              id="add-address-btn"
            >
              + Add Address
            </button>
          </div>

          {showAddressForm && (
            <div className="address-form-card">
              <h4>{editingAddress ? 'Edit Address' : 'Add New Address'}</h4>
              <form onSubmit={handleAddressSubmit} className="address-form">
                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input
                    type="text"
                    value={addressForm.address_line1}
                    placeholder="House/Flat No., Street"
                    onChange={(e) => setAddressForm((p) => ({ ...p, address_line1: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    value={addressForm.address_line2}
                    placeholder="Landmark, Area"
                    onChange={(e) => setAddressForm((p) => ({ ...p, address_line2: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      placeholder="City"
                      onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      placeholder="State"
                      onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    value={addressForm.postal_code}
                    placeholder="Pincode"
                    onChange={(e) => setAddressForm((p) => ({ ...p, postal_code: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Saving…' : '✅ Save Address'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading-state">Loading addresses…</div>
          ) : addresses.length === 0 && !showAddressForm ? (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <h3>No saved addresses</h3>
              <p>Add an address for easy home collection booking</p>
            </div>
          ) : (
            <div className="addresses-list">
              {addresses.map((addr) => (
                <div key={addr.address_id} className="address-card">
                  <div className="address-icon">📍</div>
                  <div className="address-content">
                    <p className="address-line">{addr.address_line1}</p>
                    {addr.address_line2 && <p className="address-line secondary">{addr.address_line2}</p>}
                    <p className="address-line secondary">
                      {addr.city}, {addr.state} - {addr.postal_code}
                    </p>
                  </div>
                  <div className="address-actions">
                    <button className="edit-addr-btn" onClick={() => startEditAddress(addr)}>✏️</button>
                    <button className="delete-addr-btn" onClick={() => handleDeleteAddress(addr.address_id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Family Profiles Tab ── */}
      {activeTab === 'family' && (
        <div className="tab-content">
          <div className="section-header">
            <div>
              <h3>Family Member Profiles</h3>
              <p className="section-subtext">Manage family members to quickly book tests on their behalf</p>
            </div>
            <button
              className="add-btn"
              onClick={() => { setShowFamilyForm(true); }}
              id="add-family-btn"
            >
              + Add Member
            </button>
          </div>

          {showFamilyForm && (
            <div className="address-form-card">
              <h4>Add New Family Member</h4>
              <form onSubmit={handleFamilySubmit} className="address-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={familyForm.fullname}
                      onChange={(e) => setFamilyForm((p) => ({ ...p, fullname: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={familyForm.mobile}
                      onChange={(e) => setFamilyForm((p) => ({ ...p, mobile: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row three-col">
                  <div className="form-group">
                    <label>Relationship *</label>
                    <select
                      value={familyForm.relation}
                      onChange={(e) => setFamilyForm((p) => ({ ...p, relation: e.target.value }))}
                    >
                      <option value="SELF">Self</option>
                      <option value="SPOUSE">Spouse</option>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="SON">Son</option>
                      <option value="DAUGHTER">Daughter</option>
                      <option value="BROTHER">Brother</option>
                      <option value="SISTER">Sister</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Age *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      placeholder="e.g. 35"
                      value={familyForm.age}
                      onChange={(e) => setFamilyForm((p) => ({ ...p, age: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={familyForm.gender}
                      onChange={(e) => setFamilyForm((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Saving…' : '✅ Add Member'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowFamilyForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading-state">Loading family profiles…</div>
          ) : familyProfiles.length === 0 && !showFamilyForm ? (
            <div className="empty-state">
              <div className="empty-icon">👨‍👩‍👧</div>
              <h3>No family members added</h3>
              <p>Add your family members to easily book health checks for them</p>
              <button className="btn-primary" onClick={() => setShowFamilyForm(true)}>
                + Add Member
              </button>
            </div>
          ) : (
            <div className="family-profiles-grid">
              {familyProfiles.map((member) => (
                <div key={member.profileId} className="family-card">
                  <div className="family-avatar-wrap">
                    {member.gender === 'FEMALE' ? '👩' : '👨'}
                  </div>
                  <div className="family-content">
                    <div className="family-header-row">
                      <strong className="family-name">{member.fullname}</strong>
                      <span className="family-relation-badge">{member.relation}</span>
                    </div>
                    <p className="family-sub">
                      <span>🎂 {member.age} yrs</span> • <span>⚥ {member.gender}</span>
                    </p>
                    <p className="family-mobile">📱 {member.mobile}</p>
                  </div>
                  <button
                    className="delete-family-btn"
                    title="Remove member"
                    onClick={() => handleDeleteFamily(member.profileId)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
