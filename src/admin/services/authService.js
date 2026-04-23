import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Configure a centralized Axios client with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 1. Request Interceptor: Attach the current Access Token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
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
      const refreshToken = localStorage.getItem('admin_refresh_token');
      
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this failed request and wait for the new token
        return new Promise(function(resolve, reject) {
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
        // Sanitize URL to avoid double slashes if API_BASE_URL ends with a slash
        const sanitizedBaseUrl = API_BASE_URL.replace(/\/+$/, '');
        const res = await axios.post(`${sanitizedBaseUrl}/auth/refresh`, {
          refreshToken
        });
        
        const newToken = res.data.accessToken || res.data.token;
        const newRefreshToken = res.data.refreshToken;
        
        if (newToken) {
          localStorage.setItem('admin_token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('admin_refresh_token', newRefreshToken);
          }
          
          // Update the Authorization header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          
          // Update the Authorization header and replay the original request
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No valid token received from refresh endpoint');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed - purge state and force re-login
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/'; 
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
      
      // Store tokens and user info in localStorage for persistence
      if (token) {
        const userInfo = { email, ...userData }; // Fallback to inputted email if not provided in response
        localStorage.setItem('admin_token', token);
        if (refreshToken) {
          localStorage.setItem('admin_refresh_token', refreshToken);
        }
        localStorage.setItem('admin_user', JSON.stringify(userInfo));
        
        // Ensure returning standardized user object
        response.data.user = userInfo;
        // Store full dashboard data if present in response
        if (response.data.stats || response.data.recentPlayers) {
          localStorage.setItem('admin_dashboard_data', JSON.stringify({
            stats: response.data.stats,
            recentPlayers: response.data.recentPlayers,
            growthData: response.data.growthData
          }));
        }
      }
      
      return response.data;
    } catch (error) {
      // Clean error handling
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },



  /**
   * Logout the admin
   */
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_dashboard_data');
  },

  /**
   * Get the current admin access token
   */
  getToken: () => localStorage.getItem('admin_token'),

  /**
   * Get the current admin refresh token
   */
  getRefreshToken: () => localStorage.getItem('admin_refresh_token'),

  /**
   * Get current admin user info
   */
  getUser: () => {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get cached dashboard data
   */
  getDashboardData: () => {
    const data = localStorage.getItem('admin_dashboard_data');
    return data ? JSON.parse(data) : null;
  },



  /**
   * Check if the admin is authenticated
   */
  isAuthenticated: () => !!localStorage.getItem('admin_token'),

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
      // Cache in localStorage for offline access
      localStorage.setItem('admin_dashboard_data', JSON.stringify({ stats: response.data.kpis || response.data }));
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
