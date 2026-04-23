import React, { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GrowthChart = memo(({ data: dataProp = [], metricLabel = "newUsers" }) => {
  const data = dataProp || [];
  const totalValue = data.reduce((acc, curr) => acc + (curr.value || curr.users || 0), 0);

  // Format label for display
  const displayLabel = metricLabel.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  return (
    <div className="glass-card p-5 sm:p-10 h-[320px] sm:h-[450px] flex flex-col">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-10">
        <div>
          <h3 className="text-lg sm:text-2xl font-bold">{displayLabel} Trend</h3>
          <p className="text-sm text-white/40">Total {displayLabel} in selected range</p>
        </div>
        <div className="flex items-center gap-2 text-green-400 font-bold bg-green-400/10 px-4 py-2 rounded-full border border-green-400/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Uptrend
        </div>
      </div>

      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#ffffff40" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#ffffff40" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  color: '#fff'
                }}
                itemStyle={{ color: '#7c3aed' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#7c3aed" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorUsers)" 
                dot={{ fill: '#7c3aed', strokeWidth: 2, r: 6, stroke: '#fff' }}
                activeDot={{ r: 8, stroke: '#7c3aed', strokeWidth: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-lg font-bold">No Trend Data Available</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm font-medium text-white/30">
        Total {displayLabel} in View: <span className="text-white font-bold">{totalValue.toLocaleString()}</span>
      </div>
    </div>
  );
});

export default GrowthChart;

