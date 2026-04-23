import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CosmicBackground from '../components/CosmicBackground';
import { useAdmin } from '../context/AdminContext';
import logoImg from '../../assets/logo.png';

const LoginPage = ({ onLogin }) => {
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      // Destructure admin credentials safely
      const user = response?.user;
      
      if (user) {
        console.log('Admin Authenticated:', user.email);
      }
      
      setLoading(false);
      onLogin(); // Trigger redirection in App.jsx
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <CosmicBackground />
      
      {/* Login Card */}
      <div className="glass-card w-full max-w-md p-6 sm:p-10 space-y-6 sm:space-y-8 relative group">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img 
              src={logoImg} 
              alt="ArenaX Logo" 
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-500" 
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white/90">Admin Login</h1>
            <p className="text-sm sm:text-base text-white/40 font-medium">Enter your admin credentials</p>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="relative">
              <input 
                type="email" 
                required
                placeholder="Email" 
                className="glass-input pl-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="Password" 
                className="glass-input pl-4 pr-14"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-premium w-full flex items-center justify-center gap-3 relative group"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span className="text-lg">Login</span>
            )}
          </button>


        </form>
      </div>
    </div>
  );
};

export default LoginPage;
