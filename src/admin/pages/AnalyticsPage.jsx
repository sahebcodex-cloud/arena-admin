import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Filter, Loader2, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPC, Pie, Cell } from 'recharts';
import authService from '../services/authService';

const COLORS = ['#7c3aed', '#3b82f6', '#f43f5e', '#f59e0b', '#10b981', '#ec4899'];

const AnalyticsPage = () => {
  const [breakdown, setBreakdown] = useState(null);
  const [funnels, setFunnels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimension, setDimension] = useState('');
  const [funnelType, setFunnelType] = useState('onboarding');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [authService.getFunnels({ type: funnelType })];
      if (dimension) {
        promises.push(authService.getBreakdown({ dimension }));
      }

      const results = await Promise.allSettled(promises);

      // Funnel result is always the first one
      if (results[0].status === 'fulfilled') setFunnels(results[0].value);

      // Breakdown result is the second one, if dimension was set
      if (dimension && results[1]?.status === 'fulfilled') {
        setBreakdown(results[1].value);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dimension, funnelType]);

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchAnalytics(); 
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAnalytics]);

  const breakdownItems = breakdown?.items || [];
  const funnelStages = funnels?.stages || [];

  // initial page loading state removed so the dropdowns don't unmount.

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-white/50 mt-1">Breakdowns, funnels, and player insights.</p>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-xl text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Breakdown Chart */}
        <div className="glass-card p-4 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <PieChart className="text-prime" size={24} />
              <h3 className="text-xl font-bold">Breakdown by</h3>
            </div>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-prime/50 [color-scheme:dark]"
            >
              <option value="" disabled>Select Dimension</option>
              <option value="game">Game</option>
              <option value="platform">Platform</option>
              <option value="provider">Provider</option>
              <option value="rewardType">Reward Type</option>
              <option value="productId">Product ID</option>
              <option value="friendStatus">Friend Status</option>
              <option value="result">Result</option>
            </select>
          </div>

          {!dimension ? (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl opacity-30">
              <p className="text-lg font-bold">Please select a dimension</p>
            </div>
          ) : loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-prime animate-spin mb-4" />
              <p className="text-white/40 font-medium text-sm">Loading breakdown...</p>
            </div>
          ) : breakdownItems.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPC>
                  <Pie
                    data={breakdownItems.map(item => ({ name: item.key, value: item.count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {breakdownItems.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#fff'
                    }}
                  />
                </RechartsPC>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {breakdownItems.map((item, i) => (
                  <div key={item.key} className="flex items-center gap-2 text-xs text-white/60">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="font-medium">{item.key}</span>
                    <span className="text-white/30">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl opacity-30">
              <p className="text-lg font-bold">No breakdown data</p>
            </div>
          )}
        </div>

        {/* Funnel Chart */}
        <div className="glass-card p-4 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-prime" size={24} />
              <h3 className="text-xl font-bold">Funnel</h3>
            </div>
            <select
              value={funnelType}
              onChange={(e) => setFunnelType(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-prime/50 [color-scheme:dark]"
            >
              <option value="onboarding">Onboarding</option>
              <option value="engagement">Engagement</option>
              <option value="monetization">Monetization</option>
            </select>
          </div>

          {loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-prime animate-spin mb-4" />
              <p className="text-white/40 font-medium text-sm">Loading funnel...</p>
            </div>
          ) : funnelStages.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelStages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="label" type="category" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#fff'
                    }}
                    formatter={(value) => [value, 'Count']}
                  />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl opacity-30">
              <p className="text-lg font-bold">No funnel data</p>
            </div>
          )}

          {/* Conversion Rates */}
          {funnelStages.length > 0 && (
            <div className="mt-6 space-y-2">
              {funnelStages.map((stage, i) => (
                <div key={stage.key || i} className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{stage.count}</span>
                    {stage.conversionFromPrevious !== undefined && i > 0 && (
                      <span className="text-xs text-prime bg-prime/10 px-2 py-0.5 rounded-full">
                        {(stage.conversionFromPrevious * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
