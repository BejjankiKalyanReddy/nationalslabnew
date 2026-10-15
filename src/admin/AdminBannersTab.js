import React, { useState, useEffect } from 'react';
import { getBannersByLab, createBanner, deleteBanner, uploadFile, LAB_ID } from '../services/api';

const AdminBannersTab = ({ currentLab = null }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [title, setTitle] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const labId = currentLab?.labId || LAB_ID;

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getBannersByLab(labId);
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading banners:', err);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [labId]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = (ev) => setFilePreview(ev.target.result);
      r.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a banner image');
      return;
    }
    setActionLoading(true);
    setError('');

    try {
      const upRes = await uploadFile(file, 'banners');
      const bannerUrl = upRes.url || upRes.fileUrl;
      await createBanner({
        labId: labId,
        bannerUrl: bannerUrl,
        title: title || 'Promotional Offer',
      });
      setModalOpen(false);
      setFile(null);
      setFilePreview(null);
      setTitle('');
      loadBanners();
    } catch (err) {
      setError(err.message || 'Failed to upload banner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Delete this promotional banner?')) return;
    try {
      await deleteBanner(bannerId);
      loadBanners();
    } catch (err) {
      alert(err.message || 'Failed to delete banner');
    }
  };

  return (
    <div className="admin-banners-tab">
      <div className="panel-card-header" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>🖼️ Lab Promotional Banners</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Banners displayed on the customer mobile app and web homepage carousel.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-admin-action btn-secondary-action" onClick={loadBanners}>
            🔄 Refresh
          </button>
          <button className="btn-admin-action btn-primary-action" onClick={() => setModalOpen(true)}>
            ➕ Upload Banner
          </button>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="admin-panel-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading promotional banners…
          </div>
        ) : banners.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">🖼️</span>
            <h4>No promotional banners active</h4>
            <p>Upload banners to highlight health checkup packages and festive discounts.</p>
            <button
              className="btn-admin-action btn-primary-action"
              style={{ marginTop: '1rem' }}
              onClick={() => setModalOpen(true)}
            >
              Upload First Banner
            </button>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {banners.map((b) => (
              <div
                key={b.bannerId || b.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <img
                  src={b.bannerUrl || b.image}
                  alt="Banner"
                  style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                />
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    {b.title || `Banner #${b.bannerId}`}
                  </span>
                  <button
                    className="btn-table-action btn-delete"
                    onClick={() => handleDelete(b.bannerId || b.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Banner Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Upload Promotional Banner (Lab #{labId})</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="admin-modal-body">
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Banner Title (Optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Monsoon Health Checkup 50% Off"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Select Banner Image (PNG or JPG) *</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    className="admin-form-input"
                    onChange={handleFileChange}
                  />
                  <small style={{ color: '#64748b' }}>Recommended dimensions: 1200 x 400 px</small>
                </div>

                {filePreview && (
                  <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <img
                      src={filePreview}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                  </div>
                )}
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
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Uploading…' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBannersTab;
