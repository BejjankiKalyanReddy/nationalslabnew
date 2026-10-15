import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

const LocationModal = () => {
  const { user } = useAuth();
  const {
    locations,
    currentLocation,
    isLocationModalOpen,
    closeLocationModal,
    switchLocation,
    addNewAddress,
    removeAddress,
    setGuestLocation,
    loadingLocations,
  } = useLocation();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'pincode'
  const [form, setForm] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [guestPincode, setGuestPincode] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isLocationModalOpen) return null;

  const handleSelectAddress = async (addressId) => {
    await switchLocation(addressId);
    closeLocationModal();
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.address_line1 || !form.city || !form.postal_code) {
      setError('Please fill in Address, City, and Pincode');
      return;
    }
    setSubmitting(true);
    try {
      await addNewAddress(form);
      setForm({
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
      });
      setActiveTab('list');
      closeLocationModal();
    } catch (err) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetGuest = (e) => {
    e.preventDefault();
    if (!guestPincode || guestPincode.trim().length < 6) {
      setError('Please enter a valid 6-digit Pincode');
      return;
    }
    setGuestLocation(guestPincode.trim(), guestCity.trim());
    closeLocationModal();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeLocationModal()}>
      <div className="location-modal-container">
        <div className="location-modal-header">
          <div className="location-modal-title">
            <span className="location-header-icon">📍</span>
            <div>
              <h3>Select Service Location</h3>
              <p>Choose where diagnostic samples should be collected</p>
            </div>
          </div>
          <button className="modal-close" onClick={closeLocationModal}>✕</button>
        </div>

        {/* Tabs */}
        {user ? (
          <div className="location-modal-tabs">
            <button
              className={`loc-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => { setActiveTab('list'); setError(''); }}
            >
              Saved Addresses ({locations.length})
            </button>
            <button
              className={`loc-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => { setActiveTab('add'); setError(''); }}
            >
              ➕ Add New Address
            </button>
          </div>
        ) : null}

        {error && <div className="location-error-banner">{error}</div>}

        <div className="location-modal-body">
          {/* User Logged in - Address list */}
          {user && activeTab === 'list' && (
            <div className="location-list-view">
              {loadingLocations ? (
                <div className="location-loading">Loading saved addresses…</div>
              ) : locations.length === 0 ? (
                <div className="location-empty-state">
                  <span className="empty-icon">🏠</span>
                  <p>No saved addresses found.</p>
                  <button className="btn-add-first-loc" onClick={() => setActiveTab('add')}>
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="saved-locations-grid">
                  {locations.map((loc) => {
                    const isSelected = currentLocation?.address_id === loc.address_id;
                    return (
                      <div
                        key={loc.address_id}
                        className={`location-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectAddress(loc.address_id)}
                      >
                        <div className="location-card-radio">
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={isSelected}
                            readOnly
                          />
                        </div>
                        <div className="location-card-content">
                          <div className="location-card-header">
                            <strong className="location-card-city">{loc.city || 'Home'}</strong>
                            {isSelected && <span className="active-badge">Active</span>}
                          </div>
                          <p className="location-card-line1">{loc.address_line1}</p>
                          {loc.address_line2 && <p className="location-card-line2">{loc.address_line2}</p>}
                          <p className="location-card-sub">
                            {[loc.state, loc.postal_code].filter(Boolean).join(' - ')}
                          </p>
                        </div>
                        <button
                          className="btn-delete-address"
                          title="Delete address"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this address?')) {
                              removeAddress(loc.address_id);
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* User Logged In - Add Address Form */}
          {user && activeTab === 'add' && (
            <form onSubmit={handleAddNew} className="location-add-form">
              <div className="form-row">
                <div className="form-group full-width">
                  <label>House / Flat / Street (Address Line 1) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 302, Green Valley Apts, Road No. 4"
                    value={form.address_line1}
                    onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Landmark / Colony (Address Line 2)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Metro Station / Park"
                    value={form.address_line2}
                    onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row two-col">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code / Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="e.g. 500081"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>State</label>
                  <input
                    type="text"
                    placeholder="e.g. Telangana"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveTab('list')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-loc"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : 'Save & Set as Active'}
                </button>
              </div>
            </form>
          )}

          {/* Guest User - Quick Pincode / Location */}
          {!user && (
            <form onSubmit={handleSetGuest} className="guest-location-form">
              <p className="guest-loc-intro">
                Enter your area pincode to view home collection availability in your zone.
              </p>
              <div className="form-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="e.g. 500081"
                  value={guestPincode}
                  onChange={(e) => setGuestPincode(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>City / Area (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad / Madhapur"
                  value={guestCity}
                  onChange={(e) => setGuestCity(e.target.value)}
                />
              </div>
              <div className="serviced-zones-quick">
                <span className="quick-title">Available Service Zones:</span>
                <button
                  type="button"
                  className="quick-zone-chip active"
                  onClick={() => {
                    setGuestPincode('504102');
                    setGuestCity('Bhainsa');
                  }}
                >
                  📍 Bhainsa (504102) - Active
                </button>
              </div>
              <button type="submit" className="btn-set-guest-loc">
                📍 Set Location
              </button>
            </form>

          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
