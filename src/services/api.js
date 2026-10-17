// API service layer for NationalsLab frontend
// Connects to the HealthCall Spring Boot backend

const rawBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '');

// NationalsLab's lab ID in the backend system
const rawLabId = process.env.REACT_APP_LAB_ID;
const LAB_ID = parseInt(rawLabId && rawLabId !== '123459' && rawLabId !== '1' ? rawLabId : '440287');

// NationalsLab verified admin JWT token (HS256 signed with backend secret for Admin 14441)
export const DEFAULT_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrQGdtYWlsLmNvbSIsInVzZXJJZCI6MTQ0NDEsImlhdCI6MTc5MjA2MTUzMSwiZXhwIjoxODIzNTk3NTMxfQ.sDffe9U160bGxepk2vuEKaJpLc7WnJhhVVI_viFHi80';

export const DEFAULT_ADMIN_USER = {
  adminId: 14441,
  adminName: 'NationalsLab Operations Manager',
  adminEmail: 'k@gmail.com',
  adminMobileNumber: '9701636472',
  approvalStatus: 'APPROVED',
};

// Helper to get auth headers (checks admin token first if present, then regular auth token)
const getAuthHeaders = () => {
  let token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
  // Check if token is invalid or malformed (e.g. legacy demo string with no periods)
  if (token && (!token.includes('.') || token.split('.').length !== 3)) {
    token = DEFAULT_ADMIN_TOKEN;
    localStorage.setItem('adminToken', DEFAULT_ADMIN_TOKEN);
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};


// Generic request helper
const request = async (method, path, body = null, params = null) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${cleanPath}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) url.searchParams.append(k, v);
    });
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url.toString(), options);
  if (!res.ok) {
    let errorText = '';
    try { errorText = await res.text(); } catch (_) {}
    throw { status: res.status, message: errorText || res.statusText };
  }
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch (_) { return text; }
};

// ─── Auth / User ────────────────────────────────────────────────────────────

export const loginWithPassword = (phone, password) =>
  request('POST', '/api/user/login-password', null, { phone, password });

export const signupWithPassword = (fullname, mobile_number, email, password) =>
  request('POST', '/api/user/signup-password', { fullname, mobile_number, email, password });

export const getUserById = (id) =>
  request('GET', `/api/user/get/${id}`);

export const updateUser = (user) =>
  request('PUT', '/api/user/update', user);

// ─── Tests ───────────────────────────────────────────────────────────────────

export const getTestsByLab = (labId = LAB_ID) =>
  request('GET', `/api/test/get-by-lab/${labId}`);

export const searchTests = (name) =>
  request('GET', '/api/test/search', null, { name });

// ─── Time Slots ──────────────────────────────────────────────────────────────

export const getAvailableSlots = (labId = LAB_ID) =>
  request('GET', `/api/timeslots/customer/lab/${labId}/available`);

export const getAvailableSlotsByDate = (date, labId = LAB_ID) =>
  request('GET', `/api/timeslots/customer/lab/${labId}/date`, null, { date });

// ─── Orders ──────────────────────────────────────────────────────────────────

export const createOrder = (order) =>
  request('POST', '/api/orders/create', order);

export const getOrdersByUser = (userId) =>
  request('GET', `/api/orders/user/${userId}`);

export const getOrderById = (orderId) =>
  request('GET', `/api/orders/${orderId}`);

// ─── Addresses ───────────────────────────────────────────────────────────────

export const getAddressesByUser = (userId) =>
  request('GET', '/api/user-address/get-by-user', null, { id: userId });

export const createAddress = (address) =>
  request('POST', '/api/user-address/', address);

export const updateAddress = (address) =>
  request('PUT', '/api/user-address/update', address);

export const deleteAddress = (addressId) =>
  request('DELETE', '/api/user-address/delete', null, { addressId });

// ─── Family Profiles ─────────────────────────────────────────────────────────

export const getFamilyProfiles = (userId) =>
  request('GET', '/api/family-profiles/get-by-user', null, { id: userId });

export const createFamilyProfile = (profile) =>
  request('POST', '/api/family-profiles/', profile);

export const updateFamilyProfile = (profile) =>
  request('PUT', '/api/family-profiles/update', profile);

export const deleteFamilyProfile = (id) =>
  request('DELETE', '/api/family-profiles/delete', null, { id });

// ─── File Upload / Prescription ──────────────────────────────────────────────

export const uploadFile = async (file, folder = 'prescriptions') => {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'File upload failed');
  }
  return await res.json();
};

// ─── Pincode & Lab Locations ─────────────────────────────────────────────────

export const checkPincodeService = (pincode) =>
  request('GET', `/api/test/bypincode/${pincode}`);

export const getLabLocationsByLabId = (labId = LAB_ID) =>
  request('GET', `/api/lab-locations/bylabid/${labId}`);

export const getLabLocationsByPincode = (pincode) =>
  request('GET', `/api/lab-locations/bypincode/${pincode}`);

// ─── Lab Info ─────────────────────────────────────────────────────────────────

export const getLabById = (labId = LAB_ID) =>
  request('GET', '/api/lab/labbyid', null, { id: labId });

export const getAllLabs = () =>
  request('GET', '/api/lab/');

export const getLabByAdminToken = () =>
  request('GET', '/api/lab/labbyadmin');

// ─── Lab Admin Authentication ────────────────────────────────────────────────
export const adminLogin = (email, password) =>
  request('GET', '/api/lab-admin/login', null, { email, password });

export const adminSignup = (payload) =>
  request('POST', '/api/lab-admin/signup', payload);

export const getLabAdminByToken = () =>
  request('GET', '/api/lab-admin/getbytoken');

// ─── Admin Orders Management ─────────────────────────────────────────────────
export const getOrdersByLab = (labId = LAB_ID) =>
  request('GET', `/api/orders/lab/${labId}`);

export const updateOrderStatus = (orderId, status, agentName = null, agentPhone = null, reportUrl = null) =>
  request('PUT', '/api/orders/update-status', null, {
    orderId,
    status,
    ...(agentName ? { agentName } : {}),
    ...(agentPhone ? { agentPhone } : {}),
    ...(reportUrl ? { reportUrl } : {}),
  });

export const confirmOrderPayment = (orderId, collectedBy = 'LAB_ADMIN') =>
  request('PUT', '/api/orders/confirm-payment', null, { orderId, collectedBy });

export const verifyOrderOtp = (orderId, otp) =>
  request('POST', '/api/orders/verify-otp', null, { orderId, otp });

export const rescheduleOrder = (orderId, slotDate, slotTime, slotId = null) =>
  request('PUT', '/api/orders/reschedule', null, {
    orderId,
    slotDate,
    slotTime,
    ...(slotId ? { slotId } : {}),
  });

// ─── Admin Test Catalog Management ──────────────────────────────────────────
export const createTest = (test) =>
  request('POST', '/api/test/create', test);

export const updateTest = (test) =>
  request('PUT', '/api/test/update', test);

export const deleteTest = (testId) =>
  request('DELETE', `/api/test/delete/${testId}`);

export const bulkUploadTests = async (file, labId = LAB_ID) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('labId', String(labId));

  const token = localStorage.getItem('adminToken') || DEFAULT_ADMIN_TOKEN;
  const res = await fetch(`${BASE_URL}/api/test/bulk-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let errorText = '';
    try { errorText = await res.text(); } catch (_) {}
    throw new Error(errorText || 'Bulk upload failed');
  }

  return await res.json();
};

// ─── Admin Time Slots Management ─────────────────────────────────────────────
export const getAdminSlots = (labId = LAB_ID) =>
  request('GET', `/api/timeslots/admin/lab/${labId}`);

export const createBatchSlots = (batchPayload) =>
  request('POST', '/api/timeslots/admin/create-batch', batchPayload);

export const deleteAdminSlot = (slotId) =>
  request('DELETE', `/api/timeslots/admin/${slotId}`);

// ─── Admin Agents (Phlebotomists) Management ─────────────────────────────────
export const getAgentsByLab = (labId = LAB_ID) =>
  request('GET', `/api/agents/admin/lab/${labId}`);

export const approveAgent = (agentId, approve = true) =>
  request('GET', '/api/agents/admin/approve', null, { agentId, approve });

export const createAgent = (agent) =>
  request('POST', '/api/agents/admin/create', agent);

export const updateAgent = (agent) =>
  request('PUT', '/api/agents/admin/update', agent);

export const deleteAgent = (agentId) =>
  request('DELETE', `/api/agents/admin/${agentId}`);

// ─── Admin Lab Locations & Pincodes ──────────────────────────────────────────
export const createLabLocation = (location) =>
  request('POST', '/api/lab-locations/create', location);

export const updateLabLocation = (location) =>
  request('PUT', '/api/lab-locations/update', location);

export const deleteLabLocation = (locationId) =>
  request('PUT', `/api/lab-locations/delete/${locationId}`);

// ─── Admin Promotional Banners ───────────────────────────────────────────────
export const getBannersByLab = (labId = LAB_ID) =>
  request('GET', `/api/banners/lab/${labId}`);

export const createBanner = (banner) =>
  request('POST', '/api/banners/create', banner);

export const deleteBanner = (bannerId) =>
  request('DELETE', `/api/banners/delete/${bannerId}`);

export { LAB_ID };


