import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Gamepad2, ShoppingBag, Gift, UserPlus, Bell, Loader2, ChevronDown } from 'lucide-react';
import { motion as M, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';

const typeIcons = {
  game: Gamepad2,
  purchase: ShoppingBag,
  reward: Gift,
  friend: UserPlus,
  notification: Bell,
};

const typeColors = {
  game: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  purchase: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  reward: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  friend: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  notification: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

const ActivityPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('');
  const limit = 15;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filterOptions = [
    { id: '', label: 'All Events' },
    { id: 'game', label: 'Games' },
    { id: 'purchase', label: 'Purchases' },
    { id: 'reward', label: 'Rewards' },
    { id: 'friend', label: 'Friends' },
    { id: 'notification', label: 'Notifications' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFeed = useCallback(async (currentPage = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setLoading(true);

    setError(null);
    try {
      const params = { page: currentPage, limit };
      if (filterType) params.type = filterType;
      const data = await authService.getActivityFeed(params);

      const fetchedEvents = data.events || data.data || [];

      if (append) {
        setEvents(prev => [...prev, ...fetchedEvents]);
      } else {
        setEvents(fetchedEvents);
      }

      setPage(data.page || currentPage);
      setHasMore(fetchedEvents.length === limit);
    } catch (err) {
      setError(err.message);
    } finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeed(1, false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFeed]);

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchFeed(page + 1, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, isLoadingMore, hasMore, page, fetchFeed]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Feed</h2>
          <p className="text-white/50 mt-1">Real-time log of all player events and system activity.</p>
        </div>
        <div className="relative w-full md:w-64" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white flex items-center justify-between focus:outline-none focus:border-prime/50 transition-all hover:bg-white/5 group"
          >
            <span className="font-medium">{filterOptions.find(opt => opt.id === filterType)?.label || 'All Events'}</span>
            <ChevronDown size={16} className={`text-white/40 group-hover:text-white transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <M.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-full min-w-[160px] glass-card border border-white/10 z-[70] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="p-1.5 space-y-0.5">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFilterType(opt.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                        filterType === opt.id 
                          ? 'bg-prime/20 text-prime font-bold shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' 
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </M.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-xl text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Feed */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-prime animate-spin mx-auto" />
              <p className="text-white/40 font-medium">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-white/30">
            <p className="text-lg font-medium">No activity events found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event, index) => {
              const IconComp = typeIcons[event.type] || Activity;
              const colorClass = typeColors[event.type] || 'text-white/60 bg-white/5 border-white/10';
              const isLastElement = index === events.length - 1;

              return (
                <div ref={isLastElement ? lastElementRef : null} key={event.id || `activity-${index}`} className="flex items-start gap-3 px-4 sm:px-6 py-4 sm:py-5 hover:bg-white/[0.03] transition-all group">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-prime transition-colors truncate">{event.title || event.type}</p>
                    <p className="text-xs text-white/30 mt-1 truncate">
                      User: {event.userId?.substring(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <span className="text-xs text-white/20 font-medium">{formatTime(event.createdAt)}</span>
                    <p className="text-[10px] text-white/10 uppercase tracking-widest mt-1">{event.type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Loader & Status */}
        <div className="px-4 sm:px-6 py-6 border-t border-white/5 bg-white/[0.01] text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-prime">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading more events...</span>
            </div>
          ) : hasMore && events.length > 0 ? (
            <p className="text-sm text-white/30">Scroll down to load more</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
