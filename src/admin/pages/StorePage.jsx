import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Loader2, ShoppingBag, ShoppingCart, Activity, Tag, Calendar, CreditCard, CheckCircle2 } from 'lucide-react';
import { motion as M, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';

import avatar0 from '../../assets/call-of-duty-0.png';
import avatar1 from '../../assets/call-of-duty-1.png';
import avatar2 from '../../assets/call-of-duty-2.png';
import avatar3 from '../../assets/call-of-duty-3.png';
import avatar4 from '../../assets/call-of-duty-4.png';
import avatar5 from '../../assets/call-of-duty-5.png';

const AVATARS = [avatar0, avatar1, avatar2, avatar3, avatar4, avatar5];

const getAvatarImage = (profileImageId) => {
  const index = Number(profileImageId);
  if (!isNaN(index) && index >= 0 && index < AVATARS.length) {
    return AVATARS[index];
  }
  return AVATARS[0];
};

// Utility for safe property access
const safeGet = (obj, mainKey, fallbackKeys, defaultVal) => {
  if (!obj) return defaultVal;
  if (obj[mainKey] !== undefined) return obj[mainKey];
  for (let key of fallbackKeys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return defaultVal;
};

// Memoized Store Player Row Component
const StorePlayerRow = memo(({ player, isExpanded, isLast, lastElementRef, onStoreInfoClick, purchaseData, purchaseLoading }) => {
  const id = safeGet(player, 'id', ['_id', 'userId'], '');
  const name = safeGet(player, 'name', ['username'], 'Unknown');
  const email = safeGet(player, 'email', [], 'No email');
  const profileImage = safeGet(player, 'profileImage', [], 0);

  return (
    <div ref={isLast ? lastElementRef : null} className={`flex flex-col transition-all duration-300 ${isExpanded ? 'bg-white/[0.03]' : ''}`}>
      {/* Player Row */}
      <div className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 px-4 py-5 md:px-6 hover:bg-white/[0.04] transition-all group cursor-pointer" onClick={() => onStoreInfoClick(player)}>
        <div className="col-span-5 flex items-center gap-4">
          <div className="w-12 h-12 md:w-10 md:h-10 rounded-full border border-prime/30 overflow-hidden bg-white/5 group-hover:scale-110 transition-transform flex-shrink-0">
            <img
              src={getAvatarImage(profileImage)}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white group-hover:text-prime transition-colors truncate text-base md:text-sm">{name}</p>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest truncate block">ID: {id.substring(0, 8)}...</span>
          </div>
        </div>

        <div className="col-span-4 flex items-center">
          <span className="text-white/50 text-xs font-medium md:hidden w-16 uppercase">Email</span>
          <span className="text-white/70 font-medium truncate flex-1 text-sm">{email}</span>
        </div>

        <div className="col-span-3 flex justify-end items-center mt-2 md:mt-0">
          <button
            onClick={(e) => { e.stopPropagation(); onStoreInfoClick(player); }}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 rounded-xl text-sm font-bold transition-all duration-300 ${isExpanded
              ? 'bg-prime text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
              : 'bg-prime/10 text-prime border border-prime/20 hover:bg-prime/20'
              }`}
          >
            <ShoppingBag size={16} />
            {isExpanded ? 'Hide Purchases' : 'View Purchases'}
          </button>
        </div>
      </div>

      {/* Expandable Purchase Data */}
      <AnimatePresence>
        {isExpanded && (
          <M.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t-2 border-prime/30 bg-black/20 shadow-inner"
          >
            <div className="px-4 py-6 sm:px-6 md:px-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-prime/20 rounded-lg">
                  <ShoppingCart size={20} className="text-prime" />
                </div>
                <h3 className="text-lg font-bold">
                  Purchase History for <span className="text-prime truncate max-w-[150px] sm:max-w-xs md:max-w-md inline-block align-bottom">{name}</span>
                </h3>
              </div>

              {purchaseLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 text-prime animate-spin" />
                </div>
              ) : !purchaseData || purchaseData.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-10 text-center">
                  <Activity size={40} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/40 font-medium">No purchase history found for this player.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-white/80">
                  {purchaseData.map((item, idx) => (
                    <div key={item.id || item._id || item.transactionId || `purchaseData-${idx}`} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3 hover:bg-white/[0.04] transition-colors group">
                      {Array.from(new Set(purchaseData.flatMap(Object.keys))).map(key => {
                        const value = item[key];
                        if (value === undefined) return null;
                        return (
                          <div key={key} className="flex justify-between items-start gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-sm font-medium text-white/90 text-right break-all" title={typeof value === 'object' ? JSON.stringify(value) : String(value ?? 'N/A')}>
                              {typeof value === 'boolean'
                                ? (value ? 'Yes' : 'No')
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value ?? 'N/A')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </M.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const StorePage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;

  // Global Purchase state
  const [expandedRow, setExpandedRow] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const fetchPlayers = useCallback(async (currentPage = 1, search = '', append = false) => {
    try {
      if (append) setIsLoadingMore(true);
      else setLoading(true);

      setError(null);
      const params = { page: currentPage, limit, sortBy: 'createdAt', sortOrder: 'DESC' };
      if (search.trim()) params.search = search.trim();
      const data = await authService.getUsers(params);

      const fetchedPlayers = data.users || data.data || (Array.isArray(data) ? data : []);

      if (append) {
        setPlayers(prev => [...prev, ...fetchedPlayers]);
      } else {
        setPlayers(fetchedPlayers);
      }

      setPage(data.page || currentPage);
      setHasMore(fetchedPlayers.length === limit);
    } catch (err) {
      setError(err.message);
    } finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPlayers(1, searchQuery, false); }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPlayers]);

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPlayers(page + 1, searchQuery, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, isLoadingMore, hasMore, page, searchQuery, fetchPlayers]);

  const handleStoreInfoClick = useCallback(async (player) => {
    const id = player.id || player._id || player.userId;
    setExpandedRow(prev => {
      if (prev === id) {
        setPurchaseData(null);
        return null;
      }

      const fetchPurchases = async () => {
        setPurchaseLoading(true);
        try {
          const data = await authService.getUserPurchases(id);
          const purchases = data.purchases || (Array.isArray(data) ? data : [data]);
          setPurchaseData(purchases.length ? purchases : []);
        } catch (err) {
          console.error(err);
          setPurchaseData([]);
        } finally {
          setPurchaseLoading(false);
        }
      };

      fetchPurchases();
      return id;
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Store Purchases</h2>
          <p className="text-white/50 mt-1">Audit and track real-time items and currency purchases by players.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-prime/50 w-full sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="glass-card overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-5 text-sm font-bold text-white/40 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
          <div className="col-span-5">Player</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-10 text-center">
              <Loader2 className="w-8 h-8 text-prime animate-spin mx-auto mb-4" />
              <p className="text-white/40 font-medium">Fetching players...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-400 font-medium">{error}</div>
          ) : players.length === 0 ? (
            <div className="p-10 text-center text-white/40">No players found.</div>
          ) : (
            players.map((player, index) => (
              <StorePlayerRow
                key={safeGet(player, 'id', ['_id', 'userId'], `store-${index}`)}
                player={player}
                isExpanded={expandedRow === safeGet(player, 'id', ['_id', 'userId'], '')}
                isLast={index === players.length - 1}
                lastElementRef={lastElementRef}
                onStoreInfoClick={handleStoreInfoClick}
                purchaseData={purchaseData}
                purchaseLoading={purchaseLoading}
              />
            ))
          )}
        </div>

        {/* Infinite Scroll Loader & Status */}
        <div className="px-4 sm:px-6 py-6 border-t border-white/5 bg-white/[0.01] text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-prime font-bold text-sm">
              <Loader2 size={18} className="animate-spin" />
              <span>SCANNING MORE RECORDS...</span>
            </div>
          ) : hasMore ? (
            <p className="text-[10px] sm:text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Scroll to scan deeper</p>
          ) : (
            <div className="flex items-center justify-center gap-2 text-white/20 font-bold text-xs uppercase tracking-widest">
              <CheckCircle2 size={16} />
              <span>All records synchronized</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
