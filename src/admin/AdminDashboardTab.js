import React from 'react';

const AdminDashboardTab = ({
  orders = [],
  tests = [],
  agents = [],
  labLocations = [],
  currentLab = null,
  onNavigateTab,
}) => {
  // Compute metrics
  let pendingCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let totalRevenue = 0;

  orders.forEach((o) => {
    const s = (o.orderStatus || '').toLowerCase();
    if (s === 'pending') pendingCount++;
    else if (s === 'booked' || s === 'en-route' || s === 'arrived' || s === 'sample collected') inProgressCount++;
    else if (s === 'completed' || s === 'reports ready') completedCount++;

    if (o.paymentStatus === 'PAID' || s === 'completed' || s === 'reports ready') {
      totalRevenue += Number(o.totalAmount || 0);
    }
  });

  const recentOrders = orders.slice(0, 6);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase().replace(/[^a-z]/g, '');
    return `status-${s || 'pending'}`;
  };

  return (
    <div className="admin-dashboard-tab">
      {/* Metrics Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-card-info">
            <h4>Total Bookings</h4>
            <div className="stat-number">{orders.length}</div>
            <div className="stat-desc">All-time diagnostic requests</div>
          </div>
          <div className="stat-card-icon stat-icon-blue">📋</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-info">
            <h4>Action Required</h4>
            <div className="stat-number" style={{ color: '#d97706' }}>{pendingCount}</div>
            <div className="stat-desc">New orders pending assignment</div>
          </div>
          <div className="stat-card-icon stat-icon-amber">⏳</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-info">
            <h4>In Field / Scheduled</h4>
            <div className="stat-number" style={{ color: '#0284c7' }}>{inProgressCount}</div>
            <div className="stat-desc">Booked or technician en-route</div>
          </div>
          <div className="stat-card-icon stat-icon-teal">🛵</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-info">
            <h4>Completed & Ready</h4>
            <div className="stat-number" style={{ color: '#059669' }}>{completedCount}</div>
            <div className="stat-desc">Samples collected & reports issued</div>
          </div>
          <div className="stat-card-icon stat-icon-emerald">✅</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-info">
            <h4>Realized Revenue</h4>
            <div className="stat-number" style={{ color: '#7c3aed' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-desc">From completed & paid collections</div>
          </div>
          <div className="stat-card-icon stat-icon-purple">💰</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-info">
            <h4>Active Tests</h4>
            <div className="stat-number">{tests.length}</div>
            <div className="stat-desc">Diagnostic test catalog offerings</div>
          </div>
          <div className="stat-card-icon stat-icon-blue">🔬</div>
        </div>
      </div>

      {/* Lab Overview Banner */}
      <div className="admin-panel-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              OPERATING DIAGNOSTIC LABORATORY
            </span>
            <h2 style={{ margin: '4px 0 6px', fontSize: '1.5rem', color: '#ffffff' }}>
              {currentLab?.labName || 'NationalsLab (Bhainsa)'}
            </h2>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.88rem', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span>🆔 Lab ID: <strong style={{ color: '#f8fafc' }}>{currentLab?.labId || 440287}</strong></span>
              <span>📞 Phone: <strong style={{ color: '#f8fafc' }}>{currentLab?.labContactNumber || '9701636477'}</strong></span>
              <span>📍 Coverage: <strong style={{ color: '#38bdf8' }}>{labLocations.map(l => l.postalCode).filter(Boolean).join(', ') || '504102 (Bhainsa)'}</strong></span>
              <span>🛡️ Status: <strong style={{ color: '#10b981' }}>Active / Ready</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn-admin-action"
              style={{ background: '#0891b2', color: 'white' }}
              onClick={() => onNavigateTab('orders')}
            >
              📋 Open Orders
            </button>
            <button
              className="btn-admin-action"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => onNavigateTab('tests')}
            >
              🔬 Manage Tests
            </button>
          </div>
        </div>
      </div>

      {/* Live Recent Orders Panel */}
      <div className="admin-panel-card">
        <div className="panel-card-header">
          <h3>
            <span>⚡ Recent Incoming Orders</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
              (Live Telemetry)
            </span>
          </h3>
          <button
            className="btn-admin-action btn-secondary-action"
            onClick={() => onNavigateTab('orders')}
          >
            View All ({orders.length}) →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">📭</span>
            <h4>No orders recorded yet</h4>
            <p>Customer orders booked via the web or mobile app will appear here in real time.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Patient</th>
                  <th>Collection Date / Time</th>
                  <th>Status</th>
                  <th>Tests</th>
                  <th>Amount</th>
                  <th>Assigned Agent</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.orderId}>
                    <td>
                      <strong style={{ color: '#0891b2' }}>#{ord.orderId}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.fullname}</div>
                      <small style={{ color: '#64748b' }}>{ord.mobile}</small>
                    </td>
                    <td>
                      <div>{ord.slotDate || 'Today'}</div>
                      <small style={{ color: '#64748b' }}>{ord.slotTime || 'Scheduled'}</small>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusClass(ord.orderStatus)}`}>
                        {ord.orderStatus || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <span>{ord.items?.length || 1} test(s)</span>
                    </td>
                    <td>
                      <strong>₹{ord.totalAmount || 0}</strong>
                    </td>
                    <td>
                      {ord.agentName ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>🛵 {ord.agentName}</span>
                      ) : (
                        <span style={{ color: '#d97706', fontSize: '0.8rem' }}>⚠️ Unassigned</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-table-action btn-view"
                        onClick={() => onNavigateTab('orders')}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardTab;
