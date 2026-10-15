import React, { useState } from 'react';
import { createTest, updateTest, deleteTest, LAB_ID } from '../services/api';

const AdminTestsTab = ({ tests = [], currentLab = null, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    testName: '',
    testDescription: '',
    testOriginalPrice: '',
    testDiscountedPrice: '',
    categoryName: 'Blood Test',
    testType: 'Blood Test',
    testReportTime: '24 Hours',
    testAvailability: 1,
  });

  const categories = [
    'ALL',
    ...Array.from(new Set(tests.map((t) => t.categoryName).filter(Boolean))),
  ];

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      (t.testName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.testDescription || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      categoryFilter === 'ALL' ||
      (t.categoryName || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingTest(null);
    setForm({
      testName: '',
      testDescription: '',
      testOriginalPrice: '',
      testDiscountedPrice: '',
      categoryName: 'Biochemistry',
      testType: 'Blood Test',
      testReportTime: '24 Hours',
      testAvailability: 1,
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTest(t);
    setForm({
      testName: t.testName || '',
      testDescription: t.testDescription || '',
      testOriginalPrice: t.testOriginalPrice || '',
      testDiscountedPrice: t.testDiscountedPrice || '',
      categoryName: t.categoryName || 'Biochemistry',
      testType: t.testType || 'Blood Test',
      testReportTime: t.testReportTime || '24 Hours',
      testAvailability: t.testAvailability ?? 1,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.testName || !form.testDiscountedPrice) {
      setError('Test name and discounted price are required');
      return;
    }

    setLoading(true);
    setError('');

    const labIdToUse = currentLab?.labId || LAB_ID;

    const payload = {
      ...(editingTest ? { testId: editingTest.testId } : {}),
      labId: labIdToUse,
      testName: form.testName.trim(),
      testDescription: form.testDescription?.trim() || 'Standard diagnostic analysis',
      testOriginalPrice: parseFloat(form.testOriginalPrice || form.testDiscountedPrice),
      testDiscountedPrice: parseFloat(form.testDiscountedPrice),
      categoryName: form.categoryName,
      testType: form.testType,
      testReportTime: form.testReportTime,
      testAvailability: form.testAvailability ? 1 : 0,
    };

    try {
      if (editingTest) {
        await updateTest(payload);
      } else {
        await createTest(payload);
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to save test');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (t) => {
    try {
      const updated = {
        ...t,
        testAvailability: t.testAvailability === 1 ? 0 : 1,
      };
      await updateTest(updated);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update test availability');
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Are you sure you want to delete test "${t.testName}"?`)) return;
    try {
      await deleteTest(t.testId);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete test');
    }
  };

  return (
    <div className="admin-tests-tab">
      {/* Header and Controls */}
      <div className="panel-card-header" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search test by name or description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '340px' }}
          />

          <select
            className="admin-form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', minWidth: '160px' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button className="btn-admin-action btn-primary-action" onClick={handleOpenAdd}>
          ➕ Add New Test
        </button>
      </div>

      {/* Tests Table */}
      <div className="admin-panel-card">
        {filteredTests.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">🔬</span>
            <h4>No tests found</h4>
            <p>Try adjusting your search query or add a new test.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Test Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Original Price</th>
                  <th>Discounted Price</th>
                  <th>Report Time</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((t) => (
                  <tr key={t.testId}>
                    <td><strong style={{ color: '#0891b2' }}>#{t.testId}</strong></td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.testName}</div>
                      <small style={{ color: '#64748b', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.testDescription}
                      </small>
                    </td>
                    <td><span className="status-pill status-booked">{t.categoryName || 'General'}</span></td>
                    <td><small>{t.testType || 'Blood Test'}</small></td>
                    <td>
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                        ₹{t.testOriginalPrice || t.testDiscountedPrice}
                      </span>
                    </td>
                    <td><strong style={{ color: '#059669', fontSize: '0.95rem' }}>₹{t.testDiscountedPrice}</strong></td>
                    <td><small>{t.testReportTime || '24h'}</small></td>
                    <td>
                      <button
                        className="btn-table-action"
                        style={{
                          background: t.testAvailability === 1 ? '#dcfce7' : '#fee2e2',
                          color: t.testAvailability === 1 ? '#15803d' : '#b91c1c',
                          fontWeight: 700,
                        }}
                        onClick={() => handleToggleAvailability(t)}
                        title="Click to toggle availability"
                      >
                        {t.testAvailability === 1 ? '✓ Active' : '✕ Disabled'}
                      </button>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-table-action btn-view"
                          onClick={() => handleOpenEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-table-action btn-delete"
                          onClick={() => handleDelete(t)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Test Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingTest ? `Edit Test #${editingTest.testId}` : 'Add New Diagnostic Test'}</h3>
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

                <div className="admin-form-group">
                  <label>Test Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="e.g. Complete Blood Count (CBC) with ESR"
                    value={form.testName}
                    onChange={(e) => setForm({ ...form, testName: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Description / Clinical Significance</label>
                  <textarea
                    rows={3}
                    className="admin-form-textarea"
                    placeholder="Brief description of the test and what it diagnoses..."
                    value={form.testDescription}
                    onChange={(e) => setForm({ ...form, testDescription: e.target.value })}
                  />
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Original MRP (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="e.g. 500"
                      value={form.testOriginalPrice}
                      onChange={(e) => setForm({ ...form, testOriginalPrice: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Discounted Price (₹) *</label>
                    <input
                      type="number"
                      required
                      className="admin-form-input"
                      placeholder="e.g. 350"
                      value={form.testDiscountedPrice}
                      onChange={(e) => setForm({ ...form, testDiscountedPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Vitamins, Biochemistry, Profiles"
                      value={form.categoryName}
                      onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Sample / Test Type</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Blood Test, Urine Analysis"
                      value={form.testType}
                      onChange={(e) => setForm({ ...form, testType: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Turnaround / Report Time</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 24 Hours"
                      value={form.testReportTime}
                      onChange={(e) => setForm({ ...form, testReportTime: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Availability</label>
                    <select
                      className="admin-form-select"
                      value={form.testAvailability}
                      onChange={(e) => setForm({ ...form, testAvailability: Number(e.target.value) })}
                    >
                      <option value={1}>Available for Booking (Active)</option>
                      <option value={0}>Disabled / Out of Stock</option>
                    </select>
                  </div>
                </div>
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
                  {loading ? 'Saving…' : editingTest ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestsTab;
