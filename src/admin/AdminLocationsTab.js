import React, { useState } from 'react';
import { createLabLocation, deleteLabLocation, LAB_ID } from '../services/api';

const AdminLocationsTab = ({ labLocations = [], currentLab = null, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    addressLine1: '',
    addressLine2: '',
    city: 'Bhainsa',
    state: 'Telangana',
    country: 'India',
    postalCode: '',
    latitude: 12.12344,
    longitude: 12.12344,
    altitude: 12.12344,
    accuracy: 12.12344,
  });

  const labId = currentLab?.labId || LAB_ID;

  const handleOpenAdd = () => {
    setForm({
      addressLine1: '',
      addressLine2: '',
      city: 'Bhainsa',
      state: 'Telangana',
      country: 'India',
      postalCode: '',
      latitude: 12.12344,
      longitude: 12.12344,
      altitude: 12.12344,
      accuracy: 12.12344,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.postalCode || form.postalCode.length < 6) {
      setError('Please provide a valid 6-digit postal code');
      return;
    }
    setLoading(true);
    setError('');

    const payload = {
      labId: labId,
      addressLine1: form.addressLine1 || form.city,
      addressLine2: form.addressLine2 || '',
      city: form.city || 'Bhainsa',
      state: form.state || 'Telangana',
      country: form.country || 'India',
      postalCode: form.postalCode.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      altitude: form.altitude,
      accuracy: form.accuracy,
    };

    try {
      await createLabLocation(payload);
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to add service location');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (loc) => {
    if (!window.confirm(`Remove pincode ${loc.postalCode} (${loc.city}) from serviced areas?`)) return;
    try {
      await deleteLabLocation(loc.locationId);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete service location');
    }
  };

  return (
    <div className="admin-locations-tab">
      <div className="panel-card-header" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>📍 Serviced Coverage Zones & Pincodes</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Diagnostic tests on the main website are strictly filtered to the locations listed below.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-admin-action btn-secondary-action" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="btn-admin-action btn-primary-action" onClick={handleOpenAdd}>
            ➕ Add Coverage Pincode
          </button>
        </div>
      </div>

      {/* Locations Table Panel */}
      <div className="admin-panel-card">
        {labLocations.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">📍</span>
            <h4>No serviced locations found</h4>
            <p>Add the postal codes where your technicians can collect samples.</p>
            <button
              className="btn-admin-action btn-primary-action"
              style={{ marginTop: '1rem' }}
              onClick={handleOpenAdd}
            >
              Add First Service Area
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Location ID</th>
                  <th>Postal Code / Pincode</th>
                  <th>City / Town</th>
                  <th>Address & Landmark</th>
                  <th>State & Country</th>
                  <th>Customer Site Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {labLocations.map((loc) => (
                  <tr key={loc.locationId}>
                    <td><strong style={{ color: '#0891b2' }}>#{loc.locationId}</strong></td>
                    <td>
                      <span className="status-pill status-booked" style={{ fontSize: '0.88rem' }}>
                        📮 {loc.postalCode}
                      </span>
                    </td>
                    <td><strong>{loc.city}</strong></td>
                    <td>
                      <div>{loc.addressLine1}</div>
                      {loc.addressLine2 && <small style={{ color: '#64748b' }}>{loc.addressLine2}</small>}
                    </td>
                    <td><small>{loc.state}, {loc.country}</small></td>
                    <td>
                      <span className="status-pill status-completed">
                        ✓ Actively Serviced
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-table-action btn-delete"
                        onClick={() => handleDelete(loc)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Add New Coverage Zone (Lab #{labId})</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal-body">
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Postal Code / Pincode *</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      className="admin-form-input"
                      placeholder="e.g. 504102"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>City / Town *</label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      placeholder="e.g. Bhainsa"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Service Hub Address (Line 1)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Main Road, near Bus Stand"
                    value={form.addressLine1}
                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  />
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>State</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#059669', margin: 0 }}>
                  Adding this pincode immediately enables doorstep booking for customers residing in this area.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin-action btn-secondary-action"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-action btn-primary-action"
                  disabled={loading}
                >
                  {loading ? 'Adding…' : 'Add Coverage Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLocationsTab;
