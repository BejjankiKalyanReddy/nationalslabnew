import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createOrder,
  getAvailableSlots,
  getAddressesByUser,
  getFamilyProfiles,
  uploadFile,
  LAB_ID,
} from '../services/api';

const BookingModal = ({ cart, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);
  const [step, setStep] = useState(1); // 1=details 2=slot 3=confirm
  const [slots, setSlots] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [familyProfiles, setFamilyProfiles] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('self');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState(null);

  const [form, setForm] = useState({
    fullname: user?.fullname || '',
    mobile: user?.mobileNumber || '',
    collectionType: 'home',
    addressDetails: '',
    selectedAddressId: '',
    slotDate: '',
    slotTime: '',
    slotId: null,
    paymentMode: 'CASH',
  });


  const getTestName = (t) => t.testName || t.name || 'Test';
  const getTestPrice = (t) => parseFloat(t.testDiscountedPrice ?? t.currate ?? t.price ?? 0);
  const getTestId = (t) => t.testId ?? t.test_id ?? t.id ?? null;

  const totalAmount = cart.reduce((s, t) => s + getTestPrice(t), 0);

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadFamilyProfiles();
    }
  }, [user]);

  const loadFamilyProfiles = async () => {
    try {
      const data = await getFamilyProfiles(user.user_id);
      setFamilyProfiles(data || []);
    } catch (_) {}
  };

  const handleSelectMember = (member) => {
    if (member === 'self') {
      setSelectedMemberId('self');
      setForm((p) => ({
        ...p,
        fullname: user?.fullname || '',
        mobile: user?.mobileNumber || '',
      }));
    } else {
      setSelectedMemberId(member.profileId);
      setForm((p) => ({
        ...p,
        fullname: member.fullname,
        mobile: member.mobile,
      }));
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await getAddressesByUser(user.user_id);
      setAddresses(data || []);
      // Auto-fill first address if available
      if (data && data.length > 0) {
        const a = data[0];
        const combined = [a.address_line1, a.address_line2, a.city, a.state, a.postal_code]
          .filter(Boolean).join(', ');
        setForm((p) => ({ ...p, addressDetails: combined, selectedAddressId: a.address_id }));
      }
    } catch (_) {}
  };

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const data = await getAvailableSlots(LAB_ID);
      setSlots(data || []);
    } catch (_) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNext = async () => {
    setError('');
    if (step === 1) {
      if (!form.fullname || !form.mobile) {
        setError('Please fill in your name and mobile number');
        return;
      }
      if (form.collectionType === 'home' && !form.addressDetails) {
        setError('Please provide your address for home collection');
        return;
      }
      await loadSlots();
      setStep(2);
    } else if (step === 2) {
      if (!form.slotDate || !form.slotTime) {
        setError('Please select a date and time slot');
        return;
      }
      setStep(3);
    }
  };

  const formatSlotTime = (slot) => {
    if (!slot) return '';
    if (slot.slotTime) return slot.slotTime;
    if (slot.startTime && slot.endTime) {
      const fmt = (t) => {
        const parts = t.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}${m !== '00' ? ':' + m : ''} ${ampm}`;
      };
      return `${fmt(slot.startTime)} - ${fmt(slot.endTime)}`;
    }
    return 'Operational Window';
  };

  const handleSelectSlot = (slot) => {
    const formatted = formatSlotTime(slot);
    setForm((p) => ({
      ...p,
      slotDate: slot.slotDate,
      slotTime: formatted,
      slotId: slot.slotId,
    }));
  };

  const handleSelectAddress = (addr) => {
    const combined = [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.postal_code]
      .filter(Boolean).join(', ');
    setForm((p) => ({ ...p, addressDetails: combined, selectedAddressId: addr.address_id }));
  };

  // Generate next 7 days for manual date selection
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const defaultTimeSlots = [
    '7 AM - 10 AM',
    '10 AM - 1 PM',
    '1 PM - 4 PM',
    '4 PM - 7 PM',
  ];

  const handlePrescriptionChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Prescription file size exceeds 10MB limit');
      return;
    }
    setError('');
    setPrescriptionFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPrescriptionPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview(null);
    }
  };

  const handleRemovePrescription = () => {
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const mappedItems = cart.map((t) => ({
        testId: getTestId(t),
        testName: getTestName(t),
        price: getTestPrice(t),
      }));

      const missingIdItem = mappedItems.find((it) => !it.testId);
      if (missingIdItem) {
        setError(`Unable to book "${missingIdItem.testName}": Test ID is missing. Please refresh the page.`);
        setSubmitting(false);
        return;
      }

      // Upload prescription if attached
      let uploadedPrescriptionUrl = null;
      if (prescriptionFile) {
        try {
          const upRes = await uploadFile(prescriptionFile, 'prescriptions');
          uploadedPrescriptionUrl = upRes.url || upRes.fileUrl || null;
        } catch (upErr) {
          console.warn('Prescription upload warning:', upErr);
        }
      }

      const orderPayload = {
        userId: user.user_id || user.id,
        labId: LAB_ID,
        fullname: form.fullname,
        mobile: form.mobile,
        addressDetails: form.collectionType === 'home' ? form.addressDetails : 'Clinic Visit',
        collectionType: form.collectionType,
        slotDate: form.slotDate,
        slotTime: form.slotTime,
        slotId: form.slotId || null,
        paymentMode: form.paymentMode,
        totalAmount: totalAmount,
        prescriptionUrl: uploadedPrescriptionUrl,
        items: mappedItems,
      };
      const created = await createOrder(orderPayload);
      onSuccess(created);
    } catch (e) {
      setError(e.message || 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const d = slot.slotDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="booking-modal">
        <div className="modal-header">
          <h2>Book Diagnostic Tests</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Stepper */}
        <div className="booking-stepper">
          {['Patient Details', 'Select Slot', 'Confirm'].map((label, i) => (
            <div key={i} className={`step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
              <div className="step-circle">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {/* Cart Summary */}
          <div className="booking-cart-summary">
            <strong>Selected Tests ({cart.length}):</strong>
            <div className="booking-tests">
              {cart.map((t, i) => (
                <span key={i} className="booking-test-tag">
                  {getTestName(t)} — ₹{getTestPrice(t)}
                </span>
              ))}
            </div>
            <div className="booking-total">Total: <strong>₹{totalAmount}</strong></div>
          </div>

          {error && <div className="booking-error">{error}</div>}

          {/* Step 1: Patient Details */}
          {step === 1 && (
            <div className="step-content">
              <h3>Patient Information</h3>

              {familyProfiles.length > 0 && (
                <div className="form-group">
                  <label>Who is this test for? *</label>
                  <div className="member-selection-pills">
                    <button
                      type="button"
                      className={`member-pill ${selectedMemberId === 'self' ? 'active' : ''}`}
                      onClick={() => handleSelectMember('self')}
                    >
                      👤 Myself
                    </button>
                    {familyProfiles.map((m) => (
                      <button
                        key={m.profileId}
                        type="button"
                        className={`member-pill ${selectedMemberId === m.profileId ? 'active' : ''}`}
                        onClick={() => handleSelectMember(m)}
                      >
                        {m.gender === 'FEMALE' ? '👩' : '👨'} {m.fullname} ({m.relation})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={form.fullname}
                  onChange={(e) => setForm((p) => ({ ...p, fullname: e.target.value }))}
                  placeholder="Patient's full name"
                />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                  placeholder="Mobile number"
                />
              </div>
              <div className="form-group">
                <label>Collection Type *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="home"
                      checked={form.collectionType === 'home'}
                      onChange={() => setForm((p) => ({ ...p, collectionType: 'home' }))}
                    />
                    🏠 Home Collection
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="clinic"
                      checked={form.collectionType === 'clinic'}
                      onChange={() => setForm((p) => ({ ...p, collectionType: 'clinic' }))}
                    />
                    🏥 Clinic Visit
                  </label>
                </div>
              </div>

              {form.collectionType === 'home' && (
                <>
                  {addresses.length > 0 && (
                    <div className="saved-addresses">
                      <label>Saved Addresses</label>
                      {addresses.map((addr) => (
                        <div
                          key={addr.address_id}
                          className={`saved-addr-option ${form.selectedAddressId === addr.address_id ? 'selected' : ''}`}
                          onClick={() => handleSelectAddress(addr)}
                        >
                          <span>📍</span>
                          <span>{addr.address_line1}, {addr.city} - {addr.postal_code}</span>
                        </div>
                      ))}
                      <p className="or-divider">— or enter manually —</p>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Address Details *</label>
                    <textarea
                      value={form.addressDetails}
                      onChange={(e) => setForm((p) => ({ ...p, addressDetails: e.target.value }))}
                      placeholder="Enter your full address"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Prescription Attachment (Optional) */}
              <div className="booking-rx-upload-box">
                <div className="booking-rx-header">
                  <label className="booking-rx-label">
                    📄 Doctor's Prescription (Optional)
                  </label>
                  <span className="booking-rx-sublabel">PNG, JPG, PDF up to 10MB</span>
                </div>

                {!prescriptionFile ? (
                  <div
                    className="booking-rx-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePrescriptionChange}
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                    />
                    <span className="rx-dropzone-icon">📎</span>
                    <div className="rx-dropzone-text">
                      <strong>Click to upload prescription</strong>
                      <span>Upload doctor's prescription for technician guidance</span>
                    </div>
                  </div>
                ) : (
                  <div className="booking-rx-selected">
                    {prescriptionPreview ? (
                      <img src={prescriptionPreview} alt="Prescription" className="rx-thumb" />
                    ) : (
                      <span className="rx-file-icon">📄</span>
                    )}
                    <div className="rx-info">
                      <span className="rx-filename">{prescriptionFile.name}</span>
                      <span className="rx-filesize">{(prescriptionFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      className="rx-remove-btn"
                      onClick={handleRemovePrescription}
                      title="Remove prescription"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Slot Selection */}
          {step === 2 && (
            <div className="step-content">
              <h3>Select Date & Time</h3>
              {loadingSlots ? (
                <div className="loading-state">Loading available slots…</div>
              ) : (
                <>
                  {/* Date Selection */}
                  <div className="form-group">
                    <label>Select Date *</label>
                    <div className="date-grid">
                      {getNext7Days().map((date) => (
                        <button
                          key={date}
                          className={`date-btn ${form.slotDate === date ? 'selected' : ''}`}
                          onClick={() => setForm((p) => ({ ...p, slotDate: date, slotTime: '', slotId: null }))}
                        >
                          <span className="date-day">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                          </span>
                          <span className="date-num">
                            {new Date(date + 'T00:00:00').getDate()}
                          </span>
                          <span className="date-month">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {form.slotDate && (
                    <div className="form-group">
                      <label>Select Time Slot *</label>
                      <div className="slot-grid">
                        {/* Show backend slots for this date if available */}
                        {(slotsByDate[form.slotDate] && slotsByDate[form.slotDate].length > 0)
                          ? slotsByDate[form.slotDate].map((slot) => {
                            const timeDisplay = formatSlotTime(slot);
                            return (
                              <button
                                key={slot.slotId}
                                className={`slot-btn ${form.slotId === slot.slotId ? 'selected' : ''}`}
                                onClick={() => handleSelectSlot(slot)}
                              >
                                {timeDisplay}
                              </button>
                            );
                          })
                          : defaultTimeSlots.map((time) => (
                            <button
                              key={time}
                              className={`slot-btn ${form.slotTime === time ? 'selected' : ''}`}
                              onClick={() => setForm((p) => ({ ...p, slotTime: time, slotId: null }))}
                            >
                              {time}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="step-content">
              <h3>Confirm Booking</h3>
              <div className="confirm-details">
                <div className="confirm-row">
                  <span>👤 Patient</span>
                  <span>{form.fullname}</span>
                </div>
                <div className="confirm-row">
                  <span>📱 Mobile</span>
                  <span>{form.mobile}</span>
                </div>
                <div className="confirm-row">
                  <span>📅 Date</span>
                  <span>{form.slotDate}</span>
                </div>
                <div className="confirm-row">
                  <span>🕐 Time</span>
                  <span>{form.slotTime}</span>
                </div>
                <div className="confirm-row">
                  <span>🏠 Collection</span>
                  <span>{form.collectionType === 'home' ? 'Home Collection' : 'Clinic Visit'}</span>
                </div>
                {form.collectionType === 'home' && (
                  <div className="confirm-row">
                    <span>📍 Address</span>
                    <span>{form.addressDetails}</span>
                  </div>
                )}
                {prescriptionFile && (
                  <div className="confirm-row">
                    <span>📄 Prescription</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ {prescriptionFile.name}
                    </span>
                  </div>
                )}
                <div className="confirm-row">
                  <span>💳 Payment</span>
                  <span>Cash on Collection</span>
                </div>
                <div className="confirm-row total-row">
                  <span>💰 Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>


              <div className="info-notice small">
                <span>ℹ️</span>
                <p>Payment will be collected at the time of sample collection. Our team will contact you to confirm.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button className="back-btn" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button className="next-btn" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button className="confirm-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Booking…' : '✅ Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
