import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { uploadFile, createOrder, LAB_ID } from '../services/api';

const PrescriptionUploadModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLocation } = useLocation();

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [mobile, setMobile] = useState(user?.mobileNumber || '');
  const [addressDetails, setAddressDetails] = useState(
    currentLocation
      ? [currentLocation.address_line1, currentLocation.city, currentLocation.postal_code]
          .filter(Boolean)
          .join(', ')
      : ''
  );
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    setError('');
    setFile(selected);

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a prescription file to upload');
      return;
    }
    if (!fullname || !mobile || !addressDetails) {
      setError('Please fill in your name, mobile, and collection address');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 1. Upload prescription file
      const uploadRes = await uploadFile(file, 'prescriptions');
      const prescriptionUrl = uploadRes.url;

      // 2. Create booking inquiry order with prescription URL
      const orderPayload = {
        userId: user ? user.user_id : 1, // guest or user ID
        labId: LAB_ID,
        fullname: fullname,
        mobile: mobile,
        addressDetails: `${addressDetails} ${notes ? `[Notes: ${notes}]` : ''}`,
        collectionType: 'home',
        slotDate: new Date().toISOString().split('T')[0],
        slotTime: '9 AM - 1 PM',
        slotId: null,
        paymentMode: 'CASH',
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        totalAmount: 0.0,
        prescriptionUrl: prescriptionUrl,
        items: [
          {
            testId: 10000,
            testName: 'Prescription Based Diagnostic Order (Custom)',
            price: 0.0,
          },
        ],
      };

      const created = await createOrder(orderPayload);
      setSuccessOrder(created);
    } catch (err) {
      setError(err.message || 'Failed to upload prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="prescription-modal-container">
        <div className="prescription-modal-header">
          <div className="modal-title-wrap">
            <span className="prescription-icon">📄</span>
            <div>
              <h3>Upload Doctor's Prescription</h3>
              <p>Our lab team will review your prescription and confirm test details</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {successOrder ? (
          <div className="prescription-success-view">
            <div className="success-badge-large">✅</div>
            <h3>Prescription Received!</h3>
            <p className="success-order-num">Booking Reference #{successOrder.orderId}</p>
            <p className="success-desc">
              Our clinical pathologists will review your prescription and call you at{' '}
              <strong>{mobile}</strong> within 30 minutes to confirm your test schedule and sample collection.
            </p>
            <div className="success-buttons">
              {user && (
                <button
                  className="btn-view-order"
                  onClick={() => {
                    onClose();
                    navigate('/profile');
                  }}
                >
                  View in My Bookings
                </button>
              )}
              <button className="btn-done" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="prescription-form">
            {error && <div className="prescription-error-banner">{error}</div>}

            {/* File Dropzone */}
            <div className="prescription-dropzone">
              <input
                type="file"
                id="prescription-file-input"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="prescription-file-input" className="dropzone-label">
                {filePreview ? (
                  <div className="preview-container">
                    <img src={filePreview} alt="Prescription preview" className="prescription-preview-img" />
                    <span className="btn-change-file">Click to Change File</span>
                  </div>
                ) : file ? (
                  <div className="file-selected-box">
                    <span className="pdf-icon">📑</span>
                    <strong className="file-name">{file.name}</strong>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                    <span className="btn-change-file">Click to Change File</span>
                  </div>
                ) : (
                  <div className="dropzone-empty">
                    <span className="upload-cloud-icon">☁️</span>
                    <strong>Click or Drag & Drop Prescription Here</strong>
                    <p>Supports JPG, PNG, and PDF up to 10MB</p>
                    <span className="btn-select-file">Browse File</span>
                  </div>
                )}
              </label>
            </div>

            {/* Patient & Address Details */}
            <div className="form-row two-col">
              <div className="form-group">
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Patient Name"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Contact Mobile *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Home Collection Address *</label>
              <textarea
                required
                rows="2"
                placeholder="House No, Street, Landmark, City & Pincode"
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Additional Notes / Medical History (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Patient is diabetic / Morning fasting required"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="prescription-modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit-prescription"
                disabled={uploading || !file}
              >
                {uploading ? 'Uploading Prescription…' : 'Submit Prescription'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PrescriptionUploadModal;
