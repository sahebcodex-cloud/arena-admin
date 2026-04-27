import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE-SESSION / SINGLE-TAB ENFORCEMENT
//
// How it works:
//   • All auth data (token, user) is stored in sessionStorage — it is
//     ONLY available in the current tab and dies when the tab is closed.
//   • On every fresh page load we write a new unique SESSION_ID to
//     localStorage. Because localStorage is shared across tabs, every OTHER
//     open tab receives a `storage` event and sees the new ID doesn't match
//     its own — so it clears its sessionStorage and redirects to login.
//   • This means opening the URL in a new tab (normal OR incognito window)
//     always starts fresh and kicks any previously open tabs.
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_ID_KEY = 'admin_active_session_id';
const MY_SESSION_ID = crypto.randomUUID(); // unique to THIS tab load

// Claim the session — other tabs will detect this change and log out
localStorage.setItem(SESSION_ID_KEY, MY_SESSION_ID);

// Listen for another tab claiming the session
window.addEventListener('storage', (event) => {
  if (event.key === SESSION_ID_KEY && event.newValue !== MY_SESSION_ID) {
    // Only kick if this tab is actually logged in.
    // If there's no token (e.g. already on login page), do nothing —
    // otherwise login-page tabs trigger each other in an infinite loop.
    if (sessionStorage.getItem('admin_token')) {
      sessionStorage.clear();
      window.location.replace('/');
    }
  }
});

// Configure a centralized Axios client with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 1. Request Interceptor: Attach the current Access Token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Prevent multiple concurrent token refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. Response Interceptor: Automatically handle 401 Unauthorized errors to Refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = sessionStorage.getItem('admin_refresh_token');

      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this failed request and wait for the new token
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest._retry = true;
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token refresh via isolated axios call to avoid interceptor loop
        const sanitizedBaseUrl = API_BASE_URL.replace(/\/+$/, '');
        const res = await axios.post(`${sanitizedBaseUrl}/auth/refresh`, {
          refreshToken
        });

        const newToken = res.data.accessToken || res.data.token;
        const newRefreshToken = res.data.refreshToken;

        if (newToken) {
          sessionStorage.setItem('admin_token', newToken);
          if (newRefreshToken) {
            sessionStorage.setItem('admin_refresh_token', newRefreshToken);
          }

          // Update the Authorization header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          processQueue(null, newToken);

          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No valid token received from refresh endpoint');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed - purge session and force re-login
        sessionStorage.clear();
        window.location.replace('/');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

const authService = {
  /**
   * Admin Login
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} The response data containing tokens and user info
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/admin/login', {
        email,
        password,
      });

      // Flexibly handle different possible response shapes
      const token = response.data.accessToken || response.data.token;
      const refreshToken = response.data.refreshToken;
      const userData = response.data.user || response.data.admin || response.data.data || {};

      // Store tokens and user info in sessionStorage (tab-scoped only)
      if (token) {
        const userInfo = { email, ...userData };
        sessionStorage.setItem('admin_token', token);
        if (refreshToken) {
          sessionStorage.setItem('admin_refresh_token', refreshToken);
        }
        sessionStorage.setItem('admin_user', JSON.stringify(userInfo));

        // Ensure returning standardized user object
        response.data.user = userInfo;
        // Store dashboard data in sessionStorage (tab-scoped)
        if (response.data.stats || response.data.recentPlayers) {
          sessionStorage.setItem('admin_dashboard_data', JSON.stringify({
            stats: response.data.stats,
            recentPlayers: response.data.recentPlayers,
            growthData: response.data.growthData
          }));
        }
      }

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },



  /**
   * Logout the admin — clears only this tab's sessionStorage
   */
  logout: () => {
    sessionStorage.clear();
  },

  /**
   * Get the current admin access token (sessionStorage — tab-scoped)
   */
  getToken: () => sessionStorage.getItem('admin_token'),

  /**
   * Get the current admin refresh token
   */
  getRefreshToken: () => sessionStorage.getItem('admin_refresh_token'),

  /**
   * Get current admin user info
   */
  getUser: () => {
    const user = sessionStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get cached dashboard data
   */
  getDashboardData: () => {
    const data = sessionStorage.getItem('admin_dashboard_data');
    return data ? JSON.parse(data) : null;
  },

  /**
   * Check if the admin is authenticated in this tab
   */
  isAuthenticated: () => !!sessionStorage.getItem('admin_token'),

  // ─────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────

  /**
   * List all players with pagination, search, and sorting
   * @param {Object} params - { page, limit, search, from, to, sortBy, sortOrder, include }
   * @returns {Promise<Object>} { page, limit, total, users[] }
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  /**
   * Get a single player's full details
   * @param {string} id - Player UUID
   * @param {string} include - CSV: stats,wallets,purchases,rewards,notifications,friends,recentGames
   */
  getUserById: async (id, include = '') => {
    try {
      const response = await api.get(`/admin/users/${id}`, { params: include ? { include } : {} });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user details');
    }
  },

  /**
   * Update a player's profile
   * @param {string} id - Player UUID
   * @param {Object} data - { email, name, contact, profileImage }
   */
  updateUser: async (id, data) => {
    try {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  /**
   * Delete a player
   * @param {string} id - Player UUID
   */
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  /**
   * Gift items to a player
   * @param {string} id - Player UUID
   * @param {object} currencies - { gold, silver, diamond }
   */
  giftUser: async (id, currencies) => {
    try {
      // This calls the POST /admin/users/:id/gift endpoint we created
      const response = await api.post(`/admin/users/${id}/gift`, currencies);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send gift');
    }
  },


    


  

  /**
   * Get player's wallets
   * @param {string} id - Player UUID
   */
  getUserWallets: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}/wallets`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch wallets');
    }
  },

  /**
   * Get player's store purchases
   * @param {string} id - Player UUID
   */
  getUserPurchases: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}/store-purchases`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch purchases');
    }
  },

  // ─────────────────────────────────────────────────
  // DASHBOARD & ANALYTICS
  // ─────────────────────────────────────────────────

  /**
   * Get admin overview KPIs
   * @param {Object} params - { from, to }
   * @returns {Promise<Object>} { range, kpis, kpiScopes }
   */
  getOverview: async (params = {}) => {
    try {
      const response = await api.get('/admin/overview', { params });
      // Cache in sessionStorage (tab-scoped)
      sessionStorage.setItem('admin_dashboard_data', JSON.stringify({ stats: response.data.kpis || response.data }));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch overview');
    }
  },

  /**
   * Get time-series analytics data
   * @param {Object} params - { from, to, granularity (day|week|month), metrics (CSV) }
   * @returns {Promise<Object>} { range, granularity, metrics, points[] }
   */
  getTimeseries: async (params = {}) => {
    try {
      const response = await api.get('/admin/analytics/timeseries', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch timeseries');
    }
  },

  /**
   * Get breakdown analytics
   * @param {Object} params - { dimension (game|platform|provider|...), from, to }
   * @returns {Promise<Object>} { dimension, range, total, metric, items[] }
   */
  getBreakdown: async (params = {}) => {
    try {
      const response = await api.get('/admin/analytics/breakdown', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch breakdown');
    }
  },

  /**
   * Get funnel analytics
   * @param {Object} params - { type (onboarding|engagement|monetization), from, to }
   * @returns {Promise<Object>} { type, range, stages[], comparison }
   */
  getFunnels: async (params = {}) => {
    try {
      const response = await api.get('/admin/analytics/funnels', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch funnels');
    }
  },

  // ─────────────────────────────────────────────────
  // ACTIVITY FEED
  // ─────────────────────────────────────────────────

  /**
   * Get activity feed
   * @param {Object} params - { page, limit, type }
   * @returns {Promise<Object>} { page, limit, total, events[] }
   */
  getActivityFeed: async (params = {}) => {
    try {
      const response = await api.get('/admin/activity/feed', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch activity feed');
    }
  },

  // ─────────────────────────────────────────────────
  // BETTING CONFIG
  // ─────────────────────────────────────────────────

  /**
   * Update betting profit configuration
   * @param {number} profitMultiplier - e.g. 0.75 = 75% profit
   */
  updateBettingConfig: async (profitMultiplier) => {
    try {
      const response = await api.put('/admin/betting/config', { profitMultiplier });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update betting config');
    }
  },

  // ─────────────────────────────────────────────────
  // DATA EXPLORER
  // ─────────────────────────────────────────────────

  /**
   * Explore raw data tables
   * @param {string} entity - users|wallets|user_stats|game_results|rooms|store_purchases|...
   * @param {Object} params - { page, limit }
   */
  getDataExplorer: async (entity, params = {}) => {
    try {
      const response = await api.get(`/admin/data/${entity}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch data');
    }
  },
};

export default authService;
