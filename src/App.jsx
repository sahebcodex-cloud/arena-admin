import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './admin/pages/LoginPage';

import AdminLayout from './admin/layouts/AdminLayout';

function App() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/admin');
  };

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={handleLogin} />} />

      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
    </Routes>
  );
}

export default App;
