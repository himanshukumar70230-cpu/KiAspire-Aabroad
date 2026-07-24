(function (global) {
  'use strict';

  const API_BASE = 'https://kiaspire-aabroad.onrender.com/api';

  const TOKEN_KEY = 'kiaspire_admin_token';
  const ADMIN_KEY = 'kiaspire_admin_info';

  /* ---------- token / session helpers ---------- */

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  function setToken(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Unable to save token:', error);
    }
  }

  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    } catch (error) {
      console.error('Unable to clear session:', error);
    }
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  function getCachedAdmin() {
    try {
      const rawAdmin = localStorage.getItem(ADMIN_KEY);

      return rawAdmin ? JSON.parse(rawAdmin) : null;
    } catch (error) {
      return null;
    }
  }

  function setCachedAdmin(admin) {
    try {
      localStorage.setItem(
        ADMIN_KEY,
        JSON.stringify(admin)
      );
    } catch (error) {
      console.error('Unable to cache admin:', error);
    }
  }

  /* ---------- low-level request helper ---------- */

  async function request(path, options) {
    const opts = options || {};

    const method = opts.method || 'GET';

    const headers = {
      'Content-Type': 'application/json'
    };

    if (opts.auth) {
      const token = getToken();

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
        'Could not reach the server. Make sure the backend is running on port 3000.'
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

    if (response.status === 401 && opts.auth) {
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

  /* ---------- user APIs ---------- */

  // POST /api/user/register
  // body: { name, email, phone }
  function registerUser(payload) {
    return request('/user/register', {
      method: 'POST',
      body: payload
    });
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

    /*
      Your backend returns:

      {
        success: true,
        count: users.length,
        users: [...]
      }

      This function returns only the array so this works:

      const users = await KiAspireAPI.getAdminUsers();
      users.filter(...)
    */

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

    getServices: getServices,
    getStories: getStories,
    getStory: getStory,
    
    registerUser: registerUser,
    // registerStudent: registerStudent,
    // loginUser: loginUser,
    // getMyProgress: getMyProgress,
    // getMyProfile: getMyProfile,
    // logoutStudent: logoutStudent,


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

    getAdminStories: getAdminStories,
    createStory: createStory,
    updateStory: updateStory,
    deleteStory: deleteStory
  };
})(window);