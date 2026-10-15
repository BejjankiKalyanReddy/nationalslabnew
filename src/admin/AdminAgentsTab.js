import React, { useState } from 'react';
import { approveAgent, createAgent, deleteAgent, LAB_ID } from '../services/api';

const AdminAgentsTab = ({ agents = [], currentLab = null, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    agentName: '',
    agentMobileNumber: '',
    agentEmail: '',
    agentPassword: 'password123',
    vehicleNumber: '',
    agentStatus: 'Available',
    approved: true,
  });

  const labId = currentLab?.labId || LAB_ID;

  const filteredAgents = agents.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      (a.agentName || '').toLowerCase().includes(term) ||
      (a.agentMobileNumber || '').includes(term) ||
      (a.agentEmail || '').toLowerCase().includes(term)
    );
  });

  const handleApprove = async (agent, approveStatus) => {
    try {
      await approveAgent(agent.agentId, approveStatus);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update agent status');
    }
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`Delete phlebotomist "${agent.agentName}"?`)) return;
    try {
      await deleteAgent(agent.agentId);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete agent');
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!form.agentName || !form.agentMobileNumber) {
      setError('Name and phone number are required');
      return;
    }
    setLoading(true);
    setError('');

    const payload = {
      labId: labId,
      agentName: form.agentName.trim(),
      agentMobileNumber: form.agentMobileNumber.trim(),
      agentEmail: form.agentEmail?.trim() || `${form.agentName.toLowerCase().replace(/\s+/g, '')}@phlebo.com`,
      agentPassword: form.agentPassword || 'password123',
      vehicleNumber: form.vehicleNumber?.trim() || 'TS01AB1234',
      agentStatus: form.agentStatus,
      approved: form.approved,
    };

    try {
      await createAgent(payload);
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to create phlebotomist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-agents-tab">
      <div className="panel-card-header" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search by agent name, phone, or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '340px' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-admin-action btn-secondary-action" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="btn-admin-action btn-primary-action" onClick={() => setModalOpen(true)}>
            ➕ Register Phlebotomist
          </button>
        </div>
      </div>

      {/* Agents Table Panel */}
      <div className="admin-panel-card">
        {filteredAgents.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">🛵</span>
            <h4>No field phlebotomists registered</h4>
            <p>Register phlebotomists who will be dispatched to patient homes for doorstep sample collections.</p>
            <button
              className="btn-admin-action btn-primary-action"
              style={{ marginTop: '1rem' }}
              onClick={() => setModalOpen(true)}
            >
              Register First Phlebotomist
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Agent ID</th>
                  <th>Phlebotomist</th>
                  <th>Contact</th>
                  <th>Vehicle</th>
                  <th>Verification</th>
                  <th>Field Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((ag) => (
                  <tr key={ag.agentId}>
                    <td><strong style={{ color: '#0891b2' }}>#{ag.agentId}</strong></td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ag.agentName}</div>
                      <small style={{ color: '#64748b' }}>{ag.agentEmail}</small>
                    </td>
                    <td><strong>📱 {ag.agentMobileNumber}</strong></td>
                    <td><small>{ag.vehicleNumber || 'Motorbike'}</small></td>
                    <td>
                      <button
                        className="btn-table-action"
                        style={{
                          background: ag.approved ? '#dcfce7' : '#fef3c7',
                          color: ag.approved ? '#15803d' : '#b45309',
                          fontWeight: 700,
                        }}
                        onClick={() => handleApprove(ag, !ag.approved)}
                        title="Click to toggle approval"
                      >
                        {ag.approved ? '✓ Approved' : '⏳ Pending Approval'}
                      </button>
                    </td>
                    <td>
                      <span className="status-pill status-completed">
                        {ag.agentStatus || 'Available'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-table-action btn-delete"
                          onClick={() => handleDelete(ag)}
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

      {/* Add Agent Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Register New Phlebotomist (Lab #{labId})</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAgent}>
              <div className="admin-modal-body">
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={form.agentName}
                    onChange={(e) => setForm({ ...form, agentName: e.target.value })}
                  />
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      className="admin-form-input"
                      placeholder="e.g. 9876543210"
                      value={form.agentMobileNumber}
                      onChange={(e) => setForm({ ...form, agentMobileNumber: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="admin-form-input"
                      placeholder="e.g. ramesh@phlebo.com"
                      value={form.agentEmail}
                      onChange={(e) => setForm({ ...form, agentEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Vehicle / Reg Number</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. TS 01 AB 1234"
                      value={form.vehicleNumber}
                      onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Initial Status</label>
                    <select
                      className="admin-form-select"
                      value={form.agentStatus}
                      onChange={(e) => setForm({ ...form, agentStatus: e.target.value })}
                    >
                      <option value="Available">Available for Dispatch</option>
                      <option value="Busy">Busy</option>
                      <option value="Offline">Offline</option>
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
                  {loading ? 'Registering…' : 'Save Phlebotomist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgentsTab;
