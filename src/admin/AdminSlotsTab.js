import React, { useState, useEffect } from 'react';
import { getAdminSlots, createBatchSlots, deleteAdminSlot, LAB_ID } from '../services/api';

const TIME_WINDOW_MAP = {
  '6 AM - 8 AM': { start: '06:00:00', end: '08:00:00' },
  '8 AM - 10 AM': { start: '08:00:00', end: '10:00:00' },
  '7 AM - 10 AM': { start: '07:00:00', end: '10:00:00' },
  '9 AM - 11 AM': { start: '09:00:00', end: '11:00:00' },
  '10 AM - 1 PM': { start: '10:00:00', end: '13:00:00' },
  '11 AM - 1 PM': { start: '11:00:00', end: '13:00:00' },
  '1 PM - 4 PM': { start: '13:00:00', end: '16:00:00' },
  '2 PM - 4 PM': { start: '14:00:00', end: '16:00:00' },
  '4 PM - 6 PM': { start: '16:00:00', end: '18:00:00' },
  '4 PM - 7 PM': { start: '16:00:00', end: '19:00:00' },
  '7 PM - 9 PM': { start: '19:00:00', end: '21:00:00' },
};

const parseTimeWindow = (str) => {
  if (TIME_WINDOW_MAP[str]) return TIME_WINDOW_MAP[str];
  const parts = str.split('-').map((s) => s.trim());
  const to24 = (tStr) => {
    const match = tStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
    if (!match) return '09:00:00';
    let h = parseInt(match[1], 10);
    const m = match[2] || '00';
    const ampm = (match[3] || '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}:00`;
  };
  return {
    start: parts[0] ? to24(parts[0]) : '09:00:00',
    end: parts[1] ? to24(parts[1]) : '11:00:00',
  };
};

const formatSlotTime = (s) => {
  if (s.slotTime) return s.slotTime;
  if (s.startTime && s.endTime) {
    const fmt = (t) => {
      const parts = t.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1] || '00';
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}${m !== '00' ? ':' + m : ''} ${ampm}`;
    };
    return `${fmt(s.startTime)} - ${fmt(s.endTime)}`;
  }
  return 'Operational Window';
};

const AdminSlotsTab = ({ currentLab = null }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Batch slot form
  const [batchDates, setBatchDates] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([
    '7 AM - 10 AM',
    '10 AM - 1 PM',
    '1 PM - 4 PM',
    '4 PM - 7 PM',
  ]);

  const labId = currentLab?.labId || LAB_ID;

  const standardTimes = [
    '6 AM - 8 AM',
    '8 AM - 10 AM',
    '7 AM - 10 AM',
    '10 AM - 1 PM',
    '1 PM - 4 PM',
    '4 PM - 7 PM',
    '7 PM - 9 PM',
  ];

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await getAdminSlots(labId);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading slots:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [labId]);

  // Generate next 7 days helper
  const getNext14Days = () => {
    const list = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  };

  const handleToggleTime = (time) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleToggleDate = (date) => {
    if (batchDates.includes(date)) {
      setBatchDates(batchDates.filter((d) => d !== date));
    } else {
      setBatchDates([...batchDates, date]);
    }
  };

  const handleSelectAllNext7Days = () => {
    const next7 = getNext14Days().slice(0, 7);
    setBatchDates(next7);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (batchDates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    if (selectedTimes.length === 0) {
      setError('Please select at least one time window');
      return;
    }

    setActionLoading(true);
    setError('');

    // Construct batch payload matching backend TimeSlotModel
    const batchList = [];
    batchDates.forEach((date) => {
      selectedTimes.forEach((time) => {
        const parsed = parseTimeWindow(time);
        batchList.push({
          labId: labId,
          slotDate: date,
          startTime: parsed.start,
          endTime: parsed.end,
          available: true,
          maxBookings: 10,
        });
      });
    });

    try {
      await createBatchSlots(batchList);
      setModalOpen(false);
      loadSlots();
    } catch (err) {
      setError(err.message || 'Failed to create slot batch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this collection slot?')) return;
    try {
      await deleteAdminSlot(slotId);
      loadSlots();
    } catch (err) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  const filteredSlots = selectedDate
    ? slots.filter((s) => s.slotDate === selectedDate)
    : slots;

  // Group slots by date
  const groupedDates = Array.from(new Set(slots.map((s) => s.slotDate).filter(Boolean))).sort();

  return (
    <div className="admin-slots-tab">
      <div className="panel-card-header" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            className="admin-form-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px 12px', minWidth: '180px' }}
          >
            <option value="">All Scheduled Dates ({slots.length} slots)</option>
            {groupedDates.map((d) => (
              <option key={d} value={d}>
                📅 {d} ({slots.filter((s) => s.slotDate === d).length} slots)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-admin-action btn-secondary-action" onClick={loadSlots}>
            🔄 Refresh
          </button>
          <button
            className="btn-admin-action btn-primary-action"
            onClick={() => {
              setBatchDates(getNext14Days().slice(0, 7));
              setModalOpen(true);
            }}
          >
            ➕ Generate Slot Batches
          </button>
        </div>
      </div>

      {/* Slots Table Panel */}
      <div className="admin-panel-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading lab appointment slots…
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">🗓️</span>
            <h4>No appointment slots configured</h4>
            <p>Generate slots for the week so patients can choose morning and afternoon collection windows.</p>
            <button
              className="btn-admin-action btn-primary-action"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setBatchDates(getNext14Days().slice(0, 7));
                setModalOpen(true);
              }}
            >
              Generate Weekly Slots
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Slot ID</th>
                  <th>Date</th>
                  <th>Time Window</th>
                  <th>Capacity</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map((s) => (
                  <tr key={s.slotId}>
                    <td><strong style={{ color: '#0891b2' }}>#{s.slotId}</strong></td>
                    <td><strong>{s.slotDate}</strong></td>
                    <td><span className="status-pill status-booked">🕐 {formatSlotTime(s)}</span></td>
                    <td>{s.maxBookings || s.capacity || 10} bookings</td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        {s.available ? 'Available' : 'Booked'}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-completed">Active</span>
                    </td>
                    <td>
                      <button
                        className="btn-table-action btn-delete"
                        onClick={() => handleDeleteSlot(s.slotId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Create Slots Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <h3>Generate Appointment Slots (Lab #{labId})</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBatch}>
              <div className="admin-modal-body">
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Select Target Dates:</label>
                    <button
                      type="button"
                      className="btn-table-action"
                      style={{ background: '#e0f2fe', color: '#0369a1' }}
                      onClick={handleSelectAllNext7Days}
                    >
                      Select Next 7 Days
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                    {getNext14Days().map((date) => {
                      const isSelected = batchDates.includes(date);
                      return (
                        <button
                          type="button"
                          key={date}
                          className="admin-tab-btn"
                          style={{
                            background: isSelected ? '#0891b2' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#334155',
                            borderColor: isSelected ? '#0891b2' : '#cbd5e1',
                            justifyContent: 'center',
                          }}
                          onClick={() => handleToggleDate(date)}
                        >
                          {date}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>
                    Select Time Windows:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {standardTimes.map((time) => {
                      const isSelected = selectedTimes.includes(time);
                      return (
                        <button
                          type="button"
                          key={time}
                          className="admin-tab-btn"
                          style={{
                            background: isSelected ? '#059669' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#334155',
                            borderColor: isSelected ? '#059669' : '#cbd5e1',
                            justifyContent: 'center',
                          }}
                          onClick={() => handleToggleTime(time)}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="order-details-box">
                  <div className="order-detail-line">
                    <span>Total Slots to Generate:</span>
                    <strong style={{ color: '#0891b2', fontSize: '1.1rem' }}>
                      {batchDates.length * selectedTimes.length} slots
                    </strong>
                  </div>
                  <small style={{ color: '#64748b' }}>
                    ({batchDates.length} days × {selectedTimes.length} windows per day with capacity of 10 bookings each)
                  </small>
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
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating Slots…' : 'Generate Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSlotsTab;
