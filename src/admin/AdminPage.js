import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getOrdersByLab,
  getTestsByLab,
  getAgentsByLab,
  getLabLocationsByLabId,
  getLabById,
  LAB_ID,
  DEFAULT_ADMIN_TOKEN,
  DEFAULT_ADMIN_USER,
} from '../services/api';
import AdminLogin from './AdminLogin';
import AdminDashboardTab from './AdminDashboardTab';
import AdminOrdersTab from './AdminOrdersTab';
import AdminTestsTab from './AdminTestsTab';
import AdminSlotsTab from './AdminSlotsTab';
import AdminAgentsTab from './AdminAgentsTab';
import AdminLocationsTab from './AdminLocationsTab';
import AdminBannersTab from './AdminBannersTab';
import './admin.css';

const AdminPage = () => {
  const navigate = useNavigate();

  // Authentication State with automatic upgrade of legacy/malformed tokens
  const [adminToken, setAdminToken] = useState(() => {
    const saved = localStorage.getItem('adminToken');
    if (saved && (!saved.includes('.') || saved.split('.').length !== 3)) {
      localStorage.setItem('adminToken', DEFAULT_ADMIN_TOKEN);
      return DEFAULT_ADMIN_TOKEN;
    }
    return saved || null;
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('adminUser');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && (!parsed.adminId || parsed.adminId === 440287)) {
        localStorage.setItem('adminUser', JSON.stringify(DEFAULT_ADMIN_USER));
        return DEFAULT_ADMIN_USER;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentLab, setCurrentLab] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tests, setTests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [labLocations, setLabLocations] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // New incoming orders alert banner
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const prevOrdersCountRef = useRef(0);

  const labId = currentLab?.labId || LAB_ID;

  // Load Lab Profile
  useEffect(() => {
    const fetchLabInfo = async () => {
      try {
        const labData = await getLabById(LAB_ID);
        if (labData) setCurrentLab(labData);
      } catch (err) {
        console.warn('Could not fetch lab info:', err);
      }
    };
    fetchLabInfo();
  }, []);

  // Fetch all lab data
  const refreshAllData = async () => {
    if (!adminToken) return;
    try {
      const [ordersRes, testsRes, agentsRes, locsRes] = await Promise.allSettled([
        getOrdersByLab(labId),
        getTestsByLab(labId),
        getAgentsByLab(labId),
        getLabLocationsByLabId(labId),
      ]);

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        const nextOrders = ordersRes.value;
        // Check for new incoming orders
        if (prevOrdersCountRef.current > 0 && nextOrders.length > prevOrdersCountRef.current) {
          const newest = nextOrders[0];
          setNewOrderAlert(`⚡ New booking received from ${newest.fullname || 'Patient'} (Order #${newest.orderId})`);
          setTimeout(() => setNewOrderAlert(null), 6000);
        }
        prevOrdersCountRef.current = nextOrders.length;
        setOrders(nextOrders);
      }

      if (testsRes.status === 'fulfilled' && Array.isArray(testsRes.value)) {
        setTests(testsRes.value);
      }

      if (agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value)) {
        setAgents(agentsRes.value);
      }

      if (locsRes.status === 'fulfilled' && Array.isArray(locsRes.value)) {
        setLabLocations(locsRes.value);
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    }
  };

  // Initial load
  useEffect(() => {
    if (adminToken) {
      setLoadingInitial(true);
      refreshAllData().finally(() => setLoadingInitial(false));
    }
  }, [adminToken, labId]);

  // Real-time polling every 8 seconds
  useEffect(() => {
    if (!adminToken) return;
    const interval = setInterval(() => {
      refreshAllData();
    }, 8000);
    return () => clearInterval(interval);
  }, [adminToken, labId]);

  const handleLoginSuccess = (admin, token) => {
    setAdminUser(admin);
    setAdminToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    setAdminToken(null);
  };

  if (!adminToken || !adminUser) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Count pending orders
  const pendingOrdersCount = orders.filter(
    (o) => (o.orderStatus || '').toLowerCase() === 'pending'
  ).length;

  return (
    <div className="admin-layout">
      {/* ─── Sidebar Navigation ───────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src="/nationals_2.png" alt="NationalsLab" className="admin-sidebar-logo" />
          <div className="admin-sidebar-title">
            <strong>NationalsLab</strong>
            <span>Admin Center</span>
          </div>
        </div>

        {/* Operating Lab Badge */}
        <div className="sidebar-lab-pill">
          <div className="sidebar-lab-info">
            <span className="sidebar-lab-label">Current Lab</span>
            <span className="sidebar-lab-name">{currentLab?.labName || 'NationalsLab'}</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>ID:{labId}</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="sidebar-nav-icon">📊</span>
            <span>Dashboard Overview</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span className="sidebar-nav-icon">📋</span>
            <span>Orders Management</span>
            {pendingOrdersCount > 0 && (
              <span className="sidebar-badge">{pendingOrdersCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <span className="sidebar-nav-icon">🔬</span>
            <span>Diagnostic Catalog</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'slots' ? 'active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            <span className="sidebar-nav-icon">🗓️</span>
            <span>Time Slots</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <span className="sidebar-nav-icon">🛵</span>
            <span>Phlebotomists</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            <span className="sidebar-nav-icon">📍</span>
            <span>Coverage Pincodes</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'banners' ? 'active' : ''}`}
            onClick={() => setActiveTab('banners')}
          >
            <span className="sidebar-nav-icon">🖼️</span>
            <span>Promo Banners</span>
          </button>
        </nav>

        {/* User Profile & Logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              {(adminUser.adminName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-details">
              <span className="admin-user-name">
                {adminUser.adminName?.split(' ')[0] || 'Manager'}
              </span>
              <span className="admin-user-role">Lab Administrator</span>
            </div>
          </div>
          <button
            className="admin-logout-btn"
            onClick={handleLogout}
            title="Sign Out of Admin Portal"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* ─── Main Content Workspace ───────────────────────────────────────── */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <h2>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'orders' && 'Patient Orders & Sample Collections'}
              {activeTab === 'tests' && 'Diagnostic Tests & Pricing Catalog'}
              {activeTab === 'slots' && 'Daily Appointment Time Slots'}
              {activeTab === 'agents' && 'Phlebotomist Field Personnel'}
              {activeTab === 'locations' && 'Serviced Coverage Areas & Pincodes'}
              {activeTab === 'banners' && 'Promotional Banners'}
            </h2>
          </div>

          <div className="admin-topbar-actions">
            <div className="topbar-live-badge">
              <span className="topbar-live-dot"></span>
              <span>LIVE TELEMETRY</span>
            </div>

            <button
              className="topbar-site-link"
              onClick={() => navigate('/')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              🌐 View Customer Site ↗
            </button>
          </div>
        </header>

        {/* Real-time Order Alert Toast */}
        {newOrderAlert && (
          <div
            style={{
              background: '#047857',
              color: 'white',
              padding: '12px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 600,
              fontSize: '0.92rem',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)',
            }}
          >
            <span>{newOrderAlert}</span>
            <button
              onClick={() => { setActiveTab('orders'); setNewOrderAlert(null); }}
              style={{ background: '#ffffff', color: '#047857', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
            >
              View Order →
            </button>
          </div>
        )}

        {/* Content Tabs */}
        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              orders={orders}
              tests={tests}
              agents={agents}
              labLocations={labLocations}
              currentLab={currentLab}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              agents={agents}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'tests' && (
            <AdminTestsTab
              tests={tests}
              currentLab={currentLab}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'slots' && (
            <AdminSlotsTab
              currentLab={currentLab}
            />
          )}

          {activeTab === 'agents' && (
            <AdminAgentsTab
              agents={agents}
              currentLab={currentLab}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'locations' && (
            <AdminLocationsTab
              labLocations={labLocations}
              currentLab={currentLab}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'banners' && (
            <AdminBannersTab
              currentLab={currentLab}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
