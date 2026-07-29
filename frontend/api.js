(function (global) {
  'use strict';

  // Relative path: the backend serves this same frontend directory via
  // express.static, so API calls stay same-origin regardless of host/port.
  const API_BASE = '/api';

  const ADMIN_TOKEN_KEY = 'kiaspire_admin_token';
  const ADMIN_INFO_KEY = 'kiaspire_admin_info';
  const STUDENT_TOKEN_KEY = 'kiaspire_student_token';
  const STUDENT_INFO_KEY = 'kiaspire_student_info';

  /* ---------- token / session helpers (admin) ---------- */

  function getToken() {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  function setToken(token) {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch (error) {
      console.error('Unable to save token:', error);
    }
  }

  function clearToken() {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
    } catch (error) {
      console.error('Unable to clear session:', error);
    }
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  function getCachedAdmin() {
    try {
      const rawAdmin = localStorage.getItem(ADMIN_INFO_KEY);

      return rawAdmin ? JSON.parse(rawAdmin) : null;
    } catch (error) {
      return null;
    }
  }

  function setCachedAdmin(admin) {
    try {
      localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(admin));
    } catch (error) {
      console.error('Unable to cache admin:', error);
    }
  }

  /* ---------- token / session helpers (student) ----------
     Separate keys from admin on purpose — see ARCHITECTURE.md section 2 —
     so a browser signed into both doesn't clobber either session. */

  function getStudentToken() {
    try {
      return localStorage.getItem(STUDENT_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  function setStudentToken(token) {
    try {
      localStorage.setItem(STUDENT_TOKEN_KEY, token);
    } catch (error) {
      console.error('Unable to save student token:', error);
    }
  }

  function clearStudentToken() {
    try {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
      localStorage.removeItem(STUDENT_INFO_KEY);
    } catch (error) {
      console.error('Unable to clear student session:', error);
    }
  }

  function isStudentLoggedIn() {
    return Boolean(getStudentToken());
  }

  function getCachedStudent() {
    try {
      const raw = localStorage.getItem(STUDENT_INFO_KEY);

      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setCachedStudent(student) {
    try {
      localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify(student));
    } catch (error) {
      console.error('Unable to cache student:', error);
    }
  }

  /* ---------- low-level request helper ---------- */

  // opts.auth: true (or 'admin') attaches the admin token; 'student'
  // attaches the student token. A 401 on either clears that session and
  // redirects to the matching login page, never the other one's.
  async function request(path, options) {
    const opts = options || {};

    const method = opts.method || 'GET';
    const authKind = opts.auth === true ? 'admin' : opts.auth || null;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (authKind) {
      const token = authKind === 'student' ? getStudentToken() : getToken();

      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }
    }

    const normalizedPath = path.startsWith('/')
      ? path
      : '/' + path;

    const requestUrl = API_BASE + normalizedPath;

    let response;

    try {
      response = await fetch(requestUrl, {
        method: method,
        headers: headers,
        body:
          opts.body !== undefined
            ? JSON.stringify(opts.body)
            : undefined
      });
    } catch (networkError) {
      console.error('API network error:', networkError);

      const error = new Error(
        'Could not reach the server. Please try again in a moment.'
      );

      error.status = 0;
      error.originalError = networkError;

      throw error;
    }

    let data = null;

    const contentType =
      response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();

        data = text
          ? {
              message: text
            }
          : null;
      }
    } catch (parseError) {
      console.error(
        'Unable to parse API response:',
        parseError
      );
    }

    if (response.status === 401 && authKind) {
      if (authKind === 'student') {
        clearStudentToken();

        if (
          typeof window !== 'undefined' &&
          window.location &&
          !window.location.pathname.endsWith('login.html')
        ) {
          window.location.href = 'login.html';
        }
      } else {
        clearToken();

        if (
          typeof window !== 'undefined' &&
          window.location &&
          !window.location.pathname.endsWith('login.html')
        ) {
          const currentPath = window.location.pathname;

          const loginPath = currentPath.includes('/admin/')
            ? 'login.html'
            : 'admin/login.html';

          window.location.href = loginPath;
        }
      }
    }

    if (!response.ok) {
      const message =
        data &&
        (data.message ||
          data.error ||
          data.errors?.[0]?.message);

      const error = new Error(
        message ||
          'Request failed with status ' +
            response.status
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  /* ---------- public service APIs ---------- */

  // GET /api/services
  async function getServices() {
    const response = await request('/services');

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.services)) {
      return response.services;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    console.error(
      'Invalid services response:',
      response
    );

    return [];
  }

  // GET /api/services/:serviceId/fields
  async function getServiceFields(serviceId) {
    const response = await request(
      '/services/' + encodeURIComponent(serviceId) + '/fields'
    );

    if (Array.isArray(response?.fields)) {
      return response.fields;
    }

    return [];
  }

  /* ---------- public story APIs ---------- */

  // GET /api/story
  async function getStories() {
    const response = await request('/story');

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.stories)) {
      return response.stories;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    console.error(
      'Invalid stories response:',
      response
    );

    return [];
  }

  // GET /api/story/:id
  async function getStory(id) {
    if (!id) {
      throw new Error('Story ID is required');
    }

    const response = await request(
      '/story/' + encodeURIComponent(id)
    );

    return (
      response?.story ||
      response?.data ||
      response
    );
  }

  /* ---------- public "Study Abroad for Free" APIs ---------- */

  // GET /api/free-study
  async function getFreeStudyCountries() {
    const response = await request('/free-study');

    return Array.isArray(response?.countries) ? response.countries : [];
  }

  // GET /api/free-study/:slug
  async function getFreeStudyCountry(slug) {
    if (!slug) {
      throw new Error('Country slug is required');
    }

    const response = await request(
      '/free-study/' + encodeURIComponent(slug)
    );

    return response?.country || null;
  }

  /* ---------- public site settings ---------- */

  // GET /api/site-settings -> { about_countries_count: "40+", ... }
  async function getSiteSettings() {
    const response = await request('/site-settings');

    return response?.settings || {};
  }

  /* ---------- student registration / auth / dashboard ---------- */

  // POST /api/user/register
  // body: { name, email, phone, password?, serviceId, fieldValues? }
  // Auto-stores the student session when the response includes a token
  // (form-based services); external_redirect services return a
  // redirectUrl instead and issue no token — see ARCHITECTURE.md section 5.
  async function registerUser(payload) {
    const data = await request('/user/register', {
      method: 'POST',
      body: payload
    });

    if (data && data.token) {
      setStudentToken(data.token);

      if (data.user) {
        setCachedStudent(data.user);
      }
    }

    return data;
  }

  // POST /api/user/login
  async function studentLogin(email, password) {
    const data = await request('/user/login', {
      method: 'POST',
      body: { email: email, password: password }
    });

    if (data && data.token) {
      setStudentToken(data.token);

      if (data.user) {
        setCachedStudent(data.user);
      }
    }

    return data;
  }

  // Clears the localStorage token immediately (stops Authorization-header
  // API calls right away) and also asks the server to clear the httpOnly
  // page-guard cookie — without that second part, a still-valid, unexpired
  // JWT sitting in the cookie would keep letting this browser reach
  // dashboard.html even after "logging out" client-side. Awaited by the
  // caller before navigating away, so the cookie clear actually completes.
  async function studentLogout() {
    clearStudentToken();

    try {
      await request('/user/logout', { method: 'POST' });
    } catch (error) {
      console.error('studentLogout request failed:', error);
    }
  }

  // GET /api/user/dashboard
  function getStudentDashboard() {
    return request('/user/dashboard', { auth: 'student' });
  }

  /* ---------- admin authentication APIs ---------- */

  // POST /api/admin/login
  // body: { email, password }
  async function adminLogin(email, password) {
    const data = await request('/admin/login', {
      method: 'POST',
      body: {
        email: email,
        password: password
      }
    });

    if (data && data.token) {
      setToken(data.token);

      if (data.admin) {
        setCachedAdmin(data.admin);
      }
    }

    return data;
  }
  // POST /api/admin/password/forgot-password
function sendAdminPasswordOtp(email) {
  return request("/admin/password/forgot-password", {
    method: "POST",
    body: {
      email,
    },
  });
}

// POST /api/admin/password/verify-otp
function verifyAdminPasswordOtp(email, otp) {
  return request("/admin/password/verify-otp", {
    method: "POST",
    body: {
      email,
      otp,
    },
  });
}

// PATCH /api/admin/password/change-password
function changeAdminPassword(passwordData) {
  return request("/admin/password/change-password", {
    method: "PATCH",
    body: {
      email: passwordData.email,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
      resetToken: passwordData.resetToken,
    },
  });
}



  function adminLogout() {
    clearToken();

    try {
      await request('/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('adminLogout request failed:', error);
    }
  }

  // GET /api/admin/profile
  async function getAdminProfile() {
    const response = await request(
      '/admin/profile',
      {
        auth: true
      }
    );

    const admin =
      response?.admin ||
      response?.data ||
      response;

    if (admin) {
      setCachedAdmin(admin);
    }

    return admin;
  }

  /* ---------- admin user APIs ---------- */

  // GET /api/admin/users
  async function getAdminUsers() {
    const response = await request(
      '/admin/users',
      {
        auth: true
      }
    );

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.users)) {
      return response.users;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    console.error(
      'Invalid users response:',
      response
    );

    return [];
  }

  // GET /api/admin/users/:id
  async function getAdminUser(id) {
    if (!id) {
      throw new Error('User ID is required');
    }

    const response = await request(
      '/admin/users/' + encodeURIComponent(id),
      {
        auth: true
      }
    );

    return (
      response?.user ||
      response?.data ||
      response
    );
  }

  // PATCH /api/admin/users/:id/status
  // body: { isActive: true | false }
  function setAdminUserStatus(id, isActive) {
    if (!id) {
      return Promise.reject(
        new Error('User ID is required')
      );
    }

    if (typeof isActive !== 'boolean') {
      return Promise.reject(
        new Error(
          'isActive must be true or false'
        )
      );
    }

    return request(
      '/admin/users/' +
        encodeURIComponent(id) +
        '/status',
      {
        method: 'PATCH',
        auth: true,
        body: {
          isActive: isActive
        }
      }
    );
  }

  // DELETE /api/admin/users/:id
  function deleteAdminUser(id) {
    if (!id) {
      return Promise.reject(
        new Error('User ID is required')
      );
    }

    return request(
      '/admin/users/' + encodeURIComponent(id),
      {
        method: 'DELETE',
        auth: true
      }
    );
  }

  /* ---------- admin service APIs ---------- */

  // GET /api/services/admin/all
  async function getAdminServices() {
    const response = await request(
      '/services/admin/all',
      {
        auth: true
      }
    );

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.services)) {
      return response.services;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    console.error(
      'Invalid admin services response:',
      response
    );

    return [];
  }

  // POST /api/services
  function createService(payload) {
    return request('/services', {
      method: 'POST',
      auth: true,
      body: payload
    });
  }

  // PATCH /api/services/:id
  function updateService(id, payload) {
    if (!id) {
      return Promise.reject(
        new Error('Service ID is required')
      );
    }

    return request(
      '/services/' + encodeURIComponent(id),
      {
        method: 'PATCH',
        auth: true,
        body: payload
      }
    );
  }

  // DELETE /api/services/:id
  function deleteService(id) {
    if (!id) {
      return Promise.reject(
        new Error('Service ID is required')
      );
    }

    return request(
      '/services/' + encodeURIComponent(id),
      {
        method: 'DELETE',
        auth: true
      }
    );
  }

  /* ---------- admin service field APIs ---------- */
  // GET /api/services/:serviceId/fields is public (the registration form
  // needs it unauthenticated) — getServiceFields above covers reads for
  // both the public form and this admin screen; only writes need auth.

  // POST /api/services/:serviceId/fields
  function createServiceField(serviceId, payload) {
    if (!serviceId) {
      return Promise.reject(
        new Error('Service ID is required')
      );
    }

    return request(
      '/services/' + encodeURIComponent(serviceId) + '/fields',
      {
        method: 'POST',
        auth: true,
        body: payload
      }
    );
  }

  // PATCH /api/services/fields/:fieldId
  function updateServiceField(fieldId, payload) {
    if (!fieldId) {
      return Promise.reject(
        new Error('Field ID is required')
      );
    }

    return request(
      '/services/fields/' + encodeURIComponent(fieldId),
      {
        method: 'PATCH',
        auth: true,
        body: payload
      }
    );
  }

  // DELETE /api/services/fields/:fieldId
  function deleteServiceField(fieldId) {
    if (!fieldId) {
      return Promise.reject(
        new Error('Field ID is required')
      );
    }

    return request(
      '/services/fields/' + encodeURIComponent(fieldId),
      {
        method: 'DELETE',
        auth: true
      }
    );
  }

  /* ---------- admin application APIs ---------- */

  // GET /api/admin/pipeline-stages
  async function getAdminPipelineStages() {
    const response = await request('/admin/pipeline-stages', {
      auth: true
    });

    return Array.isArray(response?.stages) ? response.stages : [];
  }

  // GET /api/admin/applications?serviceId=&stageId=&isClosed=&page=&pageSize=
  async function getAdminApplications(filters) {
    const query = new URLSearchParams();
    var f = filters || {};

    if (f.serviceId) query.set('serviceId', f.serviceId);
    if (f.stageId) query.set('stageId', f.stageId);
    if (f.isClosed !== undefined && f.isClosed !== '') query.set('isClosed', f.isClosed);
    if (f.page) query.set('page', f.page);
    if (f.pageSize) query.set('pageSize', f.pageSize);

    const qs = query.toString();

    return request(
      '/admin/applications' + (qs ? '?' + qs : ''),
      { auth: true }
    );
  }

  // GET /api/admin/applications/:id -> { application, history }
  function getAdminApplication(id) {
    if (!id) {
      return Promise.reject(new Error('Application ID is required'));
    }

    return request(
      '/admin/applications/' + encodeURIComponent(id),
      { auth: true }
    );
  }

  // POST /api/admin/applications
  // body: { userId? , name?, email?, phone?, serviceId, fieldValues? }
  function createAdminApplication(payload) {
    return request('/admin/applications', {
      method: 'POST',
      auth: true,
      body: payload
    });
  }

  // PATCH /api/admin/applications/:id
  // body: any of { fieldValues, stageId, note, isClosed, closedReason }
  function updateAdminApplication(id, payload) {
    if (!id) {
      return Promise.reject(new Error('Application ID is required'));
    }

    return request(
      '/admin/applications/' + encodeURIComponent(id),
      {
        method: 'PATCH',
        auth: true,
        body: payload
      }
    );
  }

  // DELETE /api/admin/applications/:id
  function deleteAdminApplication(id) {
    if (!id) {
      return Promise.reject(new Error('Application ID is required'));
    }

    return request(
      '/admin/applications/' + encodeURIComponent(id),
      {
        method: 'DELETE',
        auth: true
      }
    );
  }

  /* ---------- admin "Study Abroad for Free" APIs ---------- */

  // GET /api/free-study/admin/all
  async function getAdminFreeStudyCountries() {
    const response = await request('/free-study/admin/all', {
      auth: true
    });

    return Array.isArray(response?.countries) ? response.countries : [];
  }

  // POST /api/free-study
  function createFreeStudyCountry(payload) {
    return request('/free-study', {
      method: 'POST',
      auth: true,
      body: payload
    });
  }

  // PATCH /api/free-study/:id
  function updateFreeStudyCountry(id, payload) {
    if (!id) {
      return Promise.reject(new Error('Country ID is required'));
    }

    return request(
      '/free-study/' + encodeURIComponent(id),
      {
        method: 'PATCH',
        auth: true,
        body: payload
      }
    );
  }

  // DELETE /api/free-study/:id
  function deleteFreeStudyCountry(id) {
    if (!id) {
      return Promise.reject(new Error('Country ID is required'));
    }

    return request(
      '/free-study/' + encodeURIComponent(id),
      {
        method: 'DELETE',
        auth: true
      }
    );
  }

  /* ---------- admin site settings APIs ---------- */

  // GET /api/site-settings/admin/all
  async function getAdminSiteSettings() {
    const response = await request('/site-settings/admin/all', {
      auth: true
    });

    return Array.isArray(response?.settings) ? response.settings : [];
  }

  // PATCH /api/site-settings/admin/:key
  // body: { value }
  function updateSiteSetting(key, value) {
    if (!key) {
      return Promise.reject(new Error('Setting key is required'));
    }

    return request(
      '/site-settings/admin/' + encodeURIComponent(key),
      {
        method: 'PATCH',
        auth: true,
        body: { value: value }
      }
    );
  }

  /* ---------- admin story APIs ---------- */

  // GET /api/story
  async function getAdminStories() {
    const response = await request('/story', {
      auth: true
    });

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.stories)) {
      return response.stories;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    console.error(
      'Invalid admin stories response:',
      response
    );

    return [];
  }

  // POST /api/story
  function createStory(payload) {
    return request('/story', {
      method: 'POST',
      auth: true,
      body: payload
    });
  }

  // PATCH /api/story/:id
  function updateStory(id, payload) {
    if (!id) {
      return Promise.reject(
        new Error('Story ID is required')
      );
    }

    return request(
      '/story/' + encodeURIComponent(id),
      {
        method: 'PATCH',
        auth: true,
        body: payload
      }
    );
  }

  // DELETE /api/story/:id
  function deleteStory(id) {
    if (!id) {
      return Promise.reject(
        new Error('Story ID is required')
      );
    }

    return request(
      '/story/' + encodeURIComponent(id),
      {
        method: 'DELETE',
        auth: true
      }
    );
  }

  /* ---------- export ---------- */

  global.KiAspireAPI = {
    isLoggedIn: isLoggedIn,
    getCachedAdmin: getCachedAdmin,
    clearToken: clearToken,

    isStudentLoggedIn: isStudentLoggedIn,
    getCachedStudent: getCachedStudent,

    getServices: getServices,
    getServiceFields: getServiceFields,
    getStories: getStories,
    getStory: getStory,
    registerUser: registerUser,

    adminLogin: adminLogin,
    sendAdminPasswordOtp: sendAdminPasswordOtp,
    verifyAdminPasswordOtp: verifyAdminPasswordOtp,
    changeAdminPassword: changeAdminPassword,
    adminLogout: adminLogout,

    getAdminUsers: getAdminUsers,
    getAdminUser: getAdminUser,
    setAdminUserStatus: setAdminUserStatus,
    deleteAdminUser: deleteAdminUser,

    getAdminServices: getAdminServices,
    createService: createService,
    updateService: updateService,
    deleteService: deleteService,

    createServiceField: createServiceField,
    updateServiceField: updateServiceField,
    deleteServiceField: deleteServiceField,

    getAdminPipelineStages: getAdminPipelineStages,
    getAdminApplications: getAdminApplications,
    getAdminApplication: getAdminApplication,
    createAdminApplication: createAdminApplication,
    updateAdminApplication: updateAdminApplication,
    deleteAdminApplication: deleteAdminApplication,

    getAdminFreeStudyCountries: getAdminFreeStudyCountries,
    createFreeStudyCountry: createFreeStudyCountry,
    updateFreeStudyCountry: updateFreeStudyCountry,
    deleteFreeStudyCountry: deleteFreeStudyCountry,

    getAdminSiteSettings: getAdminSiteSettings,
    updateSiteSetting: updateSiteSetting,

    getAdminStories: getAdminStories,
    createStory: createStory,
    updateStory: updateStory,
    deleteStory: deleteStory
  };
})(window);
