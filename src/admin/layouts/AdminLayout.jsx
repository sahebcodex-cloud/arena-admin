import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CosmicBackground from '../components/CosmicBackground';
import DashboardPage from '../pages/DashboardPage';
import PlayersPage from '../pages/PlayersPage';
import WalletPage from '../pages/WalletPage';
import StorePage from '../pages/StorePage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ActivityPage from '../pages/ActivityPage';
import BettingConfigPage from '../pages/BettingConfigPage';
import DataExplorerPage from '../pages/DataExplorerPage';
import SettingsPage from '../pages/SettingsPage';

const AdminLayout = () => {
  const { user } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <DashboardPage />;
      case 'players':    return <PlayersPage />;
      case 'wallet':     return <WalletPage />;
      case 'store':      return <StorePage />;
      case 'analytics':  return <AnalyticsPage />;
      case 'activity':   return <ActivityPage />;
      case 'explorer':   return <DataExplorerPage />;
      case 'betting':    return <BettingConfigPage />;
      case 'settings':   return <SettingsPage />;
      default:           return <DashboardPage />;
    }
  };

  return (
    <div className="h-screen text-white font-sans selection:bg-prime selection:text-white relative overflow-hidden">
      <CosmicBackground />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area — offset by sidebar width only on large screens */}
      <main className="lg:pl-72 flex flex-col h-screen">
        <Header
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
