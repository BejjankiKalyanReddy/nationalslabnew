import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { createTest, updateTest, deleteTest, bulkUploadTests, LAB_ID } from '../services/api';

const AdminTestsTab = ({ tests = [], currentLab = null, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bulk Excel Upload State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedTests, setParsedTests] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const fileInputRef = useRef(null);

  const initialForm = {
    testName: '',
    testDescription: '',
    testOriginalPrice: '',
    testDiscountedPrice: '',
    categoryName: 'Biochemistry',
    testType: 'Blood Test',
    testReportTime: '24 Hours',
    testAvailability: 1,
    collectionTube: '',
    testCode: '',
    method: '',
    schedule: 'Daily',
    isPackage: 0,
    packageTestIds: '',
    outsourceLab: '',
    outsourelabLprice: '',
    outsourcelabB2b: '',
  };

  const [form, setForm] = useState(initialForm);

  // Live profit/benefit calculation in Add/Edit modal
  const formBenefit = useMemo(() => {
    const disc = parseFloat(form.testDiscountedPrice);
    const b2b = parseFloat(form.outsourcelabB2b);
    if (!isNaN(disc) && !isNaN(b2b)) {
      return Math.round((disc - b2b) * 100) / 100;
    }
    if (!isNaN(disc)) return disc;
    return null;
  }, [form.testDiscountedPrice, form.outsourcelabB2b]);

  const categories = [
    'ALL',
    ...Array.from(new Set(tests.map((t) => t.categoryName).filter(Boolean))),
  ];

  const filteredTests = tests.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (t.testName || '').toLowerCase().includes(q) ||
      (t.testDescription || '').toLowerCase().includes(q) ||
      (t.testCode || '').toLowerCase().includes(q) ||
      (t.outsourceLab || '').toLowerCase().includes(q) ||
      String(t.testId || '').includes(q);
    const matchesCat =
      categoryFilter === 'ALL' ||
      (t.categoryName || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingTest(null);
    setForm(initialForm);
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTest(t);
    setForm({
      testName: t.testName || '',
      testDescription: t.testDescription || '',
      testOriginalPrice: t.testOriginalPrice ?? '',
      testDiscountedPrice: t.testDiscountedPrice ?? '',
      categoryName: t.categoryName || 'Biochemistry',
      testType: t.testType || 'Blood Test',
      testReportTime: t.testReportTime || '24 Hours',
      testAvailability: t.testAvailability ?? 1,
      collectionTube: t.collectionTube || '',
      testCode: t.testCode || '',
      method: t.method || '',
      schedule: t.schedule || 'Daily',
      isPackage: t.isPackage ?? 0,
      packageTestIds: t.packageTestIds || '',
      outsourceLab: t.outsourceLab || '',
      outsourelabLprice: t.outsourelabLprice ?? '',
      outsourcelabB2b: t.outsourcelabB2b ?? '',
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
    const discPrice = parseFloat(form.testDiscountedPrice);
    const b2bPrice = form.outsourcelabB2b !== '' && form.outsourcelabB2b != null ? parseFloat(form.outsourcelabB2b) : null;
    const computedBenifit = b2bPrice != null ? Math.round((discPrice - b2bPrice) * 100) / 100 : discPrice;

    const payload = {
      ...(editingTest ? { testId: editingTest.testId } : {}),
      labId: labIdToUse,
      testName: form.testName.trim(),
      testDescription: form.testDescription?.trim() || 'Standard diagnostic analysis',
      testOriginalPrice: parseFloat(form.testOriginalPrice || form.testDiscountedPrice),
      testDiscountedPrice: discPrice,
      categoryName: form.categoryName?.trim() || 'General',
      testType: form.testType?.trim() || 'Blood Test',
      testReportTime: form.testReportTime?.trim() || '24 Hours',
      testAvailability: form.testAvailability ? 1 : 0,
      collectionTube: form.collectionTube?.trim() || '',
      testCode: form.testCode?.trim() || '',
      method: form.method?.trim() || '',
      schedule: form.schedule?.trim() || 'Daily',
      isPackage: form.isPackage ? 1 : 0,
      packageTestIds: form.packageTestIds?.trim() || '',
      outsourceLab: form.outsourceLab?.trim() || '',
      outsourelabLprice: form.outsourelabLprice !== '' && form.outsourelabLprice != null ? parseFloat(form.outsourelabLprice) : null,
      outsourcelabB2b: b2bPrice,
      benifit: computedBenifit,
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
    if (!window.confirm(`Are you sure you want to delete test "${t.testName}" (ID: #${t.testId})?`)) return;
    try {
      await deleteTest(t.testId);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete test');
    }
  };

  // Helper to calculate or read Benefit
  const getTestBenefit = (t) => {
    if (t.benifit != null) return t.benifit;
    if (t.benefit != null) return t.benefit;
    if (t.testDiscountedPrice != null && t.outsourcelabB2b != null) {
      return Math.round((Number(t.testDiscountedPrice) - Number(t.outsourcelabB2b)) * 100) / 100;
    }
    if (t.testDiscountedPrice != null && (t.outsourcelabB2b == null || t.outsourcelabB2b === 0)) {
      return Number(t.testDiscountedPrice);
    }
    return null;
  };

  // Helper to display NA for missing values
  const renderVal = (v) => {
    if (v === null || v === undefined || v === '' || v === 'null') {
      return <span className="na-tag">NA</span>;
    }
    return v;
  };

  // 1. Download Blank/Sample Excel Template
  const handleDownloadTemplate = () => {
    const headers = [
      'Test Name',
      'Original Price',
      'Discounted Price',
      'Category Name',
      'Description',
      'Test Type',
      'Report Time',
      'Availability',
      'Collection Tube',
      'Test Code',
      'Method',
      'Schedule',
      'Is Package',
      'Package Test IDs',
      'Test Image',
      'Outsource Lab',
      'Outsource Lab L-Price',
      'Outsource Lab B2B Price',
    ];

    const sampleRows = [
      [
        'Complete Blood Count (CBC)',
        500,
        450,
        'Hematology',
        'Comprehensive automated CBC checkup with 24 parameters',
        'Blood',
        '12 Hours',
        'Yes',
        'EDTA (Purple)',
        'CBC101',
        'Automated Cell Counter',
        'Daily',
        'No',
        '',
        '',
        'Metropolis',
        220,
        200,
      ],
      [
        'Lipid Profile Basic',
        900,
        699,
        'Biochemistry',
        'Cholesterol, Triglycerides, HDL, LDL, VLDL cholesterol',
        'Blood',
        '12 Hours',
        'Yes',
        'SST / Yellow',
        'LIP102',
        'Spectrophotometry',
        'Daily',
        'No',
        '',
        '',
        'Thyrocare',
        300,
        280,
      ],
      [
        'Liver Function Test (LFT)',
        850,
        650,
        'Biochemistry',
        'Bilirubin, SGOT, SGPT, Alkaline Phosphatase, Total Protein',
        'Blood',
        '12 Hours',
        'Yes',
        'SST / Yellow',
        'LFT103',
        'Photometric',
        'Daily',
        'No',
        '',
        '',
        'Metropolis',
        250,
        220,
      ],
      [
        'Thyroid Profile (T3, T4, TSH)',
        700,
        499,
        'Endocrinology',
        'Screening of thyroid gland hormone regulation and metabolism',
        'Blood',
        '24 Hours',
        'Yes',
        'Clot Activator / Red',
        'THY104',
        'CLIA',
        'Daily',
        'No',
        '',
        '',
        'Thyrocare',
        200,
        180,
      ],
      [
        'Fasting Blood Sugar (FBS)',
        150,
        99,
        'Diabetes',
        'Plasma glucose evaluation after overnight fasting',
        'Blood',
        '6 Hours',
        'Yes',
        'Fluoride / Grey',
        'GLU105',
        'GOD-POD',
        'Daily',
        'No',
        '',
        '',
        '',
        0,
        0,
      ],
    ];

    const data = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
      { wch: 32 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 35 },
      { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
      { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 20 }, { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Template');
    XLSX.writeFile(wb, 'NationalsLab_Test_Catalog_Template.xlsx');
  };

  // 2. Export Current Diagnostic Catalog to Excel
  const handleExportCatalog = () => {
    try {
      const dataToExport = filteredTests.length > 0 ? filteredTests : tests;
      if (dataToExport.length === 0) {
        alert('No diagnostic tests found to export.');
        return;
      }

      const rows = dataToExport.map((t, idx) => {
        const benefitVal = getTestBenefit(t);
        return {
          '#': idx + 1,
          'Test ID': t.testId,
          'Test Name': t.testName || 'NA',
          'Category': t.categoryName || 'NA',
          'Sample Type': t.testType || 'NA',
          'Original MRP (₹)': t.testOriginalPrice != null ? t.testOriginalPrice : 'NA',
          'Discounted Price (₹)': t.testDiscountedPrice != null ? t.testDiscountedPrice : 'NA',
          'Outsource Lab': t.outsourceLab || 'NA',
          'Outsource L-Price (₹)': t.outsourelabLprice != null ? t.outsourelabLprice : 'NA',
          'Outsource B2B Price (₹)': t.outsourcelabB2b != null ? t.outsourcelabB2b : 'NA',
          'Benefit (₹)': benefitVal != null ? benefitVal : 'NA',
          'Availability': t.testAvailability === 1 ? 'Active' : 'Disabled',
          'Report Time': t.testReportTime || 'NA',
          'Collection Tube': t.collectionTube || 'NA',
          'Test Code': t.testCode || 'NA',
          'Method': t.method || 'NA',
          'Schedule': t.schedule || 'NA',
          'Is Package': t.isPackage === 1 ? 'Yes' : 'No',
          'Package Test IDs': t.packageTestIds || 'NA',
          'Description': t.testDescription || 'NA',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 10 }, // Test ID
        { wch: 34 }, // Test Name
        { wch: 18 }, // Category
        { wch: 14 }, // Sample Type
        { wch: 16 }, // Original MRP
        { wch: 18 }, // Discounted Price
        { wch: 18 }, // Outsource Lab
        { wch: 18 }, // Outsource L-Price
        { wch: 20 }, // Outsource B2B Price
        { wch: 14 }, // Benefit
        { wch: 12 }, // Availability
        { wch: 14 }, // Report Time
        { wch: 18 }, // Collection Tube
        { wch: 12 }, // Test Code
        { wch: 18 }, // Method
        { wch: 12 }, // Schedule
        { wch: 12 }, // Is Package
        { wch: 18 }, // Package Test IDs
        { wch: 38 }, // Description
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Diagnostic Catalog');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `NationalsLab_Diagnostic_Catalog_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Failed to export catalog:', err);
      alert('Error exporting catalog: ' + err.message);
    }
  };

  // Bulk Excel Upload File Handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError('');
    setBulkSuccess('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length <= 1) {
          setBulkError('Uploaded sheet appears to be empty or has only headers.');
          setParsedTests([]);
          return;
        }

        const rows = data.slice(1).filter((r) => r && r[0]);
        if (rows.length === 0) {
          setBulkError('No valid tests found. Make sure column 1 (Test Name) is filled.');
          setParsedTests([]);
          return;
        }

        setParsedTests(rows);
      } catch (err) {
        setBulkError('Could not parse Excel spreadsheet: ' + err.message);
        setParsedTests([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteBulkUpload = async () => {
    if (!selectedFile) {
      setBulkError('Please select an Excel file first.');
      return;
    }

    setBulkLoading(true);
    setBulkError('');
    setBulkSuccess('');

    try {
      const labIdToUse = currentLab?.labId || LAB_ID;
      const res = await bulkUploadTests(selectedFile, labIdToUse);
      const count = Array.isArray(res) ? res.length : parsedTests.length;
      setBulkSuccess(`🎉 Success! ${count} diagnostic tests imported into catalog!`);
      setSelectedFile(null);
      setParsedTests([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
      setTimeout(() => {
        setBulkModalOpen(false);
        setBulkSuccess('');
      }, 2000);
    } catch (err) {
      setBulkError(err.message || 'Failed to upload tests. Please ensure the Excel columns match the template.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="admin-tests-tab">
      {/* Header and Controls */}
      <div className="admin-tests-controls">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="admin-search-input"
            placeholder="🔍 Search name, code, outsource lab…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '280px' }}
          />

          <select
            className="admin-form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Showing {filteredTests.length} of {tests.length} tests
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn-admin-action btn-emerald-action"
            onClick={handleExportCatalog}
            title="Export all currently displayed tests to formatted Excel (.xlsx)"
          >
            📊 Download Catalog (.xlsx)
          </button>
          <button
            className="btn-admin-action btn-secondary-action"
            onClick={handleDownloadTemplate}
            title="Download formatted sample Excel sheet for bulk uploads"
          >
            📥 Excel Template
          </button>
          <button
            className="btn-admin-action btn-purple-action"
            onClick={() => {
              setBulkError('');
              setBulkSuccess('');
              setSelectedFile(null);
              setParsedTests([]);
              setBulkModalOpen(true);
            }}
            title="Bulk import tests from Excel spreadsheet"
          >
            📤 Upload Excel
          </button>
          <button className="btn-admin-action btn-primary-action" onClick={handleOpenAdd}>
            ➕ Add New Test
          </button>
        </div>
      </div>

      {/* Tests Table - High Density View with All Columns */}
      <div className="admin-panel-card">
        {filteredTests.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-state-icon">🔬</span>
            <h4>No tests found</h4>
            <p>Try adjusting your search query or add a new test.</p>
          </div>
        ) : (
          <div className="admin-table-wrap" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <table className="admin-table admin-table-dense">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Test ID</th>
                  <th style={{ minWidth: '220px' }}>Test Name</th>
                  <th>Category</th>
                  <th>Sample Type</th>
                  <th>Original MRP</th>
                  <th>Discounted Price</th>
                  <th>Outsource Lab</th>
                  <th>Outsource L-Price</th>
                  <th>Outsource B2B</th>
                  <th>Benefit (Margin)</th>
                  <th>Availability</th>
                  <th>Report Time</th>
                  <th>Tube / Vial</th>
                  <th>Test Code</th>
                  <th>Method</th>
                  <th>Schedule</th>
                  <th>Package?</th>
                  <th>Package IDs</th>
                  <th style={{ minWidth: '180px' }}>Description</th>
                  <th className="th-sticky-actions" style={{ minWidth: '140px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((t) => {
                  const benefit = getTestBenefit(t);
                  return (
                    <tr key={t.testId}>
                      {/* 1. Test ID */}
                      <td>
                        <strong style={{ color: '#0891b2', fontFamily: 'monospace' }}>#{t.testId}</strong>
                      </td>

                      {/* 2. Test Name */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.testName}</div>
                      </td>

                      {/* 3. Category */}
                      <td>
                        <span className="status-pill status-booked">{renderVal(t.categoryName)}</span>
                      </td>

                      {/* 4. Sample Type */}
                      <td>{renderVal(t.testType)}</td>

                      {/* 5. Original Price */}
                      <td>
                        {t.testOriginalPrice != null ? (
                          <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                            ₹{t.testOriginalPrice}
                          </span>
                        ) : (
                          <span className="na-tag">NA</span>
                        )}
                      </td>

                      {/* 6. Discounted Price */}
                      <td>
                        <strong style={{ color: '#059669', fontSize: '0.9rem' }}>
                          ₹{t.testDiscountedPrice ?? 0}
                        </strong>
                      </td>

                      {/* 7. Outsource Lab */}
                      <td>
                        {t.outsourceLab ? (
                          <strong style={{ color: '#4338ca' }}>{t.outsourceLab}</strong>
                        ) : (
                          <span className="na-tag">NA</span>
                        )}
                      </td>

                      {/* 8. Outsource L-Price */}
                      <td>
                        {t.outsourelabLprice != null ? `₹${t.outsourelabLprice}` : <span className="na-tag">NA</span>}
                      </td>

                      {/* 9. Outsource B2B Price */}
                      <td>
                        {t.outsourcelabB2b != null ? `₹${t.outsourcelabB2b}` : <span className="na-tag">NA</span>}
                      </td>

                      {/* 10. Benefit (test_discounted_price - outsourcelab_b2b) */}
                      <td>
                        {benefit != null ? (
                          <span className={`benefit-badge ${benefit < 0 ? 'negative' : ''}`}>
                            {benefit >= 0 ? `+₹${benefit}` : `-₹${Math.abs(benefit)}`}
                          </span>
                        ) : (
                          <span className="na-tag">NA</span>
                        )}
                      </td>

                      {/* 11. Availability */}
                      <td>
                        <button
                          className="btn-table-action"
                          style={{
                            background: t.testAvailability === 1 ? '#dcfce7' : '#fee2e2',
                            color: t.testAvailability === 1 ? '#15803d' : '#b91c1c',
                            fontWeight: 700,
                            padding: '3px 8px',
                          }}
                          onClick={() => handleToggleAvailability(t)}
                          title="Click to toggle availability"
                        >
                          {t.testAvailability === 1 ? '✓ Active' : '✕ Disabled'}
                        </button>
                      </td>

                      {/* 12. Report Time */}
                      <td>{renderVal(t.testReportTime)}</td>

                      {/* 13. Collection Tube */}
                      <td>{renderVal(t.collectionTube)}</td>

                      {/* 14. Test Code */}
                      <td>
                        {t.testCode ? (
                          <code style={{ background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px' }}>
                            {t.testCode}
                          </code>
                        ) : (
                          <span className="na-tag">NA</span>
                        )}
                      </td>

                      {/* 15. Method */}
                      <td>{renderVal(t.method)}</td>

                      {/* 16. Schedule */}
                      <td>{renderVal(t.schedule)}</td>

                      {/* 17. Is Package */}
                      <td>
                        {t.isPackage === 1 ? (
                          <span className="status-pill status-reportsready">Package</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>Single</span>
                        )}
                      </td>

                      {/* 18. Package Test IDs */}
                      <td>{renderVal(t.packageTestIds)}</td>

                      {/* 19. Description */}
                      <td title={t.testDescription || ''}>
                        {t.testDescription ? (
                          <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.testDescription}
                          </div>
                        ) : (
                          <span className="na-tag">NA</span>
                        )}
                      </td>

                      {/* 20. Clear Accessible Sticky Action Buttons */}
                      <td className="td-sticky-actions">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-table-edit"
                            onClick={() => handleOpenEdit(t)}
                            title="Edit test details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-table-delete"
                            onClick={() => handleDelete(t)}
                            title="Delete test"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Test Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="admin-modal-header">
              <h3>{editingTest ? `✏️ Edit Diagnostic Test #${editingTest.testId}` : '➕ Add New Diagnostic Test'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                {/* Section 1: Basic Information */}
                <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#0891b2', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  📌 Basic Information
                </h4>
                <div className="admin-form-row-2">
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
                    <label>Test Code</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. CBC101, LFT102"
                      value={form.testCode}
                      onChange={(e) => setForm({ ...form, testCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Biochemistry, Hematology, Vitamins"
                      value={form.categoryName}
                      onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Sample / Test Type</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Blood, Serum, Urine"
                      value={form.testType}
                      onChange={(e) => setForm({ ...form, testType: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Description / Clinical Significance</label>
                  <textarea
                    rows={2}
                    className="admin-form-textarea"
                    placeholder="Brief description of the test and what it diagnoses..."
                    value={form.testDescription}
                    onChange={(e) => setForm({ ...form, testDescription: e.target.value })}
                  />
                </div>

                {/* Section 2: Pricing & Outsource Economics */}
                <h4 style={{ margin: '14px 0 10px', fontSize: '0.92rem', color: '#0891b2', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  💰 Pricing, Outsource & Benefit
                </h4>
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
                    <label>Customer Discounted Price (₹) *</label>
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
                    <label>Outsource Lab Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Metropolis, Thyrocare"
                      value={form.outsourceLab}
                      onChange={(e) => setForm({ ...form, outsourceLab: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Outsource Lab L-Price (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="e.g. 180"
                      value={form.outsourelabLprice}
                      onChange={(e) => setForm({ ...form, outsourelabLprice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Outsource Lab B2B Price (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="e.g. 150"
                      value={form.outsourcelabB2b}
                      onChange={(e) => setForm({ ...form, outsourcelabB2b: e.target.value })}
                    />
                  </div>

                  {/* Benefit Live Preview */}
                  <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label>Net Benefit / Profit Margin (₹)</label>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                        Discounted (₹{form.testDiscountedPrice || 0}) - B2B (₹{form.outsourcelabB2b || 0}) =
                      </span>
                      <strong style={{ fontSize: '1.05rem', color: formBenefit != null && formBenefit < 0 ? '#dc2626' : '#059669' }}>
                        {formBenefit != null ? `₹${formBenefit}` : '₹0'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Section 3: Lab Operations & Logistics */}
                <h4 style={{ margin: '14px 0 10px', fontSize: '0.92rem', color: '#0891b2', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  🧪 Lab Operations & Logistics
                </h4>
                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Turnaround / Report Time</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 12 Hours, 24 Hours"
                      value={form.testReportTime}
                      onChange={(e) => setForm({ ...form, testReportTime: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Collection Tube / Vial</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. EDTA (Purple), SST (Yellow)"
                      value={form.collectionTube}
                      onChange={(e) => setForm({ ...form, collectionTube: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Methodology / Technology</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. CLIA, Photometric, HPLC"
                      value={form.method}
                      onChange={(e) => setForm({ ...form, method: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Schedule / Frequency</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Daily, Mon & Thu"
                      value={form.schedule}
                      onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label>Availability Status</label>
                    <select
                      className="admin-form-select"
                      value={form.testAvailability}
                      onChange={(e) => setForm({ ...form, testAvailability: Number(e.target.value) })}
                    >
                      <option value={1}>Available for Booking (Active)</option>
                      <option value={0}>Disabled / Unavailable</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Is Package?</label>
                    <select
                      className="admin-form-select"
                      value={form.isPackage}
                      onChange={(e) => setForm({ ...form, isPackage: Number(e.target.value) })}
                    >
                      <option value={0}>No (Individual Diagnostic Test)</option>
                      <option value={1}>Yes (Diagnostic Health Package)</option>
                    </select>
                  </div>
                </div>

                {form.isPackage === 1 && (
                  <div className="admin-form-group">
                    <label>Package Sub-Test IDs (Comma Separated)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 101, 102, 103"
                      value={form.packageTestIds}
                      onChange={(e) => setForm({ ...form, packageTestIds: e.target.value })}
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
                  disabled={loading}
                >
                  {loading ? 'Saving…' : editingTest ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel Upload Modal */}
      {bulkModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !bulkLoading && setBulkModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="admin-modal-header">
              <h3>📊 Bulk Import Tests via Excel</h3>
              <button
                disabled={bulkLoading}
                onClick={() => setBulkModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#475569',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <strong>Need the Excel format?</strong> Download our pre-formatted sample spreadsheet, fill in your tests, and upload it here.
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn-admin-action btn-secondary-action"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  📥 Download Template
                </button>
              </div>

              {bulkError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {bulkError}
                </div>
              )}

              {bulkSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                  {bulkSuccess}
                </div>
              )}

              {/* Dropzone */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div
                className="excel-dropzone"
                onClick={() => !bulkLoading && fileInputRef.current?.click()}
              >
                <span className="excel-dropzone-icon">📑</span>
                {selectedFile ? (
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{selectedFile.name}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Click to browse Excel catalog (.xlsx / .xls)</strong>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>
                      Supports all 18 standard diagnostic parameters matching NationalsLab catalog
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Table */}
              {parsedTests.length > 0 && (
                <div className="excel-preview-box">
                  <div className="excel-preview-header">
                    <span>Preview ({parsedTests.length} tests found in sheet)</span>
                    <span style={{ color: '#059669', fontSize: '0.78rem' }}>✓ Header validated</span>
                  </div>
                  <div className="excel-preview-table-wrap">
                    <table className="admin-table admin-table-dense">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Test Name</th>
                          <th>Original MRP</th>
                          <th>Discounted Price</th>
                          <th>Category</th>
                          <th>Sample Type</th>
                          <th>Outsource Lab</th>
                          <th>B2B Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedTests.map((row, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><strong>{row[0] || '—'}</strong></td>
                            <td>₹{row[1] || '0'}</td>
                            <td style={{ color: '#059669', fontWeight: 700 }}>₹{row[2] || '0'}</td>
                            <td>{row[3] || 'General'}</td>
                            <td>{row[5] || 'Blood'}</td>
                            <td>{row[15] || 'NA'}</td>
                            <td>{row[17] != null ? `₹${row[17]}` : 'NA'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-admin-action btn-secondary-action"
                disabled={bulkLoading}
                onClick={() => setBulkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-action btn-purple-action"
                disabled={bulkLoading || !selectedFile}
                onClick={handleExecuteBulkUpload}
              >
                {bulkLoading
                  ? 'Importing Tests…'
                  : selectedFile
                  ? `Import ${parsedTests.length || ''} Tests`
                  : 'Select Excel File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestsTab;
