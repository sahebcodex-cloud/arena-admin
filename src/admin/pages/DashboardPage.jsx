import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserPlus, Zap, Gamepad2, ShoppingBag, Coins, Gift, UserCheck, Loader2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import authService from '../services/authService';
import StatsCard from '../components/StatsCard';
import GrowthChart from '../components/GrowthChart';
import RecentPlayers from '../components/RecentPlayers';

const DashboardPage = () => {
  const { dashboardData, loading: adminLoading } = useAdmin();

  // Live data states
  const [timeseries, setTimeseries] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeseries filters
  const [granularity, setGranularity] = useState('day');
  const [metric, setMetric] = useState('newUsers');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeseriesLoading, setTimeseriesLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardSpecifics = async () => {
      setLoading(true);
      setError(null);
      try {
        // Only fetch recent users if dashboardData is already being updated globally
        const res = await authService.getUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' });
        const data = res.users || res.data || (Array.isArray(res) ? res : []);
        setRecentUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSpecifics();
  }, []);

  useEffect(() => {
    const fetchTimeseriesData = async () => {
      setTimeseriesLoading(true);
      try {
        const response = await authService.getTimeseries({
          granularity,
          metrics: metric,
          from: new Date(fromDate).toISOString(),
          to: new Date(toDate).toISOString()
        });
        setTimeseries(response);
      } catch (err) {
        console.error('Failed to fetch timeseries', err);
      } finally {
        setTimeseriesLoading(false);
      }
    };
    fetchTimeseriesData();
  }, [granularity, metric, fromDate, toDate]);

  // Transform timeseries points into chart-ready format
  const chartData = useMemo(() => {
    return timeseries?.points?.map(p => ({
      name: p.bucket ? new Date(p.bucket).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      value: p[metric] || 0,
    })) || [];
  }, [timeseries, metric]);

  const stats = dashboardData?.stats || {};

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-prime animate-spin mx-auto" />
          <p className="text-white/40 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-xl text-sm text-center">
          ⚠️ Some data may be unavailable: {error}
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Users" 
          value={stats.totalUsers ?? stats.totalUsersAllTime ?? '0'} 
          icon={Users} 
          color="prime" 
        />
        <StatsCard 
          title="New Users" 
          value={stats.newUsers ?? stats.newUsersInRange ?? '0'} 
          icon={UserPlus} 
          color="purple" 
        />
        <StatsCard 
          title="Active Users" 
          value={stats.activeUsers ?? '0'} 
          icon={Zap} 
          color="blue" 
        />
        <StatsCard 
          title="Matches Played" 
          value={stats.matches ?? '0'} 
          icon={Gamepad2} 
          color="rose" 
        />
        <StatsCard 
          title="Purchases" 
          value={stats.purchases ?? '0'} 
          icon={ShoppingBag} 
          color="prime" 
        />
        <StatsCard 
          title="Coins Credited" 
          value={stats.coinsCredited ?? '0'} 
          icon={Coins} 
          color="blue" 
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/50 font-medium">Metric</label>
              <select 
                value={metric} 
                onChange={(e) => setMetric(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-prime [color-scheme:dark]"
              >
                <option value="newUsers">New Users</option>
                <option value="activeUsers">Active Users</option>
                <option value="matches">Matches Played</option>
                <option value="purchases">Purchases</option>
                <option value="coinsCredited">Coins Credited</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/50 font-medium">Granularity</label>
              <select 
                value={granularity} 
                onChange={(e) => setGranularity(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-prime [color-scheme:dark]"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/50 font-medium">From</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-prime [color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/50 font-medium">To</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-prime [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="relative">
            {timeseriesLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
                <Loader2 className="w-8 h-8 text-prime animate-spin" />
              </div>
            )}
            <GrowthChart data={chartData} metricLabel={metric} />
          </div>
        </div>
        <div>
          <RecentPlayers players={recentUsers} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
