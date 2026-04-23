import React from 'react';
import { User, Mail, Shield, ShieldCheck, Key, Clock, Settings as SettingsIcon } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const SettingsPage = () => {
  const { user } = useAdmin();

  const profileData = [
    { 
      label: 'Full Name', 
      value: user?.name || 'Arena Admin', 
      icon: User,
      description: 'The name displayed across the administrative dashboard.'
    },
    { 
      label: 'Email Address', 
      value: user?.email || 'admin@arenax.studio', 
      icon: Mail,
      description: 'The primary email used for login and notifications.'
    },
    { 
      label: 'Administrator Role', 
      value: user?.role || 'Super Admin', 
      icon: Shield,
      description: 'Your current permission level within the system.'
    },
    { 
      label: 'Authentication Status', 
      value: 'Verified', 
      icon: ShieldCheck,
      description: 'Confirmation that your account is fully authenticated.'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-white/50 mt-1">Manage your administrator account and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="xl:col-span-2 space-y-8">
          <div className="glass-card p-5 sm:p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <User className="text-prime" size={24} />
              Account Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileData.map((item, index) => (
                <div key={index} className="p-6 bg-white/5 border border-white/5 rounded-2xl group hover:border-prime/30 hover:bg-white/[0.08] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-prime/10 flex items-center justify-center text-prime group-hover:scale-110 transition-transform pt-0.5">
                      <item.icon size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{item.label}</p>
                      <p className="text-lg font-bold text-white group-hover:text-prime transition-colors">{item.value}</p>
                      <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 sm:p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-red-400">
              <Key size={24} />
              Security & Privacy
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                <div className="space-y-1">
                  <p className="font-bold text-white">Password Management</p>
                  <p className="text-xs text-white/40">Update your account password to maintain security.</p>
                </div>
                <button className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                  Change Password
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                <div className="space-y-1">
                  <p className="font-bold text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-white/40 italic">Coming soon: Add an extra layer of security to your account.</p>
                </div>
                <div className="w-12 h-6 bg-white/5 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-5 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-prime/20 rounded-full blur-[40px]" />
            
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Clock className="text-prime" size={24} />
              Session Meta
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Last Activity</p>
                <p className="text-sm font-bold text-white/80">Just now (127.0.0.1)</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">System Version</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-sm font-bold text-white/80 tracking-widest leading-none pt-0.5">ARENAX-v1.0.4</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-white/30 leading-relaxed italic">
                  This account is registered as a root administrative profile with full system access.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-8 group hover:bg-prime/5 transition-all">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3 group-hover:text-prime transition-colors">
              <SettingsIcon size={24} />
              Preferences
            </h3>
            <p className="text-sm text-white/40 mb-6">Manage how you receive alerts and system updates.</p>
            <button className="w-full py-3 bg-prime/20 border border-prime/30 rounded-2xl text-prime font-bold hover:bg-prime transition-all hover:text-white">
              Notification Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
