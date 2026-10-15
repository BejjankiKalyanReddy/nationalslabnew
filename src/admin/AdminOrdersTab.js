import React, { useState } from 'react';
import {
  updateOrderStatus,
  confirmOrderPayment,
  verifyOrderOtp,
  uploadFile,
} from '../services/api';

const AdminOrdersTab = ({ orders = [], agents = [], onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  // Assignment form state
  const [assignedAgentName, setAssignedAgentName] = useState('');
  const [assignedAgentPhone, setAssignedAgentPhone] = useState('');

  // Report upload state
  const [reportFile, setReportFile] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  // OTP state
  const [inputOtp, setInputOtp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const filterTabs = [
    'ALL',
    'PENDING',
    'BOOKED',
    'EN-ROUTE',
    'ARRIVED',
    'SAMPLE COLLECTED',
    'COMPLETED',
    'CANCELLED',
  ];

  const filteredOrders = orders.filter((o) => {
    const s = (o.orderStatus || '').toUpperCase();
    const matchesFilter = filterStatus === 'ALL' || s === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (o.orderId?.toString() || '').includes(term) ||
      (o.fullname || '').toLowerCase().includes(term) ||
      (o.mobile || '').includes(term) ||
      (o.addressDetails || '').toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase().replace(/[^a-z]/g, '');
    return `status-${s || 'pending'}`;
  };

  const handleOpenAssign = (ord) => {
    setSelectedOrder(ord);
    setAssignedAgentName(ord.agentName || (agents[0]?.agentName || ''));
    setAssignedAgentPhone(ord.agentPhone || (agents[0]?.agentMobileNumber || ''));
    setActionError('');
    setAssignModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignedAgentName || !assignedAgentPhone) {
      setActionError('Please specify phlebotomist name and phone');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await updateOrderStatus(
        selectedOrder.orderId,
        'BOOKED',
        assignedAgentName.trim(),
        assignedAgentPhone.trim()
      );
      setAssignModalOpen(false);
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to assign agent');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatusDirect = async (ord, newStatus) => {
    if (!window.confirm(`Update order #${ord.orderId} status to "${newStatus}"?`)) return;
    try {
      await updateOrderStatus(ord.orderId, newStatus, ord.agentName, ord.agentPhone, ord.reportUrl);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConfirmPayment = async (ord) => {
    if (!window.confirm(`Confirm collection of payment ₹${ord.totalAmount} for Order #${ord.orderId}?`)) return;
    try {
      await confirmOrderPayment(ord.orderId, 'LAB_ADMIN');
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to confirm payment');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!inputOtp || inputOtp.trim().length !== 4) {
      setActionError('Please enter the 4-digit code provided by the patient');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await verifyOrderOtp(selectedOrder.orderId, inputOtp.trim());
      setOtpModalOpen(false);
      setInputOtp('');
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Invalid verification code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!reportFile) {
      setActionError('Please select a report PDF or image file');
      return;
    }
    setUploadingReport(true);
    setActionError('');
    try {
      const upRes = await uploadFile(reportFile, 'reports');
      const fileUrl = upRes.url || upRes.fileUrl;
      await updateOrderStatus(
        selectedOrder.orderId,
        'COMPLETED',
        selectedOrder.agentName,
        selectedOrder.agentPhone,
        fileUrl
      );
      setReportModalOpen(false);
      setReportFile(null);
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Report upload failed');
    } finally {
      setUploadingReport(false);
    }
  };

  return (
    <div className="admin-orders-tab">
      {/* Search & Actions Bar */}
      <div className="panel-card-header" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by Patient, Order #, Phone, Address…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '380px' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              ✕
            </button>
          )}
        </div>

        <button className="btn-admin-action btn-secondary-action" onClick={onRefresh}>
          🔄 Refresh Orders
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs">
        {filterTabs.map((tab) => {
          const count = tab === 'ALL'
            ? orders.length
            : orders.filter((o) => (o.orderStatus || '').toUpperCase() === tab).length;
          return (
            <button
              key={tab}
              className={`admin-tab-btn ${filterStatus === tab ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab)}
            >
              <span>{tab}</span>
              <span style={{ opacity: 0.8, fontSize: '0.74rem' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table Panel */}
      <div className="admin-panel-card">
        {filteredOrders.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">📋</span>
            <h4>No {filterStatus !== 'ALL' ? filterStatus : ''} orders found</h4>
            <p>Orders matching your filter will be displayed here.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Patient & Contact</th>
                  <th>Address & Collection</th>
                  <th>Scheduled Slot</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Assigned Agent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => (
                  <tr key={ord.orderId}>
                    <td>
                      <strong style={{ color: '#0891b2', fontSize: '0.95rem' }}>#{ord.orderId}</strong>
                      {ord.prescriptionUrl && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            className="btn-table-action btn-view"
                            style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                            onClick={() => { setSelectedOrder(ord); setRxModalOpen(true); }}
                          >
                            📄 View Rx
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ord.fullname}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>📱 {ord.mobile}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '240px', fontSize: '0.82rem', lineHeight: '1.3' }}>
                        {ord.addressDetails || 'Clinic Visit'}
                      </div>
                      <small style={{ color: '#0891b2', fontWeight: 600 }}>
                        {ord.collectionType === 'home' ? '🏠 Home Collection' : '🏥 Clinic Visit'}
                      </small>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.slotDate}</div>
                      <small style={{ color: '#64748b' }}>{ord.slotTime || '9 AM - 1 PM'}</small>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusClass(ord.orderStatus)}`}>
                        {ord.orderStatus || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div><strong>₹{ord.totalAmount || 0}</strong></div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: ord.paymentStatus === 'PAID' ? '#15803d' : '#b45309',
                        }}
                      >
                        {ord.paymentStatus === 'PAID' ? '✓ PAID' : 'PENDING'}
                      </span>
                      {ord.paymentStatus !== 'PAID' && (
                        <div>
                          <button
                            className="btn-table-action"
                            style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem', marginTop: '3px' }}
                            onClick={() => handleConfirmPayment(ord)}
                          >
                            Mark Paid
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {ord.agentName ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#047857' }}>🛵 {ord.agentName}</div>
                          <small style={{ color: '#64748b' }}>{ord.agentPhone}</small>
                        </div>
                      ) : (
                        <button
                          className="btn-table-action btn-assign"
                          onClick={() => handleOpenAssign(ord)}
                        >
                          + Assign Agent
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-table-action btn-view"
                          onClick={() => setSelectedOrder(ord)}
                          title="View order details"
                        >
                          Details
                        </button>

                        {/* Status update quick buttons */}
                        {ord.orderStatus?.toLowerCase() === 'pending' && (
                          <button
                            className="btn-table-action btn-assign"
                            onClick={() => handleOpenAssign(ord)}
                          >
                            Assign
                          </button>
                        )}

                        {ord.orderStatus?.toLowerCase() === 'booked' && (
                          <button
                            className="btn-table-action"
                            style={{ background: '#fef9c3', color: '#a16207' }}
                            onClick={() => handleUpdateStatusDirect(ord, 'EN-ROUTE')}
                          >
                            En-Route
                          </button>
                        )}

                        {ord.orderStatus?.toLowerCase() === 'en-route' && (
                          <button
                            className="btn-table-action"
                            style={{ background: '#dbeafe', color: '#1d4ed8' }}
                            onClick={() => handleUpdateStatusDirect(ord, 'ARRIVED')}
                          >
                            Arrived
                          </button>
                        )}

                        {ord.orderStatus?.toLowerCase() === 'arrived' && (
                          <button
                            className="btn-table-action"
                            style={{ background: '#f3e8ff', color: '#7e22ce' }}
                            onClick={() => { setSelectedOrder(ord); setOtpModalOpen(true); }}
                          >
                            Verify OTP
                          </button>
                        )}

                        {(ord.orderStatus?.toLowerCase() === 'sample collected' ||
                          ord.orderStatus?.toLowerCase() === 'arrived') && (
                          <button
                            className="btn-table-action btn-upload-report"
                            onClick={() => { setSelectedOrder(ord); setReportModalOpen(true); }}
                          >
                            Upload Report
                          </button>
                        )}

                        {ord.reportUrl && (
                          <a
                            href={ord.reportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-table-action"
                            style={{ background: '#ecfdf5', color: '#047857', textDecoration: 'none' }}
                          >
                            📄 Report
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Order Details Modal ───────────────────────────────────── */}
      {selectedOrder && !assignModalOpen && !reportModalOpen && !rxModalOpen && !otpModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Order Details #{selectedOrder.orderId}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="order-details-box">
                <div className="order-detail-line">
                  <span>Patient Name:</span>
                  <span>{selectedOrder.fullname}</span>
                </div>
                <div className="order-detail-line">
                  <span>Phone Number:</span>
                  <span>{selectedOrder.mobile}</span>
                </div>
                <div className="order-detail-line">
                  <span>Collection Type:</span>
                  <span>{selectedOrder.collectionType === 'home' ? 'Home Sample Collection' : 'Clinic Visit'}</span>
                </div>
                <div className="order-detail-line">
                  <span>Address Details:</span>
                  <span style={{ maxWidth: '300px', textAlign: 'right' }}>{selectedOrder.addressDetails}</span>
                </div>
                <div className="order-detail-line">
                  <span>Appointment Slot:</span>
                  <span>{selectedOrder.slotDate} • {selectedOrder.slotTime}</span>
                </div>
                <div className="order-detail-line">
                  <span>Status:</span>
                  <span className={`status-pill ${getStatusClass(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div className="order-detail-line">
                  <span>Payment Mode:</span>
                  <span>{selectedOrder.paymentMode || 'CASH'} ({selectedOrder.paymentStatus || 'PENDING'})</span>
                </div>
                <div className="order-detail-line">
                  <span>Total Amount:</span>
                  <span style={{ fontSize: '1.1rem', color: '#0891b2' }}>₹{selectedOrder.totalAmount}</span>
                </div>
                <div className="order-detail-line">
                  <span>Assigned Phlebotomist:</span>
                  <span>{selectedOrder.agentName ? `${selectedOrder.agentName} (${selectedOrder.agentPhone})` : 'Unassigned'}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>Booked Tests</h4>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedOrder.items.map((it, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: '#f8fafc',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span>{it.testName || it.name}</span>
                        <strong>₹{it.price || it.currate || 0}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Tests details bundled under lab collection.</p>
                )}
              </div>

              {selectedOrder.prescriptionUrl && (
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Doctor's Prescription</h4>
                  <a
                    href={selectedOrder.prescriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-admin-action btn-secondary-action"
                    style={{ fontSize: '0.85rem' }}
                  >
                    📄 View Uploaded Prescription
                  </a>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                className="btn-admin-action btn-secondary-action"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
              <button
                className="btn-admin-action btn-primary-action"
                onClick={() => handleOpenAssign(selectedOrder)}
              >
                Assign / Re-Assign Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Assign Phlebotomist Modal ─────────────────────────────── */}
      {assignModalOpen && selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Assign Field Agent (Order #{selectedOrder.orderId})</h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAssignment}>
              <div className="admin-modal-body">
                {actionError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {actionError}
                  </div>
                )}

                {agents.length > 0 && (
                  <div className="admin-form-group">
                    <label>Select From Registered Phlebotomists</label>
                    <select
                      className="admin-form-select"
                      onChange={(e) => {
                        const ag = agents.find((a) => a.agentName === e.target.value);
                        if (ag) {
                          setAssignedAgentName(ag.agentName);
                          setAssignedAgentPhone(ag.agentMobileNumber);
                        }
                      }}
                    >
                      <option value="">-- Choose Phlebotomist --</option>
                      {agents.map((ag) => (
                        <option key={ag.agentId} value={ag.agentName}>
                          {ag.agentName} ({ag.agentMobileNumber}) {ag.approved ? '✓ Verified' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Agent / Phlebotomist Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={assignedAgentName}
                    onChange={(e) => setAssignedAgentName(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Agent Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="admin-form-input"
                    placeholder="e.g. 9876543210"
                    value={assignedAgentPhone}
                    onChange={(e) => setAssignedAgentPhone(e.target.value)}
                  />
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Assigning will update the order status to <strong>BOOKED</strong> and send patient collection details to the field technician.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin-action btn-secondary-action"
                  onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-action btn-primary-action"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Assigning…' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Upload Report Modal ───────────────────────────────────── */}
      {reportModalOpen && selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Upload Diagnostic Report (Order #{selectedOrder.orderId})</h3>
              <button
                onClick={() => setReportModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUploadReport}>
              <div className="admin-modal-body">
                {actionError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {actionError}
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Select Report File (PDF or Image) *</label>
                  <input
                    type="file"
                    required
                    accept="application/pdf,image/*"
                    onChange={(e) => setReportFile(e.target.files[0])}
                    className="admin-form-input"
                  />
                  <small style={{ color: '#64748b' }}>Maximum file size: 15MB</small>
                </div>

                <div className="order-details-box">
                  <div className="order-detail-line">
                    <span>Patient:</span>
                    <span>{selectedOrder.fullname}</span>
                  </div>
                  <div className="order-detail-line">
                    <span>Tests:</span>
                    <span>{selectedOrder.items?.map(it => it.testName).join(', ') || 'Diagnostic tests'}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#059669', margin: 0 }}>
                  Once uploaded, the report will be instantly available in the patient's profile and mobile app.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin-action btn-secondary-action"
                  onClick={() => setReportModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-action btn-primary-action"
                  disabled={uploadingReport}
                >
                  {uploadingReport ? 'Uploading Report…' : 'Upload & Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 4: Verify OTP Modal ──────────────────────────────────────── */}
      {otpModalOpen && selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setOtpModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="admin-modal-header">
              <h3>Verify Patient Collection Code</h3>
              <button
                onClick={() => setOtpModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleVerifyOtp}>
              <div className="admin-modal-body">
                {actionError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {actionError}
                  </div>
                )}
                <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                  Ask patient <strong>{selectedOrder.fullname}</strong> for their 4-digit safety code shown on their tracking screen.
                </p>

                <div className="admin-form-group">
                  <label>4-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="e.g. 4821"
                    className="admin-form-input"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '8px', fontWeight: 800 }}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin-action btn-secondary-action"
                  onClick={() => setOtpModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-action btn-primary-action"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Verifying…' : 'Verify & Collect Sample'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 5: Prescription Viewer Modal ──────────────────────────────── */}
      {rxModalOpen && selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setRxModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header">
              <h3>Doctor's Prescription (Order #{selectedOrder.orderId})</h3>
              <button
                onClick={() => setRxModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <img
                src={selectedOrder.prescriptionUrl}
                alt="Prescription"
                style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '8px' }}
              />
              <div style={{ marginTop: '1rem' }}>
                <a
                  href={selectedOrder.prescriptionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-admin-action btn-secondary-action"
                >
                  Open in New Tab ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersTab;
