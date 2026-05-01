import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './admin/pages/LoginPage';
import AdminLayout from './admin/layouts/AdminLayout';
import { useAdmin } from './admin/context/AdminContext';
import authService from './admin/services/authService';

// Always show the login page on the root path, removing auto-login
const PublicRoute = ({ onLogin }) => {
  // Clear the session here so that opening the login page guarantees a fresh start
  authService.logout();
  return <LoginPage onLogin={onLogin} />;
};

// Protect /admin — redirect unauthenticated users to login
const PrivateRoute = () => {
  const { loading } = useAdmin();
  if (loading) return null; // wait for initial auth check
  if (!authService.isAuthenticated()) return <Navigate to="/" replace />;
  return <AdminLayout />;
};

function App() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/admin');
  };

  return (
    <Routes>
      <Route path="/" element={<PublicRoute onLogin={handleLogin} />} />
      <Route path="/admin/*" element={<PrivateRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

