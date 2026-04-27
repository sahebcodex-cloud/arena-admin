import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { AdminContext } from './AdminContext';

/**
 * AdminProvider Component
 * Manages global admin state (user details, dashboard data, loading states).
 * Refactored into its own file to comply with React Fast Refresh rules.
 */
export const AdminProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshData = useCallback(() => {
    setUser(authService.getUser());
    setDashboardData(authService.getDashboardData());
  }, []);

  useEffect(() => {
    const initialize = async () => {
      // 1. Initial immediate sync from localStorage for immediate (stale) data
      const userData = authService.getUser();
      const cachedStats = authService.getDashboardData();
      
      setUser(userData);
      setDashboardData(cachedStats);

      // 2. Background fetch of fresh data to ensure dashboard is up to date
      try {
        if (userData) {
          const freshOverview = await authService.getOverview();
          setDashboardData(prev => ({ ...prev, stats: freshOverview.kpis || freshOverview }));
        }
      } catch (err) {
        console.error('Failed to pre-fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    refreshData();
    
    // Immediately fetch fresh stats so the dashboard populates right away
    try {
      const freshOverview = await authService.getOverview();
      setDashboardData(prev => ({ ...prev, stats: freshOverview.kpis || freshOverview }));
    } catch (err) {
      console.error('Failed to fetch dashboard data after login:', err);
    }
    
    return response;
  }, [refreshData]);

  const logout = useCallback(() => {
    authService.logout(); // clears sessionStorage (all auth data for this tab)
    setUser(null);
    setDashboardData(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const contextValue = useMemo(() => ({
    user, dashboardData, loading, login, logout, refreshData
  }), [user, dashboardData, loading, login, logout, refreshData]);

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};
