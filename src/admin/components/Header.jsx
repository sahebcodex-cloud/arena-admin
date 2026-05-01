import React, { useState, useRef, useEffect, memo } from 'react';
import { Search, Bell, User, Settings, LogOut, ChevronDown, ShieldCheck, Menu } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { motion as M, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Header = memo(({ activeTab, onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAdmin();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-transparent relative z-[60] border-b border-white/5">

      {/* Left: Hamburger (mobile) + Breadcrumbs */}
      <div className={`flex items-center gap-3 transition-opacity duration-300 ${sidebarOpen ? 'opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto' : ''}`}>
        {/* Hamburger — only on mobile/tablet */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold hidden sm:block">Admin Panel</p>
          <h2 className="text-base sm:text-xl font-semibold capitalize tracking-tight">{activeTab}</h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className={`flex items-center gap-2 sm:gap-4 transition-opacity duration-300 ${sidebarOpen ? 'opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto' : ''}`}>

        {/* Search — collapsible on mobile */}
        <div className="relative group hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-prime transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-prime/50 focus:w-64 transition-all w-48 text-sm"
          />
        </div>

        {/* Mobile search icon */}
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/10"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        {/* Bell */}
        <button className="relative p-2 text-white/60 hover:text-white transition-colors group">
          <Bell size={20} className="group-hover:scale-110 transition-transform" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-prime rounded-full shadow-[0_0_8px_rgba(124,58,237,0.8)]"></span>
        </button>

        {/* Profile Section */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-6 border-l border-white/10 group transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold group-hover:text-prime transition-colors">{user?.name || 'Arena Admin'}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{user?.role || 'Super Admin'}</p>
            </div>
            <div className="relative">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${isProfileOpen ? 'bg-prime border-prime shadow-[0_0_15px_rgba(124,58,237,0.4)] scale-110' : 'bg-white/5 border-white/10 group-hover:border-prime/50'}`}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <User size={18} className={isProfileOpen ? 'text-white' : 'text-prime'} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-[#0a0518] rounded-full shadow-lg" />
            </div>
            <ChevronDown size={16} className={`text-white/20 hidden sm:block group-hover:text-white transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isProfileOpen && (
              <M.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-72 glass-card border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Dropdown Header */}
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-prime/20 border border-prime/30 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="text-prime" size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white leading-none mb-1">{user?.name || 'Arena Admin'}</p>
                      <p className="text-xs text-white/40 truncate">{user?.email || 'admin@arenax.studio'}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all group">
                    <User size={18} className="group-hover:text-prime" />
                    <span className="text-sm font-medium">My Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all group">
                    <Settings size={18} className="group-hover:text-prime" />
                    <span className="text-sm font-medium">Account Settings</span>
                  </button>

                  <div className="h-px bg-white/5 my-2 mx-4" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all group"
                  >
                    <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold">Sign Out</span>
                  </button>
                </div>

                {/* Dropdown Footer */}
                <div className="px-6 py-3 bg-white/[0.01] border-t border-white/5">
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] text-center">
                    ArenaX v1.0.4 • Stable
                  </p>
                </div>
              </M.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile search bar — expands below header */}
      <AnimatePresence>
        {isSearchOpen && !sidebarOpen && (
          <M.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/5 md:hidden z-50"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                autoFocus
                type="text"
                placeholder="Search anything..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-prime/50 text-sm"
              />
            </div>
          </M.div>
        )}
      </AnimatePresence>
    </header>
  );
});

export default Header;

