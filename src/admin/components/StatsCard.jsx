import React, { memo } from 'react';

const StatsCard = memo(({ title, value, icon, color = 'prime' }) => {
  const Icon = icon;
  const formatValue = (val) => {
    if (val === undefined || val === null) return '0';
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    // Handle string numbers with commas already present or plain strings
    return val;
  };

  const displayValue = formatValue(value);
  
  const colorMap = {
    prime: 'from-[#7c3aed] to-[#3b82f6]',
    purple: 'from-[#a855f7] to-[#ec4899]',
    blue: 'from-[#2563eb] to-[#0ea5e9]',
    rose: 'from-[#f43f5e] to-[#fb7185]',
  };

  return (
    <div className={`glass-card p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500`}>
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${colorMap[color]} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`}></div>
      
      {/* Content */}
      <div className="flex justify-between items-start z-10">
        <div className="space-y-1">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{displayValue}</h3>
        </div>
        <div className={`p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 group-hover:bg-white/10 group-hover:text-white transition-all flex-shrink-0`}>
          <Icon size={22} className="sm:w-7 sm:h-7" />
        </div>
      </div>

      {/* Decorative Wave (SVG) */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-20">
        <svg viewBox="0 0 400 100" className="w-full h-auto">
          <path 
            fill="currentColor" 
            className={`text-${color === 'prime' ? 'purple-500' : color + '-500'}`}
            d="M0,80 C150,120 250,40 400,80 L400,100 L0,100 Z" 
          ></path>
        </svg>
      </div>

      {/* KPI Scopes Text (Small) */}
      <div className="mt-5 sm:mt-8 z-10">
        <div className="flex items-center gap-2 text-xs font-medium text-white/30 italic">
          <span>Target Achieved</span>
          <div className="w-1 h-1 rounded-full bg-green-500"></div>
          <span>Updated just now</span>
        </div>
      </div>
    </div>
  );
});

export default StatsCard;

