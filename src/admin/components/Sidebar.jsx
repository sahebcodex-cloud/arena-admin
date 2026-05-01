import React, { memo, useCallback } from 'react';
import { LayoutDashboard, Users, BarChart3, Activity, Settings, LogOut, ChevronRight, Wallet, ShoppingCart, X, Sliders, Database } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { motion as M, AnimatePresence } from 'framer-motion';
import logoImg from '../../assets/areanx_logo_Black_(1024X1024).png';

const Sidebar = memo(({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { logout } = useAdmin();
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'players', icon: Users, label: 'Players' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'store', icon: ShoppingCart, label: 'Store' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'activity', icon: Activity, label: 'Activity Feed' },
    { id: 'explorer', icon: Database, label: 'Data Explorer' },
    { id: 'betting', icon: Sliders, label: 'Betting Config' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleNav = useCallback((id) => {
    setActiveTab(id);
    if (onClose) onClose(); // close drawer on mobile
  }, [setActiveTab, onClose]);

  const sidebarContent = (
    <aside className="h-full w-72 glass-sidebar flex flex-col p-5 relative">
      {/* Mobile close button removed as per user request */}

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2 mt-2 lg:mt-0 shrink-0">
        <img 
          src={logoImg} 
          alt="ArenaX Logo" 
          className="h-12 w-auto object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform duration-500" 
        />
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          ArenaX Admin
        </h1>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 min-h-0">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${activeTab === item.id
              ? 'bg-prime/20 text-white border border-prime/30 shadow-[0_0_20px_rgba(124,58,237,0.2)]'
              : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
          >
            <item.icon size={22} className={activeTab === item.id ? 'text-prime' : 'group-hover:text-white'} />
            <span className="font-medium flex-1 text-left">{item.label}</span>
            {activeTab === item.id && <ChevronRight size={18} className="text-prime" />}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-4 px-4 py-3 rounded-2xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-colors mt-3 shrink-0"
      >
        <LogOut size={22} />
        <span className="font-medium">Logout</span>
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-72 z-50">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <M.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            {/* Drawer */}
            <M.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-screen w-72 z-50 lg:hidden"
            >
              {sidebarContent}
            </M.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default Sidebar;

